# Phase 6: Polish & Optimization — SPRINT PROMPT
**Duration:** 2-3 weeks  
**Goal:** Production-ready quality (tests, optimization, monitoring)  
**Owner:** Claude Code / AI Agent  
**Date Created:** 2026-08-25

---

## Phase 6 Overview

The MVP is feature-complete but needs quality polish before production. This phase focuses on:
1. **Testing** — Unit, integration, E2E tests (>80% coverage)
2. **Performance** — Bundle size reduction, query optimization
3. **Monitoring** — Error tracking (Sentry), analytics (Google Analytics)
4. **Accessibility** — WCAG AA compliance audit
5. **Mobile** — Responsive design verification

---

## What Success Looks Like

### Testing (Week 1-2)
- [ ] Unit tests for all services (>80% coverage)
  - [ ] `backend/src/services/*.service.ts` (80%+ lines)
  - [ ] `backend/src/ai/gateway.ts` (100% — critical)
  - [ ] `frontend/src/services/*.api.ts` (80%+ lines)
- [ ] Integration tests for API routes
  - [ ] Auth flow (login, logout, refresh token)
  - [ ] Question asking + RAG retrieval
  - [ ] Practice + ELO update
  - [ ] Knowledge upload + embedding
- [ ] E2E tests (Playwright) for main flows
  - [ ] User signup → login → ask question
  - [ ] User uploads document → searches → finds answer
  - [ ] User practices → sees ELO change → views progress
- [ ] All tests pass locally + CI ✅

### Performance (Week 2)
- [ ] Bundle size audit
  - [ ] Frontend bundle < 500KB (gzipped)
  - [ ] No unused dependencies
  - [ ] Code splitting working
- [ ] Database query optimization
  - [ ] Queries complete < 500ms (p95)
  - [ ] Indexes properly used
  - [ ] N+1 problems eliminated
- [ ] Lighthouse score > 80 (Performance)

### Monitoring (Week 2)
- [ ] Sentry error tracking configured
- [ ] Google Analytics events implemented
- [ ] Health checks on all critical endpoints
- [ ] Logging properly configured (no secrets)

### Accessibility (Week 3)
- [ ] WCAG AA compliance audit (axe DevTools)
- [ ] Keyboard navigation test (all interactive elements)
- [ ] Screen reader test (VoiceOver/NVDA)
- [ ] Color contrast check (all text ≥ 4.5:1)
- [ ] Focus indicators visible everywhere

### Mobile (Week 3)
- [ ] Responsive design check (375px → 1920px)
- [ ] Touch target sizes (≥48px × 48px)
- [ ] Mobile menu navigation
- [ ] Form inputs work on mobile

---

## Sprint 6A: Testing (Weeks 1-2)

### Task 6A.1: Unit Tests — Backend Services

**Goal:** >80% code coverage on business logic

**Files to test:**
```
backend/src/services/
  ├── auth.service.ts           (login, refresh, logout)
  ├── practice.service.ts        (ELO calculation, adaptive selection)
  ├── knowledge.service.ts       (embedding, chunking, search)
  ├── question.service.ts        (RAG retrieval, citation)
  └── progress.service.ts        (snapshot, mastery calc)

backend/src/ai/
  ├── gateway.ts                 (provider routing, cost tracking)
  ├── providers/claude.ts        (Claude API wrapper)
  ├── providers/openai.ts        (OpenAI API wrapper)
  └── providers/gemini.ts        (Gemini API wrapper)
```

**Test Framework:** Vitest (already in package.json)

**Example test structure:**
```typescript
// backend/src/services/__tests__/practice.service.test.ts
describe('PracticeService', () => {
  describe('calculateELO', () => {
    it('should increase ELO by 32 for correct answer at 1000 rating', () => {
      const change = calculateELO(1000, true);
      expect(change).toBe(32);
    });

    it('should decrease ELO for wrong answer', () => {
      const change = calculateELO(1000, false);
      expect(change).toBeLessThan(0);
    });

    it('should apply K-factor adjustment for high-rated players', () => {
      const change = calculateELO(1800, true);
      // K-factor 24 for ratings > 1600
      expect(change).toBeLessThan(32);
    });
  });

  describe('selectProblem', () => {
    it('should select 80% weak concepts (ELO < 1300)', async () => {
      const problems = await selectProblem(userId, 100);
      const weakCount = problems.filter(p => p.elo < 1300).length;
      expect(weakCount).toBeGreaterThan(70);
    });
  });
});
```

