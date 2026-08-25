import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';

const runMigrations = async () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🚀 Running database migrations...');
  console.log(`Database: ${databaseUrl.split('@')[1]}`);

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    await migrate(sql, {
      migrationsFolder: path.join(__dirname, '../drizzle'),
    });

    console.log('✅ Migrations completed successfully');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await sql.end();
    process.exit(1);
  }
};

runMigrations();
