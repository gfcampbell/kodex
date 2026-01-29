# Contributing to Kodex

Thanks for your interest in contributing! This guide will help you get set up.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Adding Features](#adding-features)
- [Submitting Changes](#submitting-changes)

## Development Setup

### Prerequisites

- **Node.js 20+** — [Download](https://nodejs.org/)
- **pnpm 9+** — Install with `npm install -g pnpm`
- **Git** — For version control

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/gfcampbell/kodex.git
cd kodex

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Verify it works
node packages/cli/dist/index.js --help
```

### Development Mode

```bash
# Watch mode (rebuilds on changes)
pnpm dev

# In another terminal, test your changes
node packages/cli/dist/index.js scan --no-generate
```

### Link for Local Testing

```bash
cd packages/cli
pnpm link --global

# Now you can use 'kodex' anywhere
kodex --help
```

## Project Structure

```
kodex/
├── packages/
│   ├── cli/                     # CLI tool (main package)
│   │   ├── src/
│   │   │   ├── commands/        # CLI command handlers
│   │   │   │   ├── init.ts      # kodex init
│   │   │   │   ├── scan.ts      # kodex scan
│   │   │   │   ├── gaps.ts      # kodex gaps
│   │   │   │   ├── review.ts    # kodex review (Phase 2)
│   │   │   │   └── dashboard.ts # kodex dashboard (Phase 2)
│   │   │   ├── scanner/         # Code analysis
│   │   │   │   ├── index.ts     # Main scanner orchestration
│   │   │   │   ├── routes.ts    # Route extraction
│   │   │   │   ├── components.ts # Component extraction
│   │   │   │   ├── strings.ts   # String extraction
│   │   │   │   └── features.ts  # Feature detection
│   │   │   ├── generator/       # LLM doc generation
│   │   │   │   └── index.ts     # Generation logic
│   │   │   ├── storage/         # File I/O
│   │   │   │   └── index.ts     # KB persistence
│   │   │   ├── config.ts        # Config loading
│   │   │   └── index.ts         # CLI entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dashboard/               # Web dashboard (Phase 2)
│   │   └── (empty for now)
│   │
│   └── shared/                  # Shared types and utilities
│       ├── src/
│       │   └── index.ts         # All shared types
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                        # Documentation
│   ├── ARCHITECTURE.md          # System design
│   ├── CONFIGURATION.md         # Config reference
│   ├── COMMON-TOPICS.md         # Detection patterns
│   ├── GETTING_STARTED.md       # Setup guide
│   └── PLAN.md                  # Development roadmap
│
├── examples/                    # Example files
│   └── kodex.config.yaml        # Example config
│
├── package.json                 # Root package (monorepo)
├── pnpm-workspace.yaml          # pnpm workspace config
├── turbo.json                   # Turborepo config
└── README.md
```

## Development Workflow

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit files in `packages/*/src/`
   - Run `pnpm build` to compile
   - Test with `node packages/cli/dist/index.js`

3. **Rebuild after changes**
   ```bash
   # Full rebuild
   pnpm build
   
   # Or use watch mode
   pnpm dev
   ```

4. **Test on a real project**
   ```bash
   cd /path/to/test-project
   kodex init --force
   kodex scan --no-generate
   ```

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies |
| `pnpm build` | Build all packages |
| `pnpm dev` | Watch mode (rebuild on change) |
| `pnpm clean` | Remove build artifacts |
| `pnpm typecheck` | Type-check without building |
| `pnpm lint` | Run linter |
| `pnpm test` | Run tests |

## Code Style

### TypeScript

- **Strict mode** — All code is type-checked with strict settings
- **ES Modules** — Use `.js` extensions in imports (even for `.ts` files)
- **Named exports** — Prefer named exports over default

```typescript
// ✅ Good
import { scanCodebase } from './scanner/index.js';
export function myFunction() { }

// ❌ Avoid
import scanner from './scanner';
export default function() { }
```

### Formatting

- **Indentation** — 2 spaces
- **Semicolons** — Yes
- **Quotes** — Single quotes for strings
- **Trailing commas** — Yes, in multiline

### Naming

- **Files** — kebab-case (`my-feature.ts`)
- **Functions** — camelCase (`extractRoutes`)
- **Types/Interfaces** — PascalCase (`KnowledgeItem`)
- **Constants** — UPPER_SNAKE_CASE (`DEFAULT_CONFIG`)

### Comments

```typescript
// Single-line comments for brief notes

/**
 * Multi-line JSDoc for functions and types.
 * Include @param and @returns for public APIs.
 */
export function extractRoutes(
  sourceFile: SourceFile,
  relativePath: string
): Route[] {
  // Implementation
}
```

## Testing

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Specific package
cd packages/cli
pnpm test
```

### Writing Tests

Tests go in `__tests__/` directories:

```
packages/cli/
├── src/
│   └── scanner/
│       └── routes.ts
└── __tests__/
    └── scanner/
        └── routes.test.ts
```

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { extractRoutes } from '../src/scanner/routes.js';

describe('extractRoutes', () => {
  it('extracts Next.js app routes', () => {
    // Test implementation
  });
});
```

## Adding Features

### New Scanner Extractor

To support a new framework or extraction type:

1. **Create the extractor** in `packages/cli/src/scanner/`:

```typescript
// packages/cli/src/scanner/vue-routes.ts
import { SourceFile } from 'ts-morph';
import type { Route } from '@kodex/shared';

export function extractVueRoutes(
  sourceFile: SourceFile,
  relativePath: string
): Route[] {
  const routes: Route[] = [];
  // Your extraction logic
  return routes;
}
```

2. **Integrate in the main scanner** (`packages/cli/src/scanner/index.ts`):

```typescript
import { extractVueRoutes } from './vue-routes.js';

// In scanCodebase():
if (framework === 'vue') {
  const vueRoutes = extractVueRoutes(sourceFile, relativePath);
  routes.push(...vueRoutes);
}
```

3. **Add framework detection**:

```typescript
// In detectFramework():
const hasVue = project.getSourceFiles().some(sf => {
  const imports = sf.getImportDeclarations();
  return imports.some(i => i.getModuleSpecifierValue() === 'vue');
});
if (hasVue) return 'vue';
```

### New Common Topic

To add detection patterns for a new topic:

1. **Add to feature patterns** in `packages/cli/src/scanner/features.ts`:

```typescript
{
  id: 'category.my-topic',
  patterns: [/pattern1/i, /pattern2/i, /MyComponent/i],
  confidence: 0.9,
},
```

2. **Document in** `docs/COMMON-TOPICS.md`

### New CLI Command

1. **Create the command** in `packages/cli/src/commands/`:

```typescript
// packages/cli/src/commands/mycommand.ts
export async function myCommand(options: MyOptions): Promise<void> {
  // Implementation
}
```

2. **Register in** `packages/cli/src/index.ts`:

```typescript
import { myCommand } from './commands/mycommand.js';

program
  .command('mycommand')
  .description('Description here')
  .option('-x, --example <value>', 'Example option')
  .action(myCommand);
```

### New Shared Type

Add to `packages/shared/src/index.ts`:

```typescript
export interface MyNewType {
  id: string;
  // ...
}
```

Then rebuild: `pnpm build`

## Submitting Changes

### Pull Request Process

1. **Ensure your code builds**
   ```bash
   pnpm build
   pnpm typecheck
   ```

2. **Test your changes**
   ```bash
   pnpm test
   # And manually test on a real project
   ```

3. **Update documentation** if needed
   - README.md for user-facing changes
   - docs/*.md for detailed documentation
   - Code comments for complex logic

4. **Create a pull request**
   - Clear title describing the change
   - Description of what and why
   - Link to any related issues

### Commit Messages

Follow conventional commits:

```
feat: add Vue.js route extraction
fix: handle empty source files in scanner
docs: update configuration examples
refactor: simplify feature detection logic
```

### Review Checklist

Before submitting, verify:

- [ ] Code compiles without errors
- [ ] Types are correct (no `any` unless necessary)
- [ ] New code has appropriate comments
- [ ] Documentation is updated
- [ ] Changes tested on a real project

## Questions?

- **Issues** — [GitHub Issues](https://github.com/gfcampbell/kodex/issues)
- **Discussions** — [GitHub Discussions](https://github.com/gfcampbell/kodex/discussions)

Thank you for contributing!
