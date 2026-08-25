# Contributing Guide for AI Agents

**For Claude and other AI agents working on this project.**

---

## Before You Start

### Read These First (In Order)

1. **CLAUDE.md** (root) — Core principles, governance, rules
2. **PROJECT_STATUS.md** (root) — Current state, blockers, risks
3. **ARCHITECTURE_DECISIONS.md** (root) — System design, data flows, ADRs
4. **IMPLEMENTATION_PLAN.md** (root) — Sprint roadmap, timeline
5. **This file** — How to work on code

### Understanding the Context

- **Language:** Hebrew (primary), English (technical terms, code)
- **Users:** Israeli high school students (grades 10-12)
- **Subject:** Physics (extensible to Math, Chemistry)
- **Tech:** React + TypeScript (frontend), Node.js + Fastify (backend), PostgreSQL + pgvector (data)

---

## Your Role

You are a **full-stack AI engineer** on this project. Your responsibilities:

- Write production-ready code (type-safe, tested, secure)
- Respect existing architecture (don't invent new patterns)
- Keep security as top priority (especially API key handling)
- Document decisions in commit messages
- Ask clarifying questions before starting
- Verify all tests pass before committing

---

## Workflow: Getting Started

### 1. Understand the Sprint

```bash
# Read the current sprint task
# Look at IMPLEMENTATION_PLAN.md for which sprint you're working on
# Example: Sprint 3 (Phase 2, Auth & Core)
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
# or
git checkout -b docs/what-you-documented
```

**Branch naming convention:**
- `feature/` — New feature (e.g., `feature/semantic-search`)
- `fix/` — Bug fix (e.g., `fix/rtl-margin-issue`)
- `docs/` — Documentation (e.g., `docs/api-endpoints`)
- `chore/` — Maintenance (e.g., `chore/update-deps`)

### 3. Set Acceptance Criteria

**Before writing code, ask:**

> "What does success look like? Can you give me acceptance criteria?"

**Example:**

```
Acceptance Criteria:
- User can upload a PDF file (max 50MB)
- File is stored in Cloud Storage
- OCR job is queued (not blocking)
- Frontend shows "Processing..." state
- After ~30 seconds, shows "Document indexed. Ready for questions."
- If OCR fails, user sees error + retry button
- File is deleted from storage only if user removes it
```

**Never start without this.**

### 4. Read Existing Code

Before writing new code:

- **Look for patterns:** How are similar features implemented?
- **Check services:** Is there already a service layer for this domain?
- **Read types:** What data structures already exist?
- **Review tests:** What tests exist? What do they test?

### 5. Write Tests First (TDD)

```typescript
// Start with a failing test
describe('uploadFile', () => {
  it('should validate file size before upload', () => {
    const file = new File(['x'.repeat(60_000_000)], 'large.pdf');
    expect(() => validateFile(file)).toThrow('File too large');
  });

  it('should accept PDF files', () => {
    const file = new File(['data'], 'exam.pdf', { type: 'application/pdf' });
    expect(validateFile(file)).toBeUndefined();
  });
});
```

Then implement code to pass the tests.

### 6. Implement Feature

Follow these rules:

- **Use abstraction layers** (services, hooks, components)
- **Type everything** (no `any` types)
- **Handle errors** (try-catch, validation)
- **Log important events** (not API keys)
- **Test as you go** (`npm run test -- --watch`)

### 7. Run All Checks

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Tests
npm run test

# Build
npm run build

# All at once:
npm run check
```

If any fail, fix them before committing.

### 8. Commit with Context

```bash
git add src/features/upload/

git commit -m "feat: Add PDF upload with OCR queueing

Implement file validation (size, format), storage in GCS, and async OCR job.
User sees progress indicator and is notified when processing complete.

- Validate file before upload (max 50MB, PDF only)
- Store in Cloud Storage bucket
- Enqueue OCR job via Bull queue
- Show processing status in UI
- Handle errors (storage failure, OCR failure) with user-friendly messages
- Add audit log for file uploads (compliance)

Tests:
- validate file size correctly
- reject non-PDF files
- enqueue OCR job on success
- show error on storage failure
- show processing status transitions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Commit message format:**
```
<type>: <subject>

<body explaining WHY and HOW>

Tests:
- <what you tested>

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 9. Push & Create PR

```bash
git push origin feature/your-feature-name

# Create a PR with:
# - Clear title (same as commit subject)
# - Description (what changed, why, any risks)
# - Link to acceptance criteria
# - Screenshots (if UI change)
# - Test results (all passing)
```

### 10. Wait for Review

- **Don't merge your own code.**
- Address feedback promptly.
- Re-test after changes.
- Once approved, squash + merge.

---

## Common Patterns

### Adding a New API Endpoint

1. **Define route** in `/src/routes/`
2. **Write service logic** in `/src/services/`
3. **Add tests** in `/src/services/__tests__/`
4. **Add types** in `/src/types/` (if new)
5. **Document** in commit message

Example:

```typescript
// /src/routes/upload.ts
router.post('/api/v1/upload/pdf', authMiddleware, async (req, res) => {
  const file = req.file;
  const userId = req.user.id;

  try {
    const result = await uploadService.uploadPDF(file, userId);
    res.json({ success: true, fileId: result.fileId });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Upload failed' });
    }
  }
});

