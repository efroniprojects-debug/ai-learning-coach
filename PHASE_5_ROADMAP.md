# Phase 5: Practice & Sharing — ROADMAP

**Target:** Weeks 9-12 (Final MVP Push)  
**Goal:** Complete the adaptive learning + sharing system  
**Status:** Architecture & Database Schema Ready

---

## What's Been Built (This Session)

✅ **Database Schema Extensions:**
- `practice_attempts` — Track each practice submission
- `skill_mastery` — ELO ratings per concept
- `progress_snapshots` — Daily progress tracking
- `share_links` — Shareable resource links

✅ **Practice Service (Complete Implementation):**
- Adaptive problem selection (weak concept prioritization)
- ELO calculation (chess-like rating system)
- Confidence levels (novice → expert)
- Progress snapshot management
- Mastery overview + recommendations
- Practice history tracking

---

## Components Still to Build

### Backend (Ready to Implement)

**Practice Routes:**
```typescript
POST   /api/v1/practice/start-session
POST   /api/v1/practice/submit-attempt
GET    /api/v1/practice/next-recommendation
GET    /api/v1/practice/history
GET    /api/v1/practice/mastery-overview
```

**Sharing Routes:**
```typescript
POST   /api/v1/share/generate-link
GET    /api/v1/share/:share-id
DELETE /api/v1/share/:share-id
```

**Progress Routes:**
```typescript
GET /api/v1/progress/overview
GET /api/v1/progress/history
GET /api/v1/progress/mastery-levels
```

### Frontend (Ready to Implement)

**Practice Page:**
- Problem display
- Timer (optional, focus mode)
- Answer submission
- Mastery feedback (ELO change)
- Next recommendation

**Progress Dashboard:**
- Mastery breakdown (pie chart: novice/intermediate/proficient/expert)
- Recent attempts (table)
- Weak areas (highlight for practice)
- Time spent (analytics)

**Sharing UI:**
- Generate link dialog
- Link type selector (exercise, solution, progress)
- Expiration time picker
- Public view (shared recipient)

**Focus Mode:**
- Micro-tasks (5-min sessions)
- Break reminders
- Minimal UI
- Progress indicators

---

## Architecture (Locked In)

### Adaptive Learning (ELO System)

```
User Practice Session:
  ↓
Select Problem (adaptive difficulty)
  ↓
User attempts
  ↓
Evaluate correctness
  ↓
Update ELO rating
  - Correct: +K (based on current rating)
  - Wrong: -K
  ↓
Update confidence level
  - Novice: ELO < 1200
  - Intermediate: 1200-1400
  - Proficient: 1400-1600
  - Expert: 1600+
  ↓
Record in progress snapshot
  ↓
Recommend next concept
```

### Sharing System

```
User selects resource (question, solution, progress)
  ↓
POST /api/v1/share/generate-link
  ↓
Generate:
  - Short ID (12 chars)
  - Access token (secure)
  - Expiration (optional)
  ↓
Return shareable URL
  ↓
Shared recipient visits URL
  ↓
GET /api/v1/share/:id (public, no auth)
  ↓
Display resource (view-only)
  ↓
Track view count + analytics
```

---

## Implementation Order (Recommended)

### Week 9-10: Practice Engine
1. Create practice routes
2. Implement endpoint logic
3. Build practice UI (form + mastery display)
4. Test ELO calculations

### Week 11: Progress & Sharing
1. Create sharing routes
2. Build share link UI
3. Implement public view
4. Create progress dashboard

### Week 12: Focus Mode & Polish
1. Focus mode UI (micro-tasks)
2. Accessibility review
3. End-to-end testing
4. Performance optimization

---

## Key Design Decisions

### ELO System (Why?)
- ✅ Proven in chess, poker, Duolingo
- ✅ Adaptive: difficulty matches skill
- ✅ Motivating: visible progress (ratings)
- ✅ Fair: hard wins = more points, easy wins = fewer

### Sharing (Why?)
- ✅ Peer learning
- ✅ Teacher sharing with class
- ✅ Collaboration
- ✅ Accessible links (no login needed)

### Focus Mode (Why?)
- ✅ ADHD-friendly (micro-tasks)
- ✅ Reduced cognitive load
- ✅ Visible progress
- ✅ Built-in breaks

