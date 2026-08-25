# Definition of Done — AI Learning Coach

**For every feature, fix, or task, these criteria must be met before marking as "Done".**

---

## Code Quality ✅

- [ ] **Code compiles/builds** without warnings or errors
- [ ] **TypeScript strict mode** passes (`npx tsc --strict`)
- [ ] **Linting** passes (`npm run lint`)
- [ ] **No `any` types** (unless justified with `// @ts-ignore <reason>`)
- [ ] **No secrets** in code (API keys, passwords, tokens)
- [ ] **No console.log** statements (use proper logging)

---

## Functionality ✅

- [ ] **Happy path works** (main use case)
- [ ] **Error handling complete** (invalid input, network errors, timeouts)
- [ ] **Empty states** shown (no data, loading, error screens)
- [ ] **Mobile responsive** (tested on iOS + Android)
- [ ] **Tablet responsive** (iPad, etc.)
- [ ] **Desktop responsive** (1920px, 1440px)
- [ ] **RTL Hebrew** rendering correct
  - [ ] Text right-aligned
  - [ ] Images mirrored if directional
  - [ ] Margins/padding logical (not left/right)
- [ ] **Focus mode** works (if applicable)
- [ ] **Data saved** (no data loss on refresh)

---

## Accessibility (WCAG 2.1 AA) ♿

- [ ] **Keyboard navigation** (Tab, Enter, Escape work)
- [ ] **Focus indicators** visible (not hidden)
- [ ] **Screen reader compatible** (NVDA/JAWS/VoiceOver)
- [ ] **ARIA labels** on interactive elements
- [ ] **Color contrast** ≥ 4.5:1 (text) ≥ 3:1 (large text)
- [ ] **Form labels** associated (`<label htmlFor>`)
- [ ] **No keyboard traps** (can escape any interaction)
- [ ] **Alt text** on images (if content-bearing)

---

## Testing 🧪

### Unit Tests
- [ ] **Business logic** tested (utils, hooks, services)
- [ ] **Happy path** covered
- [ ] **Error cases** covered (edge cases, invalid input)
- [ ] **Coverage** ≥ 80% for new code

### Integration Tests
- [ ] **API routes** tested with real DB (or test DB)
- [ ] **Database queries** tested
- [ ] **Auth flows** tested end-to-end
- [ ] **Error responses** validated (401, 400, 500, etc.)

### E2E Tests (Playwright/Cypress)
- [ ] **Critical user flows** tested (login → ask question → view solution)
- [ ] **Mobile viewport** tested in E2E
- [ ] **RTL viewport** tested in E2E

### Bug Fixes
- [ ] **Regression test** added (prevent re-occurrence)
- [ ] **Root cause** documented (in commit message)

### All Tests Pass
- [ ] **Local:** `npm run test` passes
- [ ] **CI:** All GitHub Actions checks green

---

## Documentation 📝

- [ ] **Code comments** explain non-obvious logic (WHY, not WHAT)
- [ ] **Function/component** JSDoc headers (parameters, return, usage)
- [ ] **Complex algorithms** have step-by-step comments
- [ ] **Database schema** changes documented (in migration files)
- [ ] **API endpoints** documented (route, params, response, errors)
- [ ] **README** updated (if user-facing behavior changed)
- [ ] **Commit message** explains change context + reason

---

## Security 🔒

- [ ] **No hardcoded secrets** (API keys, passwords, tokens)
- [ ] **API keys** stored server-side, encrypted (never client-side)
- [ ] **No direct provider calls** (use AIGateway abstraction)
- [ ] **Input validation** (Zod or similar) on all user input
- [ ] **SQL injection** prevented (use ORM, parameterized queries)
- [ ] **XSS** prevented (React auto-escapes, no `dangerouslySetInnerHTML`)
- [ ] **CSRF** tokens used (if applicable)
- [ ] **Secrets not in logs** (sanitize sensitive data)
- [ ] **User data** not exposed (GDPR compliance)

---

## Performance ⚡

- [ ] **Bundle size** impact acceptable (checked with `npm run build`)
- [ ] **Page load** < 3 seconds (lighthouse test)
- [ ] **API response** < 500ms (typical)
- [ ] **Search queries** < 1 second
- [ ] **No memory leaks** (React DevTools check)
- [ ] **useEffect cleanup** prevents stale subscriptions
- [ ] **Images optimized** (WebP, responsive sizes)
- [ ] **Lazy loading** used for below-fold content

---

## User Experience 🎨

- [ ] **Buttons** clearly labeled (not just icons)
- [ ] **Error messages** helpful (not cryptic)
- [ ] **Loading states** visible (spinners, skeleton screens)
- [ ] **Success feedback** shown (toast, confirmation)
- [ ] **No broken links** (check for 404s)
- [ ] **Consistent styling** (matches design system)
- [ ] **Dark mode** works (if enabled)
- [ ] **No typos** in copy

---

## Database 🗄️

- [ ] **Schema changes** use migrations (not manual SQL)
- [ ] **Migrations** can rollback cleanly
- [ ] **Database constraints** enforced (foreign keys, unique, etc.)
- [ ] **Indexes** added for performance (if queried frequently)
- [ ] **No N+1 queries** (use JOINs or batch loading)
- [ ] **Data consistency** maintained (transactions where needed)

---

## Deployment 🚀

- [ ] **Feature branch** up-to-date with `main`
- [ ] **All CI checks** green (lint, test, build)
- [ ] **No TODO comments** in code
- [ ] **No debug code** (console.log, debugger, etc.)
- [ ] **Environment variables** documented (.env.example updated)
- [ ] **Ready for production** (no breaking changes without migration plan)

---

## Code Review Checklist 👀

**Reviewer:** Ensure the author met all above criteria.

- [ ] Code quality meets standards
- [ ] Tests are meaningful (not just checking happy path)
- [ ] No obvious bugs or edge cases missed
- [ ] Security concerns addressed
- [ ] Performance is acceptable
- [ ] Documentation is clear
- [ ] Accessible (keyboard, screen reader, contrast)
- [ ] Responsive (mobile, tablet, desktop)
- [ ] RTL works correctly

---

## Before Merging to Main 🔀

1. **All checks pass** (CI green)
2. **Code reviewed** (at least 1 approval)
3. **Tests pass** locally + CI
4. **Commit history** is clean (logical, well-described commits)
5. **No conflicts** with main
6. **Author verified** changes are correct

---

## Sign-Off

Feature/fix is **done** when:
- ✅ All code quality checks pass
- ✅ All tests pass
- ✅ Security verified
- ✅ Accessibility verified
- ✅ Responsive design verified
- ✅ Documentation complete
- ✅ Code reviewed
- ✅ Ready for production

**Owner:** Sharon Afroni  
**Last Updated:** 2026-08-25
