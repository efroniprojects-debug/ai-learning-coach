# 🎯 MASTER ORCHESTRATOR — AI Learning Coach Development
**Your Role:** Principal Engineer for AI Learning Coach  
**Date:** 2026-08-25  
**Status:** MVP Complete → Deployment & Extensions

---

## 📋 Table of Contents

1. [Current State](#current-state)
2. [Your Mission](#your-mission)
3. [How to Use These Prompts](#how-to-use-these-prompts)
4. [Phase Roadmap](#phase-roadmap)
5. [Governance Rules](#governance-rules)
6. [Key Decisions](#key-decisions)
7. [Command Reference](#command-reference)

---

## 📊 Current State

### MVP Status: ✅ 100% COMPLETE

**What exists:**
- ✅ Auth system (Google OAuth + JWT)
- ✅ AI integration (Claude, OpenAI, Gemini via abstraction)
- ✅ Question workspace (RAG + semantic search)
- ✅ Knowledge upload (PDF, OCR, embeddings)
- ✅ Practice engine (ELO-based adaptive)
- ✅ Progress dashboard (analytics + insights)
- ✅ Sharing system (public links + expiration)

**What's ready:**
- ✅ 26 backend API routes
- ✅ 6 frontend pages (React 19)
- ✅ PostgreSQL database (Drizzle ORM + pgvector)
- ✅ TypeScript strict mode throughout
- ✅ Hebrew RTL support
- ✅ Error handling & validation
- ✅ Dockerfile & deployment config

**What's NOT done:**
- ⚠️ Tests (unit, integration, E2E)
- ⚠️ Performance optimization
- ⚠️ Error monitoring (Sentry)
- ⚠️ Analytics (Google Analytics)
- ⚠️ Accessibility audit (WCAG AA)
- ⚠️ Deployed to production
- ⚠️ Multi-subject support (Math, Chemistry)
- ⚠️ Advanced features (live tutoring, mobile, etc.)

---

## 🎯 Your Mission

You are now the **Principal Engineer** responsible for:

1. **Deploying MVP to production** (1-2 hours)
   → Follow **DEPLOYMENT_GUIDE.md**
   → Get the app live on Vercel + Railway + Supabase

2. **Phase 6: Quality Polish** (2-3 weeks)
   → Run **PHASE_6_SPRINT_PROMPT.md**
   → Add tests, optimize performance, implement monitoring

3. **Phase 7: Multi-Subject** (2-4 weeks)
   → Run **PHASE_7_SPRINT_PROMPT.md**
   → Add Math & Chemistry subjects

4. **Phase 8: Advanced Features** (4-6 weeks)
   → Run **PHASE_8_SPRINT_PROMPT.md**
   → Pick 1-2 features (live tutoring, mobile, forum, etc.)

---

## 📖 How to Use These Prompts

### For Each Phase:

1. **Read** the sprint prompt (e.g., `PHASE_6_SPRINT_PROMPT.md`)
2. **Understand** the acceptance criteria
3. **Create branch:** `git checkout -b feature/phase-6-testing`
4. **Implement tasks** in order
5. **Run tests:** `npm run test && npm run lint && npm run type-check`
6. **Commit often:** Small, logical commits
7. **Create PR:** Ask for review
8. **Merge:** Squash + merge to main
9. **Update status:** Record what you completed

### For Quick Context:

- **Status Overview:** Read `CURRENT_STATUS_2026_08_25.md`
- **Architecture:** See `CLAUDE.md` (governance)
- **Phase Details:** Pick a `PHASE_*.md` file
- **Deployment:** Follow `DEPLOYMENT_GUIDE.md`

---

## 🗺️ Phase Roadmap

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1-5: MVP (COMPLETE ✅)                               │
│ • Auth, AI, Questions, Upload, Practice, Progress          │
│ • All 26 API routes built                                  │
│ • All 6 frontend pages built                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: Quality Polish (TODO)                              │
│ • Unit tests (>80% coverage)                                │
│ • Integration & E2E tests                                   │
│ • Performance optimization                                  │
│ • Error monitoring (Sentry)                                 │
│ • Analytics (Google Analytics)                              │
│ • Accessibility (WCAG AA)                                   │
│ Duration: 2-3 weeks                                         │
│ Effort: 18 days (can split into 2 cycles)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 7: Multi-Subject (TODO)                               │
│ • Add Math subject (100+ problems)                           │
│ • Add Chemistry subject (50+ problems)                       │
│ • Configurable subject framework                            │
│ • Subject-specific tutor prompts                            │
│ • LaTeX & molecular visualization                           │
│ Duration: 2-4 weeks                                         │
│ Effort: 16 days                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 8: Advanced Features (TODO)                           │
│ Pick 1-2:                                                   │
│ • Live Tutoring (WebSocket + video) — 2 weeks              │
│ • Mobile App (React Native) — 3 weeks                       │
│ • Video Explanations — 1 week                               │
│ • Peer Forum — 2 weeks                                      │
│ • Family Accounts — 2 weeks                                 │
│ • Adaptive Study Plans — 1 week                             │
│ Duration: 4-6 weeks (1-2 features)                          │
│ Effort: Varies (1-3 weeks per feature)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚖️ Governance Rules

**READ CLAUDE.md FIRST** — It contains all the rules. Key rules:

### 🔐 Security
- [ ] No hardcoded secrets or API keys
- [ ] API keys encrypted (AES-256) on server only
- [ ] Use AIGateway for all AI calls (never direct provider calls)
- [ ] All auth via JWT (backend validates)

### 📝 Code Quality
- [ ] TypeScript strict mode (no `any` types without comment)
- [ ] ESLint + Prettier on every commit
- [ ] Tests for all new features (>80% coverage)
- [ ] No breaking changes to existing APIs

### 🌐 Multi-Subject
- [ ] No `if (subject === 'physics')` in code
- [ ] Use config/env variables for subject-specific behavior
- [ ] Database supports multiple subjects from day 1

### 📱 Accessibility & RTL
- [ ] Hebrew RTL support (Tailwind `dir="rtl"`)
- [ ] WCAG AA compliance (keyboard nav, color contrast, screen reader)
- [ ] Test in both RTL & LTR modes

### 📚 Documentation
- [ ] Comments explain non-obvious WHY (not WHAT)
- [ ] JSDoc for components & functions
- [ ] Commit messages include rationale
- [ ] README updated if needed

---

## 🔑 Key Decisions

### Architecture
1. **AIGateway abstraction** — Support Claude, OpenAI, Gemini (no vendor lock-in)
2. **RAG over fine-tuning** — Faster, cheaper, real-time updates
3. **ELO for mastery** — Chess-like system, proven adaptive learning
4. **BYOK model** — Users provide their own API keys (privacy + cost)

### Database
1. **PostgreSQL + Drizzle ORM** — Type-safe, migrations-first
2. **pgvector for embeddings** — Built-in semantic search
3. **Migrations required** — Never manual SQL

### Frontend
1. **React 19** — Latest stable, full TypeScript support
2. **Tailwind CSS** — RTL support out of box
3. **React Router** — Protected routes for auth

### Deployment
1. **Vercel** — Frontend (auto-deploy from main)
2. **Railway** — Backend (Docker, auto-scaling)
3. **Supabase** — Database (PostgreSQL + pgvector)

---

## 🛠️ Command Reference

### Setup
```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Fill in values (GOOGLE_CLIENT_ID, etc.)
```

### Development
```bash
# Start dev servers (frontend + backend)
npm run dev

# Just frontend
cd frontend && npm run dev

# Just backend
cd backend && npm run dev

# Start database (if using docker-compose)
docker-compose up -d
```

### Quality Checks
```bash
# Lint
npm run lint

# Type check
npm run type-check

# Tests
npm run test               # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Build
npm run build

# All checks (before commit)
npm run lint && npm run type-check && npm run test && npm run build
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/phase-6-testing

# Work, commit often
git add .
git commit -m "feat: Add unit tests for services"

# Before pushing, ensure everything passes
npm run lint && npm run type-check && npm run test

# Push to remote
git push origin feature/phase-6-testing

# Create PR on GitHub
# Have someone review
# Address feedback
# Merge to main (squash)
git checkout main
git pull
# (PR is merged via GitHub UI)
```

### Deployment
```bash
# Frontend (Vercel)
# Auto-deploys from main (git push)

# Backend (Railway)
# Auto-deploys from main (git push)

# Database (Supabase)
# Run migrations
npm run migrate

# Check deployment status
# Vercel: https://vercel.com/dashboard
# Railway: https://railway.app/dashboard
# Supabase: https://app.supabase.com
```

---

## 📋 Immediate Next Steps

### For Deployment (Choose One):

**Option A: Deploy Now (1-2 hours)**
1. Read `DEPLOYMENT_GUIDE.md`
2. Follow step-by-step
3. Get MVP live on Vercel + Railway + Supabase
4. Test main flows (login → ask → practice → progress)

**Option B: Polish First, Deploy Later**
1. Start Phase 6 (testing + optimization)
2. Add tests & monitoring
3. Then deploy to production

### Recommended Path:
1. **Deploy MVP as-is** (it works, just needs monitoring)
2. **Run Phase 6** in parallel (tests, optimization)
3. **Launch public beta** → get user feedback
4. **Phase 7 & 8** based on user demand

---

## 🎓 Learning Resources

**If you get stuck:**

1. **Architecture questions** → Read `CLAUDE.md`
2. **Feature details** → Read `PHASE_*.md`
3. **Code examples** → Check existing code in `backend/src/` or `frontend/src/`
4. **Git help** → `git help <command>`
5. **TypeScript issues** → Check `tsconfig.json` and compiler errors

**Key Files:**
- `CLAUDE.md` — Project governance (must-read)
- `CURRENT_STATUS_2026_08_25.md` — Full status
- `DEPLOYMENT_GUIDE.md` — Production setup
- `docs/DEFINITION_OF_DONE.md` — Feature checklist
- `README.md` — Project overview

---

## 📞 Support

**Questions?**
- Check existing GitHub issues
- Search code for examples
- Read comments in similar features
- Ask in PR review

**Blockers?**
- Create GitHub issue with error message & context
- Provide reproduction steps
- Share relevant code snippets

---

## ✅ Success Metrics

### Phase 6 (Quality)
- [ ] >80% test coverage
- [ ] 0 lint errors
- [ ] Bundle < 500KB
- [ ] Lighthouse > 80
- [ ] WCAG AA passed

### Phase 7 (Multi-Subject)
- [ ] Math & Chemistry subjects added
- [ ] 100+ Math problems indexed
- [ ] 50+ Chemistry problems indexed
- [ ] Subject selector working
- [ ] All API routes support subject param

### Phase 8 (Advanced)
- [ ] 1-2 advanced features shipped
- [ ] Feature fully tested & documented
- [ ] No regressions in existing features
- [ ] User feedback positive

---

## 🚀 Timeline

**Aggressive (3 months):**
```
Weeks 1-2:  Deploy MVP + Phase 6 (parallel)
Weeks 3-4:  Phase 6 completion
Weeks 5-8:  Phase 7 (Math + Chemistry)
Weeks 9-12: Phase 8 (2 features)
```

**Balanced (6 months):**
```
Weeks 1-2:  Deploy MVP
Weeks 3-4:  Phase 6 (testing)
Weeks 5-8:  Phase 7 (multi-subject)
Weeks 9-12: Phase 8 (live tutoring)
Weeks 13-16: Phase 8 (mobile or forum)
Weeks 17-24: Optimization & scaling
```

**Relaxed (1 year):**
```
Months 1-2:  MVP deployment + initial users
Months 3-4:  Phase 6 (polish based on feedback)
Months 5-6:  Phase 7 (2-3 subjects)
Months 7-12: Phase 8 (features in demand)
```

---

## 🎯 Final Checklist

Before starting, ensure you have:

- [ ] Read `CLAUDE.md` (governance)
- [ ] Reviewed `CURRENT_STATUS_2026_08_25.md` (context)
- [ ] Cloned/opened the git repo
- [ ] Installed dependencies (`npm install`)
- [ ] Created `.env.local` with required variables
- [ ] Can run `npm run dev` (frontend + backend)
- [ ] Can access http://localhost:5050 (frontend)
- [ ] Can access http://localhost:3000/api/v1 (backend)

**Ready?** Pick your phase below and start:

---

## 🚀 START HERE

### To Deploy MVP:
→ Read `DEPLOYMENT_GUIDE.md`

### To Run Phase 6 (Testing):
→ Read `PHASE_6_SPRINT_PROMPT.md`

### To Run Phase 7 (Multi-Subject):
→ Read `PHASE_7_SPRINT_PROMPT.md`

### To Run Phase 8 (Advanced):
→ Read `PHASE_8_SPRINT_PROMPT.md`

---

**Owner:** Sharon Afroni  
**Date Created:** 2026-08-25  
**Status:** Ready to deploy & extend  
**Next Review:** After Phase 6 completion

---

## 💡 Remember

> "The MVP is complete. What remains is polish, extension, and learning from real users."

Focus on:
1. **Getting it live** → Real feedback beats perfect code
2. **Fixing what users need** → Iterate based on usage
3. **Building with quality** → Tests & monitoring matter
4. **Staying extensible** → New subjects & features should be easy

You've got this. 🚀

---

**Last Updated:** 2026-08-25
