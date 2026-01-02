/**
 * GET /api/history
 * Get user's generation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db, generations, users } from '@/db';
import { eq, desc, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const { userId: clerkUserId } = auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch generations (last 30 days, completed only)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userGenerations = await db.query.generations.findMany({
      where: and(
        eq(generations.userId, user.id),
        eq(generations.status, 'completed'),
        gte(generations.createdAt, thirtyDaysAgo)
      ),
      orderBy: [desc(generations.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        inputContent: true,
        selectedPlatforms: true,
        selectedTone: true,
        coreMessage: true,
        detectedTopic: true,
        createdAt: true,
        generationTimeMs: true,
      },
    });

    return NextResponse.json({
      generations: userGenerations,
      total: userGenerations.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] History error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
