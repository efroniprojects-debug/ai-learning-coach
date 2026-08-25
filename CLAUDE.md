# CLAUDE.md — AI Learning Coach Governance

**Project:** AI Learning Coach  
**Owner:** Sharon Afroni  
**Last Updated:** 2026-08-25  
**Version:** 1.0

---

## Vision & Mission

**Vision:** Build an adaptive learning platform where an AI tutor explains concepts intuitively, breaks problems into steps, detects misconceptions, and adapts explanations to each student's level.

**Not:** Another ChatGPT wrapper. Not generic tutoring. Not for all subjects yet.

**Is:** Physics-first, Hebrew-enabled, extensible to Math & Chemistry. Emphasizes understanding over speed.

---

## Core Principles

### 1. Provider Agnosticism
- **Rule:** No hardcoding Claude, Gemini, or OpenAI.
- **Implementation:** All AI calls go through `AIGateway` abstraction layer.
- **Why:** Users provide their own API keys. Must support multiple providers simultaneously.
- **Non-negotiable:** Every new feature that uses AI must use the gateway, not direct provider calls.

### 2. Security First
- **Rule:** API keys NEVER stored on client. NEVER logged in plain text. NEVER in environment files.
- **Implementation:** 
  - Keys encrypted (AES-256) on server only.
  - Server proxies all AI provider requests.
  - Audit logs track usage (no keys visible).
- **Consequence:** Frontend cannot call AI providers directly. All requests via backend.
- **Testing:** Every auth flow must verify key is not exposed.

### 3. Hebrew RTL-First Design
- **Rule:** Assume Hebrew as primary language. RTL layout, fonts, and spacing built in from day 1.
- **Implementation:**
  - Tailwind CSS `direction: rtl` at root.
  - Test in both RTL and LTR modes.
  - Use logical properties (margin-inline, etc.).
  - Avoid LTR-only components (test before merge).
- **Why:** Not an afterthought. Many libraries break RTL. Catch early.

### 4. Extensibility by Design
- **Rule:** Physics → Math → Chemistry must work without code changes (only config/data).
- **Implementation:**
  - Data model: `subjects`, `topics`, `concepts` — not hardcoded.
  - Tutor prompts: Per-subject, environment-based, not hardcoded.
  - UI: Subject selector, not Physics-only buttons.
- **Non-negotiable:** No `if (subject === 'Physics')` checks. Use config instead.

### 5. RAG with Citations (Not Hallucination)
- **Rule:** AI responses cite the source knowledge chunks used. When educational material exists, use it.
- **Implementation:**
  - Semantic search retrieves top-5 chunks.
  - Chunks are stored with metadata (page, section, source).
  - AI response includes `source_chunks` array (IDs + citations).
  - Frontend displays sources (e.g., "From Exam 2024, page 3").
- **Why:** Students trust cited sources. Reduces hallucination. Improves learning.
- **Guardrail:** Tutor meta-prompt always says: "Cite your sources."

### 6. Type Safety (TypeScript Strict)
- **Rule:** `tsconfig.json` has `"strict": true`. No `any` types without justification.
- **Consequence:** All types explicit. Better IDE support. Fewer runtime bugs.
- **Exception:** Only with comment `// @ts-ignore <reason>`. Never silent ignores.

### 7. Test Everything You Ship
- **Rule:** No feature reaches production without tests covering happy path + error cases.
- **Bug Fixes:** Include regression test to prevent re-occurrence.
- **Acceptance Criteria:** Every feature task includes test acceptance criteria.
- **CI:** Tests run on every commit. Red tests block merges.

### 8. Accessibility (WCAG 2.1 AA)
- **Rule:** All interactive elements keyboard-navigable. Screen reader compatible.
- **Implementation:**
  - `aria-labels` on buttons.
  - `role` attributes where needed.
  - Color contrast ≥ 4.5:1.
  - Focus indicators visible.
- **Testing:** Use axe DevTools, VoiceOver (macOS), NVDA (Windows).

### 9. Modular Architecture by Domain
- **Frontend:**
  - `/src/features/auth/` — Login, OAuth
  - `/src/features/question/` — Ask, analyze
  - `/src/features/practice/` — Problems, mastery
  - `/src/features/knowledge/` — Search, chunks
  - `/src/features/ai-settings/` — Provider config
  - `/src/features/share/` — Links, sharing
  - `/src/components/` — Shared UI (button, card, etc.)
  - `/src/services/` — API calls, business logic
