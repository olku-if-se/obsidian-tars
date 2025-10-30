# Implementation Plan: Needle DI Migration

**Branch**: `003-needle-di-migration` | **Date**: 2025-10-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-needle-di-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the Tars Obsidian plugin from direct instantiation to Needle DI using a centralized container with facade pattern. This migration enables isolated unit testing, reduces coupling between components, simplifies configuration management, and improves extensibility for AI providers.

**Key Refactoring Goals**:
1. **All Application references via DI**: Replace `this.app` passing with `inject(OBSIDIAN_APP)` token
2. **All Settings references via DI**: Replace `this.settings` passing with `inject(APP_SETTINGS)` token
3. **Provider Object→Class Conversion**: Convert 15 provider plain objects to injectable classes (~2000 LOC)
4. **Fail-Fast Error Handling**: Validate settings before DI resolution, clear error messages to users

The migration follows a 5-phase approach: foundation setup, provider class conversion, core services migration, Application/Settings token injection, and comprehensive testing. All existing plugin APIs will be maintained through compatibility facades to ensure zero breaking changes for users.

## Technical Context

**Language/Version**: TypeScript 5.7+ with strict mode enabled, stage-3 decorators (no experimentalDecorators)
**Primary Dependencies**:
- Needle DI (@needle-di/core v1.1.0+)
- PNPM 9.x (package management), TURBO 2.x (build orchestration)
- BIOME 1.x (linting/formatting), KNIP 5.x (dependency analysis)
- TSX (TypeScript execution), TSUP 8.x (bundling), ESBUILD (production builds)
- Obsidian API (plugin platform), AI provider SDKs (OpenAI, Anthropic, etc.)
- Vitest 2.x (testing framework)

**Storage**: Obsidian's encrypted settings for configuration, file system for notes, monorepo package management with workspace protocol
**Testing**: Vitest 2.x for unit tests with 85%+ coverage requirement, TDD approach with Red-Green-Refactor, Given/When/Then comments mandatory
**Target Platform**: Obsidian plugin (desktop + mobile) with IIFE bundle format, ES2022 target for decorators
**Project Type**: Monorepo with apps/obsidian-plugin as main package, shared dependencies via workspace protocol
**Performance Goals**: Plugin initialization overhead ≤50ms, configuration updates ≤100ms, memory overhead ≤10%, test suite ≤30s
**Constraints**:
- Must work within Obsidian's security sandbox and API limitations
- Zero breaking changes requirement (use facade pattern)
- Bundle size increase limited to ~2KB (Needle DI size)
- No reflection-based DI (Needle uses stage-3 decorators)
- Gradual migration path (DI and direct instantiation can coexist)
- **Provider refactoring**: 15 providers must be converted from plain objects to classes (~2000 LOC)
- **App/Settings decoupling**: All `this.app` and `this.settings` parameter passing must be replaced with DI tokens

**Scale/Scope**: Support 10+ AI providers (OpenAI, Claude, DeepSeek, Gemini, etc.), configuration tokens for settings, model registry, command registry, provider capabilities, multiple MCP servers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

All features MUST pass these constitutional gates:

**Gate 1: Plugin Architecture Excellence**
- ✅ **Pass**: DI integration uses Obsidian's plugin lifecycle (onload/onunload) correctly
- ✅ **Pass**: Clear separation maintained - DI container lives in `src/di/`, providers in `src/providers/`
- ✅ **Pass**: DI components are independently testable through child containers and mocking
- **Justification**: DI enhances architecture by decoupling dependencies without changing Obsidian integration patterns

**Gate 2: Provider Abstraction**
- ✅ **Pass**: Existing `Vendor` interface unchanged; providers add `@injectable()` decorator only
- ✅ **Pass**: No provider logic leaks - DI container resolves providers, core plugin remains agnostic
- ✅ **Pass**: Streaming with AbortController unchanged - providers inject settings, not controllers
- **Justification**: DI is additive - providers gain injectability while maintaining existing contracts

**Gate 3: Test-First Development (TDD)**
- ✅ **Pass**: TDD approach mandatory - each migration task follows Red-Green-Refactor
- ✅ **Pass**: Tests written before implementation, verified to fail, then pass after code
- ✅ **Pass**: Contract tests included for injectable providers verify interface compliance
- ✅ **Pass**: Target 85%+ coverage explicitly required in migration validation tasks
- ✅ **Pass**: Given/When/Then comments required in all unit tests
- **Justification**: DI migration enables better TDD through mockable dependencies

**Gate 4: Cross-Platform Compatibility**
- ✅ **Pass**: DI container works identically on desktop and mobile (no platform-specific code)
- ✅ **Pass**: No UI changes - DI is internal architecture, existing UI patterns unchanged
- ✅ **Pass**: File system abstraction unchanged - DI doesn't affect Obsidian's file handling
- **Justification**: DI is internal to plugin initialization, no cross-platform concerns introduced

