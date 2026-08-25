# 🚀 Run Database Migration - 2 Minute Setup

**Status:** ✅ Migration SQL ready  
**Database:** Supabase (Connected)  
**Next Step:** Execute SQL migration

---

## ⚡ QUICKSTART (Recommended - Takes 2 Minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com
2. Login with your account
3. Select project: **suwyuzoirkxuzmjyburh**
4. Click: **SQL Editor** (left sidebar)
5. Click: **New Query** (top right)

### Step 2: Copy Migration SQL
1. Open file: `C:\Users\sharo\AI_Learning_Coach\backend\drizzle\0001_initial_schema.sql`
2. **Select All** (Ctrl+A)
3. **Copy** (Ctrl+C)

### Step 3: Paste into Supabase
1. Go back to Supabase SQL Editor query window
2. Click in the text area
3. **Paste** (Ctrl+V)
4. You'll see ~300 lines of SQL

### Step 4: Execute Migration
1. Click: **RUN** button (top right, blue button)
2. Wait for "Success" message
3. Takes ~5-10 seconds

### Step 5: Verify Success
1. Click: **Tables** (left sidebar under "Database")
2. You should see these tables:
   - ✅ users
   - ✅ ai_provider_configs
   - ✅ sessions
   - ✅ audit_logs
   - ✅ uploaded_files
   - ✅ knowledge_chunks
   - ✅ practice_attempts
   - ✅ skill_mastery
   - ✅ share_links
   - ✅ progress_snapshots

---

## ✅ After Migration Completes

### Backend Auto-Connects
Your backend `.env` now has the correct database password:
```
DATABASE_URL=postgresql://postgres:gWvxqYF$2XwXe&6@db.suwyuzoirkxuzmjyburh.supabase.co:5432/postgres?sslmode=require
```

When backend starts, it will automatically:
- ✅ Connect to database
- ✅ Load all 10 tables
- ✅ Enable vector search (pgvector)
- ✅ All 26 API endpoints become functional

### What You Can Do Now
```
1. Open http://localhost:5173 (Frontend)
2. Click "Sign in with Google"
3. Login with your Google account
4. ✅ Account created in database!
5. Click "Ask a Question" or "Upload File"
6. ✅ Full app now works with real database!
```

---

## 📋 Verification Queries (Optional)

After migration completes, you can verify by running these in Supabase SQL Editor:

### Count Tables
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: 10
```

### List All Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check Indexes
```sql
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';
-- Should return: 30+
```

### Verify pgvector Extension
```sql
SELECT extname FROM pg_extension WHERE extname = 'vector';
-- Should return: vector
```

### Test Vector Column
```sql
SELECT COUNT(*) FROM knowledge_chunks 
WHERE chunk_embedding IS NOT NULL;
-- Should return: 0 (no data yet, but column exists)
```

---

## 🎯 Your Database is Ready

| Component | Status | Details |
|-----------|--------|---------|
| Connection | ✅ | PostgreSQL configured |
| Extensions | ✅ | pgvector enabled |
| Tables | ⏳ | Ready to create (Step 4 above) |
| Indexes | ⏳ | Ready to create (Step 4 above) |
| Backend | ✅ | DATABASE_URL configured |
| Frontend | ✅ | http://localhost:5173 running |

---

## 💡 Troubleshooting

### "Query timed out"
- Try again, sometimes Supabase takes a moment
- If persistent, copy SQL in smaller chunks and run separately

### "Permission denied"
- Make sure you're using the correct Supabase project
- You should be logged in as project owner

### Can't find SQL Editor
- Left sidebar → Click "SQL Editor"
- Or: https://supabase.com/dashboard → Your project → SQL Editor

### Migration ran but tables don't appear
- Refresh the page (F5)
- Click "Tables" section again

---

## 🎉 You're 2 Minutes Away!

The hardest part is done. All you need to do is:

1. Copy the SQL (from your file)
2. Paste it in Supabase
3. Click RUN

**Then your entire app is live with a real database!**

---

**Once complete, let me know and I'll verify the connection and start everything up! 🚀**