**Acceptance Criteria:**
- [ ] All service tests pass ✅
- [ ] Coverage report shows >80% for critical files
- [ ] Error cases tested (invalid input, network failure, edge cases)
- [ ] Commit: `feat: Add unit tests for backend services`

---

### Task 6A.2: Unit Tests — Frontend Services

**Goal:** >80% code coverage for API calls & hooks

**Files to test:**
```
frontend/src/services/
  ├── api.client.ts              (axios instance)
  ├── auth.api.ts                (login, logout, refresh)
  ├── question.api.ts            (ask, retrieve)
  ├── practice.api.ts            (select, submit, history)
  ├── progress.api.ts            (overview, stats, timeline)
  ├── knowledge.api.ts           (upload, search)
  └── share.api.ts               (generate, revoke)

frontend/src/hooks/
  ├── useAuth.ts                 (auth state)
  ├── useAISettings.ts           (provider config)
  └── useQuery.ts                (data fetching)
```

**Test Framework:** Vitest + React Testing Library

**Example:**
```typescript
// frontend/src/services/__tests__/practice.api.test.ts
describe('practiceApi', () => {
  it('should select a problem with difficulty 1-5', async () => {
    const problem = await practiceApi.selectProblem();
    expect(problem.difficulty).toBeGreaterThanOrEqual(1);
    expect(problem.difficulty).toBeLessThanOrEqual(5);
  });

  it('should update ELO on submit attempt', async () => {
    const result = await practiceApi.submitAttempt({
      conceptId: 'concept-1',
      isCorrect: true,
      timeSpentSeconds: 120
    });
    expect(result.eloChange).toBeGreaterThan(0);
    expect(result.newElo).toBeDefined();
  });
});
```

**Acceptance Criteria:**
- [ ] All API service tests pass ✅
- [ ] Error scenarios tested (400, 401, 500 errors)
- [ ] Network timeouts handled
- [ ] Commit: `feat: Add unit tests for frontend API services`

---

### Task 6A.3: Integration Tests — API Routes

**Goal:** Verify backend API contracts + database interactions

**Test Scenarios:**
```
Auth Flow:
  POST /api/v1/auth/login
    → validates credentials
    → creates JWT token
    → returns user + token

  POST /api/v1/auth/refresh
    → validates refresh token
    → returns new access token

Question Flow:
  POST /api/v1/questions/ask
    → retrieves knowledge chunks (RAG)
    → calls AI provider
    → returns explanation + citations

Practice Flow:
  GET /api/v1/practice/select-problem
    → selects adaptive problem
    → returns concept + difficulty

  POST /api/v1/practice/submit-attempt
    → calculates ELO change
    → updates skill_mastery
    → records practice_attempt

Knowledge Flow:
  POST /api/v1/knowledge/upload
    → validates file
    → extracts text (OCR if needed)
    → generates embeddings
    → stores chunks + metadata
```

**Test Framework:** Supertest (HTTP testing)

**Example:**
```typescript
// backend/tests/integration/auth.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/app';

describe('POST /api/v1/auth/login', () => {
  it('should login user with valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.id).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });
});
```

**Acceptance Criteria:**
- [ ] All API route tests pass ✅
- [ ] Database state verified after each operation
- [ ] Error responses tested (invalid input, auth failure, rate limit)
- [ ] Commit: `feat: Add integration tests for API routes`

---

### Task 6A.4: E2E Tests (Playwright)

**Goal:** Verify complete user flows end-to-end

**Flows to test:**
```
1. User Registration & Login
   - Sign up with Google
   - Verify JWT token created
   - Access dashboard

2. Ask a Question
   - Login
   - Enter question
   - See retrieval working
   - See AI explanation
   - Verify citations displayed

3. Upload Knowledge
   - Login
   - Upload PDF
   - See extraction progress
   - Verify chunks indexed
   - Search retrieves content

4. Practice Session
   - Login
   - Click Practice
   - See problem
   - Submit answer
   - Verify ELO change displayed
   - See progress updated

5. View Progress
   - Login
   - Navigate to Progress
   - Verify charts render
   - Check weak areas list
   - Verify 30-day timeline
```

**Test Framework:** Playwright (already configured)

