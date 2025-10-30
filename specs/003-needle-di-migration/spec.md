# Feature Specification: Needle DI Migration

**Feature Branch**: `003-needle-di-migration`
**Created**: 2025-10-30
**Status**: Draft
**Input**: User description: "Migrate Tars Obsidian plugin from direct instantiation to Needle DI using centralized container with facade pattern for zero breaking changes"
**Tooling**: PNPM, TURBO, BIOME, KNIP, TSX, TSUP, ESBUILD (as per constitution)
**Testing**: TDD with 85%+ coverage, Given/When/Then comments in unit tests, business-value focused test descriptions

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Test AI Provider in Isolation (Priority: P1)

As a developer writing unit tests for an AI provider, I need to mock the plugin settings without instantiating the entire plugin, so that I can test provider logic independently and verify correct behavior with different configurations.

**Why this priority**: Core capability enabling TDD workflow and independent component testing. Without this, developers cannot write reliable unit tests.

**Independent Test**: Can be fully tested by creating a test container with mock settings, instantiating a single provider, and verifying it receives the mocked configuration. Delivers immediate value by enabling isolated unit testing.

**Acceptance Scenarios**:

1. **Given** a test environment with mock settings, **When** a developer creates a test container and requests an AI provider, **Then** the provider receives the mock settings without requiring the full plugin to be loaded
2. **Given** an existing provider unit test, **When** the developer updates test settings, **Then** the provider behavior changes accordingly without modifying the provider code
3. **Given** multiple test scenarios with different configurations, **When** running tests in parallel, **Then** each test has isolated settings that don't interfere with other tests

---

### User Story 2 - Add New AI Provider Without Modifying Core Plugin (Priority: P1)

As a developer extending the plugin with a new AI service, I need to register a new provider without changing plugin initialization code, so that I can add features without risking regressions in existing functionality.

**Why this priority**: Enables extensibility and reduces coupling between plugin core and provider implementations. Critical for maintainability and feature development.

**Independent Test**: Can be tested by creating a new provider class, registering it with the dependency system, and verifying the plugin recognizes and uses it. Delivers value by allowing safe feature additions.

**Acceptance Scenarios**:

1. **Given** a new AI provider implementation, **When** a developer registers it with the dependency system, **Then** the plugin automatically detects and makes it available to users without core code changes
2. **Given** an updated provider with new capabilities, **When** the developer updates the registration, **Then** the plugin reflects the new capabilities without restart
3. **Given** a faulty provider implementation, **When** the provider fails to initialize, **Then** other providers continue working and users receive clear error messages

---

### User Story 3 - Change Plugin Configuration Without Restart (Priority: P2)

As a plugin user, I need the plugin to recognize updated AI provider settings immediately, so that I can test different configurations without repeatedly reloading Obsidian.

**Why this priority**: Improves developer and user experience during configuration. Less critical than core testability but important for usability.

**Independent Test**: Can be tested by changing a provider's API key in settings, triggering a settings update event, and verifying the provider uses the new key on the next request. Delivers value through improved configuration workflow.

**Acceptance Scenarios**:

1. **Given** an active plugin with configured providers, **When** a user updates provider settings, **Then** the next AI request uses the new configuration without plugin reload
2. **Given** multiple providers configured, **When** a user changes settings for one provider, **Then** only that provider updates while others remain unaffected
3. **Given** invalid configuration values, **When** a user saves settings, **Then** the system validates inputs and provides clear error messages before applying changes

---

### User Story 4 - Maintain Existing Plugin APIs (Priority: P1)

As an existing plugin user or external integrator, I need all current plugin APIs to continue working exactly as before, so that my workflows and integrations remain functional after the migration.

**Why this priority**: Zero breaking changes is a hard requirement. Any API breakage would disrupt existing users and violate the migration goals.

**Independent Test**: Can be tested by running the existing test suite against the migrated codebase and verifying 100% pass rate. Delivers value by ensuring migration safety.

**Acceptance Scenarios**:

1. **Given** existing plugin commands and settings, **When** the migration is complete, **Then** all commands execute with identical behavior to the pre-migration version
2. **Given** user notes with existing conversation tags, **When** the migrated plugin processes them, **Then** conversations parse and execute exactly as before
3. **Given** programmatic access to plugin APIs, **When** external code calls plugin methods, **Then** all method signatures and return values remain unchanged

---

### User Story 5 - Debug Dependency Resolution Issues (Priority: P3)

As a developer troubleshooting dependency injection issues, I need clear error messages indicating which dependencies are missing or misconfigured, so that I can quickly identify and fix configuration problems.

**Why this priority**: Developer experience improvement that helps with maintenance but not critical for initial functionality.

**Independent Test**: Can be tested by intentionally misconfiguring a dependency, attempting to resolve it, and verifying the error message identifies the specific issue. Delivers value through improved developer ergonomics.

**Acceptance Scenarios**:

1. **Given** a missing dependency registration, **When** the system attempts to resolve it, **Then** the error message clearly states which dependency is missing and where it's requested
2. **Given** a circular dependency between two components, **When** the system detects the cycle, **Then** the error message shows the complete dependency chain causing the cycle
3. **Given** a dependency with invalid configuration, **When** initialization fails, **Then** the error message indicates which configuration value is invalid and suggests valid alternatives

