# Deployment Guide — AI Learning Coach MVP

**Target:** Production deployment in 1-2 hours  
**Architecture:** Vercel (Frontend) + Railway (Backend) + Supabase (Database)

---

## Prerequisites

You'll need accounts for:
1. **Vercel** (free tier ok) — Frontend hosting
2. **Railway** (free tier ok) — Backend hosting
3. **Supabase** (free tier ok) — PostgreSQL + pgvector
4. **GitHub** (required) — Source control
5. **Google Cloud Console** (free tier ok) — OAuth credentials

---

## Step 1: Database Setup (Supabase) — 15 mins

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Sign up / Login
3. Create new project
   - Project name: `ai-learning-coach`
   - Password: Store in secure location
   - Region: Choose closest to your users
4. Wait for project initialization (~2 min)

### 1.2 Get Connection String
1. In Supabase dashboard → Settings → Database
2. Copy `Connection string` (URI format)
3. Example: `postgresql://[user]:[password]@[host]:[port]/[database]`

### 1.3 Enable pgvector Extension
```sql
-- Run in Supabase SQL Editor
create extension if not exists vector;
```

### 1.4 Run Migrations
```bash
# From your backend directory
npm install
DATABASE_URL="postgresql://..." npm run migrate
```

### 1.5 Store Credentials
Save these environment variables (we'll use them next):
```
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_KEY=[anon-key]
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
```

---

## Step 2: Backend Deployment (Railway) — 20 mins

### 2.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (easiest)
3. Create new project

### 2.2 Connect GitHub Repository
1. In Railway dashboard → New Project
2. Select "Deploy from GitHub"
3. Authorize Railway to access your GitHub
4. Select `AI_Learning_Coach` repository
5. Choose `backend` directory as root

### 2.3 Configure Environment Variables
In Railway → Variables tab, add:

```
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# JWT
JWT_SECRET=[generate-random-32-char-string]

# OAuth (Google)
GOOGLE_CLIENT_ID=[your-google-client-id]
GOOGLE_CLIENT_SECRET=[your-google-client-secret]
GOOGLE_CALLBACK_URL=https://[railway-domain]/auth/google/callback

# CORS
ALLOWED_ORIGINS=https://[vercel-domain],http://localhost:3000

# Frontend
FRONTEND_URL=https://[vercel-domain]

# AI Providers (optional)
ANTHROPIC_API_KEY=[if-using-claude]
OPENAI_API_KEY=[if-using-openai]
GEMINI_API_KEY=[if-using-gemini]

# Server
PORT=3001
NODE_ENV=production
```

### 2.4 Deploy
1. Railway auto-deploys on every push to `main`
2. Or: Manual deploy via dashboard
3. Wait for build to complete (~5 mins)
4. Get production URL: `https://[project].railway.app`

### 2.5 Verify
```bash
curl https://[railway-domain]/health
# Should return: {"status":"ok"}
```

---

## Step 3: Frontend Deployment (Vercel) — 15 mins

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel

### 3.2 Import Project
1. In Vercel dashboard → New Project → Import Git Repository
2. Select `AI_Learning_Coach`
3. Configure:
   - **Framework:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 3.3 Configure Environment Variables
In Vercel → Settings → Environment Variables, add:

```
VITE_API_BASE_URL=https://[railway-domain]
VITE_GOOGLE_CLIENT_ID=[your-google-client-id]
VITE_FRONTEND_URL=https://[vercel-domain]
```

### 3.4 Deploy
1. Click "Deploy"
2. Wait for build & deployment (~3 mins)
3. Get URL: `https://[project].vercel.app`

### 3.5 Verify
Visit `https://[vercel-domain]` in browser. Should load login page.

---

## Step 4: Google OAuth Setup — 10 mins

### 4.1 Create OAuth Credentials
1. Go to https://console.cloud.google.com
2. Create new project: `AI Learning Coach`
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials (Web application)
5. Add redirect URIs:
   ```
   https://[vercel-domain]/auth/google/callback
   https://[railway-domain]/auth/google/callback
   http://localhost:3000/auth/google/callback
   ```
6. Copy `Client ID` and `Client Secret`

### 4.2 Update Environment Variables
1. **Vercel:** Add `VITE_GOOGLE_CLIENT_ID`
2. **Railway:** Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
3. Both: Redeploy

---

## Step 5: Verify Full Flow — 5 mins

### 5.1 Test Frontend
```bash
# Visit production URL
https://[vercel-domain]
# Should show: Login page with "Sign in with Google" button
```

### 5.2 Test OAuth Flow
1. Click "Sign in with Google"
2. Use your Google account
3. Should redirect to dashboard

### 5.3 Test Backend
```bash
# Check API connectivity
curl https://[railway-domain]/health
# Returns: {"status":"ok"}
```

### 5.4 Test Database
1. Dashboard → Ask a Question
2. Should load without errors
3. Check Supabase: New user should be created in `users` table

---

## Step 6: Production Checklist

### Security
- [ ] `JWT_SECRET` is random + long (32+ chars)
- [ ] API keys not logged (check middleware)
- [ ] CORS configured correctly
- [ ] HTTPS enforced (Vercel/Railway handle this)
- [ ] Environment variables never committed to git

### Performance
- [ ] Frontend bundle size < 500KB (check Vercel analytics)
- [ ] Database queries < 500ms (check Railway logs)
- [ ] Page load time < 3 seconds (check Vercel Core Web Vitals)

### Monitoring
- [ ] Error tracking (optional: add Sentry)
- [ ] Performance monitoring (Vercel built-in)
- [ ] Database backups (Supabase automatic)
- [ ] Logs accessible (Railway dashboard)

### Backups
- [ ] Supabase: Auto-backup enabled
- [ ] Database: Export weekly to secure location
- [ ] Code: Backed up in GitHub

---

## Troubleshooting

### 401 Unauthorized (OAuth)
**Cause:** `GOOGLE_CLIENT_ID` mismatch or redirect URI not configured
**Fix:** 
1. Verify Google Console has correct URIs
2. Verify `VITE_GOOGLE_CLIENT_ID` in Vercel matches Console
3. Redeploy both

### 503 Bad Gateway
**Cause:** Backend not responding
**Fix:**
1. Check Railway: Is backend running?
2. Check logs: `railway up` → View logs
3. Verify `DATABASE_URL` is correct

### Database Connection Error
**Cause:** `DATABASE_URL` incorrect or network blocked
**Fix:**
1. Test locally: `psql [DATABASE_URL]`
2. Verify Supabase IP whitelist (if restrictive)
3. Re-run migrations: `DATABASE_URL=... npm run migrate`

### CORS Error
**Cause:** `ALLOWED_ORIGINS` doesn't match frontend URL
**Fix:**
1. Check browser console (origin shown in error)
2. Update `ALLOWED_ORIGINS` in Railway
3. Redeploy backend

---

## Deployment Automation (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway up
      
      - name: Notify Slack (optional)
        run: |
          echo "✅ Deployment complete: https://[vercel-domain]"
```

---

## Rollback Plan

If something breaks in production:

### Option 1: Revert Last Commit
```bash
git revert HEAD
git push origin main
# Vercel/Railway auto-deploy previous version
```

### Option 2: Manual Rollback (Railway)
```bash
railway environment switch [previous-build]
```

### Option 3: Database Recovery (Supabase)
1. Supabase dashboard → Backups
2. Select restore point
3. Restore (may take 5-10 mins)

---

## Post-Deployment

### 1. Monitor for 24 Hours
- Watch error logs
- Monitor performance
- Gather user feedback

### 2. Gradual Rollout (Optional)
- Use Vercel's "Analytics Engine" to track adoption
- Can use feature flags for gradual releases

### 3. Celebrate! 🎉
You now have a production AI Learning Coach MVP live!

---

## Cost Estimates (Monthly)

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Vercel** | 100 GB bandwidth | $20/mo |
| **Railway** | $5 credit | $0-50/mo |
| **Supabase** | 500 MB DB, 1GB bandwidth | $25/mo |
| **Total** | Free | ~$45-50/mo |

The free tier should handle 100-1000 users/month. Upgrade as you scale.

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **GitHub Actions:** https://docs.github.com/en/actions

---

**Ready to deploy? Follow the steps above, and your MVP will be live in 1-2 hours.**

