# Contributing to Kodex

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. **Prerequisites**
   - Node.js 20+
   - pnpm 9+

2. **Clone and install**
   ```bash
   git clone https://github.com/phasefour/kodex.git
   cd kodex
   pnpm install
   ```

3. **Build**
   ```bash
   pnpm build
   ```

4. **Run locally**
   ```bash
   # From the repo root
   node packages/cli/dist/index.js --help
   
   # Or link globally
   cd packages/cli
   pnpm link --global
   kodex --help
   ```

## Project Structure

```
kodex/
├── packages/
│   ├── cli/          # Command-line tool
│   ├── dashboard/    # Web dashboard (Phase 2)
│   └── shared/       # Shared types and utilities
├── docs/             # Documentation
└── examples/         # Example configs and outputs
```

## Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests where appropriate
   - Update documentation

3. **Test your changes**
   ```bash
   pnpm test
   pnpm typecheck
   ```

4. **Submit a PR**
   - Describe what you changed and why
   - Link any related issues

## Adding New Features

### New Scanner Extractors

To support a new framework, add an extractor in `packages/cli/src/scanner/`:

```typescript
// packages/cli/src/scanner/myframework.ts
export function extractMyFrameworkRoutes(
  sourceFile: SourceFile,
  relativePath: string
): Route[] {
  // Your extraction logic
}
```

Then integrate it in `packages/cli/src/scanner/routes.ts`.

### New Common Topics

Add patterns to `packages/cli/src/scanner/features.ts`:

```typescript
{
  id: 'category.my-topic',
  patterns: [/pattern1/i, /pattern2/i],
  confidence: 0.9,
},
```

And document in `docs/COMMON-TOPICS.md`.

## Code Style

- TypeScript with strict mode
- ESM modules (`.js` extensions in imports)
- Prefer `const` over `let`
- Meaningful variable names
- Comments for non-obvious logic

## Questions?

Open an issue or start a discussion. We're happy to help!
