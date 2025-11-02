<!--
Sync Impact Report:
Version change: 1.3.0 → 1.4.0 (minor version increase - added comprehensive TypeScript, Needle DI, and React architecture principles)
Modified principles:
- Development Standards & Tooling (enhanced with specific TypeScript and React patterns)
- Testing Standards (aligned with TypeScript excellence guidelines)
Added sections:
- VIII. TypeScript Code Excellence (domain-scoped architecture, error handling, async patterns)
- IX. Needle DI Architecture Standards (dependency injection patterns, container management)
- X. React Component Architecture (atomic hierarchy, performance, i18n, security)
- Enhanced Development Standards with specific patterns from rules documents
Removed sections:
- N/A
Templates requiring updates:
✅ .specify/templates/spec-template.md (updated with TypeScript excellence references)
✅ .specify/templates/plan-template.md (updated with Needle DI and React architecture gates)
✅ .specify/templates/tasks-template.md (updated with TypeScript and React task patterns)
⚠️ docs/rules-typescript-code.md (referenced in constitution - keep as detailed reference)
⚠️ docs/rules-needle_di-monorepo.md (referenced in constitution - keep as detailed reference)
⚠️ docs/rules-react-components.md (referenced in constitution - keep as detailed reference)
Follow-up TODOs: N/A
-->

# Tars Constitution

## Core Principles

### I. Plugin Architecture Excellence
Tars is an Obsidian plugin first - all features MUST integrate cleanly with Obsidian's APIs and respect Obsidian's file system, caching, and editor patterns. Plugin code MUST be self-contained, independently testable, and maintain clear separation between AI provider logic, MCP server integration, and Obsidian-specific functionality. Package architecture MUST follow monorepo principles with clear dependency management.

**Rationale**: Ensures compatibility with Obsidian updates and maintainable architecture that doesn't fight the platform's design patterns while enabling extensibility through MCP integration and scalable monorepo structure.

### II. Provider Abstraction (NON-NEGOTIABLE)
All AI providers MUST implement the same `Vendor` interface. Provider implementations MUST be isolated from core plugin logic and support streaming responses with proper AbortController handling. No provider-specific logic may leak into core editor or command processing.

**Rationale**: Enables rapid addition of new AI providers without architectural changes and ensures consistent user experience across all providers.

### III. Test-First Development (TDD APPROACH)
Red-Green-Refactor cycle strictly enforced. Tests MUST be written before implementation, MUST fail initially, and only pass after correct implementation. All provider implementations MUST include contract tests validating interface compliance. TDD is the mandatory development approach for all features. Code and branch coverage MUST exceed 85%. All unit tests MUST include Given/When/Then comments in the format `// {GIVEN|WHEN|THEN}: {description}` to describe business value in human-readable terms.

**Rationale**: Prevents regression across multiple AI providers and ensures robust handling of API changes, error conditions, and streaming responses while maintaining high code quality standards. Given/When/Then comments create executable documentation that bridges technical tests with business requirements.

### IV. Cross-Platform Compatibility
Tars MUST work consistently on desktop and mobile Obsidian clients. All UI interactions MUST support both mouse/keyboard and touch interfaces. File handling MUST respect Obsidian's cross-platform file system abstraction.

**Rationale**: Users expect seamless experience across all Obsidian-supported platforms; mobile usage is significant for note-taking workflows.

### V. Performance & Responsiveness
UI MUST remain responsive during AI text generation. Long operations MUST use streaming responses and proper async handling. File embedding and attachment processing MUST be efficient and never block the main thread. Build performance MUST meet established targets with intelligent caching and parallel execution.

**Rationale**: Poor performance breaks note-taking flow and frustrates users, especially during longer AI generations and development cycles.

### VI. MCP Integration Capability
Tars MUST support integration with multiple MCP servers that provide additional tools, resources, and prompts for plugin reuse. MCP integrations MUST follow the same abstraction patterns as AI providers, ensuring clean separation between core plugin logic and MCP server implementations. All MCP functionality MUST be independently testable.

