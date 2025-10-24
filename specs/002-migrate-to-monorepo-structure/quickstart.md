# Monorepo Migration Quickstart Guide

**Created**: 2025-01-24
**Purpose**: Step-by-step guide for developers to set up and work with the new monorepo structure

## Prerequisites

- **Node.js**: 24.x (managed by mise)
- **pnpm**: 9.x (automatically installed with mise)
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions listed below

## 1. Initial Setup

### 1.1 Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/TarsLab/obsidian-tars.git
cd obsidian-tars

# Switch to the monorepo branch
git checkout 002-migrate-to-monorepo-structure

# Install mise (if not already installed)
curl https://mise.run | sh

# Install Node.js and other tools
mise install

# Install all dependencies
pnpm install
```

### 1.2 VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-eslint",
    "vitest.explorer"
  ]
}
```

## 2. Development Workflow

### 2.1 Development Mode

```bash
# Start all packages in development mode with hot reload
pnpm dev

# Start only the plugin in development mode
pnpm dev:plugin

# Start specific packages
pnpm --filter @tars/core dev
pnpm --filter @tars/providers dev

# Start packages with TSX (instant execution)
tsx packages/core/src/cli/tars-cli.ts --help
tsx packages/providers/src/demo/provider-demo.ts --provider openai
tsx packages/mcp/src/cli/mcp-cli.ts --list-servers
```

### 2.2 Building

```bash
# Build all packages (ESM for packages, IIFE for plugin)
pnpm build

# Build only the plugin (IIFE bundle)
pnpm build:plugin

# Build specific packages (ESM modules)
pnpm --filter @tars/core build
pnpm --filter @tars/providers build

# Build ESM modules only
pnpm build:esm

# Build IIFE bundle only
pnpm build:iife
```

### 2.3 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @tars/core test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### 2.4 CLI Tools and TSX Execution

```bash
# TARS Core CLI
pnpm cli:core --help
pnpm cli:core init --config ./config
pnpm cli:core test

# Provider Demos
pnpm cli:providers --provider openai
pnpm cli:providers --provider claude --demo

# MCP Server Management
pnpm cli:mcp --list-servers
pnpm cli:mcp --test-server my-server

# Shared Utilities
pnpm cli:shared --validate-config
pnpm cli:shared --check-dependencies

# Direct TSX execution
tsx packages/core/src/cli/tars-cli.ts init
tsx packages/providers/src/demo/provider-demo.ts --interactive
tsx packages/shared/src/cli/tui.ts

# Run TUI interface
pnpm demo
```

## 3. Quality Assurance

### 3.1 Code Quality Checks

```bash
# Run all quality checks (compilation, type-check, biome, knip)
pnpm quality

# Fix automatically fixable issues
pnpm quality:fix

# Individual quality checks
pnpm type-check          # TypeScript type checking
pnpm lint               # Biome linting
pnpm lint:fix           # Auto-fix Biome issues
pnpm knip               # Dependency analysis
```

### 3.2 Quality Gates

Every package must pass these quality gates:

1. **Compilation**: `tsc` completes without warnings or errors
2. **TypeScript**: Strict type checking passes
3. **Biome**: Code formatting and linting passes
4. **Knip**: No unused dependencies or exports
5. **Tests**: All tests pass with minimum 80% coverage

### 3.3 Pre-commit Hooks

```bash
# Install pre-commit hooks
pnpm prepare

# Manual pre-commit check
pnpm pre-commit
```

## 4. Package Structure Overview

### 4.1 Package Categories

```
obsidian-tars/
├── apps/                        # Deployable applications
│   └── obsidian-plugin/         # Main Obsidian plugin (IIFE bundle)
├── packages/                    # Shared libraries (ESM modules)
│   ├── types/                   # TypeScript definitions
│   ├── core/                    # Core plugin logic
│   ├── providers/               # AI provider implementations
│   ├── mcp/                     # MCP server integration
│   ├── shared/                  # Shared utilities
│   └── testing/                 # Testing utilities
└── tools/                       # Development tools
    ├── build-scripts/           # Build automation
    └── dev-tools/               # Development utilities
```

