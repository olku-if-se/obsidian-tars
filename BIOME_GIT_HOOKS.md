# Biome Git Hooks Configuration

This document describes the Biome Git hooks setup for the Tars Obsidian plugin monorepo.

## Configuration Overview

The Git hooks are configured according to the [Biome Git hooks recipe](https://biomejs.dev/recipes/git-hooks/) and provide automatic code formatting and linting on commits.

## Root Package Configuration

### Scripts
```json
{
  "scripts": {
    "check": "turbo run check",
    "format": "turbo run format",
    "prepare": "pnpm simple-git-hooks",
    "lint-staged": "lint-staged"
  }
}
```

### Git Hooks Configuration
```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*": "biome check --write --no-errors-on-unmatched"
  }
}
```

### Dependencies
```json
{
  "devDependencies": {
    "lint-staged": "^15.2.10",
    "simple-git-hooks": "^2.11.1"
  }
}
```

## Per-Package Scripts

All packages (both in `packages/` and `apps/` directories) have the following Biome scripts:

```json
{
  "scripts": {
    "lint": "biome lint .",
    "format": "biome format --write .",
    "check": "biome check --write ."
  }
}
```

## Biome Configuration

The `biome.json` file is configured with:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.1/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 120,
    "attributePosition": "auto"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

## Available Commands

### For Manual Usage
- `pnpm format` - Format all code across the monorepo
- `pnpm check` - Check and fix linting issues across the monorepo
- `pnpm lint` - Check for linting issues without fixing

### Git Hooks Integration
- **Pre-commit hook** automatically runs `pnpm lint-staged`
- `lint-staged` runs `biome check --write --no-errors-on-unmatched` on staged files
- Only processes files that are staged for commit
- Automatically fixes formatting and linting issues before commit

## Setup Instructions

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up Git hooks:
   ```bash
   pnpm exec simple-git-hooks
   ```

3. The Git hooks are now active and will run automatically on commits.

## How It Works

1. **Developer stages files**: `git add .`
2. **Developer commits**: `git commit -m "message"`
3. **Pre-commit hook runs**: `pnpm lint-staged`
4. **Biome processes staged files**: `biome check --write --no-errors-on-unmatched`
5. **Files are automatically formatted and linted**
6. **Commit proceeds** (unless Biome finds errors that can't be auto-fixed)

## Benefits

- **Consistent code formatting** across the entire monorepo
- **Automatic linting fixes** on every commit
- **No broken commits** due to formatting issues
- **Fast execution** with Turbo caching
- **Minimal manual intervention** - Git hooks handle everything automatically

## Troubleshooting

### Git hooks not running
```bash
# Reinstall Git hooks
pnpm exec simple-git-hooks
```

### Lint-staged not finding files
Make sure files are staged:
```bash
git add .
git commit -m "test commit"
```

### Biome configuration errors
Check the Biome schema version matches the installed CLI version:
```bash
npx biome --version
```

## File Processing

The Git hooks and Biome configuration are set up to process:
- TypeScript files (`.ts`, `.tsx`)
- JavaScript files (`.js`, `.jsx`)
- JSON files (`.json`)
- Markdown files (`.md`)
- Configuration files (`.jsonc`, etc.)

Files in `node_modules/`, `dist/`, `coverage/`, and other build directories are ignored.