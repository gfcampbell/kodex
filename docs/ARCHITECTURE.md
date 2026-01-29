# Kodex Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER'S REPO                               │
│  src/pages/*, components/*, routes/*, api/*                         │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CODE SCANNER                                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Route     │  │  Component  │  │   String    │  │    API     │ │
│  │  Extractor  │  │   Mapper    │  │  Extractor  │  │  Detector  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
│  Input: Source files                                                │
│  Output: CodeMap (structured representation of the codebase)        │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DOC GENERATOR                                │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  Topic Matcher  │  │  LLM Prompt     │  │  Output Formatter   │ │
│  │  (code → topic) │  │  Builder        │  │  (JSON + Markdown)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
│                                                                     │
│  Input: CodeMap + Common Topics                                     │
│  Output: Knowledge Items                                            │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       KNOWLEDGE BASE                                │
│                                                                     │
│  .kodex/                                                            │
│  ├── docs/           # Generated markdown files                     │
│  ├── items.json      # Knowledge item metadata                      │
│  ├── gaps.json       # Unanswered questions queue                   │
│  ├── codemap.json    # Cached code analysis                         │
│  └── config.yaml     # Project configuration                        │
│                                                                     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CONSUMERS                                   │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Dashboard  │  │  In-App     │  │  Static     │  │    RAG     │ │
│  │  (Review)   │  │  Help Widget│  │  Docs Site  │  │  Chatbot   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Code Scanner

**Purpose:** Parse source code and build a structured map of the application.

**Inputs:**
- Source files (TypeScript/JavaScript)
- Configuration (include/exclude patterns, framework hints)

**Outputs:**
- `CodeMap`: Structured representation containing:
  - Routes (URL paths and their components)
  - Components (React components and their relationships)
  - Pages (route → component mapping)
  - Strings (user-facing text: headings, labels, errors)
  - API Endpoints (backend routes)
  - Features (detected functionality patterns)

**Implementation:**
- Uses `ts-morph` for AST parsing
- Framework-specific extractors for:
  - React Router (v5, v6)
  - Next.js (pages router, app router)
  - Express/Fastify routes
- Pattern matching for common structures (auth, settings, etc.)

```typescript
interface CodeMap {
  routes: Route[];
  components: Component[];
  pages: Page[];
  strings: ExtractedString[];
  apiEndpoints: ApiEndpoint[];
  features: DetectedFeature[];
}

interface Page {
  path: string;           // "/settings/security"
  componentIds: string[]; // Components that render on this page
  sourceFile: string;     // Where this route is defined
  strings: string[];      // User-visible text on this page
  features: string[];     // Detected features (auth, forms, etc.)
}
```

---

### 2. Doc Generator

**Purpose:** Transform code understanding into user-facing documentation.

**Inputs:**
- `CodeMap` from scanner
- Common topics taxonomy
- LLM configuration
- Existing documentation (if any)

**Outputs:**
- Knowledge Items (structured docs)

**Process:**
1. **Topic Matching:** Map detected features to common topics
   - Found auth routes → generate password-reset, login-help docs
   - Found settings page → generate preferences docs
   
2. **Context Building:** For each doc to generate:
   - Gather relevant code snippets
   - Extract user-facing strings
   - Identify related components
   
3. **LLM Generation:** 
   - Build prompt with code context
   - Request structured documentation
   - Parse and validate response
   
4. **Output Formatting:**
   - Generate JSON metadata
   - Generate Markdown content
   - Tag with pages and source files

**Prompt Strategy:**
```
You are generating user support documentation for a software product.

Context:
- Page: /settings/security
- Components: [PasswordChange, TwoFactorSetup]
- User-visible strings: ["Change Password", "Enable 2FA", "Security Settings"]
- Code snippets: [relevant code]

Generate a help article for: "How to change your password"

Requirements:
- Write for end users (not developers)
- Be concise and actionable
- Include step-by-step instructions where appropriate
- Reference actual UI elements from the strings provided
```

---

### 3. Knowledge Base

**Purpose:** Store, version, and serve generated documentation.

**Storage Format:**
```
.kodex/
├── docs/
│   ├── authentication/
│   │   ├── password-reset.md
│   │   ├── login-help.md
│   │   └── two-factor.md
│   ├── navigation/
│   │   └── getting-started.md
│   └── settings/
│       └── preferences.md
├── items.json          # All knowledge items metadata
├── gaps.json           # Unanswered questions
├── codemap.json        # Cached code analysis
└── history/            # Previous versions (optional)
```

**Versioning:**
- Each item tracks `codeVersion` (git commit hash)
- On regeneration, compare before/after
- Human edits marked with `humanEdited: true` and `pinned` option
- Merge strategy: preserve human edits, update generated sections

---

### 4. Gap Tracker

**Purpose:** Capture and manage unanswered questions.

**Input Methods:**
- REST API endpoint for in-app reporting
- Manual entry via CLI or dashboard
- Import from support ticket systems (future)

**Workflow:**
1. Question received with context (page, user action)
2. Deduplicated against existing gaps
3. Auto-categorized by topic if possible
4. Queued for human review
5. Human creates/updates doc
6. Gap marked resolved, linked to doc

---

### 5. Dashboard

**Purpose:** Web interface for reviewing and managing documentation.

**Features:**
- **Doc Browser:** View all generated docs, filter by status/page/topic
- **Editor:** Review, edit, approve, reject docs
- **Gap Queue:** Manage unanswered questions
- **Preview:** See docs as users would
- **Analytics:** (Phase 3) Usage and effectiveness metrics

**Tech:**
- Next.js 14+ with App Router
- Server Components for data fetching
- API routes for mutations
- SQLite for dashboard-specific data (users, assignments, etc.)

---

## Data Flow

### Scan Flow
```
User runs `kodex scan`
    │
    ▼
Load configuration
    │
    ▼
Discover source files
    │
    ▼
Parse each file (AST)
    │
    ▼
Extract routes, components, strings
    │
    ▼
Build CodeMap
    │
    ▼
Match to common topics
    │
    ▼
Generate docs via LLM (batched)
    │
    ▼
Write to .kodex/docs
    │
    ▼
Update items.json
```

### Gap Flow
```
User question not answered
    │
    ▼
POST /api/gaps { question, page, context }
    │
    ▼
Deduplicate (fuzzy match existing)
    │
    ▼
Auto-categorize topic
    │
    ▼
Add to gaps.json
    │
    ▼
Human reviews in dashboard
    │
    ▼
Creates/updates knowledge item
    │
    ▼
Gap resolved, linked to item
```

### Regeneration Flow
```
Code changes (git push)
    │
    ▼
kodex scan --changed
    │
    ▼
Git diff → changed files
    │
    ▼
Find affected knowledge items (via sourceFiles)
    │
    ▼
Filter out pinned items
    │
    ▼
Regenerate affected items only
    │
    ▼
Merge with human edits (if any)
    │
    ▼
Update items.json
```

---

## Extension Points

### Custom Extractors
For frameworks not supported out-of-box:
```typescript
interface Extractor {
  name: string;
  detect(project: Project): boolean;
  extractRoutes(project: Project): Route[];
  extractComponents(project: Project): Component[];
}
```

### Custom Topics
Add project-specific topics beyond the common taxonomy:
```yaml
# kodex.config.yaml
docs:
  customTopics:
    - name: "billing.crypto-payments"
      trigger: "CryptoPayment|BitcoinCheckout"
      prompt: "Generate help for cryptocurrency payments"
```

### Output Adapters
Export to different formats:
```typescript
interface OutputAdapter {
  name: string;
  export(kb: KnowledgeBase, options: object): void;
}

// Built-in: markdown, json, docusaurus, gitbook
```

---

## Security Considerations

- **No secrets in output:** Scanner should detect and redact API keys, tokens
- **Code not included in docs:** Only user-facing descriptions, not implementation
- **LLM data handling:** Configurable to use local models if sensitive
- **Dashboard auth:** Optional but recommended for team use
