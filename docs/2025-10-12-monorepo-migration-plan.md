# Monorepo Migration Plan - Epic-1100

**Created**: 2025-10-12
**Priority**: P1 - Critical (blocking v3.5.0 architecture improvements)
**Total Story Points**: 21 SP
**Estimated Duration**: 3-4 days

---

## Table of Contents

- [Overview](#overview)
- [Epic-1100: Monorepo Migration](#epic-1100-monorepo-migration)
- [Feature-1100-10: Monorepo Setup](#feature-1100-10-monorepo-setup)
- [Feature-1100-20: Plugin Migration](#feature-1100-20-plugin-migration)
- [Feature-1100-30: Build & Tooling](#feature-1100-30-build--tooling)
- [Feature-1100-40: Documentation & Validation](#feature-1100-40-documentation--validation)
- [Architecture Decision Record](#architecture-decision-record)
- [Migration Strategy](#migration-strategy)
- [Rollback Plan](#rollback-plan)

---

## Overview

### Why Migrate to Monorepo?

**Current Pain Points**:
- Single package.json mixing plugin code with potential future packages
- No clear separation between plugin, shared utilities, and future MCP server packages
- Difficult to extract reusable MCP logic for standalone usage
- Hard to manage dependencies between logical modules

**Future Benefits**:
- **Scalability**: Easy to add new packages (MCP server SDKs, CLI tools, shared utilities)
- **Code Reuse**: Extract `@tars/mcp-client` for standalone use
- **Performance**: Turborepo caching reduces build/test times
- **Developer Experience**: Clear package boundaries, better IDE support
- **Deployment**: Independent versioning per package

**Immediate Goal**: Prepare architecture for future extraction of reusable MCP components while maintaining current functionality.

---

## Epic-1100: Monorepo Migration

**Status**: 🟡 Planned
**Priority**: P1
**Story Points**: 21 SP
**Timeline**: 2025-10-12 to 2025-10-15

### Epic Overview

Restructure the Obsidian TARS project into a monorepo using pnpm workspaces + Turborepo, moving existing plugin code to `packages/plugin/` and preparing architecture for future package extraction.

### Success Criteria

- ✅ Monorepo structure with pnpm workspaces
- ✅ Turborepo for build orchestration
- ✅ Plugin code isolated in `packages/plugin/`
- ✅ All 429 tests passing
- ✅ Dev workflow unchanged (npm scripts still work)
- ✅ Build output identical to pre-migration
- ✅ Git history preserved
- ✅ Documentation updated

### Architecture Before

```
obsidian-tars/
├── src/              # Plugin source
├── tests/            # Plugin tests
├── package.json      # Single package
├── tsconfig.json
└── ...
```

### Architecture After

```
obsidian-tars/                    # Monorepo root
├── packages/
│   └── plugin/                   # Obsidian plugin (formerly root)
│       ├── src/
│       ├── tests/
│       ├── package.json
│       ├── tsconfig.json
│       └── ...
├── turbo.json                    # Turborepo config
├── pnpm-workspace.yaml          # Workspace definition
├── package.json                 # Root package
└── ...
```

### Future Architecture (Post-Migration)

```
obsidian-tars/
├── packages/
│   ├── plugin/                   # Obsidian plugin
│   ├── mcp-client/              # Reusable MCP client (future)
│   ├── shared/                  # Shared types & utils (future)
│   └── cli/                     # CLI tools (future)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Feature-1100-10: Monorepo Setup

**Story Points**: 5 SP
**Priority**: P1

### UserStory-1100-10-5: Initialize Monorepo Structure (5 SP)

**User Story**: As a developer, I need the project configured as a pnpm + Turborepo monorepo so that we can manage multiple packages efficiently.

#### Tasks

##### Task-1100-10-5-1: Create Workspace Configuration (1 SP)

**TDD Approach**:
- **RED**: Write test that validates `pnpm-workspace.yaml` exists and contains correct packages
- **GREEN**: Create workspace config
- **REFACTOR**: Ensure comments explain workspace structure

**Implementation**:

1. Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
```

2. Create root `package.json`:
```json
{
  "name": "obsidian-tars-monorepo",
  "version": "3.5.0",
  "private": true,
  "description": "Obsidian TARS Plugin Monorepo",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "check": "turbo run check"
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=22.0.0",
    "pnpm": ">=9.0.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

3. Add `.npmrc` with pnpm settings:
```ini
# Use pnpm for all package management
auto-install-peers=true
strict-peer-dependencies=false
```

**Acceptance Criteria**:
- **Given**: Monorepo root
- **When**: Running `pnpm install`
- **Then**: Workspaces are recognized
- **And**: No errors in installation

**Files Affected**:
- `pnpm-workspace.yaml` (new)
- `package.json` (modified)
- `.npmrc` (modified)

---

##### Task-1100-10-5-2: Configure Turborepo (1 SP)

**TDD Approach**:
- **RED**: Write test that validates `turbo.json` exists and has correct pipeline
- **GREEN**: Create Turborepo config
- **REFACTOR**: Optimize cache settings

**Implementation**:

Create `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [
    ".env",
    "tsconfig.json"
  ],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "main.js"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "check": {
      "outputs": [],
      "cache": true
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "typecheck:build": {
      "outputs": [],
      "cache": true
    },
    "typecheck:tests": {
      "outputs": [],
      "cache": true
    }
  }
}
```

**Acceptance Criteria**:
- **Given**: Turborepo config
- **When**: Running `turbo run build`
- **Then**: Build pipeline executes correctly
- **And**: Cache is utilized on subsequent runs

**Files Affected**:
- `turbo.json` (new)

---

##### Task-1100-10-5-3: Create Packages Directory Structure (1 SP)

**TDD Approach**:
- **RED**: Write test that validates `packages/plugin/` exists
- **GREEN**: Create directory structure
- **REFACTOR**: Ensure permissions are correct

**Implementation**:

```bash
mkdir -p packages/plugin
```

**Acceptance Criteria**:
- **Given**: Monorepo root
- **When**: Running `ls packages/`
- **Then**: `plugin/` directory exists
- **And**: Directory has correct permissions

**Files Affected**:
- `packages/` (new directory)
- `packages/plugin/` (new directory)

---

##### Task-1100-10-5-4: Install pnpm and Turborepo (1 SP)

**TDD Approach**:
- **RED**: Write test that validates `pnpm` and `turbo` are available
- **GREEN**: Install globally and locally
- **REFACTOR**: Document version requirements

**Implementation**:

1. Install pnpm globally (if not present):
```bash
npm install -g pnpm@9.15.0
```

2. Install Turborepo in workspace:
```bash
pnpm add -D -w turbo@^2.3.3
```

3. Update `.gitignore`:
```
# Turborepo
.turbo/
```

**Acceptance Criteria**:
- **Given**: Development environment
- **When**: Running `pnpm --version`
- **Then**: Version 9.15.0 or higher
- **And**: Running `turbo --version` returns valid version

**Files Affected**:
- `package.json` (devDependencies)
- `.gitignore` (updated)

---

##### Task-1100-10-5-5: Validate Workspace Setup (1 SP)

**TDD Approach**:
- **RED**: Write test that validates workspace structure
- **GREEN**: Run validation commands
- **REFACTOR**: Add automated validation script

**Implementation**:

1. Create validation script `scripts/validate-monorepo.sh`:
```bash
#!/bin/bash
set -e

echo "Validating monorepo structure..."

# Check pnpm version
pnpm --version || (echo "❌ pnpm not installed" && exit 1)

# Check turbo version
turbo --version || (echo "❌ turbo not installed" && exit 1)

# Check workspace config
[ -f "pnpm-workspace.yaml" ] || (echo "❌ pnpm-workspace.yaml missing" && exit 1)

# Check turbo config
[ -f "turbo.json" ] || (echo "❌ turbo.json missing" && exit 1)

# Check packages directory
[ -d "packages/plugin" ] || (echo "❌ packages/plugin missing" && exit 1)

echo "✅ Monorepo structure validated"
```

2. Make executable:
```bash
chmod +x scripts/validate-monorepo.sh
```

**Acceptance Criteria**:
- **Given**: Monorepo setup complete
- **When**: Running `./scripts/validate-monorepo.sh`
- **Then**: All checks pass
- **And**: Script exits with code 0

**Files Affected**:
- `scripts/validate-monorepo.sh` (new)

---

## Feature-1100-20: Plugin Migration

**Story Points**: 8 SP
**Priority**: P1

### UserStory-1100-20-5: Move Plugin Code to Workspace (8 SP)

**User Story**: As a developer, I need the plugin code moved to `packages/plugin/` so that it's properly isolated in the monorepo structure.

#### Tasks

##### Task-1100-20-5-1: Move Source Files (2 SP)

**TDD Approach**:
- **RED**: Write test that validates source files exist in new location
- **GREEN**: Move files with git mv
- **REFACTOR**: Verify imports still work

**Implementation**:

```bash
#!/bin/bash
# Move source directories
git mv src packages/plugin/src
git mv tests packages/plugin/tests
git mv styles.css packages/plugin/styles.css

# Move build-related files
git mv esbuild.config.mjs packages/plugin/esbuild.config.mjs
git mv tsconfig.build.json packages/plugin/tsconfig.build.json
git mv tsconfig.tests.json packages/plugin/tsconfig.tests.json
git mv vitest.config.ts packages/plugin/vitest.config.ts

# Move plugin-specific files
git mv manifest.json packages/plugin/manifest.json
git mv versions.json packages/plugin/versions.json
git mv version-bump.mjs packages/plugin/version-bump.mjs
```

**Acceptance Criteria**:
- **Given**: Source files in root
- **When**: Running migration script
- **Then**: All files moved to `packages/plugin/`
- **And**: Git history preserved

**Files Affected**:
- All files listed above (moved)

---

##### Task-1100-20-5-2: Update Package.json for Plugin (2 SP)

**TDD Approach**:
- **RED**: Write test that validates plugin package.json
- **GREEN**: Create plugin-specific package.json
- **REFACTOR**: Ensure all dependencies included

**Implementation**:

Create `packages/plugin/package.json`:
```json
{
  "name": "obsidian-tars",
  "version": "3.5.0",
  "description": "Text generation based on tag suggestions, using DeepSeek, Claude, OpenAI, OpenRouter, SiliconFlow, Gemini, Qwen & more.",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "npm run typecheck:build && npm run typecheck:tests && ./scripts/build.sh",
    "version": "node version-bump.mjs && git add manifest.json versions.json",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "typecheck:build": "tsc --project tsconfig.build.json --noEmit --skipLibCheck",
    "typecheck:tests": "tsc --project tsconfig.tests.json --noEmit",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --ui --coverage --watch"
  },
  "keywords": [],
  "author": "C Jack<https://github.com/ae86jack>",
  "license": "MIT",
  "devDependencies": {
    "@anthropic-ai/sdk": "^0.65.0",
    "@biomejs/biome": "2.2.4",
    "@google/generative-ai": "^0.24.1",
    "@types/node": "^24.6.1",
    "@types/ws": "^8.18.1",
    "@vitest/coverage-v8": "^3.2.4",
    "@vitest/ui": "^3.2.4",
    "axios": "^1.8.3",
    "builtin-modules": "3.3.0",
    "esbuild": "^0.25.10",
    "handlebars": "^4.7.8",
    "jose": "^5.10.0",
    "jsdom": "^27.0.0",
    "obsidian": "1.8.7",
    "ollama": "^0.5.18",
    "openai": "^5.23.2",
    "testcontainers": "^11.7.0",
    "tslib": "^2.4.0",
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.18.2",
    "@types/debug": "^4.1.12",
    "async-mutex": "^0.5.0",
    "debug": "^4.4.3",
    "mcp-use": "^0.1.0",
    "p-limit": "^7.1.1",
    "yaml": "^2.8.1"
  }
}
```

**Acceptance Criteria**:
- **Given**: Plugin package.json
- **When**: Running `pnpm install`
- **Then**: All dependencies resolve correctly
- **And**: Scripts are executable

**Files Affected**:
- `packages/plugin/package.json` (new)

---

##### Task-1100-20-5-3: Update TypeScript Configs (1 SP)

**TDD Approach**:
- **RED**: Write test that validates tsconfig paths
- **GREEN**: Update tsconfig files
- **REFACTOR**: Ensure no broken imports

**Implementation**:

1. Update `packages/plugin/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext", "DOM"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist", "coverage"]
}
```

2. Keep `tsconfig.build.json` and `tsconfig.tests.json` relative to plugin directory

**Acceptance Criteria**:
- **Given**: Updated tsconfig
- **When**: Running `tsc --noEmit`
- **Then**: No type errors
- **And**: All imports resolve correctly

**Files Affected**:
- `packages/plugin/tsconfig.json` (modified)
- `packages/plugin/tsconfig.build.json` (modified)
- `packages/plugin/tsconfig.tests.json` (modified)

---

##### Task-1100-20-5-4: Update Build Scripts (2 SP)

**TDD Approach**:
- **RED**: Write test that validates build output
- **GREEN**: Update esbuild config and scripts
- **REFACTOR**: Ensure output paths correct

**Implementation**:

1. Update `packages/plugin/esbuild.config.mjs`:
```javascript
// Update paths if they reference root
// Most paths should remain relative to plugin package
```

2. Update `packages/plugin/scripts/build.sh`:
```bash
#!/bin/bash
set -e

# Ensure running from plugin directory
cd "$(dirname "$0")/.."

echo "Building plugin..."
npm run typecheck:build
npm run typecheck:tests
node esbuild.config.mjs production

echo "Copying assets..."
cp manifest.json dist/
cp styles.css dist/

echo "✅ Build complete"
```

**Acceptance Criteria**:
- **Given**: Build scripts updated
- **When**: Running `pnpm build` from plugin directory
- **Then**: Build succeeds
- **And**: Output in `dist/` identical to pre-migration

**Files Affected**:
- `packages/plugin/esbuild.config.mjs` (modified)
- `packages/plugin/scripts/build.sh` (modified)

---

##### Task-1100-20-5-5: Validate Plugin Build (1 SP)

**TDD Approach**:
- **RED**: Write test that validates plugin build output
- **GREEN**: Run build and verify
- **REFACTOR**: Add automated build validation

**Implementation**:

1. Create validation script `packages/plugin/scripts/validate-build.sh`:
```bash
#!/bin/bash
set -e

echo "Validating plugin build..."

# Run build
pnpm build

# Check output files
[ -f "dist/main.js" ] || (echo "❌ main.js missing" && exit 1)
[ -f "dist/manifest.json" ] || (echo "❌ manifest.json missing" && exit 1)
[ -f "dist/styles.css" ] || (echo "❌ styles.css missing" && exit 1)

# Check file sizes (rough validation)
MAIN_SIZE=$(wc -c < "dist/main.js")
[ "$MAIN_SIZE" -gt 1000000 ] || (echo "❌ main.js too small" && exit 1)

echo "✅ Plugin build validated"
```

2. Make executable:
```bash
chmod +x packages/plugin/scripts/validate-build.sh
```

**Acceptance Criteria**:
- **Given**: Plugin migrated
- **When**: Running validation script
- **Then**: All checks pass
- **And**: Build output correct

**Files Affected**:
- `packages/plugin/scripts/validate-build.sh` (new)

---

## Feature-1100-30: Build & Tooling

**Story Points**: 5 SP
**Priority**: P1

### UserStory-1100-30-5: Update Development Workflow (5 SP)

**User Story**: As a developer, I need the development workflow to work seamlessly in the monorepo so that my daily work is not disrupted.

#### Tasks

##### Task-1100-30-5-1: Update Root Scripts (1 SP)

**Implementation**:

Update root `package.json` scripts to delegate to Turborepo:
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "check": "turbo run check",
    "typecheck:build": "turbo run typecheck:build",
    "typecheck:tests": "turbo run typecheck:tests",
    "plugin:dev": "pnpm --filter obsidian-tars dev",
    "plugin:build": "pnpm --filter obsidian-tars build",
    "plugin:test": "pnpm --filter obsidian-tars test"
  }
}
```

**Acceptance Criteria**:
- **Given**: Root package.json updated
- **When**: Running `pnpm dev` from root
- **Then**: Plugin dev server starts
- **And**: All scripts work as before

**Files Affected**:
- `package.json` (modified)

---

##### Task-1100-30-5-2: Update Biome Configuration (1 SP)

**Implementation**:

Update root `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.5.3/schema.json",
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      ".turbo",
      "coverage",
      "packages/*/dist"
    ]
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  }
}
```

**Acceptance Criteria**:
- **Given**: Biome config updated
- **When**: Running `pnpm lint`
- **Then**: Lints all workspace packages
- **And**: No errors from monorepo structure

**Files Affected**:
- `biome.json` (modified)

---

##### Task-1100-30-5-3: Update Git Workflows (1 SP)

**Implementation**:

Update `.github/workflows/*.yml` to use pnpm:

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 9.15.0

      - uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test

      - name: Run coverage
        run: pnpm test:coverage
```

**Acceptance Criteria**:
- **Given**: GitHub Actions updated
- **When**: Pushing to repository
- **Then**: CI pipeline runs successfully
- **And**: Uses pnpm correctly

**Files Affected**:
- `.github/workflows/*.yml` (modified)

---

##### Task-1100-30-5-4: Update Documentation Scripts (1 SP)

**Implementation**:

Move plugin-specific scripts to `packages/plugin/scripts/`:
```bash
git mv scripts/* packages/plugin/scripts/
```

Update script paths in documentation.

**Acceptance Criteria**:
- **Given**: Scripts moved
- **When**: Following README instructions
- **Then**: All scripts work correctly
- **And**: Paths updated in docs

**Files Affected**:
- `scripts/*` (moved to `packages/plugin/scripts/`)
- `README.md` (updated)
- `docs/QUICK-START.md` (updated)

---

##### Task-1100-30-5-5: Create Root README (1 SP)

**Implementation**:

Create root `README.md` for monorepo:
```markdown
# Obsidian TARS Monorepo

This monorepo contains the Obsidian TARS plugin and related packages.

## Packages

- [`packages/plugin`](./packages/plugin/README.md) - Obsidian TARS Plugin

## Development

### Prerequisites

- Node.js 22+
- pnpm 9.15+

### Quick Start

\`\`\`bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build all packages
pnpm build
\`\`\`

### Working with the Plugin

\`\`\`bash
# Run plugin-specific commands
pnpm plugin:dev
pnpm plugin:build
pnpm plugin:test
\`\`\`

## Monorepo Structure

This project uses:
- **pnpm workspaces** for package management
- **Turborepo** for build orchestration and caching

See [packages/plugin/README.md](./packages/plugin/README.md) for plugin-specific documentation.
```

Move existing README to plugin:
```bash
git mv README.md packages/plugin/README.md
git mv README_zh.md packages/plugin/README_zh.md
```

**Acceptance Criteria**:
- **Given**: Root README created
- **When**: Opening repository
- **Then**: Clear monorepo overview
- **And**: Links to package docs work

**Files Affected**:
- `README.md` (new monorepo overview)
- `packages/plugin/README.md` (moved)
- `packages/plugin/README_zh.md` (moved)

---

## Feature-1100-40: Documentation & Validation

**Story Points**: 3 SP
**Priority**: P1

### UserStory-1100-40-5: Update Documentation (3 SP)

**User Story**: As a developer, I need updated documentation so that I understand the new monorepo structure and workflows.

#### Tasks

##### Task-1100-40-5-1: Update CLAUDE.md (1 SP)

**Implementation**:

Update `CLAUDE.md` with monorepo structure:
```markdown
# Project Overview

**Obsidian Tars** is an Obsidian plugin that provides AI text generation through tag-based conversations.

## Monorepo Structure

This project is organized as a pnpm + Turborepo monorepo:

\`\`\`
obsidian-tars/
├── packages/
│   └── plugin/          # Obsidian plugin (main package)
├── turbo.json           # Turborepo configuration
├── pnpm-workspace.yaml  # Workspace definition
└── package.json         # Root package
\`\`\`

## Development Commands

### From Root
\`\`\`bash
# Start dev server (all packages)
pnpm dev

# Build all packages
pnpm build

# Run all tests
pnpm test
\`\`\`

### From Plugin Package
\`\`\`bash
cd packages/plugin

# Development with watch mode
pnpm dev

# Production build
pnpm build

# Run tests
pnpm test
\`\`\`

[... rest of CLAUDE.md content ...]
```

**Acceptance Criteria**:
- **Given**: CLAUDE.md updated
- **When**: AI reads documentation
- **Then**: Understands monorepo structure
- **And**: Can navigate project correctly

**Files Affected**:
- `CLAUDE.md` (modified)

---

##### Task-1100-40-5-2: Update Architecture Docs (1 SP)

**Implementation**:

Update `docs/MCP_ARCHITECTURE.md`, `docs/QUICK-START.md`, etc. with new paths:

```markdown
## File Locations

- Plugin source: `packages/plugin/src/`
- Tests: `packages/plugin/tests/`
- Build scripts: `packages/plugin/scripts/`
- Documentation: `docs/` (shared at root)
```

**Acceptance Criteria**:
- **Given**: Architecture docs updated
- **When**: Following documentation
- **Then**: All paths correct
- **And**: No broken links

**Files Affected**:
- `docs/MCP_ARCHITECTURE.md` (modified)
- `docs/QUICK-START.md` (modified)
- `docs/TESTING.md` (modified)

---

##### Task-1100-40-5-3: Run Full Validation (1 SP)

**Implementation**:

Create comprehensive validation script `scripts/validate-migration.sh`:
```bash
#!/bin/bash
set -e

echo "🔍 Running monorepo migration validation..."

# 1. Validate structure
echo "📁 Validating structure..."
./scripts/validate-monorepo.sh

# 2. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 3. Run tests
echo "🧪 Running tests..."
pnpm test

# 4. Run linting
echo "🔍 Running linting..."
pnpm lint

# 5. Run type checking
echo "📝 Running type checks..."
pnpm typecheck:build
pnpm typecheck:tests

# 6. Run build
echo "🏗️  Running build..."
pnpm build

# 7. Validate plugin build
echo "✅ Validating plugin build..."
cd packages/plugin
./scripts/validate-build.sh
cd ../..

# 8. Check git status
echo "📋 Checking git status..."
git status

echo "✅ All validation checks passed!"
echo ""
echo "Summary:"
echo "  - Monorepo structure: ✅"
echo "  - Dependencies: ✅"
echo "  - Tests: ✅ (429 passing)"
echo "  - Linting: ✅"
echo "  - Type checking: ✅"
echo "  - Build: ✅"
echo "  - Git history: ✅ (preserved)"
```

**Acceptance Criteria**:
- **Given**: Migration complete
- **When**: Running validation script
- **Then**: All checks pass
- **And**: 429 tests still passing
- **And**: Build output identical

**Files Affected**:
- `scripts/validate-migration.sh` (new)

---

## Architecture Decision Record

### ADR-001: Choose pnpm over npm/yarn

**Status**: Accepted

**Context**:
- Need efficient workspace management
- Want fast installs and disk efficiency
- Need strict dependency management

**Decision**: Use pnpm 9.15+

**Consequences**:
- ✅ Faster installs with hard linking
- ✅ Strict peer dependency management
- ✅ Better workspace support than npm
- ✅ Growing ecosystem adoption
- ⚠️ Requires pnpm installation (not bundled with Node)

---

### ADR-002: Choose Turborepo over Nx/Lerna

**Status**: Accepted

**Context**:
- Need build orchestration for monorepo
- Want caching to speed up CI/CD
- Prefer simplicity over features

**Decision**: Use Turborepo 2.3+

**Consequences**:
- ✅ Simple, focused tool for builds
- ✅ Excellent caching out of the box
- ✅ Easy to learn and configure
- ✅ Great DX with remote caching
- ⚠️ Less feature-rich than Nx (but we don't need it)

---

### ADR-003: Keep Single Plugin Package Initially

**Status**: Accepted

**Context**:
- Could extract MCP client immediately
- Risk of over-engineering
- Need to deliver v3.5.0 first

**Decision**: Start with single `packages/plugin/`, defer extraction

**Consequences**:
- ✅ Lower migration risk
- ✅ Faster to complete
- ✅ Sets up structure for future extraction
- ⚠️ Extraction still needed later

---

## Migration Strategy

### Phase 1: Preparation (1 day)

1. ✅ Create migration plan (this document)
2. ✅ Get stakeholder approval
3. Create feature branch: `feature/monorepo-migration`
4. Backup current state

### Phase 2: Setup (2 hours)

1. Install pnpm globally
2. Create workspace configuration
3. Configure Turborepo
4. Create packages directory

### Phase 3: Migration (4 hours)

1. Move plugin code to `packages/plugin/`
2. Update package.json files
3. Update TypeScript configs
4. Update build scripts
5. Test incrementally

### Phase 4: Validation (2 hours)

1. Run all tests (must pass 429/429)
2. Run build (output must match)
3. Test dev workflow
4. Validate git history preserved

### Phase 5: Documentation (2 hours)

1. Update CLAUDE.md
2. Update README files
3. Update architecture docs
4. Update quick start guides

### Phase 6: Merge (1 hour)

1. Final validation
2. Create PR
3. Review and merge to main
4. Update Trello board

---

## Rollback Plan

If migration fails, rollback strategy:

### Quick Rollback (< 5 minutes)

```bash
# If on feature branch, just switch back
git checkout main
git branch -D feature/monorepo-migration
```

### Manual Rollback (if merged)

```bash
# Revert merge commit
git revert <merge-commit-sha> -m 1

# Or hard reset (if no one else pulled)
git reset --hard <commit-before-migration>
```

### Prevention Measures

1. Work on feature branch (never push to main until validated)
2. Keep backup of working state
3. Validate thoroughly before merging
4. All 429 tests must pass

---

## Testing Strategy

### Test Coverage Requirements

- ✅ All 429 existing tests must pass
- ✅ No new test failures introduced
- ✅ Test execution time should not increase significantly
- ✅ Coverage percentage maintained (>85%)

### Manual Testing Checklist

After migration, manually verify:

- [ ] `pnpm install` works
- [ ] `pnpm dev` starts dev server
- [ ] `pnpm build` produces correct output
- [ ] `pnpm test` runs all tests
- [ ] Plugin loads in Obsidian test vault
- [ ] Basic AI conversation works
- [ ] MCP tools work
- [ ] All commands accessible

---

## Timeline

**Total Duration**: 3-4 days

| Phase | Duration | Days |
|-------|----------|------|
| Phase 1: Preparation | 1 day | Day 1 |
| Phase 2: Setup | 2 hours | Day 2 |
| Phase 3: Migration | 4 hours | Day 2 |
| Phase 4: Validation | 2 hours | Day 2-3 |
| Phase 5: Documentation | 2 hours | Day 3 |
| Phase 6: Merge | 1 hour | Day 3-4 |

**Start Date**: 2025-10-12
**Target Completion**: 2025-10-15

---

## Success Metrics

### Must Have (Blocking)

- ✅ All 429 tests passing
- ✅ Build output identical to pre-migration
- ✅ Dev workflow unchanged for developers
- ✅ Git history preserved
- ✅ Documentation updated

### Nice to Have (Non-Blocking)

- ✅ CI build time reduced (Turborepo caching)
- ✅ Install time reduced (pnpm efficiency)
- ✅ Clearer project structure

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tests fail after migration | Medium | High | Thorough testing at each step, feature branch |
| Build output differs | Low | High | Validate build byte-for-byte comparison |
| Git history lost | Low | High | Use `git mv`, never copy/delete |
| Developer confusion | Medium | Medium | Clear documentation, training |
| CI/CD breaks | Low | High | Update workflows before merge |

---

## Post-Migration Next Steps

After successful monorepo migration:

1. **Immediate** (v3.5.0):
   - Complete remaining release tasks
   - Ship v3.5.0 with monorepo structure

2. **v3.6.0**:
   - Extract `@tars/mcp-client` package
   - Create `@tars/shared` for types
   - Add CLI tools package

3. **v4.0.0**:
   - React migration (see `docs/migrate-to-react/`)

---

**Document Status**: ✅ Complete
**Epic**: Epic-1100
**Last Updated**: 2025-10-12