- **Backend:**
  - `/src/routes/` — HTTP routes (organized by domain)
  - `/src/services/` — Business logic (auth, tutor, practice, etc.)
  - `/src/db/` — ORM, queries, migrations
  - `/src/ai/` — AI gateway, providers
  - `/src/middleware/` — Auth, logging, error handling
  - `/src/config/` — Environment, secrets

### 10. Inspect Before Edit
- **Rule:** Before modifying a file, read it first.
- **Why:** Understand context. Avoid breaking existing functionality.
- **Practice:** Every edit should include a comment explaining WHY, not just WHAT.

### 11. Test After Every Change
- **Rule:** `npm run lint && npm run type-check && npm run test` after every feature/fix.
- **CI:** Pipeline checks these automatically. Don't merge red.
- **Local:** Commit often (at least daily). Small commits are easier to debug.

### 12. Migrations-First Database Changes
- **Rule:** Any schema change requires a migration file. Never manual SQL.
- **Implementation:** Use Drizzle or Prisma migrations.
- **Why:** Reproducible deployments, rollback capability, audit trail.

### 13. No Hardcoded Secrets
- **Rule:** NEVER commit API keys, credentials, or secrets.
- **Storage:** Use `.env` (local only, in `.gitignore`).
- **Production:** Environment variables or secure secret manager.
- **Verification:** Pre-commit hook should scan for secrets. `npm run check-secrets` before push.

---

## API & UI Stability

### Backend API
- **Rule:** Once an endpoint is deployed, its contract is stable.
- **Versioning:** `/api/v1/` prefix. If major change needed, create `/api/v2/`.
- **Backwards Compatibility:** Old endpoints keep working (deprecated, but not deleted).
- **Documentation:** Every endpoint documented in comments + OpenAPI/Swagger (future).

### Frontend UI
- **Rule:** Navigation paths stable. Pages not renamed without redirect.
- **Consistency:** Same button style, same input behavior everywhere.
- **Breaking Changes:** Rare. Plan multi-phase if unavoidable.

---

## Code Style & Conventions

### Naming
- **Components:** PascalCase (`QuestionWorkspace.tsx`)
- **Functions:** camelCase (`getQuestionById()`)
- **Constants:** SCREAMING_SNAKE_CASE (`API_TIMEOUT_MS`)
- **Files:** kebab-case for utilities (`parse-markdown.ts`), PascalCase for components
- **Variables:** Descriptive, no single letters except loop counters

### Comments
- **When to Comment:** Non-obvious logic, workarounds, constraints.
- **Don't Comment:** Obvious code (good naming is better).
- **Example:**
  ```typescript
  // Poor:
  // Loop through questions
  for (const q of questions) { ... }

  // Good:
  // Only include questions from last 30 days (compliance requirement)
  for (const q of questions.filter(q => q.createdAt > 30daysAgo)) { ... }
  ```

### Imports
- Absolute imports from `/src` (configured in tsconfig).
- Group imports: React, libraries, local code.
- Example:
  ```typescript
  import React from 'react';
  import axios from 'axios';

  import { useAuth } from '@/services/auth';
  import { QuestionCard } from '@/components/question-card';
  ```

### Error Handling
- Specific error types (not generic `Error`).
- Always include context (what operation failed, why).
- Example:
  ```typescript
  class ValidationError extends Error {
    constructor(field: string, reason: string) {
      super(`Validation failed for ${field}: ${reason}`);
    }
  }
  ```

---

## Git Workflow

### Branch Naming
- `feature/question-workspace` — New feature
- `fix/auth-token-refresh` — Bug fix
- `docs/api-endpoints` — Documentation
- `chore/update-deps` — Maintenance

