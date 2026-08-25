# AI Learning Coach

**An adaptive learning platform for physics (Hebrew-first) with extensibility to other subjects.**

🚀 AI tutor that explains concepts intuitively, breaks problems into steps, detects misconceptions, and adapts to each student's level.

---

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- Redis
- Google OAuth credentials
- Google Cloud Storage bucket

### Setup (Local Development)

```bash
# 1. Clone repo
git clone https://github.com/efroni/AI_Learning_Coach.git
cd AI_Learning_Coach

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env.local
# Edit .env.local with your settings

# 4. Database setup
npm run db:migrate

# 5. Start development servers
npm run dev

# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

### Running Tests

```bash
npm run test              # Run all tests
npm run test -- --watch  # Watch mode (TDD)
npm run test:e2e         # E2E tests (Playwright)
```

### Code Quality

```bash
npm run type-check  # TypeScript strict mode
npm run lint        # ESLint
npm run format      # Prettier
npm run check       # All checks at once
```

---

## Project Structure

```
AI_Learning_Coach/
├── frontend/                 # React + TypeScript
│   ├── src/
│   │   ├── features/        # Domain-based features
│   │   ├── components/      # Shared UI components
│   │   ├── services/        # API calls & business logic
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript types
│   └── tests/
├── backend/                  # Node.js + Fastify
│   ├── src/
│   │   ├── routes/          # HTTP routes
│   │   ├── services/        # Business logic
│   │   ├── db/              # Database ORM + migrations
│   │   ├── ai/              # AI Gateway & providers
│   │   └── middleware/      # Auth, logging, error handling
│   └── tests/
├── docs/                     # Documentation
│   ├── PROJECT_STATUS.md
│   ├── ARCHITECTURE_DECISIONS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── DEFINITION_OF_DONE.md
│   └── CONTRIBUTING_FOR_AI_AGENTS.md
├── CLAUDE.md               # Governance & rules
└── README.md              # This file
```

---

## Technology Stack

| Layer | Technology |
|-------|----------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Fastify, TypeScript |
| **Database** | PostgreSQL, pgvector (semantic search) |
| **Storage** | Google Cloud Storage |
| **Auth** | Google OAuth 2.0, JWT |
| **AI** | Claude, Gemini, OpenAI (provider-agnostic) |
| **Queue** | Bull (Redis-backed) |
| **Testing** | Jest, Playwright |
| **Deployment** | Vercel (FE), Railway/Cloud Run (BE) |

---

## Key Features

### Phase 1: Foundation (Current)
- ✅ Git repo initialized
- ✅ Governance (CLAUDE.md)
- ✅ Database schema designed
- 🚧 CI/CD pipeline setup
- 🚧 Authentication system

### Phase 2: Core Features (Weeks 3-6)
- 🚧 User auth (Google OAuth)
- 🚧 AI Settings (BYOK — Bring Your Own API Key)
- 🚧 Question Workspace (ask physics questions)
- 🚧 Semantic search + RAG (retrieve relevant materials)

### Phase 3: Knowledge & Practice (Weeks 7-10)
- 🚧 Upload PDFs/images (exam materials)
- 🚧 OCR + chunking pipeline
- 🚧 Practice engine with adaptive difficulty
- 🚧 Mastery tracking (ELO-based)

### Phase 4: Sharing & Polish (Weeks 11-12)
- 🚧 Share solutions (shareable links)
- 🚧 Focus mode (for ADHD/accessibility)
- 🚧 Progress dashboard

### Future (Year 2)
- Multi-subject support (Math, Chemistry, etc.)
- Teacher dashboard
- School partnerships

---

## Architecture Highlights

### Provider-Agnostic AI
No hardcoding of Claude/Gemini/OpenAI. All calls go through `AIGateway` abstraction. Users choose their provider + bring their own API key.

### Security First
- API keys **never** stored on client
- Server-side encryption (AES-256)
- Audit logs for compliance
- GDPR-ready

### Hebrew RTL-First
Built from day 1 with right-to-left layout. Not an afterthought.

### Extensible to Other Subjects
Physics → Math → Chemistry seamlessly. Subject-agnostic architecture.

### RAG with Citations
AI responses cite knowledge sources. Reduces hallucination. Improves learning.

---

## Contributing

See `docs/CONTRIBUTING_FOR_AI_AGENTS.md` for detailed guidelines.

### Quick Checklist Before Submitting PR

- [ ] Tests pass (`npm run test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Linting passes (`npm run lint`)
- [ ] Builds successfully (`npm run build`)
- [ ] Commit message explains WHY (not just WHAT)
- [ ] No secrets in code
- [ ] RTL works (if UI change)
- [ ] Mobile responsive (if UI change)

