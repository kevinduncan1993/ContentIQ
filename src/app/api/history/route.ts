/**
 * GET /api/history
 * Get user's content generation history
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { db, users, generations } from '@/db';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId: clerkUserId } = auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's generations, newest first
    const userGenerations = await db.query.generations.findMany({
      where: eq(generations.userId, user.id),
      orderBy: [desc(generations.createdAt)],
      limit: 50, // Limit to last 50 generations
    });

    return NextResponse.json({ generations: userGenerations });
  } catch (error) {
    console.error('[API] History error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
