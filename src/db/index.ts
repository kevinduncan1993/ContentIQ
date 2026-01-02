/**
 * Database connection and client
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database connection string with fallback to prevent build errors
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://placeholder:placeholder@localhost:5432/placeholder';

// Only validate in runtime (not during build)
let client: ReturnType<typeof postgres>;

try {
  // Create postgres client with connection string
  // prepare: false is required for Supabase/Vercel Postgres compatibility
  client = postgres(connectionString, {
    prepare: false,
    max: 1, // Limit connections in serverless
  });
} catch (error) {
  console.error('[DB] Failed to create postgres client:', error);
  // Create a dummy client to prevent build errors
  client = postgres('postgresql://localhost:5432/postgres', { prepare: false });
}

// Create database client
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from './schema';
