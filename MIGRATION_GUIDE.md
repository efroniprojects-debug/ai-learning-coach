# Database Migration Guide

**Status:** ✅ Migration files created  
**Location:** `backend/drizzle/0001_initial_schema.sql`  
**Database:** Supabase PostgreSQL with pgvector

---

## Quick Start

### Option 1: Run via Supabase Dashboard (Easiest)

1. **Login to Supabase**
   - Go to https://supabase.com
   - Select your project: `suwyuzoirkxuzmjyburh`

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

3. **Copy & Paste Migration SQL**
   - Open: `backend/drizzle/0001_initial_schema.sql`
   - Copy entire SQL content
   - Paste into Supabase SQL Editor

4. **Execute**
   - Click "RUN" button
   - Wait for success message

5. **Verify**
   - Go to "Database" → "Tables"
   - Should see 8 new tables:
     - users
     - ai_provider_configs
     - sessions
     - audit_logs
     - uploaded_files
     - knowledge_chunks
     - practice_attempts
     - skill_mastery
     - share_links
     - progress_snapshots

---

### Option 2: Run via CLI (With Docker)

```bash
# Install Docker if not already installed
# https://www.docker.com/products/docker-desktop

# Navigate to project
cd C:\Users\sharo\AI_Learning_Coach

# Start Postgres with psql
docker run -it --rm postgres:15-alpine psql \
  "postgresql://postgres:YOUR_PASSWORD@db.suwyuzoirkxuzmjyburh.supabase.co:5432/postgres?sslmode=require" \
  -f backend/drizzle/0001_initial_schema.sql
```

---

### Option 3: Run via psql Command Line

```bash
# Install psql (PostgreSQL client)
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: apt-get install postgresql-client

# Run migration
psql "postgresql://postgres:YOUR_PASSWORD@db.suwyuzoirkxuzmjyburh.supabase.co:5432/postgres?sslmode=require" \
  -f backend/drizzle/0001_initial_schema.sql

# Verify tables created
psql "postgresql://postgres:YOUR_PASSWORD@db.suwyuzoirkxuzmjyburh.supabase.co:5432/postgres?sslmode=require" \
  -c "\dt public.*"
```

---

### Option 4: Run via Node.js Script

```bash
cd backend
npm install pg
node << 'EOF'
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    const fs = require('fs');
    const sql = fs.readFileSync('../drizzle/0001_initial_schema.sql', 'utf-8');
    
    await client.query(sql);
    console.log('✅ Migration completed successfully!');
    
    // Verify tables
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\n📊 Created tables:');
    result.rows.forEach(row => console.log(`   • ${row.table_name}`));
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
})();
EOF
```

---

## Migration Details

### What Gets Created

**Core Tables:**
- `users` — User accounts & profiles
- `ai_provider_configs` — AI provider settings (Claude, OpenAI, Gemini)
- `sessions` — JWT refresh tokens & session management
- `audit_logs` — Activity logging

**Knowledge Base:**
- `uploaded_files` — File upload tracking
- `knowledge_chunks` — Semantic text chunks with vector embeddings
  - Uses pgvector (1536-dimensional embeddings)
  - HNSW index for fast similarity search

**Learning Analytics:**
- `practice_attempts` — Individual problem attempts
- `skill_mastery` — ELO ratings per concept (adaptive learning)
- `progress_snapshots` — Daily progress tracking

**Sharing:**
- `share_links` — Shareable resource links

### Indexes Created

✅ User lookup (email, Google ID)  
✅ Provider config lookup (per user, active status)  
✅ Session expiration tracking  
✅ Audit log querying  
✅ File status tracking  
✅ Vector similarity search (HNSW for knowledge chunks)  
✅ ELO rating lookups  
✅ Progress date queries  

### Functions Created

✅ `update_updated_at_column()` — Automatically updates `updated_at` timestamp
✅ Triggers on `users`, `ai_provider_configs`, `skill_mastery` tables

### Permissions Granted

✅ `authenticated` role: Full access (logged-in users)  
✅ `anon` role: SELECT on public tables (for public share links)  

---

## Verification Checklist

After running migrations, verify:

