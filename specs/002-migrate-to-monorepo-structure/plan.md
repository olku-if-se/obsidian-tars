# Implementation Plan: Monorepo Migration with Modern Tooling

**Branch**: `002-migrate-to-monorepo-structure` | **Date**: 2025-01-24 | **Spec**: spec.md
**Input**: Feature specification from `/specs/002-migrate-to-monorepo-structure/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the Tars Obsidian plugin from a single-package structure to a modern monorepo using pnpm workspaces, turbo for build orchestration, tsup for bundling, and the latest stable SDK versions. The migration must maintain 100% functional compatibility while significantly improving build performance and developer experience.

## Technical Context

**Language/Version**: TypeScript 5.7+ with strict mode enabled
**Primary Dependencies**: pnpm 9.x, turbo 2.x, tsup 8.x, vitest 2.x, biome 1.x, knip 5.x, tsx latest, latest Obsidian API, modern AI provider SDKs
**Storage**: Obsidian's encrypted settings for configuration, file system for notes, monorepo package management
**Testing**: Vitest for unit tests, custom test framework for Obsidian integration, turbo test orchestration, comprehensive coverage reporting
**Target Platform**: Obsidian plugin (desktop + mobile) with monorepo build system
**Project Type**: Monorepo with multiple TypeScript packages and shared dependencies
**Performance Goals**: 50%+ faster builds, <5s incremental builds, <30s full test suite execution
**Quality Standards**: All packages must compile without warnings/errors, pass TypeScript checks, pass Biome formatting/lint, pass Knip dependency analysis
**Bundle Strategy**: Only plugin package produces bundled JavaScript (IIFE), all other packages remain ESM modules
**TSX Support**: Code should be executable via TSX for TUI interfaces, demo, and testing purposes
**Constraints**: Must maintain identical plugin functionality and Obsidian compatibility
**Scale/Scope**: Monorepo supporting 10+ AI providers, multiple MCP servers, shared packages, global developer community

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All features MUST pass these constitutional gates:

**Gate 1: Plugin Architecture Excellence** ✅
- Feature integrates cleanly with Obsidian APIs (file cache, editor, suggestions)
- Clear separation between provider logic and Obsidian-specific code
- Self-contained and independently testable implementation
- **Monorepo Impact**: Enhanced architecture with clear package boundaries and separation of concerns

**Gate 2: Provider Abstraction** ✅
- Uses existing `Vendor` interface without modifications (unless explicitly justified)
- No provider-specific logic leaks into core plugin code
- Supports streaming responses with proper AbortController handling
- **Monorepo Impact**: Provider isolation enhanced through dedicated packages with proper abstraction

**Gate 3: Test-First Development (TDD)** ✅
- Red-Green-Refactor cycle strictly enforced
- Tests MUST be written before implementation, MUST fail initially
- All provider implementations MUST include contract tests
- **Monorepo Impact**: Vitest integration with comprehensive testing strategy and quality gates

**Gate 4: Cross-Platform Compatibility** ✅
- Works on both desktop and mobile Obsidian clients
- Supports both mouse/keyboard and touch interfaces
- Uses Obsidian's cross-platform file system abstraction
- **Monorepo Impact**: No impact - compatibility maintained through consistent package structure

**Gate 5: Performance & Responsiveness** ✅
- UI remains responsive during AI operations
- Uses streaming responses for long operations
- No blocking operations in the main thread
- **Monorepo Impact**: 60-85% build performance improvements with turbo caching and parallel builds

**Gate 6: MCP Integration Capability** ✅
- MCP server integrations follow same abstraction patterns as AI providers
- Clean separation between core plugin logic and MCP server implementations
- MCP functionality is independently testable
- **Monorepo Impact**: Enhanced MCP integration through dedicated MCP package with clear interfaces

**Gate 7: Security & Privacy** ✅
- API keys stored in Obsidian's encrypted settings
- No sensitive data exposed in logs or error messages
- Content only transmitted to configured AI provider or MCP server
- MCP server connections have appropriate security controls and user consent
- **Monorepo Impact**: Security enhanced through package boundaries and controlled dependencies

### Constitution Compliance Summary

**Status**: ✅ ALL GATES PASSED

**Constitutional Enhancements Through Monorepo**:
- **Enhanced Test-First Development**: Vitest integration with comprehensive coverage
- **Improved Performance**: Turbo orchestration with intelligent caching
- **Better Separation of Concerns**: Clear package boundaries and interfaces
- **Enhanced Quality Standards**: Biome, Knip, and comprehensive quality gates
- **Improved Developer Experience**: Modern tooling with fast iteration cycles

**No Constitutional Violations**: All gates passed with monorepo structure providing enhanced compliance with existing principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-migrate-to-monorepo-structure/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Monorepo Root Structure
.
├── pnpm-workspace.yaml        # Workspace configuration
├── turbo.json                 # Build orchestration configuration
├── package.json               # Root package with dev dependencies (includes tsx)
├── tsconfig.json              # Root TypeScript configuration (supports TSX)
├── biome.json                 # Biome configuration (formatting + linting)
├── knip.json                  # Knip dependency analysis configuration
├── apps/                      # Application packages
│   └── obsidian-plugin/       # Main Obsidian plugin (BUNDLED IIFE)
│       ├── src/               # Plugin source code
│       │   ├── main.ts        # Plugin entry point
│       │   ├── settings.ts    # Settings management
│       │   ├── editor.ts      # Core text processing
│       │   └── suggest.ts     # Tag-based autocomplete
│       ├── styles.css         # Plugin-specific styles
│       ├── manifest.json      # Obsidian plugin manifest
│       ├── package.json       # Plugin dependencies + tsup for IIFE bundle
│       ├── tsup.config.ts     # Plugin bundling config (IIFE output)
│       └── tsconfig.json      # Plugin TypeScript config
├── packages/                  # Shared packages (ESM MODULES)
│   ├── types/                 # TypeScript definitions
│   │   ├── src/               # Type definitions
│   │   ├── package.json       # Types package (ESM)
│   │   └── tsconfig.json      # Types TypeScript config
│   ├── core/                  # Core plugin logic
│   │   ├── src/               # Core implementation
│   │   │   ├── plugin.ts      # Plugin core logic
│   │   │   ├── commands/      # Command system
│   │   │   ├── cache/         # File cache management
│   │   │   └── cli/           # CLI utilities for TSX execution
│   │   ├── bin/               # Executable scripts for TSX
│   │   │   └── tars-cli.ts    # TARS CLI (executable via tsx)
│   │   ├── package.json       # Core package (ESM + tsx)
│   │   └── tsconfig.json      # Core TypeScript config
│   ├── providers/             # AI provider implementations
│   │   ├── src/               # Provider implementations
│   │   │   ├── base.ts        # Base vendor interface
│   │   │   ├── openai/        # OpenAI provider
│   │   │   ├── claude/        # Claude provider
│   │   │   ├── demo/          # Demo scripts (TSX executable)
│   │   │   └── [others]/      # Other AI providers
│   │   ├── bin/               # Demo executables
│   │   │   └── provider-demo.ts # Provider demo (tsx)
│   │   ├── package.json       # Provider dependencies (ESM + tsx)
│   │   └── tsconfig.json      # Provider TypeScript config
│   ├── mcp/                   # MCP server integration
│   │   ├── src/               # MCP implementations
│   │   │   ├── base.ts        # MCP server interface
│   │   │   ├── client.ts      # MCP client logic
│   │   │   ├── servers/       # Server implementations
│   │   │   └── cli/           # MCP CLI utilities
│   │   ├── bin/               # MCP executables
│   │   │   └── mcp-cli.ts     # MCP CLI (tsx)
│   │   ├── package.json       # MCP dependencies (ESM + tsx)
│   │   └── tsconfig.json      # MCP TypeScript config
│   ├── shared/                # Shared utilities and types
│   │   ├── src/               # Shared code
│   │   │   ├── types/         # TypeScript types
│   │   │   ├── utils/         # Utility functions
│   │   │   ├── constants/     # Shared constants
│   │   │   └── cli/           # CLI utilities
│   │   ├── bin/               # Shared executables
│   │   │   └── utils-cli.ts   # Utilities CLI (tsx)
│   │   ├── package.json       # Shared dependencies (ESM + tsx)
│   │   └── tsconfig.json      # Shared TypeScript config
│   └── testing/               # Testing utilities
│       ├── src/               # Test helpers
│       │   ├── mocks/         # Mock implementations
│       │   ├── fixtures/      # Test fixtures
│       │   ├── helpers/       # Test helper functions
│       │   └── cli/           # Testing CLI utilities
│       ├── bin/               # Testing executables
│       │   └── test-runner.ts # Custom test runner (tsx)
│       ├── package.json       # Testing dependencies (ESM + tsx)
│       └── tsconfig.json      # Testing TypeScript config
├── tools/                     # Development tools
│   ├── build-scripts/         # Build automation
│   │   ├── scripts/           # Build scripts (tsx executable)
│   │   └── package.json       # Build tools (ESM + tsx)
│   └── dev-tools/             # Development utilities
│       ├── scripts/           # Dev scripts (tsx executable)
│       └── package.json       # Dev tools (ESM + tsx)
└── docs/                      # Documentation
    ├── development/           # Development guides
    ├── architecture/          # Architecture documentation
    └── migration/             # Migration guides

# Build Output
apps/obsidian-plugin/main.js  # Final IIFE bundle (plugin only)
apps/obsidian-plugin/styles.css # Plugin styles
dist/                         # ESM outputs for packages (development/testing)

# TSX Executable Examples
tsx packages/core/src/cli/tars-cli.ts --help
tsx packages/providers/src/demo/provider-demo.ts --provider openai
tsx packages/mcp/src/cli/mcp-cli.ts --list-servers
tsx packages/shared/src/cli/utils-cli.ts --validate-config
```

**Structure Decision**: Monorepo with pnpm workspaces, turbo orchestration, TSX support, and strategic bundling (IIFE for plugin, ESM for packages)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | No constitutional violations | All requirements align with constitutional principles |