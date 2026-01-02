/**
 * GET /api/tier
 * Get user's tier status and trial information
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { getUserTierStatus } from '@/lib/tier';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

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

    const tierStatus = await getUserTierStatus(user.id);

    return NextResponse.json(tierStatus);
  } catch (error) {
    console.error('[API] Tier status error:', error);
    return NextResponse.json(
      { error: 'Failed to get tier status' },
      { status: 500 }
    );
  }
}
