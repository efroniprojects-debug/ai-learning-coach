import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create connection pool — Supabase requires SSL
const client = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 30,
  ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

// Create database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
export * from './schema';
