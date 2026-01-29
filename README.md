# Kodex

**Automated knowledge base generator for product support.**

Kodex scans your codebase, understands your product's structure, and generates user-facing help documentation — tagged by page, versioned with your code, and continuously improved through gap tracking.

## Why Kodex?

- **Documentation is always stale** — Kodex regenerates docs when your code changes
- **Support teams answer the same questions** — Auto-generate FAQs from code patterns
- **Users can't find contextual help** — Every doc is tagged with the page(s) it applies to
- **Knowledge gaps go unnoticed** — Track unanswered questions, grow the KB over time

## Features

- 🔍 **Code Scanning** — Extracts routes, components, UI strings, and feature patterns
- 🤖 **LLM Generation** — Creates user-facing docs using Claude, GPT, or Gemini
- 📍 **Page-Level Tagging** — Docs know which pages they apply to
- 🔄 **Version Tracking** — Regenerate only what changed
- 📝 **Gap Tracking** — Queue unanswered questions for human review
- 🎯 **Framework Support** — Next.js, React, Express (more coming)

## Requirements

- **Node.js 20+**
- **pnpm 9+** (for development)
- **LLM API Key** (Anthropic, OpenAI, or Google)

## Installation

### From Source (Current)

```bash
# Clone the repo
git clone https://github.com/gfcampbell/kodex.git
cd kodex

# Install dependencies
pnpm install

# Build
pnpm build

# Link globally (optional)
cd packages/cli
pnpm link --global
```

### Future (npm)

```bash
npm install -g @kodex/cli
```

## Quick Start

### 1. Initialize in your project

```bash
cd your-project
kodex init
```

This creates:
- `kodex.config.yaml` — Configuration file
- `.kodex/` — Output directory (added to .gitignore)

### 2. Configure your LLM

Set your API key as an environment variable:

```bash
# Anthropic (recommended)
export ANTHROPIC_API_KEY=sk-ant-...

# Or OpenAI
export OPENAI_API_KEY=sk-...

# Or Google
export GOOGLE_API_KEY=...
```

Or add it directly to `kodex.config.yaml`:

```yaml
llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
  apiKey: sk-ant-...  # Or use ${ANTHROPIC_API_KEY}
```

### 3. Scan and generate

```bash
# Scan only (no LLM calls)
kodex scan --no-generate

# Full scan with doc generation
kodex scan
```

### 4. Review output

Generated docs are in `.kodex/docs/`:

```
.kodex/
├── docs/
│   ├── authentication/
│   │   ├── login-logout.md
│   │   ├── password-reset.md
│   │   └── two-factor-auth.md
│   ├── settings/
│   │   └── profile-management.md
│   └── json/
│       └── *.json
├── items.json      # All knowledge items
├── gaps.json       # Unanswered questions queue
└── codemap.json    # Cached code analysis
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `kodex init` | Initialize Kodex in current project |
| `kodex scan` | Scan codebase and generate docs |
| `kodex scan --no-generate` | Scan only, skip LLM generation |
| `kodex scan --changed` | Only regenerate changed docs |
| `kodex scan --dry-run` | Preview without writing files |
| `kodex gaps` | View unanswered questions queue |
| `kodex gaps --add "question"` | Add a question to the queue |
| `kodex review` | Interactive doc review (Phase 2) |
| `kodex dashboard` | Web dashboard (Phase 2) |

## Configuration

See [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) for full reference.

### Minimal config

```yaml
name: "My Product"
llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
```

### Full config

```yaml
name: "My Product"
version: "1.0.0"

scan:
  include:
    - "src/**/*.{ts,tsx,js,jsx}"
  exclude:
    - "**/*.test.*"
    - "**/node_modules/**"
  framework: auto  # react | nextjs | express | auto

docs:
  outputDir: ".kodex/docs"
  format: both  # markdown | json | both
  topics:
    - authentication
    - navigation
    - settings
    - errors
    - billing

llm:
  provider: anthropic  # anthropic | openai | google
  model: claude-3-5-haiku-20241022
