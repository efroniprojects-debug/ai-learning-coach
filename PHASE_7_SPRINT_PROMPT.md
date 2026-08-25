# Phase 7: Subject Expansion — SPRINT PROMPT
**Duration:** 2-4 weeks  
**Goal:** Multi-subject platform (Math + Chemistry + configurable)  
**Owner:** Claude Code / AI Agent  
**Date Created:** 2026-08-25

---

## Overview

Convert Physics-first tutor into extensible multi-subject platform. Add **Math** & **Chemistry** subjects with full feature parity (tutor, problems, concepts, topics).

---

## Success Criteria

✅ Math subject fully functional:
- 100+ conceptual problems (algebra, geometry, calculus)
- Math-specific tutor prompts & pedagogy
- LaTeX formula support in questions/explanations
- Equation step-by-step solving

✅ Chemistry subject fully functional:
- 50+ concept-based problems (stoichiometry, thermodynamics, etc.)
- Chemistry-specific tutor (explain bonds, mechanisms, etc.)
- Molecular visualization support (future)

✅ Configurable subject framework:
- Subject plugin architecture (add subjects via config)
- Topic taxonomy per-subject
- Tutor prompts per-subject (env variables)
- Problem bank per-subject

✅ Frontend:
- Subject selector on login
- Subject-specific UI (Math formulas, Chemistry diagrams)
- All existing features (Ask, Upload, Practice, Progress) work per-subject

---

## Key Tasks

### Task 7.1: Subject Configuration Framework
**Files:**
- `backend/src/config/subjects.ts` — Subject registry
- `backend/src/types/subject.ts` — Subject interface
- Database: Add `subject` column to existing tables

**What to build:**
```typescript
// Subject interface
interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  topics: Topic[];
  concepts: Concept[];
  tutorPrompt: string;  // System prompt for this subject
  problemBank: string;  // Path to problem JSON
}

// Example: Physics (existing)
const PHYSICS: Subject = {
  id: 'physics',
  name: 'Physics',
  tutorPrompt: process.env.TUTOR_PROMPT_PHYSICS,
  topics: [...],
  concepts: [...]
};

// Example: Math (new)
const MATH: Subject = {
  id: 'math',
  name: 'Mathematics',
  tutorPrompt: process.env.TUTOR_PROMPT_MATH,
  topics: [
    { id: 'algebra', name: 'Algebra' },
    { id: 'geometry', name: 'Geometry' },
    { id: 'calculus', name: 'Calculus' }
  ],
  concepts: [...]
};

// Register
export const SUBJECTS = {
  physics: PHYSICS,
  math: MATH,
  chemistry: CHEMISTRY
};
```

**Acceptance:**
- [ ] Subject registry loads from config
- [ ] Environment variables for tutor prompts
- [ ] Database migration adds subject_id to tables
- [ ] Commit: `feat: Add subject configuration framework`

---

### Task 7.2: Math Subject Content
**Goal:** 100+ math problems across algebra, geometry, calculus

**Structure:**
```
Math Topics:
├── Algebra (25 problems)
│  ├── Solving linear equations
│  ├── Quadratic equations
│  ├── Systems of equations
│  └── Polynomials
├── Geometry (25 problems)
│  ├── Angles & triangles
│  ├── Circles
│  ├── Coordinate geometry
│  └── 3D shapes
└── Calculus (25 problems)
   ├── Limits
   ├── Derivatives
   ├── Integrals
   └── Series & sequences
```

**Problem format:**
```json
{
  "id": "algebra-quadratic-1",
  "topic": "Quadratic Equations",
  "difficulty": 3,
  "question": "Solve: x² + 5x + 6 = 0",
  "concepts": ["quadratic", "factoring"],
  "tutorHint": "Can you factor this polynomial?",
  "solution": "x = -2 or x = -3",
  "explanation": "Factor as (x+2)(x+3) = 0"
}
```

**Files to create:**
- `backend/data/math-problems.json` (100+ problems)
- `backend/data/math-concepts.json` (topic hierarchy)
- `backend/src/services/math.tutor.ts` (Math-specific tutor)

**Acceptance:**
- [ ] 100+ math problems in database
- [ ] All problems have solutions & explanations
- [ ] Math tutor prompt addresses formula notation
- [ ] LaTeX rendering in frontend
- [ ] Commit: `feat: Add Math subject with 100+ problems`

---

### Task 7.3: Chemistry Subject Content
**Goal:** 50+ chemistry problems across core topics

