import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Supabase direct hostnames (db.*.supabase.co) return only AAAA (IPv6) records in some
// regions, but Railway containers have no outbound IPv6 routing. Rewrite to the Session
// Pooler host (aws-0-<region>.pooler.supabase.com) which resolves to IPv4.
function resolveSupabaseUrl(url: string): string {
  const match = url.match(/db\.([a-z0-9]+)\.supabase\.co/);
  if (!match) return url; // not a direct Supabase connection — leave unchanged
  const projectRef = match[1];
  return url
    .replace(`db.${projectRef}.supabase.co`, 'aws-0-ap-south-1.pooler.supabase.com')
    .replace(/\/\/postgres:/, `//postgres.${projectRef}:`);
}

const resolvedUrl = resolveSupabaseUrl(databaseUrl);

// Create connection pool — Supabase requires SSL
const client = postgres(resolvedUrl, {
  max: 10,
  idle_timeout: 30,
  ssl: resolvedUrl.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

// Create database instance
export const db = drizzle(client, { schema });

export type Database = typeof db;
export * from './schema';