**Gate 5: Performance & Responsiveness**
- ✅ **Pass**: UI remains responsive - DI container initializes during onload (async)
- ✅ **Pass**: Lazy instantiation support - providers registered but not created until needed
- ✅ **Pass**: No main thread blocking - DI resolution is synchronous but lightweight (<1ms)
- ✅ **Pass**: Performance validation task explicitly checks ≤50ms initialization overhead
- **Justification**: Needle DI is lightweight (~2KB), lazy loading prevents unnecessary instantiation

**Gate 6: MCP Integration Capability**
- ✅ **Pass**: MCP servers will follow same DI pattern as AI providers (future work)
- ✅ **Pass**: Clean separation ensured - DI tokens and registration follow provider model
- ✅ **Pass**: MCP integration will be independently testable through DI container
- **Justification**: DI migration establishes pattern for future MCP server integration

**Gate 7: Development Standards & Tooling**
- ✅ **Pass**: PNPM workspace protocol already in use, DI added as workspace dependency
- ✅ **Pass**: TURBO orchestration unchanged, DI doesn't affect build pipeline
- ✅ **Pass**: BIOME linting/formatting applies to DI code, no ESLint/Prettier used
- ✅ **Pass**: KNIP will validate DI dependencies are used, no dead code
- ✅ **Pass**: TSX works with decorators (ES2022 target), TSUP bundles with esbuild
- ✅ **Pass**: Monorepo structure unchanged, DI is internal to apps/obsidian-plugin
- **Justification**: DI integrates seamlessly with existing modern tooling stack

**Gate 8: Security & Privacy**
- ✅ **Pass**: API keys remain in Obsidian's encrypted settings, DI injects settings reference
- ✅ **Pass**: No sensitive data exposed - DI error messages don't leak keys or tokens
- ✅ **Pass**: Content transmission unchanged - DI doesn't affect data flow to providers
- ✅ **Pass**: MCP security controls unchanged - DI pattern ready for MCP integration
- **Justification**: DI abstracts configuration access without changing storage or transmission

**Result**: ✅ ALL GATES PASS - No constitutional violations requiring justification

## Project Structure

### Documentation (this feature)

```text
specs/003-needle-di-migration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - DI architecture decisions
├── data-model.md        # Phase 1 output - DI entities and relationships
├── quickstart.md        # Phase 1 output - Developer quick start guide
├── contracts/           # Phase 1 output - TypeScript interfaces/tokens
│   ├── container.ts     # Container API contract
│   ├── tokens.ts        # Configuration token definitions
│   └── providers.ts     # Injectable provider interfaces
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/obsidian-plugin/
├── src/
│   ├── main.ts                    # Plugin entry point (integrates DI container)
│   ├── settings.ts                # Settings management (existing)
│   ├── editor.ts                  # Core text processing (existing)
│   ├── suggest.ts                 # Tag autocomplete (existing)
│   ├── di/                        # NEW: Dependency injection system
│   │   ├── container.ts           # Main DI container implementation
│   │   ├── tokens.ts              # Configuration injection tokens
│   │   ├── provider-factory.ts   # Provider creation factory
│   │   └── __tests__/             # DI system unit tests
│   ├── facades/                   # NEW: Backward compatibility facades
│   │   ├── settings.facade.ts    # Settings delegation facade
│   │   └── __tests__/             # Facade unit tests
│   ├── providers/                 # AI provider implementations (migrate to DI)
│   │   ├── index.ts               # Base vendor interface (add injectable support)
│   │   ├── decorator.ts           # Provider decorator (updated for DI)
│   │   ├── openai.ts              # OpenAI provider (add @injectable)
│   │   ├── claude.ts              # Claude provider (add @injectable)
│   │   ├── deepseek.ts            # DeepSeek provider (add @injectable)
│   │   ├── gemini.ts              # Gemini provider (add @injectable)
│   │   └── __tests__/             # Provider injectable tests
│   ├── commands/                  # Tag-based command system (existing)
│   ├── prompt/                    # Prompt template management (existing)
│   ├── lang/                      # Internationalization support (existing)
│   └── mcp/                       # MCP server integrations (future)
├── tests/
│   ├── unit/                     # Unit tests for DI components
│   ├── integration/              # Integration tests for DI system
│   └── e2e/                      # End-to-end plugin functionality tests
├── package.json                  # Add @needle-di/core dependency
├── tsconfig.json                 # Update for stage-3 decorators (ES2022)
└── esbuild.config.mjs            # Ensure ES2022 target for decorators

# Build Output
dist/
├── main.js                       # Compiled plugin bundle (IIFE format)
└── main.js.map                   # Source maps

# Root monorepo (context)
pnpm-workspace.yaml               # Workspace configuration
turbo.json                        # Build orchestration
biome.json                        # Linting/formatting config
```

**Structure Decision**: Add DI system as new `src/di/` and `src/facades/` directories within existing Obsidian plugin structure. Migrate providers in-place by adding decorators. Use facade pattern in `src/facades/` to maintain backward compatibility with existing code that directly accesses plugin.settings and other services.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A       | N/A        | N/A                                 |

**Result**: No constitutional violations detected. All complexity is justified by requirements and follows established architectural patterns.

