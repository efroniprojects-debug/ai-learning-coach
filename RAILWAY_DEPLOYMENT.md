# Railway Deployment Guide — Backend

Deploy the AI Learning Coach backend to Railway in minutes.

## Quick Start

### 1. Connect GitHub Repository
- Go to [railway.app](https://railway.app)
- Click "New Project" → "Deploy from GitHub repo"
- Select your fork: `efroniprojects-debug/ai-learning-coach`

### 2. Add PostgreSQL Database
- In Railway dashboard, click "Add Service" → "Database" → "PostgreSQL"
- Copy the connection string (Railway will auto-inject as `DATABASE_URL`)

### 3. Deploy Backend
Railway will automatically:
- Detect `Procfile` at root
- Install dependencies: `npm install`
- Run backend from: `cd backend && npm start`
- Expose on port assigned by Railway (auto-read from `PORT` env var)

### 4. Set Environment Variables
In Railway dashboard, go to "Backend Service" → "Variables" and set:

```
NODE_ENV=production
PORT=3000  # Railway will override this automatically
ALLOWED_ORIGINS=https://frontend-vercel-url.vercel.app,https://yourdomain.com
DATABASE_URL=<auto-injected from PostgreSQL service>
```

**Optional (for full functionality):**
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
OPENAI_API_KEY=sk-proj-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=your-secret-key-min-32-chars
```

### 5. Get Backend URL
- Railway assigns a public URL (e.g., `https://ai-learning-coach-backend.railway.app`)
- Use this in frontend's `VITE_API_URL` environment variable

### 6. Connect Frontend to Backend
In Vercel (frontend) dashboard, set:
```
VITE_API_URL=https://ai-learning-coach-backend.railway.app
```

## Troubleshooting

### Build Fails: `Cannot find module 'tsx'`
**Fix:** Add `tsx` to `backend/package.json` dependencies ✅ (already done)

### Build Fails: `npm ERR! missing: @types/node`
**Fix:** `@types/node` is in `devDependencies` ✅ (already done)

### Server Starts but `/health` Returns Error
**Cause:** Port mismatch or CORS issue
**Fix:**
1. Check Railway logs: `railway logs`
2. Verify `PORT` env var is set
3. Verify frontend URL in `ALLOWED_ORIGINS`

### Database Connection Fails
**Cause:** `DATABASE_URL` not set or wrong format
**Fix:**
1. Ensure PostgreSQL service is running in Railway
2. Check `DATABASE_URL` is auto-injected
3. Run migrations: `npm run db:migrate` (when available)

## Monitoring & Logs

### View Live Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs
railway logs
```

### Health Check
```bash
curl https://your-railway-backend-url.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-08-25T12:34:56.789Z"
}
```

## Environment Variables Reference

| Variable | Example | Required | Notes |
|----------|---------|----------|-------|
| `NODE_ENV` | `production` | ✅ | Set to production |
| `PORT` | Auto (Railway) | ✅ | Railway assigns automatically |
| `DATABASE_URL` | `postgresql://...` | ✅ | Auto-injected from PostgreSQL service |
| `ALLOWED_ORIGINS` | `https://frontend.vercel.app` | ✅ | Frontend URL for CORS |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | ❌ | For Claude integration |
| `GOOGLE_CLIENT_ID` | `...apps.googleusercontent.com` | ❌ | For OAuth |
| `JWT_SECRET` | Min 32 chars | ❌ | For auth token signing |

## What's Deployed

Backend only. Frontend is deployed separately to **Vercel**.

```
┌─ GitHub ─────────────────┐
│ main branch              │
└──────────┬─────────────┬─┘
           │             │
       Railway         Vercel
       Backend        Frontend
```

## CI/CD Pipeline

On every push to `main`:
1. **GitHub** triggers Railway deployment
2. **Railway** installs dependencies (backend/)
3. **Railway** runs `npm start` (tsx src/index.ts)
4. **Frontend** (Vercel) automatically builds from same commit

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Connect Railway to GitHub repo
3. ✅ Add PostgreSQL service in Railway
4. ✅ Set environment variables
5. ✅ Trigger deploy (automatic on push)
6. ✅ Test `/health` endpoint
7. ✅ Update frontend `VITE_API_URL`
8. ✅ Test login flow (end-to-end)

## Support

- Railway Docs: https://docs.railway.app
- Project Issues: GitHub Issues in the repo
- Contact: Open a discussion

---

**Last Updated:** 2026-08-25