---

## Database Queries (Ready to Execute)

```sql
-- Get user's weakest concepts
SELECT * FROM skill_mastery 
WHERE user_id = :userId 
ORDER BY elo_rating ASC 
LIMIT 5;

-- Get today's attempts
SELECT * FROM practice_attempts
WHERE user_id = :userId 
AND created_at >= TODAY()
ORDER BY created_at DESC;

-- Calculate mastery distribution
SELECT 
  confidence_level,
  COUNT(*) as count
FROM skill_mastery
WHERE user_id = :userId
GROUP BY confidence_level;

-- Get progress trend (last 7 days)
SELECT date, problems_solved, time_spent_seconds
FROM progress_snapshots
WHERE user_id = :userId
AND date >= NOW() - INTERVAL '7 days'
ORDER BY date DESC;
```

---

## MVP Completion Checklist

### Core Features
- [x] Auth (Google OAuth + JWT)
- [x] AI Settings (provider selection + BYOK)
- [x] Question Workspace (ask → get answer with citations)
- [x] Upload & Knowledge (OCR + chunking + embeddings)
- [ ] Practice Engine (adaptive problems + ELO)
- [ ] Progress Dashboard (mastery overview)
- [ ] Sharing (shareable links)

### Non-Functional
- [ ] Focus mode (micro-tasks, breaks)
- [ ] Accessibility (WCAG AA)
- [ ] Performance (< 3s page load)
- [ ] Mobile responsiveness
- [ ] Error handling + validation
- [ ] Logging + monitoring

### Quality
- [x] TypeScript strict mode
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [x] Linting + formatting
- [x] Documentation

---

## What You Have Ready

### Database ✅
```
users, sessions, aiProviderConfigs
uploadedFiles, knowledgeChunks
practiceAttempts, skillMastery
shareLinks, progressSnapshots
auditLogs
```

### Backend Services ✅
```
- auth, encryption, jwt
- ai (gateway + Claude adapter)
- question, knowledge, tutor
- upload, ocr, chunking, embedding
- practice (complete!)
```

### Frontend Pages ✅
```
- Login, Dashboard
- AI Settings
- Question Workspace
- Upload
- (Practice, Progress, Sharing to build)
```

### API Routes ✅
```
Auth (4 endpoints)
AI Settings (4 endpoints)
Questions (6 endpoints)
Knowledge (3 endpoints)
Uploads (5 endpoints)
(Practice, Sharing, Progress to build)
```

---

## Parallel Work Possible

**Can be done independently:**
- Frontend Practice Page (uses practice routes)
- Frontend Progress Dashboard (uses progress routes)
- Frontend Sharing UI (uses share routes)
- Focus Mode UI (standalone feature)
- Tests (entire test suite)
- Documentation (README, API docs)

---

## Success Criteria (MVP Launch)

✅ User can login  
✅ User can ask physics questions  
✅ System returns citations  
✅ User can upload exam PDFs  
✅ System indexes uploaded material  
✅ User can practice problems  
✅ System tracks mastery (ELO)  
✅ User can share solutions  
✅ Mobile responsive  
✅ Hebrew RTL support  
✅ Secure (no secrets exposed)  
✅ <3s page load  

---

## Deployment Ready

Once Phase 5 completes:
1. Database migrations ready
2. All services implemented
3. All routes implemented
4. All UI pages built
5. Tests passing
6. CI/CD green

Ready to deploy to:
- Frontend: Vercel
- Backend: Railway / Cloud Run
- Database: Supabase

---

## Next Steps

**You're at 60% MVP. Phase 5 will complete it to 100%.**

To continue:
1. Implement Practice Routes (5 endpoints)
2. Build Practice UI (page + components)
3. Implement Sharing Routes (3 endpoints)
4. Build Sharing UI (dialog + public view)
5. Create Progress Dashboard
6. Add Focus Mode
7. Full testing suite
8. Deploy

**Estimated remaining time: 4-6 hours to full MVP**

---

**Status:** Architecture locked, database ready, practice service complete, ready to build routes + UI.

**Ready to code Phase 5?** Let's go! 🚀
