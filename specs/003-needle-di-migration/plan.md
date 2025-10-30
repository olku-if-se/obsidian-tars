# Implementation Plan: Needle DI Migration

**Branch**: `003-needle-di-migration` | **Date**: 2025-10-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-needle-di-migration/spec.md`

## Summary

Migrate the Tars Obsidian plugin from direct instantiation to Needle DI (Dependency Injection) using a centralized container with facade pattern to achieve zero breaking changes while enabling improved testability, extensibility, and maintainability. The migration follows a big bang approach converting all AI providers simultaneously to use constructor injection with singleton/transient lifecycle management.

## Technical Context

**Language/Version**: TypeScript 5.7+ with strict mode enabled, stage-3 decorators (no experimentalDecorators)
**Primary Dependencies**: PNPM 9.x, TURBO 2.x, BIOME 1.x, KNIP 5.x, TSX latest, TSUP 8.x, ESBUILD latest, Obsidian API, @needle-di/core v1.1.0+, various AI provider SDKs
**Storage**: Obsidian's encrypted settings for configuration, file system for notes, monorepo package management with workspace protocol
**Testing**: Vitest 2.x for unit tests with DI container support, custom test framework for Obsidian integration, turbo test orchestration
**Target Platform**: Obsidian plugin (desktop + mobile) with monorepo build system
**Project Type**: Monorepo with multiple TypeScript packages and shared dependencies
**Performance Goals**: Plugin initialization time increase ≤50ms, configuration propagation <10ms, 85%+ test coverage with isolated unit tests
**Constraints**: Must work within Obsidian's security sandbox and API limitations, maintain monorepo package boundaries, zero breaking changes for existing APIs
**Scale/Scope**: Single plugin supporting 10+ AI providers through DI container with lazy instantiation and lifecycle management

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All features MUST pass these constitutional gates:

**Gate 1: Plugin Architecture Excellence**
- Feature integrates cleanly with Obsidian APIs (file cache, editor, suggestions)
- Clear separation between provider logic and Obsidian-specific code
- Self-contained and independently testable implementation

**Gate 2: Provider Abstraction**
- Uses existing `Vendor` interface without modifications (unless explicitly justified)
- No provider-specific logic leaks into core plugin code
- Supports streaming responses with proper AbortController handling

**Gate 3: Test-First Development (TDD)**
- Red-Green-Refactor cycle strictly enforced
- Tests MUST be written before implementation, MUST fail initially
- All provider implementations MUST include contract tests
- Code and branch coverage MUST exceed 85%
- All unit tests MUST include Given/When/Then comments in format `// {GIVEN|WHEN|THEN}: {description}`
- Test comments MUST focus on business value, not implementation details

**Gate 4: Cross-Platform Compatibility**
- Works on both desktop and mobile Obsidian clients
- Supports both mouse/keyboard and touch interfaces
- Uses Obsidian's cross-platform file system abstraction

**Gate 5: Performance & Responsiveness**
- UI remains responsive during AI operations
- Uses streaming responses for long operations
- No blocking operations in the main thread

**Gate 6: MCP Integration Capability**
- MCP server integrations follow same abstraction patterns as AI providers
- Clean separation between core plugin logic and MCP server implementations
- MCP functionality is independently testable

**Gate 7: Development Standards & Tooling**
- Uses PNPM for package management and workspaces
- Uses TURBO for build orchestration and caching
- Uses BIOME for linting and formatting (replaces ESLint/Prettier)
- Uses KNIP for dependency analysis
- Uses TSX for TypeScript execution
- Uses TSUP/ESBUILD for bundling
- Follows monorepo architecture requirements

**Gate 8: Security & Privacy**
- API keys stored in Obsidian's encrypted settings
- No sensitive data exposed in logs or error messages
- Content only transmitted to configured AI provider or MCP server
- MCP server connections have appropriate security controls and user consent

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Tars Obsidian Plugin with Needle DI Migration
apps/obsidian-plugin/src/
├── main.ts                    # Plugin entry point
├── settings.ts                # Settings management
├── editor.ts                  # Core text processing and AI request handling
├── suggest.ts                 # Tag-based autocomplete system
├── di/                        # NEW: Dependency Injection System
│   ├── container.ts           # Central DI container setup
│   ├── tokens.ts              # Configuration token definitions
│   ├── facades.ts             # Backward compatibility facades
│   └── providers.ts           # Provider registration
├── providers/                 # AI provider implementations (MODIFIED)
│   ├── base.ts               # Base vendor interface (with DI decorators)
│   ├── openai.ts             # OpenAI provider (with DI decorators)
│   ├── claude.ts             # Claude provider (with DI decorators)
│   ├── deepseek.ts           # DeepSeek provider (with DI decorators)
│   ├── gemini.ts             # Gemini provider (with DI decorators)
│   └── [other-providers].ts  # Other AI providers (with DI decorators)
├── commands/                  # Tag-based command system
├── prompt/                    # Prompt template management
├── lang/                      # Internationalization support
└── mcp/                       # MCP server integrations
    ├── base.ts               # MCP server interface (with DI decorators)
    └── [server-implementations].ts

tests/
├── unit/                     # Unit tests for core logic
│   ├── di/                   # DI system tests
│   ├── providers/            # Provider tests with mocking
│   └── [other-components]/   # Component tests
├── integration/              # Integration tests for providers/MCP
└── contract/                 # Contract tests for interface compliance

# Build Output
main.js                      # Compiled plugin bundle
styles.css                   # Plugin-specific styles
```

**Structure Decision**: Enhanced Obsidian plugin architecture with Needle DI integration layer and backward compatibility facades

## Complexity Tracking

> **No Constitution Check violations - all gates passed**