```

## Supported Frameworks

| Framework | Routes | Components | Strings |
|-----------|--------|------------|---------|
| Next.js (App Router) | ✅ | ✅ | ✅ |
| Next.js (Pages Router) | ✅ | ✅ | ✅ |
| React + React Router | ✅ | ✅ | ✅ |
| Express | ✅ | — | — |
| Vanilla JS | Partial | ❌ | ❌ |

## Common Topics

Kodex auto-detects these feature categories:

- **authentication** — login, signup, password reset, 2FA, sessions
- **navigation** — getting started, search, keyboard shortcuts
- **settings** — profile, notifications, theme, language
- **data** — create/edit, import/export, filtering, autosave
- **errors** — error messages, connection issues, 404
- **billing** — subscriptions, payments, invoices
- **integrations** — API access, webhooks, SSO
- **collaboration** — sharing, comments, team invites

See [docs/COMMON-TOPICS.md](./docs/COMMON-TOPICS.md) for detection patterns.

## Output Format

### Knowledge Item (JSON)

```json
{
  "id": "kb-auth-password-reset",
  "topic": "authentication.password-reset",
  "title": "How to Reset Your Password",
  "pages": ["/login", "/settings/security"],
  "content": "## Resetting Your Password\n\n...",
  "sourceFiles": ["src/app/login/page.tsx"],
  "codeVersion": "a3f8c2d",
  "generatedAt": "2026-01-29T17:00:00Z",
  "status": "draft",
  "confidence": 0.95,
  "humanEdited": false,
  "pinned": false
}
```

### Markdown with Frontmatter

```markdown
---
id: kb-auth-password-reset
topic: authentication.password-reset
title: "How to Reset Your Password"
pages: ["/login", "/settings/security"]
generated: 2026-01-29T17:00:00Z
status: draft
confidence: 0.95
---

## Resetting Your Password

If you've forgotten your password...
```

## Development Status

### Phase 1: Foundation ✅
- [x] CLI scaffolding
- [x] Code scanner (routes, components, strings, features)
- [x] LLM doc generation
- [x] File-based storage
- [x] Gap tracking

### Phase 2: Dashboard (Next)
- [ ] Web UI for reviewing docs
- [ ] Interactive approval workflow
- [ ] Gap queue management

### Phase 3: Continuous Improvement
- [ ] Git-based change detection
- [ ] Selective regeneration
- [ ] Analytics

### Phase 4: Integrations
- [ ] GitHub Action
- [ ] Export to Docusaurus/GitBook
- [ ] RAG-ready embeddings

## Project Structure

```
kodex/
├── packages/
│   ├── cli/                 # CLI tool
│   │   ├── src/
│   │   │   ├── commands/    # CLI commands
│   │   │   ├── scanner/     # Code parsing
│   │   │   ├── generator/   # LLM doc generation
│   │   │   └── storage/     # KB file management
│   │   └── package.json
│   ├── dashboard/           # Web dashboard (Phase 2)
│   └── shared/              # Shared types
├── docs/                    # Documentation
├── examples/                # Example configs
└── package.json             # Monorepo root
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — System design and data flow
- [Configuration](./docs/CONFIGURATION.md) — Full config reference
- [Common Topics](./docs/COMMON-TOPICS.md) — Feature detection patterns
- [Development Plan](./docs/PLAN.md) — Roadmap and tech decisions
- [Contributing](./CONTRIBUTING.md) — How to contribute

## Troubleshooting

### "No API key found"

Set the appropriate environment variable:
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Or add to config:
```yaml
llm:
  apiKey: sk-ant-...
```

### "Command not found: kodex"

If installed from source, either:
1. Use full path: `node /path/to/kodex/packages/cli/dist/index.js`
2. Link globally: `cd packages/cli && pnpm link --global`

### "No routes/components found"

Check your `scan.include` patterns match your source files:
```yaml
scan:
  include:
    - "src/**/*.{ts,tsx}"      # Adjust to your structure
    - "app/**/*.{ts,tsx}"
```

### Build errors

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

## License

MIT

## Credits

Built by [Phase Four AI](https://phasefour.ai)
