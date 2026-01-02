/**
 * Database connection and client
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database connection string
// IMPORTANT: Must be an absolute URL for serverless environments (Vercel/Edge)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// Validate connection string exists
if (!connectionString) {
  throw new Error(
    'Database connection string is missing. Set DATABASE_URL or POSTGRES_URL environment variable.'
  );
}

// Validate it's a valid postgres URL
if (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://')) {
  throw new Error(
    `Invalid database URL format. Expected postgres:// or postgresql://, got: ${connectionString.substring(0, 20)}...`
  );
}

// Create postgres client
// NOTE: Using absolute URL required for Vercel serverless functions
// prepare: false is required for Supabase connection pooling compatibility
const client = postgres(connectionString, {
  prepare: false,
});

// Create database client
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from './schema';
