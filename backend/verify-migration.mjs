import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:gWvxqYF$2XwXe&6@db.suwyuzoirkxuzmjyburh.supabase.co:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await client.connect();
    
    // Check tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('❌ NO TABLES FOUND - Migration not run yet');
      console.log('\nPlease:');
      console.log('1. Go to https://supabase.com');
      console.log('2. Select project: suwyuzoirkxuzmjyburh');
      console.log('3. SQL Editor → New Query');
      console.log('4. Copy/paste backend/drizzle/0001_initial_schema.sql');
      console.log('5. Click RUN');
      process.exit(1);
    }
    
    console.log('✅ MIGRATION COMPLETE!');
    console.log('\n📊 Database Tables:');
    tables.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.table_name}`);
    });
    console.log(`\nTotal: ${tables.rows.length} tables`);
    
    // Check indexes
    const indexes = await client.query(`
      SELECT COUNT(*) as count FROM pg_indexes WHERE schemaname = 'public'
    `);
    console.log(`\n📈 Indexes: ${indexes.rows[0].count}`);
    
    // Check pgvector
    const vector = await client.query(`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `);
    console.log(`\n🔍 pgvector: ${vector.rows.length > 0 ? '✅ ENABLED' : '❌ NOT ENABLED'}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