**Structure:**
```
Chemistry Topics:
├── Stoichiometry (15 problems)
│  ├── Molar mass
│  ├── Balancing equations
│  ├── Limiting reactants
│  └── Percent composition
├── Thermodynamics (15 problems)
│  ├── Enthalpy
│  ├── Entropy
│  ├── Gibbs free energy
│  └── Reaction rates
└── Organic Chemistry (20 problems)
   ├── Functional groups
   ├── Reaction mechanisms
   ├── Synthesis
   └── Spectroscopy basics
```

**Problem format:** Same as Math

**Files:**
- `backend/data/chemistry-problems.json` (50+ problems)
- `backend/data/chemistry-concepts.json`
- `backend/src/services/chemistry.tutor.ts`

**Acceptance:**
- [ ] 50+ chemistry problems indexed
- [ ] Chemistry tutor addresses mechanisms & reactions
- [ ] Molecular structures viewable (SMILES notation)
- [ ] Commit: `feat: Add Chemistry subject with 50+ problems`

---

### Task 7.4: Database Schema Updates
**Goal:** Add subject_id to all relevant tables

**Migrations:**
```sql
-- Add subject column to topics
ALTER TABLE topics ADD COLUMN subject_id VARCHAR(50);

-- Add subject column to skill_mastery
ALTER TABLE skill_mastery ADD COLUMN subject_id VARCHAR(50);

-- Add subject column to practice_attempts
ALTER TABLE practice_attempts ADD COLUMN subject_id VARCHAR(50);

-- Add subject column to progress_snapshots
ALTER TABLE progress_snapshots ADD COLUMN subject_id VARCHAR(50);

-- Add index for faster queries
CREATE INDEX idx_skill_mastery_subject ON skill_mastery(user_id, subject_id);
CREATE INDEX idx_practice_subject ON practice_attempts(user_id, subject_id);
```

**Files:**
- `backend/src/db/migrations/` (new migration files)

**Acceptance:**
- [ ] All migrations run successfully
- [ ] Backward compatible (Physics defaults)
- [ ] Indexes created
- [ ] Drizzle schema updated
- [ ] Commit: `chore: Add subject support to database schema`

---

### Task 7.5: API Updates
**Goal:** Add subject_id parameter to all endpoints

**Examples:**
```typescript
// GET /api/v1/questions/ask?subject=physics
// GET /api/v1/practice/select-problem?subject=math
// GET /api/v1/progress/overview?subject=chemistry
```

**Files to update:**
- `backend/src/routes/question.routes.ts` (add subject param)
- `backend/src/routes/practice.routes.ts` (add subject param)
- `backend/src/routes/progress.routes.ts` (add subject param)
- `backend/src/routes/knowledge.routes.ts` (add subject param)

**Example change:**
```typescript
// Before
app.get('/api/v1/questions/ask', async (req, res) => {
  const { question } = req.query;
  const context = await getKnowledgeContext(userId, question);
  // ...
});

// After
app.get('/api/v1/questions/ask', async (req, res) => {
  const { question, subject = 'physics' } = req.query;
  const context = await getKnowledgeContext(userId, question, subject);
  // ...
});
```

**Acceptance:**
- [ ] All endpoints accept `subject` parameter
- [ ] Default to 'physics' for backward compatibility
- [ ] All 26 API routes updated
- [ ] Tests updated
- [ ] Commit: `feat: Add subject parameter to all API endpoints`

---

### Task 7.6: Frontend Subject Selector
**Goal:** Let users choose subject on login/dashboard

**Components:**
- `SubjectSelector.tsx` — Dropdown/grid of subjects
- `SubjectContext.tsx` — Global subject state (React Context)
- Update `Dashboard.tsx` to show subject selector

**Example:**
```typescript
// frontend/src/components/SubjectSelector.tsx
export const SubjectSelector: React.FC = () => {
  const { subject, setSubject } = useSubject();
  
  return (
    <div className="flex gap-2">
      <button 
        onClick={() => setSubject('physics')}
        className={subject === 'physics' ? 'active' : ''}
      >
        ⚛️ Physics
      </button>
      <button 
        onClick={() => setSubject('math')}
        className={subject === 'math' ? 'active' : ''}
      >
        ∑ Mathematics
      </button>
      <button 
        onClick={() => setSubject('chemistry')}
        className={subject === 'chemistry' ? 'active' : ''}
      >
        🧪 Chemistry
      </button>
    </div>
  );
};

// frontend/src/context/SubjectContext.tsx
export const useSubject = () => {
  const context = useContext(SubjectContext);
  if (!context) throw new Error('useSubject must be inside SubjectProvider');
  return context;
};
```

