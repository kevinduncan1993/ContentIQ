/**
 * Database connection and client
 *
 * WHY @neondatabase/serverless:
 * - Designed for serverless/edge environments (Vercel, Cloudflare Workers)
 * - Works with Supabase connection pooling
 * - Avoids "/pipeline" URL errors in production
 * - Uses WebSocket connections which work in serverless
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './schema';

// Configure WebSocket for Node.js environment
// Required for serverless compatibility
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Get database connection string
// MUST be absolute postgres:// URL - relative URLs fail in serverless
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  '';

// Create connection pool
// Uses WebSocket protocol - works in Vercel/Edge runtimes
const pool = new Pool({ connectionString });

// Create database client with Drizzle ORM
export const db = drizzle(pool, { schema });

// Export schema for use in queries
export * from './schema';
