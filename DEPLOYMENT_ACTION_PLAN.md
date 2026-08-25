# 🚀 Deployment Action Plan — AI Learning Coach MVP

**Started:** 2026-08-25  
**Target:** Live in 1.5 hours  
**Deploying to:** Vercel (Frontend) + Railway (Backend) + Supabase (Database)

---

## 📋 Master Checklist

- [ ] **Phase 1:** Supabase Database Setup (15 min)
- [ ] **Phase 2:** Railway Backend Deployment (20 min)
- [ ] **Phase 3:** Vercel Frontend Deployment (15 min)
- [ ] **Phase 4:** Google OAuth Configuration (10 min)
- [ ] **Phase 5:** End-to-End Verification (5 min)
- [ ] **Phase 6:** Go Live & Celebrate 🎉

---

## ⏱️ Phase 1: Supabase Database (15 min)

### Step 1.1: Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Click "Sign Up" or "Sign In"
- [ ] Click "New Project"
- [ ] **Settings:**
  - Name: `ai-learning-coach`
  - Password: Store safely (1Password / Bitwarden)
  - Region: Choose closest to you
- [ ] Wait for initialization (~2 min)
- **Save:** Copy `Project URL` (e.g., `https://xyz.supabase.co`)

### Step 1.2: Get Database Connection String
- [ ] In Supabase → Settings → Database → Connection Pooling
- [ ] Copy the full connection string
  ```
  postgresql://[user]:[password]@[host]:[port]/[database]
  ```
- **Save:** `DATABASE_URL=postgresql://...`

### Step 1.3: Enable pgvector Extension
- [ ] In Supabase → SQL Editor → Create new query
- [ ] Paste this:
  ```sql
  create extension if not exists vector;
  ```
- [ ] Click "Run"
- [ ] Should see: `"created extension"`

### Step 1.4: Run Migrations
```bash
# In your terminal, go to backend directory
cd backend

# Install deps (if not done)
npm install

# Run migrations
DATABASE_URL="postgresql://..." npm run migrate
```
- **Expected output:** `✓ Migrations complete`

### Step 1.5: Verify Database
- [ ] In Supabase → Table Editor → Should see tables:
  - `users`
  - `sessions`
  - `ai_provider_configs`
  - `knowledge_chunks`
  - `practice_attempts`
  - `skill_mastery`
  - `share_links`

**✅ Phase 1 Complete!**

---

## ⏱️ Phase 2: Railway Backend (20 min)

### Step 2.1: Create Railway Account
- [ ] Go to https://railway.app
- [ ] Click "Start Project"
- [ ] Select "Deploy from GitHub"
- [ ] Authorize Railway to access GitHub
- **Save:** Copy Railway project ID

### Step 2.2: Configure Backend Deployment
- [ ] In Railway dashboard → New Project
- [ ] Select GitHub repo: `AI_Learning_Coach`
- [ ] Select source: `backend` directory
- [ ] Wait for auto-build (~3-5 min)

### Step 2.3: Set Environment Variables
In Railway → Variables tab, add all of these:

```
# Database
DATABASE_URL=postgresql://[from-supabase]

# JWT (generate random 32-char string)
JWT_SECRET=your_random_secret_here_min_32_chars

# Google OAuth (we'll fill these in Phase 4)
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
GOOGLE_CALLBACK_URL=https://[railway-domain]/auth/google/callback

# CORS & URLs
ALLOWED_ORIGINS=https://[vercel-domain],http://localhost:3000
FRONTEND_URL=https://[vercel-domain]

# Server config
PORT=3001
NODE_ENV=production
```

- **Note:** Leave `GOOGLE_CLIENT_ID` as placeholder for now (will update after getting OAuth keys)

### Step 2.4: Deploy Backend
- [ ] Railway should auto-deploy when you set variables
- [ ] Check Build Logs → Should see ✓ Build successful
- [ ] Get your backend URL:
  - Railway dashboard → Settings → Domain
  - Copy: `https://[project].railway.app`
- **Save:** `RAILWAY_BACKEND_URL=https://[project].railway.app`

### Step 2.5: Verify Backend Health
```bash
curl https://[railway-domain]/health
# Should return: {"status":"ok"}
```

**✅ Phase 2 Complete!**

---

## ⏱️ Phase 3: Vercel Frontend (15 min)

### Step 3.1: Create Vercel Account
- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub
- [ ] Authorize Vercel

### Step 3.2: Import Project
- [ ] Click "Add New" → "Project"
- [ ] Select `AI_Learning_Coach` repo from GitHub
- [ ] Configure settings:
  - **Framework:** Vite
  - **Root Directory:** `frontend`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
- [ ] Click "Deploy"

### Step 3.3: Set Environment Variables
While deploying, go to Project Settings → Environment Variables:

```
VITE_API_BASE_URL=https://[railway-backend-domain]
VITE_GOOGLE_CLIENT_ID=placeholder
VITE_FRONTEND_URL=https://[vercel-domain]
```

- **Note:** `VERCEL_DOMAIN` will be assigned (e.g., `ai-learning-coach.vercel.app`)

### Step 3.4: Wait for Deployment
- [ ] Vercel builds (~3-5 min)
- [ ] Watch deployment progress
- [ ] Should see "Deployment Complete"
- **Save:** `VERCEL_FRONTEND_URL=https://[project].vercel.app`

### Step 3.5: Verify Frontend
```bash
# Visit in browser
https://[vercel-domain]
# Should see: Login page with "Sign in with Google" button
```

**✅ Phase 3 Complete!**

---

## ⏱️ Phase 4: Google OAuth (10 min)

