# Kodex

**Automated knowledge base generator for product support.**

Kodex scans your codebase, understands your product's structure, and generates user-facing help documentation — tagged by page, versioned with your code, and continuously improved through gap tracking.

## The Problem

Product documentation is always stale. Support teams answer the same questions repeatedly. Users can't find help for the feature they're looking at.

## The Solution

1. **Scan** — Parse your codebase to understand routes, components, features
2. **Generate** — Use LLMs to create help docs for common topics + product-specific features
3. **Tag** — Every doc knows which page(s) it applies to
4. **Version** — Docs track their source files; regenerate when code changes
5. **Learn** — Unanswered questions queue for human review, growing the KB over time

## Status

🚧 **In Development** — Not ready for use yet.

## Quick Start

```bash
# Install
npm install -g kodex

# Initialize in your project
cd your-project
kodex init

# Scan and generate docs
kodex scan

# Review generated docs
kodex review

# Start the dashboard
kodex dashboard
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Configuration](./docs/CONFIGURATION.md)
- [Common Topics](./docs/COMMON-TOPICS.md)
- [Contributing](./CONTRIBUTING.md)

## License

MIT