**Example:**
```typescript
// tests/e2e/ask-question.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Ask a Question Flow', () => {
  test('should ask question and receive explanation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');

    // Navigate to Ask
    await page.click('a:has-text("Ask Question")');

    // Enter question
    await page.fill('textarea[placeholder="Enter your question"]', 
      'What is Newton\'s second law?');
    
    // Submit
    await page.click('button:has-text("Search")');

    // Verify response
    await page.waitForSelector('[data-testid="explanation"]', { timeout: 10000 });
    const explanation = await page.textContent('[data-testid="explanation"]');
    expect(explanation).toContain('F = ma');

    // Verify citations
    const citations = await page.locator('[data-testid="citation"]').count();
    expect(citations).toBeGreaterThan(0);
  });
});
```

**Acceptance Criteria:**
- [ ] All E2E flows pass ✅
- [ ] Tests run on CI (GitHub Actions)
- [ ] Timeouts reasonable (< 30s per flow)
- [ ] Screenshots captured on failure
- [ ] Commit: `feat: Add E2E tests with Playwright`

---

## Sprint 6B: Performance & Monitoring (Week 2-3)

### Task 6B.1: Performance Optimization

**Goal:** Bundle size < 500KB, queries < 500ms

**Checklist:**
- [ ] Analyze bundle with `npm run build -- --analyze`
  - [ ] Identify large dependencies
  - [ ] Remove unused packages
  - [ ] Enable code splitting

- [ ] Database query optimization
  - [ ] Add indexes on frequently-queried columns
  - [ ] Use EXPLAIN ANALYZE to find slow queries
  - [ ] Implement pagination (limit 50 per page)

- [ ] Frontend optimization
  - [ ] Lazy load components
  - [ ] Cache API responses (30s TTL)
  - [ ] Minify CSS/JS

**Commands:**
```bash
# Analyze bundle
npm run build --analyze

# Profile database
EXPLAIN ANALYZE SELECT * FROM skill_mastery WHERE user_id = $1 ORDER BY elo_rating DESC;

# Check Lighthouse
npm run lighthouse http://localhost:3000
```

**Acceptance Criteria:**
- [ ] Bundle < 500KB (gzipped)
- [ ] Lighthouse Performance > 80
- [ ] Database queries < 500ms (p95)
- [ ] Commit: `perf: Optimize bundle size and database queries`

---

### Task 6B.2: Error Monitoring (Sentry)

**Goal:** Track errors in production

**Setup:**
```bash
npm install @sentry/react @sentry/tracing

# Backend
npm install @sentry/node @sentry/tracing
```

**Frontend integration:**
```typescript
// frontend/src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Backend integration:**
```typescript
// backend/src/middleware/sentry.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

**Acceptance Criteria:**
- [ ] Sentry project created & configured
- [ ] Frontend & backend reporting errors
- [ ] Test error (manual throw) appears in Sentry
- [ ] Commit: `feat: Add Sentry error monitoring`

---

### Task 6B.3: Analytics Setup (Google Analytics)

**Goal:** Track user behavior & conversion

**Setup:**
```bash
npm install @react-google-analytics/core
```

**Events to track:**
```typescript
// Track page views
gtag('event', 'page_view', {
  page_path: location.pathname
});

// Track actions
gtag('event', 'question_asked', {
  concept: 'Forces',
  duration_ms: 2500
});

gtag('event', 'practice_attempt', {
  is_correct: true,
  elo_rating: 1500
});

gtag('event', 'knowledge_uploaded', {
  file_type: 'pdf',
  pages: 50
});
```

**Acceptance Criteria:**
- [ ] Google Analytics property created
- [ ] Tracking ID configured in env vars
- [ ] 5+ key events instrumented
- [ ] Events appearing in GA dashboard
- [ ] Commit: `feat: Add Google Analytics tracking`

---

## Sprint 6C: Quality Assurance (Week 3)

### Task 6C.1: Accessibility Audit (WCAG AA)

**Goal:** Full WCAG AA compliance

**Tools:**
- axe DevTools (Chrome extension)
- WAVE (WebAIM accessibility tool)
- Lighthouse (built-in)

**Checklist:**
- [ ] Keyboard navigation
  - [ ] Tab through all elements
  - [ ] No keyboard traps
  - [ ] Focus order logical