### Step 4.1: Create Google OAuth Credentials
- [ ] Go to https://console.cloud.google.com
- [ ] Create new project: `AI Learning Coach`
- [ ] Search for "Google+ API" → Enable it
- [ ] Go to "Credentials" (left sidebar)
- [ ] Click "Create Credentials" → "OAuth 2.0 Client ID"
  - Application type: Web application
  - Add Authorized redirect URIs:
    ```
    https://[vercel-domain]/auth/google/callback
    https://[railway-backend]/auth/google/callback
    http://localhost:3000/auth/google/callback
    ```
- [ ] Click "Create"
- **Save Both:**
  - `GOOGLE_CLIENT_ID=...`
  - `GOOGLE_CLIENT_SECRET=...`

### Step 4.2: Update Vercel Environment
- [ ] Go to Vercel Project → Settings → Environment Variables
- [ ] Update (don't add new):
  ```
  VITE_GOOGLE_CLIENT_ID=[your-real-client-id]
  ```
- [ ] **Trigger redeploy:**
  - Vercel → Deployments → Click top deployment
  - → Click "Redeploy"

### Step 4.3: Update Railway Environment
- [ ] Go to Railway → Variables
- [ ] Update these:
  ```
  GOOGLE_CLIENT_ID=[your-real-client-id]
  GOOGLE_CLIENT_SECRET=[your-secret]
  GOOGLE_CALLBACK_URL=https://[railway-domain]/auth/google/callback
  ```
- [ ] Railway auto-redeploys

### Step 4.4: Test OAuth Flow
- [ ] Visit `https://[vercel-domain]`
- [ ] Click "Sign in with Google"
- [ ] Use your Google account
- [ ] Should redirect to dashboard (if logged in)

**✅ Phase 4 Complete!**

---

## ⏱️ Phase 5: End-to-End Verification (5 min)

### Test 1: Login Flow
- [ ] Visit frontend: `https://[vercel-domain]`
- [ ] Click "Sign in with Google"
- [ ] Complete OAuth flow
- [ ] Verify redirect to Dashboard

### Test 2: Ask a Question
- [ ] On Dashboard, go to "Ask Question"
- [ ] Type a physics question
- [ ] Click "Search"
- [ ] Verify AI response loads
- [ ] Check backend logs in Railway (should see API calls)

### Test 3: Check Database
- [ ] In Supabase → Table Editor
- [ ] Check `users` table → Should have your user
- [ ] Check other tables exist (no errors)

### Test 4: Backend Health
```bash
curl https://[railway-domain]/health
# Should return: {"status":"ok"}
```

### Test 5: Frontend Performance
- [ ] Open DevTools (F12) → Network tab
- [ ] Check:
  - Page loads < 3 sec
  - No 401/403/500 errors
  - API calls return 200 OK

**✅ Phase 5 Complete!**

---

## 🎉 Phase 6: Go Live!

### Before You Announce:

**Security Checklist:**
- [ ] No API keys in git history (`git log -p | grep -i "key\|secret"`)
- [ ] `JWT_SECRET` is random and long
- [ ] HTTPS enforced (Vercel/Railway default ✓)
- [ ] CORS configured (`ALLOWED_ORIGINS` set)

**Functionality Checklist:**
- [ ] Login works ✓
- [ ] OAuth flow works ✓
- [ ] API requests work ✓
- [ ] Database saves data ✓
- [ ] Mobile responsive ✓

### Announce!
```
📢 AI Learning Coach is LIVE! 🎉

🔗 Visit: https://[your-frontend-domain]
📚 Ask questions, practice problems, track your progress
🎓 Adaptive learning powered by AI

Sign up with Google and start learning!
```

---

## 📊 URLs Reference (Fill These In)

Save these somewhere:

```
🌐 Frontend URL:
   https://[vercel-project].vercel.app

🔧 Backend API:
   https://[railway-project].railway.app

💾 Database:
   https://[supabase-project].supabase.co

🗝️ Google OAuth Console:
   https://console.cloud.google.com
```

---

## 🆘 If Something Goes Wrong

### Error: "Cannot connect to database"
```bash
# Test connection locally
psql [DATABASE_URL]
# If fails, check:
# 1. DATABASE_URL is correct in Railway
# 2. Supabase project exists and is running
# 3. Network not blocked
```

### Error: "401 Unauthorized (OAuth)"
```bash
# Check:
# 1. GOOGLE_CLIENT_ID matches in both Vercel & Google Console
# 2. Redirect URIs in Google Console match deployment domains
# 3. Environment variables updated in Vercel/Railway
```

### Error: "Cannot POST /api/v1/..."
```bash
# Check:
# 1. Railway backend is running (check logs)
# 2. VITE_API_BASE_URL in Vercel is correct
# 3. CORS ALLOWED_ORIGINS includes frontend domain
```

**For more help:** See `DEPLOYMENT_GUIDE.md` section "Troubleshooting"

---

## 📅 Timeline Tracker

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Supabase Setup | 15 min | ⏳ |
| 2 | Railway Backend | 20 min | ⏳ |
| 3 | Vercel Frontend | 15 min | ⏳ |
| 4 | Google OAuth | 10 min | ⏳ |
| 5 | Verification | 5 min | ⏳ |
| **Total** | | **65 min** | ⏳ |

---

## 🎯 Next Steps (After Deployment)

Once live, you can:

1. **Monitor:** Watch Railway/Vercel logs for errors
2. **Test:** Get real user feedback
3. **Polish:** Phase 6 (tests, performance, monitoring)
4. **Expand:** Phase 7 (Math + Chemistry subjects)

---

**Owner:** Sharon Afroni  
**Status:** Ready to deploy ✅  
**Estimated completion:** Today! 🚀