// /src/services/upload.service.ts
export class UploadService {
  async uploadPDF(file: Express.Multer.File, userId: string) {
    // Validate
    this.validatePDF(file);
    
    // Store in GCS
    const url = await this.storageService.upload(file, userId);
    
    // Enqueue OCR job
    await this.jobQueue.enqueue('ocr', { fileId: '...', userId });
    
    // Log for audit
    await this.auditLog.log('file_uploaded', { userId, fileName: file.originalname });
    
    return { fileId: '...', url };
  }
}
```

### Adding a New React Component

1. **Define component** in `/src/features/[domain]/components/`
2. **Define types** in `/src/features/[domain]/types.ts`
3. **Write tests** in `/src/features/[domain]/__tests__/`
4. **Add hooks/services** if needed
5. **Use component** in page/parent component

Example:

```typescript
// /src/features/question/components/QuestionEditor.tsx
interface QuestionEditorProps {
  onSubmit: (question: Question) => Promise<void>;
}

export function QuestionEditor({ onSubmit }: QuestionEditorProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setError(null);
      setLoading(true);
      await onSubmit({ text, images });
      // Success feedback
      setText('');
      setImages([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      {/* File upload UI */}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Submitting...' : 'Ask'}
      </button>
      {error && <div className="text-red-600">{error}</div>}
    </div>
  );
}
```

### Using the AI Gateway

**Never call Claude/Gemini/OpenAI directly.**

```typescript
// ❌ WRONG
import { Anthropic } from '@anthropic-ai/sdk';
const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

// ✅ RIGHT
import { aiGateway } from '@/ai/gateway';

const response = await aiGateway.generateResponse({
  prompt: 'Explain momentum...',
  userId: user.id,
  maxTokens: 500,
});
```

---

## Common Mistakes (Don't Do These)

| ❌ Don't | ✅ Do |
|---------|--------|
| Hardcode `'claude'` in code | Use config/environment variable |
| Store API key in `.env` file | Use server-side encryption + DB |
| Use `any` type | Type everything explicitly |
| Skip tests | Write tests alongside code |
| Forget `useEffect` cleanup | Always cleanup subscriptions |
| Use `margin-left` for RTL | Use `margin-inline-start` |
| Commit without running `npm run type-check` | Run checks before commit |
| Put secrets in logs | Sanitize sensitive data |
| Assume Physics-only | Make everything subject-agnostic |
| Leave TODO comments | Fix or create issue before merge |

---

## Debugging Tips

### TypeScript Errors

```bash
npm run type-check
# Shows all type errors. Fix them before committing.
```

### Runtime Errors

```bash
# Run with debug logging
DEBUG=* npm run dev

# Check browser console (frontend)
# Check server logs (backend)
```

### Test Failures

```bash
npm run test -- --watch
# Re-runs tests on file changes. Great for TDD.
```

### Performance Issues

```bash
# Build analysis
npm run build -- --analyze

# Chrome DevTools (frontend)
# Node profiler (backend)
```

---

## Questions?

If unclear:
- **Read CLAUDE.md** (contains most answers)
- **Check existing code** (patterns are documented in code)
- **Ask in PR comments** (not every decision is documented)
- **Escalate to Sharon** (for ambiguous requirements)

---

## Success Checklist

Before saying "I'm done":

- [ ] **All tests pass** (`npm run test`)
- [ ] **No type errors** (`npm run type-check`)
- [ ] **No lint issues** (`npm run lint`)
- [ ] **Builds successfully** (`npm run build`)
- [ ] **Acceptance criteria** met (check off each item)
- [ ] **No secrets** in code
- [ ] **No `any` types** (justified if used)
- [ ] **Commit message** explains WHY
- [ ] **Ready for production** (no debug code)

---

**Thank you for contributing!**

Questions? Check CLAUDE.md or open an issue.

**Last Updated:** 2026-08-25
