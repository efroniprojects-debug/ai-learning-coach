import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run migrations');

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const files = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  for (const fileName of files) {
    const [existing] = await sql<{ name: string }[]>`
      SELECT name FROM schema_migrations WHERE name = ${fileName}
    `;
    if (existing) continue;

    const migrationSql = await readFile(join(migrationsDirectory, fileName), 'utf8');
    await sql.begin(async (transaction) => {
      await transaction.unsafe(migrationSql);
      await transaction`INSERT INTO schema_migrations (name) VALUES (${fileName})`;
    });
    console.log(`Applied migration: ${fileName}`);
  }
} finally {
  await sql.end();
}