### 4.2 Bundle Strategy

The monorepo uses a strategic bundling approach:

| Package Type | Output Format | TSX Support | Use Case |
|--------------|---------------|-------------|----------|
| Plugin (apps/) | IIFE | No | Obsidian deployment |
| Core Library | ESM | Yes | Development & testing |
| Provider Packages | ESM | Yes | Development & demos |
| MCP Integration | ESM | Yes | Development & CLI |
| Shared Utilities | ESM | Yes | Development & utilities |
| Testing Package | ESM | Yes | Development tools |

**Bundle Outputs**:
- `apps/obsidian-plugin/main.js` - IIFE bundle for Obsidian
- `packages/*/dist/` - ESM modules for development
- CLI scripts executed directly via TSX

### 4.2 Package Naming Convention

- **Applications**: `apps/<name>`
- **Packages**: `@tars/<name>` (e.g., `@tars/core`, `@tars/providers`)
- **Tools**: `tools/<name>`

### 4.3 Inter-Package Dependencies

```json
// Example: apps/obsidian-plugin/package.json
{
  "dependencies": {
    "@tars/core": "workspace:*",
    "@tars/providers": "workspace:*",
    "@tars/mcp": "workspace:*",
    "@tars/shared": "workspace:*",
    "@tars/types": "workspace:*"
  }
}
```

## 5. Common Development Tasks

### 5.1 Adding a New AI Provider

```bash
# Create new provider package
mkdir packages/providers/new-provider
cd packages/providers/new-provider

# Initialize package
pnpm init

# Add dependencies
pnpm add @tars/types @tars/core @tars/shared
pnpm add -D typescript tsup vitest @tars/testing

# Create provider implementation
# See packages/providers/src/template.ts for reference

# Add to workspace
# Update pnpm-workspace.yaml if needed
```

### 5.2 Adding a New Shared Utility

```bash
# Create utility in shared package
cd packages/shared
echo "export function newUtility() { /* implementation */ }" >> src/utils.ts

# Add tests
echo "import { describe, it, expect } from 'vitest'" >> src/utils.test.ts
echo "import { newUtility } from './utils'" >> src/utils.test.ts

# Run tests
pnpm test

# Build package
pnpm build
```

### 5.3 Updating Package Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update @tars/core

# Add new dependency to specific package
pnpm --filter @tars/core add lodash

# Add dev dependency
pnpm --filter @tars/core add -D @types/lodash
```

## 6. Build System

### 6.1 Turbo Orchestration

```bash
# Build with dependency graph
pnpm build

# Build specific package and dependencies
pnpm --filter @tars/core build

# Build package and dependents
pnpm --filter @tars/core^... build

# Build in parallel
pnpm run build --parallel
```

### 6.2 Caching

```bash
# Clear turbo cache
pnpm turbo clean

# Force rebuild (ignore cache)
pnpm build --force

# Check cache status
pnpm turbo run build --dry-run=json
```

### 6.3 Package Building with tsup

```typescript
// tsup.config.ts example
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['obsidian'],
  onSuccess: 'echo "Build completed"'
})
```

## 7. Testing

### 7.1 Test Structure

```
packages/core/
├── src/
│   ├── index.ts
│   └── plugin.ts
└── tests/
    ├── plugin.test.ts
    ├── integration/
    └── fixtures/
```

### 7.2 Writing Tests

```typescript
// packages/core/tests/plugin.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { TarsCore } from '../src/plugin'

describe('TarsCore', () => {
  let core: TarsCore

  beforeEach(() => {
    core = new TarsCore({
      providers: [],
      mcpServers: [],
      settings: {}
    })
  })

  it('should initialize successfully', async () => {
    await expect(core.initialize()).resolves.not.toThrow()
  })

  it('should process messages correctly', async () => {
    const message = {
      id: 'test-msg',
      role: 'user',
      content: { type: 'text', text: 'Hello' },
      timestamp: new Date()
    }

    const response = core.processMessage(message, 'mock-provider')
    await expect(response).resolves.toBeDefined()
  })
})
```

### 7.3 Test Utilities

```typescript
// Import from testing package
import { MockVendor, TestHelper } from '@tars/testing'

