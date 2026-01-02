/**
 * GET /api/usage
 * Get user's current usage and quota information
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { auth } from '@clerk/nextjs/server';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { getUserUsageStats } from '@/lib/usage';

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

    // Get usage stats
    const stats = await getUserUsageStats(user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API] Usage error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