---

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Core principles, governance, rules for AI agents
- **[docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md)** — Feature acceptance criteria
- **[docs/CONTRIBUTING_FOR_AI_AGENTS.md](docs/CONTRIBUTING_FOR_AI_AGENTS.md)** — How to work on this project
- **[docs/PROJECT_STATUS.md](../PROJECT_STATUS.md)** — Current state, risks, metrics
- **[docs/ARCHITECTURE_DECISIONS.md](../ARCHITECTURE_DECISIONS.md)** — System design, data flows
- **[docs/IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)** — Sprint roadmap, timeline

---

## Development Workflow

### Local Development

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make changes
[edit code]

# Test & lint
npm run check

# Commit with context
git commit -m "feat: Add feature X

Explain WHY and HOW in the body.

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push & create PR
git push origin feature/your-feature-name
```

### Deployment

#### Staging
```bash
npm run deploy:staging
```

#### Production
```bash
npm run deploy:prod
```

---

## Environment Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (dev)
   - `https://yourdomain.com/api/auth/google/callback` (prod)
4. Copy Client ID & Secret to `.env.local`

### PostgreSQL
```bash
# Local with Docker
docker run --name pg -e POSTGRES_PASSWORD=postgres -d postgres:15
```

### Redis
```bash
# Local with Docker
docker run --name redis -d redis:7
```

---

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` in `.env.local`
- Ensure PostgreSQL is running
- Run migrations: `npm run db:migrate`

### OAuth Not Working
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Check redirect URI matches in Google Console
- Clear browser cookies/cache

### Tests Failing
- Update snapshots: `npm run test -- -u`
- Check Node version: `node --version` (should be 20+)
- Clear cache: `npm run clean && npm install`

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page Load | < 3 seconds | — |
| API Response | < 500ms | — |
| Semantic Search | < 1 second | — |
| Lighthouse Score | > 90 | — |

---

## Security & Privacy

- ✅ HTTPS only (in production)
- ✅ API keys encrypted at rest
- ✅ No user data shared with AI providers
- ✅ GDPR compliant (user data export/delete)
- ✅ Audit logs for compliance
- ✅ Rate limiting to prevent abuse

---

## Support & Contact

**Owner:** Sharon Afroni  
**Email:** sharone123@gmail.com

For questions:
1. Check [CLAUDE.md](CLAUDE.md) first
2. Look at existing code (patterns documented)
3. Open an issue or PR
4. Contact maintainer

---

## License

[To be determined — GPL, MIT, or proprietary]

---

## Roadmap

### MVP (End of Month 2)
- ✅ User authentication
- ✅ Ask questions → Get AI responses
- ✅ Upload exam PDFs → Semantic search
- ✅ Responsive, RTL Hebrew

### Post-MVP (Month 3-4)
- ✅ Practice engine with mastery tracking
- ✅ Sharing (shareable links)
- ✅ Focus mode
- ✅ Progress dashboard

### Year 2
- ✅ Math curriculum
- ✅ Chemistry curriculum
- ✅ Teacher dashboard
- ✅ School partnerships

---

**Last Updated:** 2026-08-25  
**Status:** 🚧 Foundation Phase
