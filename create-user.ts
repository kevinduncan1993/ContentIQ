/**
 * One-time script to manually create a user in the database
 * Run with: npx tsx create-user.ts
 */

import { db, users } from './src/db';
import { eq } from 'drizzle-orm';

async function createUser() {
  const clerkUserId = 'user_37gd2dfr23P96ByCLBryyQcRiCT';
  const email = 'kevinfinnissee4@gmail.com';

  try {
    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (existing) {
      console.log('✅ User already exists:', existing);
      return;
    }

    // Create user
    const [newUser] = await db.insert(users).values({
      clerkUserId,
      email,
      fullName: null,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      generationsLimit: 10,
      generationsCountCurrentMonth: 0,
      usageResetAt: getNextMonthStart(),
    }).returning();

    console.log('✅ User created successfully:', newUser);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }

  process.exit(0);
}

function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

createUser();
