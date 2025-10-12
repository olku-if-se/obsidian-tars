# Contributing to Obsidian Tars

Thank you for your interest in contributing to Obsidian Tars! This document provides guidelines and instructions for developers.

## Monorepo Structure

This project uses a monorepo structure managed by **pnpm** and **Turborepo**:

```
obsidian-tars/                  # Monorepo root
├── packages/
│   └── plugin/                 # Main Obsidian plugin package
│       ├── src/                # Source code
│       ├── tests/              # Test files
│       ├── scripts/            # Build and utility scripts
│       ├── dist/               # Build output
│       └── package.json        # Plugin dependencies
├── pnpm-workspace.yaml         # pnpm workspace configuration
├── turbo.json                  # Turborepo pipeline configuration
├── biome.json                  # Code quality configuration
└── package.json                # Root package.json (workspace config)
```

## Prerequisites

- **Node.js**: >= 22.0.0 (managed via Volta if available)
- **pnpm**: >= 9.0.0 (package manager)
- **Docker**: Required for MCP server testing

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/TarsLab/obsidian-tars.git
cd obsidian-tars
pnpm install
```

This will install dependencies for all packages in the workspace.

### 2. Development Workflow

#### Build the Plugin

```bash
# Build all packages
pnpm build

# Build only the plugin package
pnpm --filter obsidian-tars build

# Watch mode for development
pnpm --filter obsidian-tars dev
```

#### Run Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode with UI
pnpm test:watch

# Run tests for specific package
pnpm --filter obsidian-tars test
```

#### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Check and auto-fix issues
pnpm check
```

#### Type Checking

```bash
# Type check build code
pnpm typecheck:build

# Type check test code
pnpm typecheck:tests
```

### 3. Testing in Obsidian

We provide convenient scripts for testing the plugin in a real Obsidian vault:

```bash
# Complete workflow: build → setup vault → launch Obsidian
packages/plugin/scripts/test-workflow.sh

# Or step by step:
pnpm --filter obsidian-tars build
packages/plugin/scripts/setup-test-vault.sh
packages/plugin/scripts/launch-obsidian.sh
```

The test vault is created at:
- **WSL2**: `/mnt/c/Users/[USERNAME]/obsidian-test-vault`
- **Linux/macOS**: `~/obsidian-test-vault`

#### Development with Live Reload

For faster development, use a symlink instead of copying build files:

```bash
# Remove copied files
rm -rf ~/obsidian-test-vault/.obsidian/plugins/obsidian-tars

# Create symlink to plugin package
ln -s /path/to/obsidian-tars/packages/plugin ~/obsidian-test-vault/.obsidian/plugins/obsidian-tars

# Run dev mode (watches for changes and rebuilds)
pnpm --filter obsidian-tars dev
```

Now changes are reflected immediately in Obsidian (toggle plugin off/on to reload).

## Project Structure

### Main Plugin (`packages/plugin/`)

- **`src/main.ts`**: Plugin entry point
- **`src/editor.ts`**: Text generation and message parsing logic
- **`src/suggest.ts`**: Tag auto-completion (EditorSuggest)
- **`src/settings.ts`**: Settings schema and defaults
- **`src/settingTab.ts`**: Settings UI
- **`src/providers/`**: LLM provider implementations
- **`src/mcp/`**: Model Context Protocol integration
  - `managerMCPUse.ts`: MCP server lifecycle manager
  - `executor.ts`: Tool execution with limits
  - `toolCallingCoordinator.ts`: AI tool calling orchestration
  - `adapters/`: Provider-specific tool format adapters
- **`src/statusBarManager.ts`**: Status bar display
- **`tests/`**: Comprehensive test suite (279+ tests)

### Scripts (`packages/plugin/scripts/`)

- **`build.sh`**: Production build script
- **`test-workflow.sh`**: Complete testing workflow
- **`setup-test-vault.sh`**: Create Obsidian test vault
- **`launch-obsidian.sh`**: Launch Obsidian with test vault
- **`validate-monorepo.sh`**: Validate monorepo structure
- **`diagnose-ollama-wsl.sh`**: Diagnose Ollama connectivity issues

## Development Guidelines

### Code Style

This project uses **Biome** for linting and formatting:

- **Indentation**: Tabs
- **Line width**: 120 characters
- **Quote style**: Single quotes
- **Semicolons**: As needed (omit where possible)
- **Trailing commas**: None

Run `pnpm check` before committing to auto-fix issues.

### Testing Strategy

We follow a comprehensive testing approach:

- **Unit tests**: Mock external dependencies (Obsidian API, Docker, MCP SDK)
- **Integration tests**: Test component interactions
- **E2E tests**: Test complete workflows with error recovery

**Example test command**:
```bash
# Run specific test file
pnpm --filter obsidian-tars test -- tests/mcp/executor.test.ts

