/**
 * Database connection and client
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create postgres connection
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';

// Disable prefetch as it's not supported with Supabase in serverless environments
const client = postgres(connectionString, { prepare: false });

// Create database client
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from './schema';
