const fs = require('fs');
const pg = require('pg');

const connectionString = 'postgresql://postgres:gWvxqYF$2XwXe&6@db.suwyuzoirkxuzmjyburh.supabase.co:5432/postgres?sslmode=require';

const client = new pg.Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    // Connect
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL');
    
    // Enable pgvector extension
    console.log('\n📦 Enabling pgvector extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension ready');
    
    // Read migration SQL
    console.log('\n📖 Reading migration file...');
    const migrationSQL = fs.readFileSync('./drizzle/0001_initial_schema.sql', 'utf-8');
    
    // Run migration
    console.log('\n⚙️  Running database migrations...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Verify tables
    console.log('\n📊 Verifying tables created...');
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n✅ Created tables:');
    result.rows.forEach((row, i) => {
      console.log(`   ${i+1}. ${row.table_name}`);
    });
    console.log(`\n   Total: ${result.rows.length} tables`);
    
    // Verify indexes
    console.log('\n✅ Verifying indexes...');
    const indexResult = await client.query(`
      SELECT COUNT(*) as index_count FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    console.log(`   Total: ${indexResult.rows[0].index_count} indexes`);
    
    // Verify vector extension
    console.log('\n✅ Verifying pgvector...');
    const vectorResult = await client.query(`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `);
    if (vectorResult.rows.length > 0) {
      console.log('   pgvector extension: ENABLED');
    }
    
    console.log('\n✅ DATABASE SETUP COMPLETE!');
    console.log('\n🎉 You can now:');
    console.log('   • Backend will auto-connect via DATABASE_URL');
    console.log('   • Frontend can create accounts');
    console.log('   • Users can upload files & ask questions');
    console.log('   • Practice system ready for tracking');
    
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:');
    console.error(err.message);
    if (err.detail) console.error('Detail:', err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