**Rationale**: Enables extensibility through the broader MCP ecosystem while maintaining architectural consistency and preventing vendor lock-in.

### VII. Development Standards & Tooling
All development MUST use the modern tooling stack: PNPM for package management, TURBO for build orchestration, BIOME for linting and formatting, KNIP for dependency analysis, TSX for TypeScript execution, and TSUP/ESBUILD for bundling. Monorepo structure with pnpm workspaces is MANDATORY for multi-package projects. Outdated tools (NPM, ESLint, PRETTIER) MUST NOT be used.

**Rationale**: Modern tooling provides superior performance, better developer experience, and essential features for monorepo management that outdated tools cannot match.

### VIII. TypeScript Code Excellence
All TypeScript code MUST follow domain-scoped file structure where files export composable component suites without redundant domain prefixes. Code MUST use generic type names within domains (Result, Config, Options), preserve error causes with proper chaining, and favor composition over inheritance with EventEmitter patterns for reactive systems. Async operations MUST use `async function*` generators for streaming, implement cancellation via `AbortSignal`, and isolate side effects to application edges.

**Rationale**: Domain-aware TypeScript creates elegant, composable systems that are maintainable, testable, and follow modern async patterns essential for streaming AI responses.

### IX. Needle DI Architecture Standards
All dependency injection MUST use Needle DI v1.1.0+ with stage-3 decorators (no experimentalDecorators). Components MUST use `@injectable()` decorators with constructor injection via `inject()`. Containers MUST support child containers for test isolation, configuration tokens for type-safe settings binding, and factory patterns for complex initialization. All DI setup MUST target ES2022+ for proper decorator emission.

**Rationale**: Needle DI provides reflection-free dependency injection that works seamlessly with modern TypeScript build tools and enables clean test architecture through child container isolation.

### X. React Component Architecture
All React components MUST follow atomic hierarchy (Atoms → Components → Views) with minimal state in Atoms only. Components MUST use TypeScript props typing with `type` over `interface`, mark most props required (80%+), and avoid `React.FC` by default. Code MUST implement React 18+ patterns (automatic batching, Suspense boundaries, proper hooks discipline), use composition over prop drilling, and follow performance rules (stable keys, memoization only with stable props, proper dependency arrays).

**Rationale**: Atomic React architecture creates maintainable UI systems that are performant, testable, and scale with team size while following modern React best practices.

## Development Standards & Tooling

### Mandatory Tooling Requirements

All projects MUST use these tools without exception:
- **PNPM**: Package management and workspace management (replaces NPM)
- **TURBO**: Build orchestration and caching (required for monorepo)
- **BIOME**: Code linting, formatting, and import organization (replaces ESLint + Prettier)
- **KNIP**: Dependency analysis and unused code detection
- **TSX**: TypeScript execution for CLI tools and scripts
- **TSUP**: TypeScript bundling with esbuild under the hood
- **ESBUILD**: Ultra-fast bundling for production builds
- **NEEDLE DI**: @needle-di/core v1.1.0+ for dependency injection

### Monorepo Architecture Requirements

- All multi-package projects MUST use pnpm workspaces
- Package boundaries MUST be clearly defined with acyclic dependencies
- Internal packages MUST use workspace protocol (e.g., @tars/core@workspace:*)
- Build orchestration MUST use turbo with intelligent caching
- ESM modules for internal packages, IIFE bundles for distribution
- TypeScript MUST target ES2022+ for decorator and modern feature support

### TypeScript Excellence Standards

- **Domain-Scoped Files**: File path defines domain, avoid redundant prefixes in type names
- **Generic Type Names**: Use Result, Config, Options, Event within domain files
- **Error Cause Chains**: Always preserve original error with `cause` property using `Object.assign`
- **Async Generators**: Use `async function*` for streaming with `yield` for intermediate values
- **Composition Over Inheritance**: Small focused classes with EventEmitter for reactive systems
- **Cancellation Support**: Make `AbortSignal` first-class in all async operations
- **Side Effect Isolation**: Keep core logic pure, handle I/O at application edges
- **Static Factories**: Provide clean declarative APIs over constructor complexity

