# Monorepo Setup Guide

This guide covers the setup and development workflow for the Tars Obsidian plugin monorepo structure.

## Overview

The Tars plugin has been migrated from a single-package structure to a modern monorepo using:
- **pnpm** for package management and workspace configuration
- **turbo** for build orchestration and caching
- **tsup** for TypeScript bundling
- **vitest** for testing
- **biome** for formatting and linting
- **knip** for dependency analysis

## Project Structure

```
obsidian-tars/
├── pnpm-workspace.yaml        # Workspace configuration
├── turbo.json                 # Build orchestration
├── package.json               # Root dev dependencies
├── tsconfig.json              # Root TypeScript config
├── biome.json                 # Formatting and linting
├── knip.json                  # Dependency analysis
├── apps/                      # Application packages
│   └── obsidian-plugin/       # Main Obsidian plugin (IIFE bundle)
├── packages/                  # Shared packages (ESM modules)
│   ├── types/                 # TypeScript definitions
│   ├── shared/                # Shared utilities
│   ├── core/                  # Core plugin logic
│   ├── providers/             # AI provider implementations
│   ├── mcp/                   # MCP server integration
│   └── testing/               # Testing utilities
└── docs/                      # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9.x

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd obsidian-tars

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development Workflow

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @tars/core build

# Watch mode for development (when configured)
pnpm dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @tars/providers test

# Run tests with coverage
pnpm test --coverage
```

### Code Quality

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# TypeScript type checking
pnpm typecheck

# Build, typecheck, lint and unit tests
pnpm quality

# Check for unused dependencies
pnpm knip

# Check all workspace dependencies and versions
pnpm check:all
```

## Package Architecture

### Package Types

1. **apps/obsidian-plugin**: Main plugin bundle (IIFE format for Obsidian)
2. **packages/types**: Shared TypeScript definitions
3. **packages/shared**: Common utilities and constants
4. **packages/core**: Core plugin logic and settings
5. **packages/providers**: AI provider implementations
6. **packages/mcp**: MCP server integration
7. **packages/testing**: Test utilities and mocks

### Dependencies

- Packages use workspace protocol for internal dependencies: `"@tars/core": "workspace:*"`
- External dependencies are declared at the package level
- Root package.json contains dev dependencies for tooling

### Build Outputs

- **Plugin**: `apps/obsidian-plugin/main.js` (IIFE bundle)
- **Packages**: `packages/*/dist/` (ESM modules with type definitions)

## Build System

### Turbo Configuration

The `turbo.json` defines pipelines for:
- **build**: Package compilation with proper dependency order
- **test**: Parallel test execution with caching
- **lint**: Code quality checks
- **format**: Code formatting

### Caching

Turbo provides intelligent caching:
- Build outputs cached based on file changes
- Test results cached when no test files change
- Significantly speeds up subsequent builds

### Package Builds

Each package uses `tsup` for bundling:
- ESM format for packages
- IIFE format for plugin
- TypeScript declaration generation
- Source maps for development

## Development Tools

### TSX Support

CLI tools and scripts can be executed with TSX:
```bash
# Run CLI tools
tsx packages/core/bin/tars-cli.ts
tsx packages/providers/bin/provider-demo.ts
```

### Biome Configuration

Biome handles both formatting and linting:
- Automatic code formatting on save
- Linting with TypeScript support
- Consistent code style across packages

### Vitest Testing

Test configuration includes:
- `passWithNoTests: true` for packages without tests
- Parallel execution across packages
- Coverage reporting when needed

## Common Commands

```bash
# Development
pnpm dev              # Start development mode
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm format           # Format all code

# Package-specific
pnpm --filter <package> <command>  # Run command in specific package
pnpm --filter "@tars/*" build      # Build all tars packages

# Quality checks
pnpm quality          # Build, typecheck, lint and unit tests
pnpm typecheck        # TypeScript type checking
pnpm knip             # Check for unused dependencies
pnpm check:all        # Check all workspace dependencies and versions
```

## Adding New Packages

1. Create package directory under `packages/` or `apps/`
2. Initialize `package.json` with workspace protocol dependencies
3. Add TypeScript configuration extending root config
4. Add `tsup.config.ts` for build configuration
5. Update `turbo.json` if needed for new pipeline dependencies

## Migration Notes

This monorepo setup enables:
- **Faster builds** through turbo caching
- **Better dependency management** with pnpm workspaces
- **Improved developer experience** with modern tooling
- **Clear package boundaries** for future development
- **Scalable architecture** for additional features

The migration maintains 100% functional compatibility with the original plugin while providing a robust foundation for future development.

## Troubleshooting

### Common Issues

1. **Build failures**: Check TypeScript errors and missing dependencies
2. **Test failures**: Ensure test files use correct import paths
3. **Cache issues**: Clear turbo cache with `pnpm turbo clean`
4. **Dependency issues**: Run `pnpm install` to sync workspace

### Validation and Maintenance

For comprehensive validation procedures, dependency management, and maintenance workflows, see the **[Monorepo Validation Toolkit](maintenance/monorepo-validation.md)** which includes:

- Dependency consistency checks across workspace packages
- Dead code detection and unused dependency analysis
- Interactive dependency update workflows
- Automated fix procedures for common issues

### Getting Help

- Check individual package README files
- Review turbo pipeline configuration
- Consult pnpm workspace documentation
- Use `pnpm why <package>` to understand dependency resolution
- See [Monorepo Validation Toolkit](maintenance/monorepo-validation.md) for maintenance procedures