### Commit Messages
- Format: `<type>: <subject> — <body>`
- Type: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Subject: Present tense, imperative ("add" not "added")
- Body: Explain WHY (not WHAT, code shows that)
- Example:
  ```
  feat: Add semantic search for knowledge chunks

  Implement vector embeddings + pgvector query for better question retrieval.
  Reduces manual keyword tuning, improves UX.

  - Generate embeddings via Claude embeddings API
  - Store in pgvector (PostgreSQL)
  - Query via HNSW index
  - Cache top-5 results

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### Pull Request Process
1. Create PR with detailed description (link to issue, explain changes).
2. Tag reviewers (@team members).
3. Run CI checks (must pass).
4. Code review feedback.
5. Squash + merge to main (not "create merge commit").
6. Delete branch.

---

## Definition of Done (per Feature/Fix)

Every feature must meet these criteria before calling it "done":

### Code Quality
- [ ] Code compiles/builds without warnings
- [ ] TypeScript strict mode passes
- [ ] Linting passes (`npm run lint`)
- [ ] Type safety complete (no `any` types)
- [ ] No secrets or API keys in code

### Functionality
- [ ] Happy path works (main use case)
- [ ] Error cases handled (invalid input, network failure, etc.)
- [ ] Empty states handled (no data, loading, error screens)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] RTL Hebrew rendering correct
- [ ] Accessibility: WCAG AA compliant (keyboard nav, screen readers)

### Testing
- [ ] Unit tests for business logic (>80% coverage)
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows (Playwright)
- [ ] Bug fixes include regression test
- [ ] All tests pass locally + CI

### Documentation
- [ ] Comments explain non-obvious logic
- [ ] Component props documented (JSDoc)
- [ ] API endpoints documented (if new routes)
- [ ] Database schema changes documented
- [ ] README updated if needed

### Security
- [ ] No hardcoded secrets or keys
- [ ] API keys handled via AIGateway (not direct calls)
- [ ] Input validation (Zod or similar)
- [ ] SQL injection prevented (ORM used)
- [ ] XSS prevented (React auto-escapes, no dangerouslySetInnerHTML)

### Performance
- [ ] Bundle size impact acceptable
- [ ] Page load time < 3 seconds (target)
- [ ] Query performance acceptable (< 500ms)
- [ ] No memory leaks (useEffect cleanup)

### Deployment
- [ ] Feature branch up-to-date with main
- [ ] Passing all checks on CI
- [ ] Ready for production (no debug code, no TODOs)

---

## AI & AI Agents Working on This Project

### How AI Should Approach This Project

**DO:**
- Read CLAUDE.md first (this file). It contains all the rules.
- Ask clarifying questions if requirements are ambiguous.
- Run tests after every change. Report failures.
- Check existing code patterns before writing new code.
- Use abstraction layers (AIGateway, service layer, etc.) — don't put logic in components.
- Propose architectural changes in comments before implementing.
- Use TypeScript strict mode. Type everything explicitly.
- Write acceptance criteria before implementing. Ask for confirmation.
- Commit often (every feature = 1-3 commits).
- Document decisions in commit messages.

**DON'T:**
- Hardcode provider names (Claude, Gemini, OpenAI) in code.
- Store API keys on client or in environment files.
- Skip tests. No shipping untested code.
- Use `any` types without justification.
- Delete or rename existing APIs without creating deprecation period.
- Assume Physics-only domain. Everything should be subject-agnostic.
- Add features beyond the current sprint. Stay focused.
- Write comments explaining obvious code. Good naming > comments.
- Ship without running lint/type-check/test.

### Guidance for Claude Code Users

**Before Starting a Task:**
1. Read PROJECT_STATUS.md, ARCHITECTURE_DECISIONS.md, IMPLEMENTATION_PLAN.md
2. Read CLAUDE.md (this file) + docs/DEFINITION_OF_DONE.md
3. Check the current sprint in IMPLEMENTATION_PLAN.md
4. Read the feature spec or issue (if one exists)

**While Implementing:**
1. Create a branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD) or alongside code
3. Run `npm run type-check && npm run lint && npm run test` constantly
4. Commit often (small, logical chunks)
5. Push when ready for review

**Before Merging:**
1. Ensure CI passes (all checks green)
2. Request code review (tag @efroni or team)
3. Address feedback
4. Merge to main (squash if many small commits)

---

## Project Structure (To Be Created)

```
AI_Learning_Coach/
├── .github/
│   └── workflows/
│       ├── lint-test-build.yml
│       └── deploy.yml
├── docs/
│   ├── DEFINITION_OF_DONE.md
│   ├── CONTRIBUTING_FOR_AI_AGENTS.md
│   ├── PROJECT_STATUS.md
│   ├── ARCHITECTURE_DECISIONS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── API.md (future)
│   └── DATABASE.md (future)
├── frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── question/
│   │   │   ├── practice/
│   │   │   ├── knowledge/
│   │   │   ├── ai-settings/
│   │   │   └── share/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── migrations/
│   │   ├── ai/
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
├── CLAUDE.md (this file)
├── README.md
├── .gitignore
└── .env.example
```

---

## Environment Variables

See `.env.example` for all required variables. Never commit `.env` itself.

**Local Development:** Copy `.env.example` to `.env.local` and fill in values.

**Staging/Production:** Use environment variable secrets (GitHub Secrets, Cloud Run env vars, etc.).

---

## Contact & Escalation

**Project Owner:** Sharon Afroni  
**Questions:** Open an issue or comment on relevant PR.  
**Emergency:** Reach out directly (prefer async communication).

---

## Document Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-08-25 | Initial governance setup |

---

**Last Update:** 2026-08-25  
**Next Review:** After Phase 1 (Bootstrap) completion
