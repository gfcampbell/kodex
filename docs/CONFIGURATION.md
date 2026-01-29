# Kodex Configuration

Kodex uses a YAML configuration file in your project root.

## Quick Start

```bash
kodex init
```

This creates `kodex.config.yaml` with sensible defaults.

## Config File Location

Kodex searches for config in this order:
- `kodex.config.yaml`
- `kodex.config.yml`
- `kodex.config.json`
- `kodex.config.js`
- `.kodexrc`
- `.kodexrc.yaml`
- `.kodexrc.yml`
- `.kodexrc.json`

## Full Configuration Reference

```yaml
# Project info
name: "My Product"           # Product name (used in generated docs)
version: "1.0.0"             # Product version

# Scan settings
scan:
  include:                   # Glob patterns for files to scan
    - "src/**/*.{ts,tsx,js,jsx}"
  exclude:                   # Glob patterns to ignore
    - "**/*.test.*"
    - "**/node_modules/**"
  framework: auto            # react | nextjs | express | auto

# Documentation settings
docs:
  outputDir: ".kodex/docs"   # Where to write generated docs
  format: both               # markdown | json | both
  topics:                    # Topics to generate (categories)
    - authentication
    - navigation
    - data
    - settings
    - errors
  customTopics: []           # Product-specific topics (see below)

# LLM settings
llm:
  provider: anthropic        # anthropic | openai | google
  model: claude-3-5-haiku-20241022
  apiKey: ${ANTHROPIC_API_KEY}  # Env var reference (optional)
  maxTokens: 1000            # Max tokens per generation (optional)
  temperature: 0.7           # LLM temperature (optional)

# Dashboard settings
dashboard:
  port: 3333                 # Dashboard port
  auth: false                # Enable authentication
```

## Scan Configuration

### include

Glob patterns for files to scan. Kodex uses these to find your source code.

```yaml
scan:
  include:
    - "src/**/*.{ts,tsx}"      # TypeScript files in src
    - "app/**/*.{ts,tsx}"      # Next.js app directory
    - "pages/**/*.{ts,tsx}"    # Next.js pages directory
```

### exclude

Glob patterns to ignore. Test files, mocks, and generated code should be excluded.

```yaml
scan:
  exclude:
    - "**/*.test.*"
    - "**/*.spec.*"
    - "**/node_modules/**"
    - "**/__tests__/**"
    - "**/generated/**"
    - "**/*.d.ts"
```

### framework

Framework hint for route extraction. Set to `auto` for automatic detection.

| Value | Description |
|-------|-------------|
| `auto` | Auto-detect (recommended) |
| `nextjs` | Next.js (App Router or Pages Router) |
| `react` | React with React Router |
| `express` | Express.js |

## Documentation Settings

### outputDir

Where to write generated documentation. Relative to project root.

```yaml
docs:
  outputDir: ".kodex/docs"     # Default: hidden in .kodex
  outputDir: "docs/help"       # Alternative: visible docs folder
```

### format

Output format for generated docs.

| Value | Description |
|-------|-------------|
| `markdown` | Markdown files with YAML frontmatter |
| `json` | JSON files with full metadata |
| `both` | Both formats (default) |

### topics

Categories of documentation to generate. Only features matching these categories will produce docs.

Available categories:
- `authentication` - Login, signup, password reset, 2FA
- `navigation` - Getting started, search, shortcuts
- `data` - Create, edit, import/export, filtering
- `settings` - Profile, notifications, theme
- `errors` - Error messages, troubleshooting
- `billing` - Subscriptions, payments, invoices
- `integrations` - API access, webhooks, SSO
- `collaboration` - Sharing, comments, team features

See [COMMON-TOPICS.md](./COMMON-TOPICS.md) for the full list of topics within each category.

### customTopics

Define product-specific topics with custom detection patterns.

```yaml
docs:
  customTopics:
    - id: "myproduct.widget-builder"
      name: "Widget Builder"
      patterns:
        - "WidgetBuilder"
        - "/widgets/build"
        - "createWidget"
      prompt: |
        Generate help documentation for the widget builder.
        Explain how to create, customize, and publish widgets.
        Include common use cases and troubleshooting tips.
```

## LLM Configuration

### provider

LLM provider to use. Each requires its own API key.

| Provider | Env Variable | Models |
|----------|-------------|--------|
| `anthropic` | `ANTHROPIC_API_KEY` | claude-3-5-haiku-*, claude-3-5-sonnet-* |
| `openai` | `OPENAI_API_KEY` | gpt-4o-mini, gpt-4o |
| `google` | `GOOGLE_API_KEY` | gemini-2.0-flash, gemini-1.5-pro |

### model

Specific model to use. Recommended models for doc generation:

**Cost-effective (recommended for most use):**
- `claude-3-5-haiku-20241022` (Anthropic)
- `gpt-4o-mini` (OpenAI)
- `gemini-2.0-flash` (Google)

**Higher quality (for final passes):**
- `claude-3-5-sonnet-20241022` (Anthropic)
- `gpt-4o` (OpenAI)
- `gemini-1.5-pro` (Google)

### apiKey

API key or environment variable reference.

```yaml
llm:
  # Direct value (not recommended - don't commit secrets!)
  apiKey: sk-...
  
  # Env var reference (recommended)
  apiKey: ${ANTHROPIC_API_KEY}
  
  # Omit to use default env var for provider
  # (ANTHROPIC_API_KEY, OPENAI_API_KEY, or GOOGLE_API_KEY)
```

## Dashboard Configuration

### port

Port for the web dashboard. Default: 3333.

### auth

Enable authentication for the dashboard. Recommended for team use.

When enabled, Kodex will prompt for authentication setup on first run.

## Environment Variables

Kodex respects these environment variables:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_API_KEY` | Google AI API key |
| `KODEX_CONFIG` | Path to config file |
| `KODEX_OUTPUT_DIR` | Override output directory |

## Example Configurations

### Minimal (defaults)

```yaml
name: "My App"
llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
```

### Next.js Project

```yaml
name: "My Next.js App"
version: "2.0.0"

scan:
  include:
    - "app/**/*.{ts,tsx}"
    - "components/**/*.{ts,tsx}"
  framework: nextjs

docs:
  topics:
    - authentication
    - navigation
    - settings

llm:
  provider: anthropic
  model: claude-3-5-haiku-20241022
```

### Monorepo

```yaml
name: "My Monorepo App"

scan:
  include:
    - "packages/web/src/**/*.{ts,tsx}"
    - "packages/app/src/**/*.{ts,tsx}"
  exclude:
    - "**/node_modules/**"
    - "packages/shared/**"  # Skip non-UI packages

docs:
  outputDir: "docs/generated"
  format: markdown

llm:
  provider: openai
  model: gpt-4o-mini
```
