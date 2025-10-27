<!--
Sync Impact Report:
Version change: 1.2.0 → 1.3.0 (minor version increase - enhanced TDD requirements with Given/When/Then standards)
Modified principles:
- Test-First Development (enhanced with 85%+ coverage and Given/When/Then comment requirements)
- Testing Standards (expanded with business-value focused test comments and cucumber-like scenario extraction)
Added sections:
- Enhanced testing comment format requirements (within existing Testing Standards section)
Removed sections:
- N/A
Templates requiring updates:
✅ .specify/templates/spec-template.md (updated with enhanced TDD standards)
✅ .specify/templates/plan-template.md (updated with enhanced TDD gate and testing standards)
✅ .specify/templates/tasks-template.md (updated with TDD coverage and comment requirements)
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

### VII. Development Standards & Tooling (NEW)
All development MUST use the modern tooling stack: PNPM for package management, TURBO for build orchestration, BIOME for linting and formatting, KNIP for dependency analysis, TSX for TypeScript execution, and TSUP/ESBUILD for bundling. Monorepo structure with pnpm workspaces is MANDATORY for multi-package projects. Outdated tools (NPM, ESLint, PRETTIER) MUST NOT be used.

**Rationale**: Modern tooling provides superior performance, better developer experience, and essential features for monorepo management that outdated tools cannot match.

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

### Monorepo Architecture Requirements

- All multi-package projects MUST use pnpm workspaces
- Package boundaries MUST be clearly defined with acyclic dependencies
- Internal packages MUST use workspace protocol (e.g., @tars/core@workspace:*)
- Build orchestration MUST use turbo with intelligent caching
- ESM modules for internal packages, IIFE bundles for distribution

### TypeScript & Code Quality Standards

- TypeScript strict mode with comprehensive type coverage (no `any` types without explicit justification)
- Modern ES2022+ features when appropriate (async/await, optional chaining, nullish coalescing)
- Biome configuration for consistent code formatting and linting
- Clear separation between UI logic, business logic, provider implementations, and MCP integrations
- Comprehensive error handling with user-friendly messages
- No blocking operations in the main thread
- Proper memory management and cleanup for sensitive data

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

## Security & Privacy

### API Key Management
All API keys MUST be stored in Obsidian's encrypted settings and never exposed in logs, debug output, or error messages. Memory cleanup MUST be implemented for sensitive data.

### Content Privacy
User content and AI conversations MUST NOT be transmitted to any services other than the explicitly configured AI provider or MCP server. Local processing of embeddings and attachments MUST respect user privacy expectations.

### MCP Server Security
MCP server connections MUST be configurable with appropriate security controls. All MCP server communications MUST respect user consent and privacy preferences.

## Governance

This constitution supersedes all other development practices and guides all architectural decisions. Amendments require:
1. Proposal documentation with impact analysis
2. Team approval through pull request review
3. Version update in this constitution following semantic versioning
4. Migration plan for existing code if needed

All pull requests and code reviews MUST verify compliance with these constitutional principles. Complexity beyond these standards MUST be explicitly justified in PR descriptions.

**Version**: 1.3.0 | **Ratified**: 2025-01-24 | **Last Amended**: 2025-01-24