- [ ] Color contrast
  - [ ] Run axe DevTools
  - [ ] All text ≥ 4.5:1 ratio
  - [ ] Don't rely on color alone

- [ ] Screen reader
  - [ ] Test with NVDA (Windows) or VoiceOver (Mac)
  - [ ] All interactive elements labeled
  - [ ] Images have alt text
  - [ ] Form labels associated

- [ ] Motion
  - [ ] No auto-playing videos
  - [ ] Respect `prefers-reduced-motion`
  - [ ] Animations pausable

**Example fix (motion):**
```typescript
// Respect prefers-reduced-motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Play animations
} else {
  // Skip animations
}
```

**Acceptance Criteria:**
- [ ] axe DevTools: 0 violations
- [ ] WAVE: 0 errors
- [ ] Keyboard navigation 100%
- [ ] Screen reader test passed
- [ ] Commit: `a11y: Achieve WCAG AA compliance`

---

### Task 6C.2: Mobile Responsiveness

**Goal:** Works perfectly on all screen sizes (375px-1920px)

**Test devices:**
- iPhone 12 (375px)
- iPad Pro (1024px)
- Desktop (1920px)

**Checklist:**
- [ ] Touch targets ≥ 48px × 48px
- [ ] Text readable without zoom
- [ ] Forms work with mobile keyboards
- [ ] Horizontal scroll not needed
- [ ] Images scale properly
- [ ] Navigation responsive (mobile menu)

**Tools:**
- Chrome DevTools (Responsive Design Mode)
- BrowserStack (real devices)

**Acceptance Criteria:**
- [ ] No horizontal scroll on 375px view
- [ ] Touch targets all ≥ 48px
- [ ] Lighthouse Mobile Score > 80
- [ ] Tested on 3+ device sizes
- [ ] Commit: `ui: Improve mobile responsiveness`

---

## Definition of Done (Phase 6)

- [ ] Unit tests >80% coverage (backend services)
- [ ] Integration tests for all API routes
- [ ] E2E tests for main user flows
- [ ] All tests passing on CI ✅
- [ ] Performance: bundle < 500KB, queries < 500ms
- [ ] Sentry error monitoring configured
- [ ] Google Analytics tracking implemented
- [ ] WCAG AA accessibility audit passed
- [ ] Mobile responsiveness verified (375px-1920px)
- [ ] All PRs reviewed & merged
- [ ] No open TODOs in code
- [ ] Updated PHASE_6_COMPLETE.md with results

---

## Estimation

| Task | Estimate | Complexity |
|------|----------|-----------|
| Unit tests | 5 days | Medium |
| Integration tests | 3 days | Medium |
| E2E tests | 3 days | Low |
| Performance optimization | 2 days | Medium |
| Sentry + Analytics | 1 day | Low |
| Accessibility audit | 2 days | Low |
| Mobile responsiveness | 2 days | Low |
| **Total** | **18 days** | **Medium** |

**With 2-week sprint (10 working days):** Split into two cycles or prioritize critical items.

---

## Commands to Run

```bash
# Install test dependencies (if not already installed)
npm install --save-dev vitest @vitest/ui supertest @testing-library/react

# Run tests
npm run test               # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Build & analyze
npm run build
npm run build -- --analyze

# Lint & type check
npm run lint
npm run type-check

# Lighthouse
npm run lighthouse https://your-domain.com

# Git workflow
git checkout -b feature/phase-6-testing
git add .
git commit -m "feat: Complete Phase 6 testing & optimization"
git push origin feature/phase-6-testing
```

---

## Success Criteria

✅ Phase 6 is complete when:
1. **Testing:** >80% coverage, all tests passing
2. **Performance:** Bundle < 500KB, queries < 500ms, Lighthouse > 80
3. **Monitoring:** Sentry & Google Analytics live
4. **Accessibility:** WCAG AA passed, axe 0 violations
5. **Mobile:** Responsive 375px-1920px, touch targets 48px+
6. **Code:** All PRs merged, no TODOs, build green

---

## Next: Phase 7

After Phase 6 is complete, move to **Phase 7: Subject Expansion** (Math, Chemistry, configurable subjects).

See **PHASE_7_SPRINT_PROMPT.md** for next sprint.

---

**Owner:** Sharon Afroni  
**Created:** 2026-08-25  
**Status:** Ready to start
