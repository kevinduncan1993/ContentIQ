/**
 * POST /api/generate
 * Main generation endpoint - analyzes content and generates platform-specific outputs
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { db, generations, users, usageLogs } from '@/db';
import { eq } from 'drizzle-orm';
import { promptEngine } from '@/lib/prompt-engine';
import { checkRateLimit } from '@/lib/rate-limit';
import { checkUserQuota, incrementUsage } from '@/lib/usage';
import { validatePlatformAccess } from '@/lib/tier';
import { hashContent, getClientIp } from '@/lib/utils';
import { z } from 'zod';
import type { Platform, Tone } from '@/prompts';

// Request validation schema
const generateSchema = z.object({
  content: z.string().min(100).max(10000),
  platforms: z.array(z.enum(['tiktok', 'twitter', 'linkedin', 'instagram', 'threads', 'email'])).min(1).max(6),
  tone: z.enum(['educational', 'conversational', 'opinionated', 'authority']),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Rate Limiting
    const clientIp = getClientIp(request.headers);
    const rateLimitResult = await checkRateLimit(user.id, clientIp);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const validationResult = generateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { content, platforms, tone } = validationResult.data;

    // 4. Check user quota
    const quotaCheck = await checkUserQuota(user.id);
    if (!quotaCheck.canGenerate) {
      return NextResponse.json(
        {
          error: 'Quota exceeded',
          message: `You've used all ${quotaCheck.limit} generations this month. Upgrade to Pro for more.`,
          limit: quotaCheck.limit,
          remaining: quotaCheck.remaining,
          resetsAt: quotaCheck.resetsAt,
        },
        { status: 429 }
      );
    }

    // 5. Check platform access based on tier and trial
    const platformAccess = validatePlatformAccess(
      platforms as Platform[],
      user.subscriptionTier,
      user.createdAt
    );

    if (!platformAccess.valid) {
      return NextResponse.json(
        {
          error: 'Platform access denied',
          message: platformAccess.message,
          invalidPlatforms: platformAccess.invalidPlatforms,
          tier: user.subscriptionTier,
        },
        { status: 403 }
      );
    }

    // 6. Sanitize and validate input
    const sanitizedContent = promptEngine.sanitizeInput(content);
    const inputValidation = promptEngine.validateInput({
      content: sanitizedContent,
      platforms: platforms as Platform[],
      tone: tone as Tone,
    });

    if (!inputValidation.valid) {
      return NextResponse.json(
        { error: inputValidation.error },
        { status: 400 }
      );
    }

    // 7. Create generation record
    const contentHash = hashContent(sanitizedContent);
    const [generationRecord] = await db
      .insert(generations)
      .values({
        userId: user.id,
        inputContent: sanitizedContent,
        inputContentHash: contentHash,
        selectedPlatforms: platforms,
        selectedTone: tone,
        status: 'pending',
      })
      .returning();

    // 8. Generate content
    try {
      const result = await promptEngine.generate({
        content: sanitizedContent,
        platforms: platforms as Platform[],
        tone: tone as Tone,
      });

      // 9. Update generation record with results
      const platformOutputs: Record<string, any> = {};
      result.outputs.forEach((output) => {
        const key = `output${output.platform.charAt(0).toUpperCase() + output.platform.slice(1)}`;
        platformOutputs[key as keyof typeof platformOutputs] = output.error
          ? { error: output.error }
          : output.content;
      });

      await db
        .update(generations)
        .set({
          coreMessage: result.analysis.coreMessage,
          keyPoints: result.analysis.keyPoints,
          detectedTopic: result.analysis.topic,
          detectedAudience: result.analysis.audience,
          ...platformOutputs,
          generationTimeMs: result.generationTimeMs,
          llmProvider: result.llmProvider,
          llmModel: result.llmModel,
          totalTokensUsed: result.totalTokens,
          status: 'completed',
          completedAt: new Date(),
        })
        .where(eq(generations.id, generationRecord.id));

      // 10. Increment usage counter
      await incrementUsage(user.id, platforms.length);

      // 11. Log usage
      await db.insert(usageLogs).values({
        userId: user.id,
        generationId: generationRecord.id,
        eventType: 'generation_completed',
        platformCount: platforms.length,
        platforms,
        tokensUsed: result.totalTokens,
        estimatedCostUsd: Math.ceil(result.totalTokens * 0.00002 * 100), // Rough estimate in cents
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: clientIp,
      });

      // 12. Return success response
      return NextResponse.json({
        success: true,
        generationId: generationRecord.id,
        analysis: result.analysis,
        outputs: result.outputs,
        metadata: {
          generationTimeMs: result.generationTimeMs,
          tokensUsed: result.totalTokens,
          quotaRemaining: quotaCheck.remaining - 1,
        },
      });
    } catch (error) {
      // Update generation record with error
      await db
        .update(generations)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(generations.id, generationRecord.id));

      // Log error
      await db.insert(usageLogs).values({
        userId: user.id,
        generationId: generationRecord.id,
        eventType: 'generation_failed',
        platformCount: platforms.length,
        platforms,
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: clientIp,
      });

      console.error('[API] Generation error:', error);

      return NextResponse.json(
        {
          error: 'Generation failed',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