---

### Edge Cases

- What happens when a provider's dependencies fail to initialize but other providers are healthy?
- How does the system handle configuration updates while an AI request is in progress?
- What happens when a developer accidentally creates circular dependencies between services?
- How does the system behave when running tests in parallel with different dependency configurations?
- What happens when Obsidian's settings storage is unavailable during plugin load?
- How does the system handle gradual migration where some components use DI and others use direct instantiation?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dependency injection container that manages the lifecycle of all plugin components
- **FR-002**: System MUST allow components to declare their dependencies through constructor injection
- **FR-003**: System MUST support configuration tokens that provide type-safe access to plugin settings
- **FR-004**: System MUST enable replacing real implementations with test mocks without code changes
- **FR-005**: System MUST maintain backward compatibility with all existing plugin APIs and settings
- **FR-006**: System MUST support lazy instantiation of components to minimize plugin load time
- **FR-007**: System MUST allow dynamic registration and unregistration of AI providers at runtime
- **FR-008**: System MUST propagate configuration changes to all dependent components
- **FR-009**: System MUST isolate failures in individual components to prevent cascading failures
- **FR-010**: System MUST provide clear error messages when dependency resolution fails
- **FR-011**: System MUST support scoped instances where each request gets a fresh component instance
- **FR-012**: System MUST support singleton instances that persist for the plugin's lifetime
- **FR-013**: System MUST enable developers to register new providers by adding a single registration call
- **FR-014**: System MUST validate dependency configurations at plugin initialization time
- **FR-015**: System MUST support child containers for test isolation and mocking
- **FR-016**: System MUST preserve all error context when wrapping exceptions from dependencies
- **FR-017**: System MUST allow providers to access shared services through the dependency system
- **FR-018**: System MUST support factory functions for complex component initialization
- **FR-019**: System MUST enable gradual migration where legacy and DI code coexist safely
- **FR-020**: System MUST provide facades that delegate to DI-managed instances for backward compatibility

### Key Entities

- **Dependency Container**: Central registry managing component lifecycles, resolving dependencies, and providing type-safe access to services
- **Configuration Token**: Type-safe identifiers representing injectable configuration values (settings, registries, feature flags)
- **AI Provider**: Component providing AI service integration with specific capabilities (text generation, vision, image generation)
- **Service Facade**: Compatibility layer maintaining existing APIs while delegating to DI-managed implementations
- **Provider Factory**: Component responsible for creating and configuring AI provider instances based on user settings
- **Lifecycle Scope**: Definition of component lifetime (singleton, transient, scoped) determining when instances are created and destroyed

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can create isolated unit tests for any component in under 5 lines of test setup code
- **SC-002**: Adding a new AI provider requires modifying fewer than 10 lines of registration code
- **SC-003**: 100% of existing plugin functionality works identically after migration with zero breaking changes
- **SC-004**: Plugin initialization time increases by no more than 50 milliseconds compared to pre-migration baseline
- **SC-005**: Test coverage for provider logic reaches 85% or higher using isolated unit tests
- **SC-006**: Configuration changes reflect in active components within 100 milliseconds without restart
- **SC-007**: Dependency resolution errors provide actionable error messages identifying the specific missing or misconfigured component
- **SC-008**: Memory usage during plugin operation remains within 10% of pre-migration baseline
- **SC-009**: Developers can mock any dependency in tests without modifying production code
- **SC-010**: All 6 migration phases complete with passing tests and zero regressions

## Assumptions

- The plugin already has a working test suite that will validate backward compatibility
- Obsidian's plugin API provides sufficient hooks for dependency injection integration
- The migration can be done gradually without requiring a complete rewrite
- The existing provider interfaces are well-defined and stable
- Plugin settings are already stored in a structured format that can be bound to DI tokens
- The codebase follows TypeScript best practices and supports modern decorators (ES2022+)
- The build system (esbuild/tsup) supports decorator emission without additional configuration
- Developers are willing to adopt constructor injection patterns for new code
- The plugin's bundle size can accommodate the Needle DI library (approximately 2KB)

## Dependencies

- **Needle DI Library**: The core dependency injection framework (@needle-di/core v1.1.0 or later)
- **TypeScript Compiler**: Must support stage-3 decorators (TypeScript 5.7+)
- **Build System**: Must support ES2022 target for decorator emission (esbuild/tsup configured correctly)
- **Test Framework**: Must support container creation and mocking (Vitest with DI support)
- **Existing Plugin Architecture**: Assumes current plugin structure allows for gradual refactoring
- **Obsidian API**: Must remain stable during migration to avoid conflicting changes

## Out of Scope

- Rewriting existing provider implementations beyond adding DI decorators
- Performance optimization of AI request handling (separate from DI migration goals)
- Adding new AI providers or capabilities during migration
- Refactoring non-DI related code patterns or architecture
- Updating documentation for end users (only developer documentation needs updates)
- Migrating configuration storage format or settings structure
- Changes to Obsidian's plugin manifest or API requirements
- Optimizing bundle size beyond the baseline DI library overhead
- Creating a plugin SDK or API for third-party extensions
- Implementing hot module replacement or advanced plugin reload mechanisms
