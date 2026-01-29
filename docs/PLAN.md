# Kodex Development Plan

## Overview

Kodex is a CLI tool + web dashboard that generates and manages product support documentation by scanning codebases.

---

## Phase 1: Foundation (MVP)

### 1.1 Project Setup
- [ ] Node.js + TypeScript project structure
- [ ] CLI framework (Commander.js)
- [ ] Configuration system (kodex.config.yaml)
- [ ] Basic test harness

### 1.2 Code Scanner
- [ ] TypeScript/JavaScript AST parsing (ts-morph)
- [ ] Route extraction (React Router, Next.js pages/app router)
- [ ] Component discovery and page mapping
- [ ] User-facing string extraction (headings, labels, error messages)
- [ ] API endpoint detection

### 1.3 Doc Generator
- [ ] LLM integration (Anthropic Claude, configurable)
- [ ] Common topics detection and generation
- [ ] Product-specific feature documentation
- [ ] Structured output format (JSON + Markdown)

### 1.4 Knowledge Base Storage
- [ ] File-based storage (git-friendly)
- [ ] Version tracking (tied to git commits)
- [ ] Page tagging system
- [ ] Source file linking

**Deliverable:** `kodex scan` produces a knowledge base from a JS/TS repo.

---

## Phase 2: Dashboard

### 2.1 Next.js Web App
- [ ] Project setup (Next.js 14+ App Router)
- [ ] Basic layout and navigation
- [ ] Authentication (optional, for teams)

### 2.2 Doc Review Interface
- [ ] List all generated docs
- [ ] Filter by page, topic, status
- [ ] Edit/approve/reject workflow
- [ ] Pin docs to prevent regeneration

### 2.3 Gap Queue
- [ ] View unanswered questions
- [ ] Assign to team members
- [ ] Create new doc from question
- [ ] Mark as resolved/won't-fix

### 2.4 Preview
- [ ] Render knowledge base as browsable docs
- [ ] Search functionality
- [ ] Page-filtered view (simulate in-app help)

**Deliverable:** Web dashboard for managing generated docs.

---

## Phase 3: Continuous Improvement

### 3.1 Change Detection
- [ ] Git diff analysis
- [ ] Affected doc identification
- [ ] Selective regeneration
- [ ] Merge strategy for human edits

### 3.2 Gap Tracking API
- [ ] REST endpoint for logging unanswered questions
- [ ] Question deduplication
- [ ] Auto-categorization

### 3.3 Analytics
- [ ] Track which docs are accessed
- [ ] Identify low-performing docs
- [ ] Suggest improvements

**Deliverable:** Self-improving knowledge base that grows with use.

---

## Phase 4: Integrations

### 4.1 CI/CD
- [ ] GitHub Action for scan on push
- [ ] PR comments for doc changes
- [ ] Release-triggered regeneration

### 4.2 Export Formats
- [ ] Static site generation (Docusaurus, etc.)
- [ ] JSON API for custom integrations
- [ ] Markdown files for existing doc systems

### 4.3 Chat Integration
- [ ] Embeddings generation for semantic search
- [ ] RAG-ready output format
- [ ] Example chatbot implementation

**Deliverable:** Production-ready tool with CI/CD and export options.

---

## Tech Stack

### CLI
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js 20+ | Requirement |
| Language | TypeScript | Type safety, better tooling |
| CLI Framework | Commander.js | Simple, mature, widely used |
| AST Parsing | ts-morph | Clean wrapper around TS compiler |
| Config | cosmiconfig | Standard config file discovery |
| LLM Client | Vercel AI SDK | Multi-provider, streaming, TypeScript-native |

### Dashboard
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 14+ | App Router, Server Components, API routes |
| Styling | Tailwind CSS | Fast iteration, consistent design |
| UI Components | shadcn/ui | Accessible, customizable, not a dependency |
| State | Zustand or built-in | Simple, minimal overhead |
| Database | SQLite (via Prisma) | Zero-config, portable, good enough to start |

### Storage
| Component | Choice | Rationale |
|-----------|--------|-----------|
| Knowledge Base | JSON + Markdown files | Git-friendly, human-readable |
| Metadata | SQLite | Fast queries, zero setup |
| Embeddings | Local vector store (later) | Vectra or similar when needed |

---

## Directory Structure

```
kodex/
├── packages/
│   ├── cli/                 # CLI tool
│   │   ├── src/
│   │   │   ├── commands/    # CLI commands
│   │   │   ├── scanner/     # Code parsing
│   │   │   ├── generator/   # Doc generation
│   │   │   ├── storage/     # KB file management
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── dashboard/           # Next.js web app
│   │   ├── app/
│   │   ├── components/
│   │   └── package.json
│   │
│   └── shared/              # Shared types and utilities
│       ├── src/
│       └── package.json
│
├── docs/                    # Project documentation
├── examples/                # Example configs and outputs
├── package.json             # Monorepo root
├── turbo.json               # Turborepo config
└── README.md
```

---

## Configuration

```yaml
# kodex.config.yaml

# Project info
name: "My Product"
version: "1.0.0"

# What to scan
scan:
  include:
    - "src/**/*.{ts,tsx,js,jsx}"
  exclude:
    - "**/*.test.*"
    - "**/*.spec.*"
    - "**/node_modules/**"
  
  # Framework hints (auto-detected if not specified)
  framework: "nextjs"  # react | nextjs | express | auto

# Documentation settings
docs:
  outputDir: ".kodex/docs"
  format: "markdown"  # markdown | json | both
  
  # Common topics to generate
  topics:
    - authentication
    - navigation
    - settings
    - errors
    # See COMMON-TOPICS.md for full list

# LLM settings
llm:
  provider: "anthropic"
  model: "claude-3-5-haiku-20241022"
  # Alternative: 
  # provider: "google"
  # model: "gemini-2.0-flash"

# Dashboard settings (optional)
dashboard:
  port: 3333
  auth: false  # Enable for team use
```

---

## Output Format

### Knowledge Item (JSON)

```json
{
  "id": "kb-auth-password-reset",
  "topic": "authentication.password-reset",
  "title": "How to Reset Your Password",
  "pages": ["/login", "/settings/security"],
  "content": "## Resetting Your Password\n\nIf you've forgotten your password...",
  "sourceFiles": [
    "src/pages/login.tsx",
    "src/components/PasswordReset.tsx"
  ],
  "codeVersion": "a3f8c2d",
  "generatedAt": "2026-01-29T17:00:00Z",
  "status": "draft",
  "confidence": 0.85,
  "humanEdited": false
}
```

### Gap Item (JSON)

```json
{
  "id": "gap-001",
  "question": "How do I export my data?",
  "page": "/dashboard",
  "askedAt": "2026-01-29T18:30:00Z",
  "frequency": 12,
  "status": "pending",
  "assignee": null,
  "resolution": null
}
```

---

## Open Questions

1. **Monorepo tool** — Turborepo vs Nx vs pnpm workspaces only?
2. **Testing strategy** — Unit tests sufficient, or integration tests against real repos?
3. **First target repo** — Which product should we test against?
4. **Team features** — Auth/multi-user needed for v1, or add later?

---

## Next Steps

1. Set up monorepo structure
2. Scaffold CLI package with basic commands
3. Implement TypeScript scanner (route + component extraction)
4. Test against a real repo
5. Add LLM generation
6. Build dashboard

Ready to start on Step 1?