// Create mock provider
const mockProvider = new MockVendor()
mockProvider.setResponses(['Hello world!'])

// Create test conversation
const conversation = TestHelper.createTestConversation([
  { role: 'user', content: { type: 'text', text: 'Hello' } }
])
```

## 8. Troubleshooting

### 8.1 Common Issues

**Issue**: `pnpm install fails with peer dependency conflicts`
```bash
# Solution: Use --force or --strict-peer-dependencies
pnpm install --force
# or
pnpm install --strict-peer-dependencies
```

**Issue**: Build fails with TypeScript errors
```bash
# Solution: Check type dependencies
pnpm type-check
# Ensure all workspace dependencies are properly declared
```

**Issue**: Tests fail with import errors
```bash
# Solution: Check tsconfig paths and package exports
# Verify the package has proper exports in package.json
```

**Issue**: Quality gates fail
```bash
# Solution: Run individual checks to identify issues
pnpm lint
pnpm knip
pnpm type-check
```

### 8.2 Performance Issues

**Issue**: Slow builds
```bash
# Check turbo cache hit rate
pnpm turbo run build --dry-run=json

# Clear cache if needed
pnpm turbo clean
```

**Issue**: Memory usage high during development
```bash
# Use selective development
pnpm --filter @tars/core dev

# Restart services periodically
```

## 9. Migration from Old Structure

### 9.1 File Mapping

| Old Location | New Location |
|--------------|--------------|
| `src/main.ts` | `apps/obsidian-plugin/src/main.ts` |
| `src/providers/` | `packages/providers/src/` |
| `src/settings.ts` | `packages/core/src/settings.ts` |
| `src/editor.ts` | `apps/obsidian-plugin/src/editor.ts` |
| `src/suggest.ts` | `apps/obsidian-plugin/src/suggest.ts` |

### 9.2 Configuration Migration

```bash
# Old: package.json scripts
{
  "dev": "node esbuild.config.mjs",
  "build": "tsc -noEmit -skipLibCheck && node esbuild.config.mjs production"
}

# New: turbo-managed scripts
{
  "dev": "turbo run dev",
  "build": "turbo run build",
  "dev:plugin": "turbo run dev --filter=obsidian-plugin"
}
```

## 10. Contributing

### 10.1 Development Workflow

1. Create feature branch from `main`
2. Make changes in appropriate packages
3. Run quality checks: `pnpm quality`
4. Run tests: `pnpm test`
5. Build all packages: `pnpm build`
6. Submit pull request

### 10.2 Code Standards

- **TypeScript**: Strict mode enabled, no implicit any
- **Formatting**: Biome with project configuration
- **Testing**: Minimum 80% coverage for new code
- **Documentation**: JSDoc for public APIs
- **Dependencies**: Use workspace protocol for internal packages

### 10.3 Release Process

```bash
# Update versions (uses changesets)
pnpm changeset
pnpm changeset version

# Build and test
pnpm build
pnpm test

# Release
pnpm release
```

## 11. Additional Resources

- **Biome Documentation**: https://biomejs.dev/
- **Turbo Documentation**: https://turbo.build/
- **pnpm Workspaces**: https://pnpm.io/workspaces
- **tsup Documentation**: https://tsup.egoist.dev/
- **Vitest Documentation**: https://vitest.dev/
- **Knip Documentation**: https://github.com/webpro/knip

## 12. Getting Help

- **Issues**: GitHub repository issues
- **Discussions**: GitHub repository discussions
- **Documentation**: `docs/` directory in repository
- **Examples**: `examples/` directory in repository

---

This guide provides the essential information to get started with the new monorepo structure. For more detailed information on specific topics, refer to the individual package documentation and the main project README.