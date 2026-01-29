# Getting Started with Kodex

This guide walks you through setting up Kodex and generating your first knowledge base.

## Prerequisites

Before starting, ensure you have:

- **Node.js 20+** — Check with `node --version`
- **pnpm 9+** — Install with `npm install -g pnpm`
- **An LLM API key** — Anthropic (recommended), OpenAI, or Google

## Step 1: Install Kodex

### Clone and Build

```bash
# Clone the repository
git clone https://github.com/gfcampbell/kodex.git
cd kodex

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Verify Installation

```bash
node packages/cli/dist/index.js --help
```

You should see:

```
Usage: kodex [options] [command]

Automated knowledge base generator for product support

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  init            Initialize Kodex in the current project
  scan            Scan codebase and generate documentation
  review          Interactively review generated documentation
  gaps            View and manage unanswered questions
  dashboard       Start the web dashboard
```

### (Optional) Link Globally

To use `kodex` anywhere without the full path:

```bash
cd packages/cli
pnpm link --global
```

Now you can run `kodex` directly.

## Step 2: Set Up Your API Key

Kodex needs an LLM API key to generate documentation.

### Option A: Environment Variable (Recommended)

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export ANTHROPIC_API_KEY=sk-ant-api03-...

# Or for OpenAI
export OPENAI_API_KEY=sk-...

# Or for Google
export GOOGLE_API_KEY=...
```

Then reload your shell:
```bash
source ~/.zshrc
```

### Option B: In Configuration File

Add directly to `kodex.config.yaml` (less secure, but works):

```yaml
llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
  apiKey: sk-ant-api03-...
```

## Step 3: Initialize Your Project

Navigate to your project and initialize Kodex:

```bash
cd /path/to/your-project
kodex init
```

This creates:
- `kodex.config.yaml` — Configuration file
- `.kodex/` — Output directory
- Updates `.gitignore` to exclude `.kodex/`

Kodex auto-detects your framework (Next.js, React, Express).

## Step 4: Configure (Optional)

Review and customize `kodex.config.yaml`:

```yaml
# Project info
name: "My Product"
version: "1.0.0"

# What to scan
scan:
  include:
    - "src/**/*.{ts,tsx,js,jsx}"    # Adjust to your structure
    - "app/**/*.{ts,tsx,js,jsx}"
  exclude:
    - "**/*.test.*"
    - "**/node_modules/**"
  framework: auto

# Topics to generate docs for
docs:
  outputDir: ".kodex/docs"
  format: both
  topics:
    - authentication
    - navigation
    - settings
    - errors

# LLM settings
llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
```

## Step 5: Scan Your Codebase

### Preview First (No LLM Calls)

```bash
kodex scan --no-generate
```

This scans your code and shows what it finds:

```
✔ Configuration loaded
✔ Scanned 326 files in 1471ms
   Routes: 39
   Components: 118
   Pages: 39
   Features: 23
   Framework: nextjs
```

Review `.kodex/codemap.json` to see the detailed analysis.

### Generate Documentation

```bash
kodex scan
```

This:
1. Scans your codebase
2. Detects features matching configured topics
3. Calls the LLM to generate docs
4. Saves to `.kodex/docs/`

```
✔ Configuration loaded
✔ Scanned 326 files in 1471ms
   Routes: 39
   Components: 118
   Pages: 39
   Features: 23
   Framework: nextjs
✔ Documentation generated
   Generated: 15 items
   Updated: 0 items
   Skipped: 0 items (pinned or unchanged)
   Tokens used: 12,500

✅ Knowledge base saved to .kodex/docs

📝 15 items need review
   Run: kodex review
```

## Step 6: Review Generated Docs

Browse the generated documentation:

```bash
ls -la .kodex/docs/
```

```
authentication/
  login-logout.md
  password-reset.md
  two-factor-auth.md
settings/
  profile-management.md
  notifications.md
navigation/
  getting-started.md
json/
  kb-auth-login-logout.json
  ...
```

Each markdown file includes:
- YAML frontmatter with metadata
- Generated content
- Source file references

### Example Output

```markdown
---
id: kb-auth-password-reset
topic: authentication.password-reset
title: "How to Reset Your Password"
pages: ["/login", "/settings/security"]
generated: 2026-01-29T18:00:00Z
status: draft
confidence: 0.95
---

## Resetting Your Password

If you've forgotten your password, you can reset it from the login page:

1. Click "Forgot Password" on the login screen
2. Enter your email address
3. Check your inbox for the reset link
4. Click the link and enter your new password

### From Settings

If you're logged in and want to change your password:

1. Go to **Settings** → **Security**
2. Click "Change Password"
3. Enter your current password
4. Enter and confirm your new password
5. Click "Save"
```

## Step 7: Iterate

### Regenerate After Code Changes

```bash
# Full regeneration
kodex scan

# Only regenerate affected docs
kodex scan --changed
```

### Add Questions to Gap Queue

When users ask questions that aren't answered:

```bash
kodex gaps --add "How do I export my data?"
```

### View Gap Queue

```bash
kodex gaps
```

```
📋 Unanswered Questions (3)

Pending:
  [gap-1706547890] How do I export my data?
  [gap-1706548123] Can I use keyboard shortcuts?
           Asked 5 times
```

## Next Steps

- **Review all generated docs** — Edit for accuracy, approve good ones
- **Configure custom topics** — Add product-specific documentation categories
- **Set up CI/CD** — Run `kodex scan` on releases (Phase 4)
- **Deploy dashboard** — For team review workflow (Phase 2)

## Common Issues

### No features detected

Your code might not match the detection patterns. Check:
1. File paths match `scan.include`
2. You're using a supported framework
3. Code follows common naming patterns (see [COMMON-TOPICS.md](./COMMON-TOPICS.md))

### Low confidence scores

Low confidence (< 0.7) means the pattern match was weak. These docs need extra review.

### Missing routes

For non-standard routing, you may need to:
1. Adjust `scan.framework`
2. Add custom extractors (future feature)

## Getting Help

- [Architecture docs](./ARCHITECTURE.md)
- [Configuration reference](./CONFIGURATION.md)
- [GitHub Issues](https://github.com/gfcampbell/kodex/issues)