### Needle DI Implementation Standards

- **Stage-3 Decorators**: Use native decorators, never `experimentalDecorators` or `emitDecoratorMetadata`
- **Constructor Injection**: Use `@injectable()` and `inject()` for all dependencies
- **Configuration Tokens**: Use `InjectionToken<T>` for type-safe settings binding
- **Child Containers**: Create child containers for test isolation with mocked dependencies
- **Factory Patterns**: Use `useFactory` for complex component initialization
- **Provider Types**: Support useClass, useValue, useFactory, useExisting providers
- **Lifecycle Management**: Support singleton and transient scopes appropriately
- **Container Validation**: Validate all bindings can be resolved at startup

### React Component Standards

- **Atomic Hierarchy**: Atoms (minimal state) → Components → Views (orchestration)
- **Props Typing**: Use `type ComponentNameProps`, mark 80%+ required, avoid `React.FC`
- **Event Handling**: Use `event.currentTarget`, specific React event types
- **Performance**: Stable keys, memoization only with stable props, proper dependency arrays
- **Hooks Discipline**: Call unconditionally at top, complete deps, cleanup effects
- **Composition**: Move state down, pass children as props, avoid prop drilling
- **Conditional Rendering**: Early returns, avoid nested ternaries, extract subcomponents
- **i18n Ready**: Wrap all user-facing text in `t('...')` function immediately

### Obsidian Integration Standards

Tars MUST integrate with Obsidian's core features:
- File cache and embed resolution for proper multimodal content handling
- Editor suggestions API for tag-based autocomplete
- Command palette integration for tag commands
- Status bar updates for real-time generation feedback
- Settings management with proper validation
- Mobile-responsive UI patterns

### Testing Standards

TDD is the MANDATORY development approach:
- Unit tests for all core logic components with 85%+ code and branch coverage
- Integration tests for provider and MCP server interactions
- Contract tests ensuring interface compliance
- Mock implementations for external dependencies
- Performance tests for streaming and file handling scenarios
- Vitest as the testing framework with comprehensive coverage
- All unit tests MUST include Given/When/Then comments in format `// {GIVEN|WHEN|THEN}: {description}`
- Test comments MUST focus on business value, not implementation details
- Test comments extracted from code MUST form readable cucumber-like scenarios
- DI container tests MUST validate child container isolation and mocking
- React component tests MUST use Testing Library with semantic queries

## Security & Privacy

### API Key Management
All API keys MUST be stored in Obsidian's encrypted settings and never exposed in logs, debug output, or error messages. Memory cleanup MUST be implemented for sensitive data.

### Content Privacy
User content and AI conversations MUST NOT be transmitted to any services other than the explicitly configured AI provider or MCP server. Local processing of embeddings and attachments MUST respect user privacy expectations.

### MCP Server Security
MCP server connections MUST be configurable with appropriate security controls. All MCP server communications MUST respect user consent and privacy preferences.

### React Security
- Sanitize `dangerouslySetInnerHTML` with DOMPurify
- Validate URL protocols to block `javascript:`
- Never expose secrets in client bundles
- Use httpOnly cookies for authentication tokens

## Governance

This constitution supersedes all other development practices and guides all architectural decisions. Amendments require:
1. Proposal documentation with impact analysis
2. Team approval through pull request review
3. Version update in this constitution following semantic versioning
4. Migration plan for existing code if needed

All pull requests and code reviews MUST verify compliance with these constitutional principles. Complexity beyond these standards MUST be explicitly justified in PR descriptions.

**Version**: 1.4.0 | **Ratified**: 2025-01-24 | **Last Amended**: 2025-11-02