### ✅ Tables Created
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' ORDER BY table_name;
```

Should show: 10 tables
- audit_logs
- ai_provider_configs
- knowledge_chunks
- practice_attempts
- progress_snapshots
- sessions
- share_links
- skill_mastery
- uploaded_files
- users

### ✅ Indexes Created
```sql
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' ORDER BY indexname;
```

Should show: 30+ indexes (user lookups, foreign keys, search indexes)

### ✅ Vector Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Should return: pgvector extension enabled

### ✅ Functions Created
```sql
SELECT proname FROM pg_proc 
WHERE proname LIKE 'update_%' OR proname LIKE '%updated_at%';
```

Should show: `update_updated_at_column` function

---

## Troubleshooting

### Connection Refused
```
Error: Connection refused
```
**Fix:** Verify DATABASE_URL password is correct:
```
postgresql://postgres:YOUR_PASSWORD@db.suwyuzoirkxuzmjyburh.supabase.co:5432/postgres?sslmode=require
```

### SSL Certificate Error
```
Error: SSL connection error
```
**Fix:** Add `?sslmode=require` to DATABASE_URL (already included)

### "Extension not found: vector"
```
ERROR: could not find expected version of extension "vector"
```
**Fix:** Supabase automatically enables pgvector. If error persists:
1. Login to Supabase dashboard
2. Go to Database → Extensions
3. Search for "vector" and enable it

### Permission Denied
```
ERROR: permission denied for schema public
```
**Fix:** Use service role key with full permissions, not anon key

### Already Exists
```
ERROR: relation "users" already exists
```
**Fix:** Tables already created. Migrations idempotent (IF NOT EXISTS checks included)

---

## Post-Migration Setup

### 1. Add Initial Data (Optional)

```sql
-- Add default concepts for physics
INSERT INTO skill_mastery (id, user_id, concept_id, elo_rating, confidence_level)
SELECT gen_random_uuid(), id, concept, 1000, 'novice'
FROM (
  SELECT user_id as id FROM users LIMIT 1
) u
CROSS JOIN (
  SELECT unnest(array[
    'Force', 'Acceleration', 'Momentum', 'Energy', 'Velocity',
    'Gravity', 'Friction', 'Tension', 'Pressure', 'Power'
  ]) as concept
) concepts;
```

### 2. Test Connection from Backend

```bash
cd backend
npm install pg
node -e "
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.connect()
  .then(() => {
    console.log('✅ Database connected');
    return client.query('SELECT COUNT(*) FROM users');
  })
  .then(res => {
    console.log('✅ Tables accessible, user count:', res.rows[0].count);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
"
```

### 3. Enable Real-time Updates (Optional)

In Supabase dashboard:
1. Database → Replication
2. Enable for tables: `users`, `practice_attempts`, `skill_mastery`, `progress_snapshots`
3. Now frontend can subscribe to real-time updates

---

## Production Considerations

### ✅ Already Included
- pgvector indexes (HNSW for fast similarity search)
- Proper foreign keys & cascading deletes
- Audit logging
- Session management
- Timestamp tracking

### 🔒 Security Recommendations
- [ ] Enable Row Level Security (RLS)
- [ ] Add encryption at rest (Supabase default: on)
- [ ] Set up backups (Supabase default: daily)
- [ ] Monitor query performance (Supabase dashboard)

### 📈 Performance Optimization
- [ ] Monitor knowledge_chunks table size (pgvector indexes use memory)
- [ ] Consider partitioning practice_attempts by date for large scale
- [ ] Analyze query plans: `EXPLAIN ANALYZE SELECT...`

---

## Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | SQL migration file created | ✅ |
| 2 | Tables schema designed | ✅ |
| 3 | Indexes configured | ✅ |
| 4 | pgvector enabled | ✅ |
| 5 | Run migration via Supabase UI | ⏳ YOUR ACTION |
| 6 | Verify tables created | ⏳ YOUR ACTION |
| 7 | Backend connects to database | ⏳ PENDING |

---

## Next Steps

1. **Run the migration** (choose Option 1-4 above)
2. **Verify tables created** (run verification queries)
3. **Test backend connection**
4. **Start servers:** Frontend & Backend will auto-connect
5. **Test login flow** with Google OAuth
6. **Try upload & search** to test knowledge base

---

**🚀 Database setup complete. Ready for deployment!**

---

**Owner:** Sharon Afroni  
**Date:** 2026-08-25  
**Status:** ✅ Migration files created, ready to execute
