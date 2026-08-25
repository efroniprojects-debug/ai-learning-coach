# 🚀 SPRINT 1 — DEPLOYMENT TO PRODUCTION

**Sprint Goal:** Get AI Learning Coach MVP live  
**Duration:** 1.5 hours  
**Owner:** Sharon Afroni  
**Start Date:** 2026-08-25  
**Status:** 🎯 Ready to start

---

## 📋 Sprint Objective

Deploy the completed MVP to production with:
- ✅ Frontend on Vercel
- ✅ Backend on Railway
- ✅ Database on Supabase
- ✅ Google OAuth configured
- ✅ End-to-end verification

**Success Criteria:**
- [ ] Frontend loads at `https://[vercel-domain]`
- [ ] Backend health check passes at `https://[railway-domain]/health`
- [ ] Google OAuth login works
- [ ] Database saves data successfully
- [ ] API requests complete without errors

---

## 🎯 Tasks (in order)

### Task 1.1: Supabase Database Setup
**Duration:** 15 minutes  
**Owner:** Sharon  
**Status:** 🔴 Not started

**Subtasks:**
- [ ] Create Supabase project
- [ ] Get connection string
- [ ] Enable pgvector extension
- [ ] Run database migrations
- [ ] Verify tables created

**Checklist:**
```bash
# After setting DATABASE_URL:
DATABASE_URL="postgresql://..." npm run migrate
# Should see: ✓ Migrations complete
```

**Save these:**
- `DATABASE_URL` from Supabase
- `SUPABASE_URL` (project URL)

**Reference:** `DEPLOYMENT_ACTION_PLAN.md` → Phase 1  
**Estimated:** ⏱️ 15 min

---

### Task 1.2: Railway Backend Deployment
**Duration:** 20 minutes  
**Owner:** Sharon  
**Status:** 🔴 Not started

**Subtasks:**
- [ ] Create Railway account
- [ ] Connect GitHub repo
- [ ] Configure environment variables
- [ ] Deploy backend
- [ ] Verify health check

**Environment Variables to Set (in Railway):**
```
DATABASE_URL=postgresql://[from-supabase]
JWT_SECRET=[generate-random-32-char]
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
GOOGLE_CALLBACK_URL=https://[railway-domain]/auth/google/callback
ALLOWED_ORIGINS=https://[vercel-domain],http://localhost:3000
FRONTEND_URL=https://[vercel-domain]
PORT=3001
NODE_ENV=production
```

**Verification:**
```bash
curl https://[railway-domain]/health
# Should return: {"status":"ok"}
```

**Save these:**
- `RAILWAY_BACKEND_URL` (backend domain)
- `JWT_SECRET` (random string)

**Reference:** `DEPLOYMENT_ACTION_PLAN.md` → Phase 2  
**Estimated:** ⏱️ 20 min

---

### Task 1.3: Vercel Frontend Deployment
**Duration:** 15 minutes  
**Owner:** Sharon  
**Status:** 🔴 Not started

**Subtasks:**
- [ ] Create Vercel account
- [ ] Import AI_Learning_Coach repo
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy frontend

**Environment Variables to Set (in Vercel):**
```
VITE_API_BASE_URL=https://[railway-backend-domain]
VITE_GOOGLE_CLIENT_ID=placeholder
VITE_FRONTEND_URL=https://[vercel-domain]
```

**Verification:**
```bash
# Visit in browser
https://[vercel-domain]
# Should show: Login page with "Sign in with Google" button
```

**Save these:**
- `VERCEL_FRONTEND_URL` (frontend domain)

**Reference:** `DEPLOYMENT_ACTION_PLAN.md` → Phase 3  
**Estimated:** ⏱️ 15 min

---

### Task 1.4: Google OAuth Configuration
**Duration:** 10 minutes  
**Owner:** Sharon  
**Status:** 🔴 Not started

**Subtasks:**
- [ ] Create Google Cloud project
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add redirect URIs
- [ ] Update environment variables in Railway & Vercel
- [ ] Redeploy both

**Redirect URIs to Add in Google Console:**
```
https://[vercel-domain]/auth/google/callback
https://[railway-domain]/auth/google/callback
http://localhost:3000/auth/google/callback
```

**Environment Variables to Update:**

**Railway:**
```
GOOGLE_CLIENT_ID=[your-real-client-id]
GOOGLE_CLIENT_SECRET=[your-secret]
GOOGLE_CALLBACK_URL=https://[railway-domain]/auth/google/callback
```

**Vercel:**
```
VITE_GOOGLE_CLIENT_ID=[your-real-client-id]
```

**Verification:**
```bash
# Visit frontend, click "Sign in with Google"
# Should complete OAuth flow without errors
```

**Save these:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Reference:** `DEPLOYMENT_ACTION_PLAN.md` → Phase 4  
**Estimated:** ⏱️ 10 min

---

### Task 1.5: End-to-End Verification
**Duration:** 5 minutes  
**Owner:** Sharon  
**Status:** 🔴 Not started

**Test Cases:**

**Test 1: Login Flow**
- [ ] Visit frontend URL
- [ ] Click "Sign in with Google"
- [ ] Login with Google account
- [ ] Redirects to Dashboard
- [ ] No errors in browser console

**Test 2: Ask a Question**
- [ ] Go to "Ask Question" page
- [ ] Type: "What is Newton's second law?"
- [ ] Click "Search"
- [ ] See AI response load
- [ ] No API errors

**Test 3: Database Check**
- [ ] In Supabase → Table Editor
- [ ] Check `users` table has your user
- [ ] Verify other tables exist