# Run with coverage
pnpm --filter obsidian-tars test:coverage
```

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example**:
```
feat(mcp): add tool execution timeout configuration

- Add timeout setting in MCP server configuration
- Default timeout: 30 seconds
- Configurable per server

Closes #123
```

### Pull Request Process

1. **Create feature branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Follow code style and testing guidelines
3. **Run quality checks**:
   ```bash
   pnpm typecheck:build
   pnpm typecheck:tests
   pnpm test
   pnpm check
   ```
4. **Commit changes**: Use conventional commits
5. **Push and create PR**: Provide clear description and reference issues

### Debugging

#### Developer Console

- **Windows/Linux**: `Ctrl+Shift+I`
- **macOS**: `Cmd+Option+I`

Look for `[MCP]` prefixed logs for MCP-related debugging.

#### MCP Debugging

- Enable `enableStreamLog` in MCP settings for detailed logs
- Use "Browse MCP Tools" command to inspect available tools
- Click status bar on error to see error details
- Check Docker containers: `docker ps -a`

## Monorepo Commands Reference

### Root Level (Turborepo)

These commands run across all packages using Turborepo's caching:

```bash
pnpm dev          # Run dev mode for all packages
pnpm build        # Build all packages
pnpm test         # Test all packages
pnpm lint         # Lint all packages
pnpm format       # Format all packages
pnpm check        # Check all packages (lint + format)
```

### Package Level (Filtered)

Target specific packages using `--filter`:

```bash
pnpm --filter obsidian-tars <script>   # Run script in plugin package
pnpm --filter obsidian-tars build      # Build only plugin
pnpm --filter obsidian-tars test       # Test only plugin
```

### Workspace Management

```bash
pnpm install                  # Install all dependencies
pnpm install <pkg> -w         # Install to workspace root
pnpm add <pkg> --filter <workspace>  # Install to specific package
```

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf packages/plugin/dist packages/plugin/node_modules
pnpm install
pnpm --filter obsidian-tars build
```

### Tests Fail

```bash
# Run tests with verbose output
pnpm --filter obsidian-tars test -- --reporter=verbose

# Check type errors
pnpm typecheck:tests
```

### MCP Issues

See `docs/mcp-error-handling.md` for comprehensive MCP debugging guide.

### Ollama Connection Issues (WSL2)

```bash
# Run diagnostic script
packages/plugin/scripts/diagnose-ollama-wsl.sh
```

Common issue: Ollama listening on 127.0.0.1 instead of 0.0.0.0. Fix:
```powershell
# Windows PowerShell
$env:OLLAMA_HOST="0.0.0.0:11434"
ollama serve
```

## Documentation

- **User Guides**: See `README.md` for user-facing documentation
- **Architecture**: See `docs/MCP_ARCHITECTURE.md`
- **Development**: See `docs/CLAUDE.md` for comprehensive dev guide
- **Testing**: See `docs/TESTING.md` for manual testing guide

## Release Process

1. Update version in `packages/plugin/package.json`
2. Run `pnpm --filter obsidian-tars version`
3. Build: `pnpm --filter obsidian-tars build`
4. Test: `pnpm --filter obsidian-tars test`
5. Create release tag: `git tag -a v3.5.0 -m "Release v3.5.0"`
6. Push tag: `git push origin v3.5.0`
7. Upload `packages/plugin/dist/main.js` and `manifest.json` to GitHub release

## Need Help?

- **Issues**: https://github.com/TarsLab/obsidian-tars/issues
- **Discussions**: https://github.com/TarsLab/obsidian-tars/discussions
- **Documentation**: https://github.com/TarsLab/obsidian-tars/tree/main/docs

Thank you for contributing! 🎉