**Acceptance:**
- [ ] Subject selector visible on dashboard
- [ ] Selection persists (localStorage or backend)
- [ ] All pages respect selected subject
- [ ] Icons/colors per-subject
- [ ] Commit: `feat: Add frontend subject selector`

---

### Task 7.7: Math-Specific UI Features
**Goal:** LaTeX rendering, equation inputs

**Libraries:**
```bash
npm install katex react-katex  # LaTeX rendering
npm install mathquill         # Math formula input (optional)
```

**Example usage:**
```typescript
import { InlineMath, BlockMath } from 'react-katex';

<BlockMath math="x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}" />
<InlineMath math="E = mc^2" />
```

**Acceptance:**
- [ ] LaTeX renders in questions
- [ ] LaTeX renders in explanations
- [ ] Math formula input works (if included)
- [ ] No breaking in RTL mode
- [ ] Commit: `feat: Add LaTeX & math formula support`

---

### Task 7.8: Chemistry-Specific UI Features
**Goal:** Molecular structure visualization

**Libraries:**
```bash
npm install smiles-drawer  # Draw molecules from SMILES notation
```

**Example:**
```typescript
import { SmilesDrawer } from 'smiles-drawer';

const drawer = new SmilesDrawer.Drawer();
drawer.draw('C1=CC=CC=C1', 'structure-canvas');
```

**Acceptance:**
- [ ] Molecules render from SMILES notation
- [ ] Visible in questions & explanations
- [ ] Interactive (hover for atom info)
- [ ] Commit: `feat: Add molecular structure visualization`

---

### Task 7.9: Subject-Specific Tutor Prompts
**Goal:** Customize tutor behavior per-subject

**Environment variables:**
```bash
# backend/.env
TUTOR_PROMPT_PHYSICS="You are a Physics tutor..."
TUTOR_PROMPT_MATH="You are a Mathematics tutor..."
TUTOR_PROMPT_CHEMISTRY="You are a Chemistry tutor..."
```

**Each prompt should cover:**
- Subject-specific pedagogy (conceptual focus)
- Common misconceptions
- Step-by-step approach
- Citation requirements

**Example:**
```env
TUTOR_PROMPT_MATH="
You are an expert Mathematics tutor who explains concepts with intuition before formulas.
Your approach:
1. Connect to real-world examples
2. Build intuition first
3. Then introduce formulas
4. Show worked examples
5. Identify common misconceptions

When explaining:
- Use analogies from physics or everyday life
- Break complex problems into steps
- Show WHY each step matters
- Avoid symbol-heavy explanations early
- Cite textbook sources when relevant
"
```

**Acceptance:**
- [ ] All 3 prompts defined
- [ ] Tutor uses subject-specific prompt
- [ ] Responses differ per-subject
- [ ] Commit: `feat: Add subject-specific tutor prompts`

---

## Testing (Per-Subject)

For each subject, verify:
- [ ] Can ask questions (get answers with subject context)
- [ ] Can upload subject-specific knowledge
- [ ] Can practice (problems for that subject)
- [ ] Can see progress (ELO per-subject)
- [ ] API filters by subject correctly

---

## Definition of Done (Phase 7)

- [ ] Math subject: 100+ problems, tutor prompt, full feature parity
- [ ] Chemistry subject: 50+ problems, tutor prompt, full feature parity
- [ ] Database schema supports multiple subjects
- [ ] All 26 API endpoints support subject parameter
- [ ] Frontend subject selector working
- [ ] LaTeX rendering for Math
- [ ] Molecular visualization for Chemistry
- [ ] Subject-specific tutor prompts configured
- [ ] All tests passing (per-subject)
- [ ] No regressions in Physics (original subject)
- [ ] Updated documentation
- [ ] Commit merged to main

---

## Estimation

| Task | Estimate |
|------|----------|
| Subject config framework | 2 days |
| Math content (100+ problems) | 3 days |
| Chemistry content (50+ problems) | 2 days |
| Database schema updates | 1 day |
| API updates (subject parameter) | 2 days |
| Frontend subject selector | 1 day |
| Math UI (LaTeX) | 1 day |
| Chemistry UI (molecules) | 1 day |
| Tutor prompts | 1 day |
| Testing & polish | 2 days |
| **Total** | **16 days** |

---

## Next: Phase 8

After Phase 7, start **Phase 8: Advanced Features** (live tutoring, mobile app, etc.).

See **PHASE_8_SPRINT_PROMPT.md**.

---

**Owner:** Sharon Afroni  
**Created:** 2026-08-25  
**Status:** Ready to start