**Test 4: Backend Health**
- [ ] Run: `curl https://[railway-domain]/health`
- [ ] Get: `{"status":"ok"}`
- [ ] No timeouts or errors

**Test 5: Performance**
- [ ] Open DevTools (F12)
- [ ] Network tab → Reload page
- [ ] Check:
  - Page load < 3 seconds ✓
  - No 401/403/500 errors ✓
  - API calls return 200 ✓

**Reference:** `DEPLOYMENT_ACTION_PLAN.md` → Phase 5  
**Estimated:** ⏱️ 5 min

---

## 📊 Progress Tracking

| Task | Duration | Status | Completed |
|------|----------|--------|-----------|
| 1.1 Supabase | 15 min | 🔴 | - |
| 1.2 Railway Backend | 20 min | 🔴 | - |
| 1.3 Vercel Frontend | 15 min | 🔴 | - |
| 1.4 Google OAuth | 10 min | 🔴 | - |
| 1.5 Verification | 5 min | 🔴 | - |
| **Total** | **65 min** | 🔴 | - |

---

## 🎯 Key Credentials (Fill in as you go)

Save these somewhere secure (1Password, Bitwarden, etc.):

```
=== SUPABASE ===
Project URL: [fill in]
Database URL: postgresql://[fill in]
Supabase Key: [fill in]

=== RAILWAY ===
Backend URL: https://[fill in].railway.app
JWT Secret: [fill in]

=== VERCEL ===
Frontend URL: https://[fill in].vercel.app

=== GOOGLE OAUTH ===
Client ID: [fill in]
Client Secret: [fill in]
```

---

## 📚 Documentation References

| Document | Purpose | Phase |
|----------|---------|-------|
| `DEPLOYMENT_ACTION_PLAN.md` | 📋 Step-by-step guide | All |
| `DEPLOYMENT_GUIDE.md` | 📖 Detailed reference | All |
| `PRE_DEPLOYMENT_CHECKLIST.md` | ✅ Pre-flight check | Before start |
| `PHASE_5_COMPLETE.md` | 🎯 What was built | Reference |

---

## 🚀 Getting Started

### Before You Start:
1. **Read:** `PRE_DEPLOYMENT_CHECKLIST.md` (5 min)
   - Confirms everything is ready
   - No surprises during deployment

2. **Read:** `DEPLOYMENT_ACTION_PLAN.md` (10 min)
   - Bookmark it for reference
   - Follow it step-by-step

### Then Execute:
1. **Task 1.1:** Supabase (15 min)
2. **Task 1.2:** Railway (20 min)
3. **Task 1.3:** Vercel (15 min)
4. **Task 1.4:** Google OAuth (10 min)
5. **Task 1.5:** Verify (5 min)

**Estimated Total:** 65 minutes ⏱️

---

## 🎉 Done! What's Next?

Once live (Task 1.5 ✅):

**Option A: Monitor**
- Watch logs for 24 hours
- Get user feedback
- Fix any issues

**Option B: Next Sprint (Phase 6)**
- Start testing & quality work
- Add unit tests
- Performance optimization
- Accessibility audit

**Option C: Next Sprint (Phase 7)**
- Expand to Math + Chemistry
- Add more subjects
- More problem bank

---

## 🆘 If You Get Stuck

1. **Check:** `DEPLOYMENT_GUIDE.md` → Troubleshooting section
2. **Common issues:**
   - Database connection → Check `DATABASE_URL`
   - OAuth 401 → Check `GOOGLE_CLIENT_ID`
   - Backend 503 → Check Railway logs

3. **Resources:**
   - Vercel Docs: https://vercel.com/docs
   - Railway Docs: https://docs.railway.app
   - Supabase Docs: https://supabase.com/docs

---

## ✅ Definition of Done

Sprint 1 is complete when:

- [x] Task 1.1: Supabase database live with migrations ✅
- [x] Task 1.2: Backend deployed to Railway ✅
- [x] Task 1.3: Frontend deployed to Vercel ✅
- [x] Task 1.4: Google OAuth working ✅
- [x] Task 1.5: All verification tests pass ✅
- [x] No errors in production logs
- [x] App accessible from internet
- [x] Login flow works end-to-end

---

## 📝 Commit Plan (After Deployment)

Once everything is live, make a deployment commit:

```bash
git add DEPLOYMENT_ACTION_PLAN.md PRE_DEPLOYMENT_CHECKLIST.md SPRINT_1_DEPLOYMENT.md

git commit -m "docs: Complete Sprint 1 - Deploy MVP to production

- Frontend: https://[vercel-domain].vercel.app
- Backend: https://[railway-project].railway.app
- Database: Supabase PostgreSQL with pgvector
- Auth: Google OAuth configured
- Status: ✅ All systems live and verified

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

## 🎯 Summary

**Sprint 1: DEPLOYMENT TO PRODUCTION**

| Phase | Duration | Task | Status |
|-------|----------|------|--------|
| 1 | 15 min | Supabase | 🔴 To do |
| 2 | 20 min | Railway | 🔴 To do |
| 3 | 15 min | Vercel | 🔴 To do |
| 4 | 10 min | OAuth | 🔴 To do |
| 5 | 5 min | Verify | 🔴 To do |

**Total:** ~65 minutes  
**Owner:** Sharon Afroni  
**Goal:** 🎉 AI Learning Coach MVP live in production  

---

**Status:** 🎯 Ready to deploy  
**Next:** Open `DEPLOYMENT_ACTION_PLAN.md` and start Phase 1  
**Let's go! 🚀**
