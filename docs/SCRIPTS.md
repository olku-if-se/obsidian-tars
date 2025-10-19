# Monorepo Scripts Reference

This document describes all available pnpm scripts and their parallel execution capabilities.

## Quick Reference

### Development
```bash
pnpm dev              # Start development mode (watch)
pnpm build            # Build all packages
pnpm test             # Run all tests
```

### Quality Checks (Parallel)
```bash
pnpm typecheck        # Type check both build and tests (parallel)
pnpm quality          # Run lint, check, and typecheck:build (parallel)
pnpm ci               # Full CI pipeline (parallel)
```

### Maintenance
```bash
pnpm clean            # Clean all build artifacts and node_modules
pnpm clean:cache      # Clean only Turborepo cache
```

## Available Scripts

### Root Package Scripts

All root scripts use Turborepo for intelligent caching and parallel execution.

| Script | Description | Parallel | Dependencies |
|--------|-------------|----------|--------------|
| `pnpm dev` | Start dev mode with watch | No (persistent) | ^build |
| `pnpm build` | Build all packages | No | typecheck:build |
| `pnpm test` | Run all tests | No | build |
| `pnpm test:coverage` | Run tests with coverage | No | build |
| `pnpm test:watch` | Run tests in watch mode | No (persistent) | build |
| `pnpm lint` | Lint all code | Yes | - |
| `pnpm format` | Format all code | Yes | - |
| `pnpm check` | Lint + format all code | Yes | lint |
| `pnpm typecheck` | **Parallel typecheck** | **Yes** | - |
| `pnpm typecheck:build` | Type check build code | Yes | - |
| `pnpm typecheck:tests` | Type check test code | Yes | typecheck:build |
| `pnpm quality` | **Parallel quality checks** | **Yes** | - |
| `pnpm ci` | **Full CI pipeline (parallel)** | **Yes** | - |
| `pnpm clean` | Clean everything | No | - |
| `pnpm clean:cache` | Clean turbo cache only | No | - |

### Plugin-Specific Scripts

Target only the plugin package using `--filter`:

```bash
pnpm --filter obsidian-tars dev        # Plugin dev mode
pnpm --filter obsidian-tars build      # Plugin build
pnpm --filter obsidian-tars test       # Plugin tests
pnpm --filter obsidian-tars clean      # Plugin clean
```

Or use the aliases:

```bash
pnpm plugin:dev         # Same as --filter obsidian-tars dev
pnpm plugin:build       # Same as --filter obsidian-tars build
pnpm plugin:test        # Same as --filter obsidian-tars test
pnpm plugin:clean       # Same as --filter obsidian-tars clean
```

## Parallel Execution Details

### `pnpm typecheck` - Parallel Type Checking
Runs both build and test type checks simultaneously:
```bash
turbo typecheck:build typecheck:tests --parallel
```
**Time saved**: ~50% compared to sequential

### `pnpm quality` - Parallel Quality Gates
Runs lint, check, and typecheck:build in parallel:
```bash
turbo lint check typecheck:build --parallel
```
**Use case**: Pre-commit quality checks
**Time saved**: ~60% compared to sequential

### `pnpm ci` - Full CI Pipeline
Runs all checks, build, and test in parallel where possible:
```bash
turbo lint check typecheck:build typecheck:tests build test --parallel --cache-dir=.turbo
```
**Use case**: CI/CD pipelines
**Time saved**: ~70% compared to sequential
**Features**:
- Intelligent task scheduling (respects dependencies)
- Shared cache directory for CI
- Fails fast on errors

## Task Dependencies

Turborepo automatically handles task dependencies:

```
build
├── ^build (upstream dependencies)
└── typecheck:build

test
└── build

typecheck:tests
└── typecheck:build

check
└── lint

dev
└── ^build (upstream dependencies)
```

## Caching Strategy

Turborepo caches task outputs based on inputs:

| Task | Cached | Cache Key Inputs |
|------|--------|------------------|
| build | ✅ Yes | Source files, tsconfig, deps |
| test | ✅ Yes | Source files, test files, build output |
| lint | ✅ Yes | Source files, biome.json |
| format | ✅ Yes | Source files, biome.json |
| check | ✅ Yes | Source files, biome.json |
| typecheck:* | ✅ Yes | Source files, tsconfig.json |
| dev | ❌ No | Persistent process |
| test:watch | ❌ No | Persistent process |
| clean | ❌ No | Maintenance task |

### Cache Commands
```bash
# Clear turbo cache
pnpm clean:cache

# Force rebuild (ignore cache)
turbo build --force

# View cache status
turbo run build --dry-run
```

## Performance Tips

### 1. Use Parallel Scripts
```bash
# ❌ Slow (sequential)
pnpm typecheck:build && pnpm typecheck:tests

# ✅ Fast (parallel)
pnpm typecheck
```

### 2. Leverage Caching
```bash
# First run: builds everything
pnpm build

# Second run: instant (cached)
pnpm build
```

### 3. Use --filter for Single Package
```bash
# ❌ Slower (scans all packages)
pnpm test

# ✅ Faster (targets plugin only)
pnpm --filter obsidian-tars test
```

### 4. CI Optimization
```bash
# Use the ci script for optimal parallel execution
pnpm ci

# Or customize for your CI
turbo lint check build test --parallel --cache-dir=.turbo
```

## Workflow Examples

### Daily Development
```bash
# Start development
pnpm dev

# In another terminal, run tests in watch mode
pnpm test:watch
```

### Pre-Commit
```bash
# Run all quality checks (parallel)
pnpm quality

# Or just quick checks
pnpm lint && pnpm typecheck:build
```

### CI/CD Pipeline
```bash
# Full pipeline with parallel execution
pnpm ci

# Or step by step with caching
pnpm lint
pnpm check
pnpm typecheck
pnpm build
pnpm test
```

### Release Preparation
```bash
# Clean build
pnpm clean
pnpm install
pnpm ci

# If all passes, build for release
pnpm build
```

## Troubleshooting

### Cache Issues
If you encounter stale cache issues:
```bash
pnpm clean:cache
pnpm build --force
```

### Node Version Warnings
Ensure you're using Node 22.20.0:
```bash
mise install
node --version  # Should show v22.20.0
```

### Parallel Execution Not Working
Check turbo.json for proper task configuration:
```bash
cat turbo.json
```

### Build Failures
Clean and rebuild:
```bash
pnpm clean
pnpm install
pnpm build
```

## References

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Package Scripts](./package.json)
- [Turbo Configuration](./turbo.json)
