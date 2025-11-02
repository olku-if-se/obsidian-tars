---

description: "Task list for Needle DI migration implementation"
---

# Tasks: Needle DI Migration

**Input**: Design documents from `/specs/003-needle-di-migration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are REQUIRED - Constitution mandates Test-First Development (TDD) with 85%+ coverage

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Obsidian Plugin**: `apps/obsidian-plugin/src/`
- **DI Infrastructure**: `apps/obsidian-plugin/src/di/`
- **Tests**: `apps/obsidian-plugin/tests/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for Needle DI integration

- [ ] T001 Add @needle-di/core dependency to apps/obsidian-plugin/package.json
- [ ] T002 Configure TypeScript for ES2022 target with stage-3 decorators in apps/obsidian-plugin/tsconfig.json
- [ ] T002a [P] Create unit tests that validate required tsconfig settings in apps/obsidian-plugin/tests/build/test-tsconfig-validation.test.ts
- [ ] T003 [P] Create DI infrastructure directory structure in apps/obsidian-plugin/src/di/
- [ ] T004 [P] Create test directory structure for DI tests in apps/obsidian-plugin/tests/di/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core DI infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create DI container tokens including AI_PROVIDERS, COMMANDS, and multi-tokens in apps/obsidian-plugin/src/di/tokens.ts
- [ ] T006 [P] Create core DI container interfaces in apps/obsidian-plugin/src/di/interfaces.ts
- [ ] T007 Implement PluginInitializer class in apps/obsidian-plugin/src/di/plugin-initializer.ts
- [ ] T008 Implement DI container wrapper in apps/obsidian-plugin/src/di/container.ts
- [ ] T009 Create DI container setup in apps/obsidian-plugin/src/di/setup.ts
- [ ] T010 Create configuration validation utilities in apps/obsidian-plugin/src/di/validation.ts
- [ ] T011 [P] Create test utilities for DI testing in apps/obsidian-plugin/tests/di/test-utils.ts
- [ ] T011a [P] Create NotificationsService implementation in apps/obsidian-plugin/src/services/notifications-service.ts
- [ ] T012 Update build configuration to support decorators in esbuild.config.mjs
- [ ] T012a [P] Create unit tests that confirm proper esbuild configuration in apps/obsidian-plugin/tests/build/test-esbuild-config.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Test AI Provider in Isolation (Priority: P1) 🎯 MVP

**Goal**: Enable developers to create isolated unit tests for AI providers with mock settings without instantiating the entire plugin

**Independent Test**: Create a test container with mock settings, instantiate a single provider, and verify it receives the mocked configuration without requiring full plugin load

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Contract test for OpenAI provider injection in apps/obsidian-plugin/tests/di/test-openai-provider.test.ts
- [ ] T014 [P] [US1] Contract test for Claude provider injection in apps/obsidian-plugin/tests/di/test-claude-provider.test.ts
- [ ] T015 [P] [US1] Integration test for mock settings injection in apps/obsidian-plugin/tests/di/test-settings-injection.test.ts
- [ ] T016 [P] [US1] Integration test for child container isolation in apps/obsidian-plugin/tests/di/test-child-containers.test.ts

### Implementation for User Story 1

- [ ] T017 [P] [US1] Create BaseVendorOptions class in apps/obsidian-plugin/src/di/base-vendor-options.ts
- [ ] T018 [US1] Convert OpenAI provider to injectable class in apps/obsidian-plugin/src/providers/openai.ts
- [ ] T019 [US1] Convert Claude provider to injectable class in apps/obsidian-plugin/src/providers/claude.ts
- [ ] T020 [US1] Create provider registry service in apps/obsidian-plugin/src/di/provider-registry.ts
- [ ] T021 [US1] Implement settings validation for providers in apps/obsidian-plugin/src/di/validation.ts (depends on T010)
- [ ] T022 [US1] Add provider registration to DI setup in apps/obsidian-plugin/src/di/setup.ts (depends on T009)
- [ ] T023 [US1] Create test container factory in apps/obsidian-plugin/tests/di/test-container-factory.ts
- [ ] T024 [US1] Add performance monitoring for DI resolution in apps/obsidian-plugin/src/di/performance-monitor.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Add New AI Provider Without Modifying Core Plugin (Priority: P1)

**Goal**: Enable developers to register new AI providers without changing plugin initialization code

**Independent Test**: Create a new provider class, register it with the dependency system, and verify the plugin recognizes and uses it without core code changes

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T025 [P] [US2] Contract test for provider registration in apps/obsidian-plugin/tests/di/test-provider-registration.test.ts
- [ ] T026 [P] [US2] Integration test for provider factory in apps/obsidian-plugin/tests/di/test-provider-factory.test.ts
- [ ] T027 [P] [US2] Integration test for provider discovery in apps/obsidian-plugin/tests/di/test-provider-discovery.test.ts

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create provider factory interface in apps/obsidian-plugin/src/di/provider-factory.ts
- [ ] T029 [US2] Implement provider factory service in apps/obsidian-plugin/src/di/provider-factory-impl.ts
- [ ] T030 [US2] Create provider metadata system in apps/obsidian-plugin/src/di/provider-metadata.ts
- [ ] T031 [P] [US2] Convert DeepSeek provider to injectable class in apps/obsidian-plugin/src/providers/deepseek.ts
- [ ] T032 [P] [US2] Convert Gemini provider to injectable class in apps/obsidian-plugin/src/providers/gemini.ts
- [ ] T033 [P] [US2] Convert Perplexity provider to injectable class in apps/obsidian-plugin/src/providers/perplexity.ts
- [ ] T034 [P] [US2] Convert Groq provider to injectable class in apps/obsidian-plugin/src/providers/groq.ts
- [ ] T035 [P] [US2] Convert remaining providers to injectable classes in apps/obsidian-plugin/src/providers/
- [ ] T036 [US2] Implement dynamic provider registration with multi flag in apps/obsidian-plugin/src/di/provider-registry.ts (depends on T020)
- [ ] T037 [US2] Add provider configuration schemas in apps/obsidian-plugin/src/di/provider-schemas.ts
- [ ] T038 [US2] Update DI setup to support multi-registration of providers in apps/obsidian-plugin/src/di/setup.ts (depends on T022)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently
**Total Task Count**: 115+ tasks (expanded to include complete provider migration, TypeScript Excellence compliance, command multi-registration, NotificationsService, validation tests, and quality gate requirements)

---

## Phase 5: User Story 3 - Change Plugin Configuration Without Restart (Priority: P2)

**Goal**: Enable plugin to recognize updated AI provider settings immediately without requiring Obsidian reload

**Independent Test**: Change a provider's API key in settings, trigger a settings update event, and verify the provider uses the new key on the next request

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T036 [P] [US3] Contract test for settings change notification in apps/obsidian-plugin/tests/di/test-settings-change-notification.test.ts
- [ ] T037 [P] [US3] Integration test for live configuration updates in apps/obsidian-plugin/tests/di/test-live-config-update.test.ts

### Implementation for User Story 3

- [ ] T038 [P] [US3] Create settings change notifier in apps/obsidian-plugin/src/di/settings-change-notifier.ts
- [ ] T039 [US3] Implement configuration binding service in apps/obsidian-plugin/src/di/config-binding-service.ts
- [ ] T040 [US3] Add configuration propagation to providers in apps/obsidian-plugin/src/di/provider-registry.ts (depends on T033)
- [ ] T041 [US3] Update PluginInitializer to handle settings changes in apps/obsidian-plugin/src/di/plugin-initializer.ts (depends on T007)
- [ ] T042 [US3] Add performance timing for configuration updates in apps/obsidian-plugin/src/di/performance-monitor.ts (depends on T024)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - Maintain Existing Plugin APIs (Priority: P1)

**Goal**: Ensure all current plugin APIs continue working exactly as before through facade pattern

**Independent Test**: Run the existing test suite against the migrated codebase and verify 100% pass rate with zero API changes

### Tests for User Story 4 (REQUIRED) ⚠️

- [ ] T043 [P] [US4] Contract test for settings facade in apps/obsidian-plugin/tests/di/test-settings-facade.test.ts
- [ ] T044 [P] [US4] Contract test for provider factory facade in apps/obsidian-plugin/tests/di/test-provider-factory-facade.test.ts
- [ ] T045 [P] [US4] Integration test for backward compatibility in apps/obsidian-plugin/tests/di/test-backward-compatibility.test.ts
- [ ] T045a [P] [US4] Contract test for command multi-registration pattern in apps/obsidian-plugin/tests/di/test-command-multi-registration.test.ts
- [ ] T045b [P] [US4] Contract test for NotificationsService lifecycle management in apps/obsidian-plugin/tests/services/test-notifications-service.test.ts

### Implementation for User Story 4

- [ ] T046 [P] [US4] Create settings facade in apps/obsidian-plugin/src/di/settings-facade.ts
- [ ] T047 [P] [US4] Create provider factory facade in apps/obsidian-plugin/src/di/provider-factory-facade.ts
- [ ] T048 [US4] Update main.ts to use DI container while maintaining APIs in apps/obsidian-plugin/src/main.ts
- [ ] T049 [US4] Implement command registration service with multi DI pattern in apps/obsidian-plugin/src/di/command-service.ts
- [ ] T049a [P] [US4] Extract NotificationsService for Notice lifecycle management in apps/obsidian-plugin/src/services/notifications-service.ts
- [ ] T050 [US4] Update settings.ts to delegate to DI-managed settings in apps/obsidian-plugin/src/settings.ts
- [ ] T051 [US4] Migrate StatusBarManager to use DI in apps/obsidian-plugin/src/services/status-bar-manager.ts
- [ ] T052 [US4] Migrate TagEditorSuggest to use DI in apps/obsidian-plugin/src/suggest.ts

**Checkpoint**: All user stories should now be independently functional with zero breaking changes

---

## Phase 7: User Story 5 - Debug Dependency Resolution Issues (Priority: P3)

**Goal**: Provide clear error messages indicating which dependencies are missing or misconfigured

**Independent Test**: Intentionally misconfigure a dependency, attempt to resolve it, and verify the error message identifies the specific issue

### Tests for User Story 5 (REQUIRED) ⚠️

- [ ] T053 [P] [US5] Contract test for dependency resolution errors in apps/obsidian-plugin/tests/di/test-resolution-errors.test.ts
- [ ] T054 [P] [US5] Integration test for circular dependency detection in apps/obsidian-plugin/tests/di/test-circular-dependency.test.ts

### Implementation for User Story 5

- [ ] T055 [P] [US5] Create DI error handler in apps/obsidian-plugin/src/di/error-handler.ts
- [ ] T056 [US5] Implement circular dependency detection in apps/obsidian-plugin/src/di/circular-dependency-detector.ts
- [ ] T057 [US5] Add debug mode for DI container in apps/obsidian-plugin/src/di/debug-mode.ts
- [ ] T058 [US5] Create validation utilities for dependency graphs in apps/obsidian-plugin/src/di/validation.ts (depends on T010)
- [ ] T059 [US5] Update error handling in DI container wrapper in apps/obsidian-plugin/src/di/container.ts (depends on T008)

**Checkpoint**: All user stories should now be independently functional with enhanced debugging

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T060 [P] Update documentation for DI usage in docs/developer-guide.md
- [ ] T061 Code cleanup and refactoring for DI integration
- [ ] T062 Performance optimization across all DI operations
- [ ] T063 [P] Additional unit tests for edge cases in apps/obsidian-plugin/tests/unit/
- [ ] T064 Security hardening for DI configuration
- [ ] T065 Run quickstart.md validation for DI setup

### Constitution Compliance Tasks (REQUIRED)

- [ ] T066 [P] Constitutional compliance review for Plugin Architecture Excellence
- [ ] T067 [P] Constitutional compliance review for Provider Abstraction
- [ ] T068 [P] Constitutional compliance review for Test-First Development (TDD)
- [ ] T069 [P] Verify 85%+ code and branch coverage for all tests
- [ ] T070 [P] Verify Given/When/Then comment format in unit tests
- [ ] T071 [P] Verify test comments focus on business value, not implementation details
- [ ] T072 [P] Constitutional compliance review for Cross-Platform Compatibility
- [ ] T073 [P] Constitutional compliance review for Performance & Responsiveness
- [ ] T074 [P] Constitutional compliance review for MCP Integration Capability
- [ ] T075 [P] Constitutional compliance review for Development Standards & Tooling
- [ ] T076 [P] Constitutional compliance review for TypeScript Code Excellence
- [ ] T077 [P] Constitutional compliance review for Needle DI Architecture Standards
- [ ] T078 [P] Constitutional compliance review for React Component Architecture
- [ ] T079 [P] Constitutional compliance review for Security & Privacy
- [ ] T080 Update constitution version if amendments were needed

### TypeScript Excellence Tasks

- [ ] T081 [P] Refactor provider classes to use domain-scoped naming (OpenAI instead of OpenAIProvider)
- [ ] T082 [P] Implement generic type names (Options, Result, Event, Config) within each domain file
- [ ] T083 [P] Verify error cause preservation with proper chaining using Object.assign
- [ ] T084 [P] Implement async generator patterns for streaming with yield/return structure
- [ ] T085 [P] Refactor to use EventEmitter reactive patterns instead of conditional logic
- [ ] T086 [P] Validate side effect isolation - core logic pure, I/O at application edges
- [ ] T087 [P] Add static factory methods for clean declarative APIs
- [ ] T088 [P] Extract complex object literals to named configuration objects
- [ ] T089 [P] Implement proper AbortSignal support for cancellation in all async operations
- [ ] T090 [P] Extract repeated conditions to utility functions
- [ ] T091 [P] Ensure all files export composable suites, not single functions

### Needle DI Implementation Tasks

- [ ] T092 [P] Verify Needle DI v1.1.0+ with stage-3 decorators
- [ ] T093 [P] Validate @injectable() decorators with constructor injection
- [ ] T094 [P] Verify child container support for test isolation
- [ ] T095 [P] Validate configuration token usage for type-safe binding
- [ ] T096 [P] Verify factory pattern implementation for complex initialization
- [ ] T097 [P] Validate container binding resolution at startup

### Performance Validation Tasks

- [ ] T098 [P] Measure plugin initialization overhead with DI (target: ≤50ms increase)
- [ ] T099 [P] Validate configuration propagation timing (target: <10ms)
- [ ] T100 [P] Measure bundle size impact (target: ~7KB total increase)
- [ ] T101 [P] Validate memory footprint for DI containers
- [ ] T102 [P] Create automated performance regression tests

---

## Obsidian API Integration with Multi DI Patterns

### Command Registration with Multi Pattern
```typescript
// In apps/obsidian-plugin/src/commands/message-commands.ts
@injectable()
export class SelectMessage {
  constructor(private app = inject(ObsidianApp), private settings = inject(AppSettings)) {}

  execute(editor: Editor, view: MarkdownView): void {
    // Command implementation
  }
}

@injectable()
export class CancelRequest {
  constructor(private app = inject(ObsidianApp)) {}

  execute(): void {
    // Command implementation
  }
}

// Generic types for the domain
type Options = {
  editor: Editor;
  view: MarkdownView;
};

type Result = {
  success: boolean;
  error?: Error;
};

// Register commands with multi flag
container.bind({ provide: Commands, useClass: SelectMessageCommand, multi: true });
container.bind({ provide: Commands, useClass: CancelCommand, multi: true });
// ... all other commands

// Command service registers all commands via plugin.addCommand()
@injectable()
export class CommandRegistry extends EventEmitter {
  private readonly registeredCommands = new Map<string, Command>();

  constructor(
    private plugin = inject(TarsPlugin),
    private commands = inject(Commands, { multi: true }),
    private notifications = inject(Tokens.Notifications)
  ) {
    super();
  }

  // Static factory for clean API
  static create(plugin: TarsPlugin, commands: Command[], notifications: Tokens.Notifications): CommandRegistry {
    return new CommandRegistry(plugin, commands, notifications);
  }

  register(): void {
    try {
      this.commands.forEach(command => {
        const id = this.generateCommandId(command);

        this.plugin.addCommand({
          id,
          name: this.getCommandName(command),
          editorCallback: (editor, view) => {
            // Emit event instead of direct execution - reactive pattern
            this.emit('execute', { command, editor, view });
          }
        });

        this.registeredCommands.set(id, command);
      });

      // Emit completion event
      this.emit('registered', { count: this.commands.length });
    } catch (error) {
      throw Object.assign(
        new Error("Failed to register commands"),
        { cause: error }
      );
    }
  }

  unregister(): void {
    try {
      for (const [id] of this.registeredCommands) {
        // Note: Obsidian doesn't have unregisterCommand, so we track internally
        this.registeredCommands.delete(id);
      }

      this.emit('unregistered', {});
    } catch (error) {
      throw Object.assign(
        new Error("Failed to unregister commands"),
        { cause: error }
      );
    }
  }

  // Extracted utility functions
  private generateCommandId(command: Command): string {
    const name = command.constructor.name;
    return name.replace(/Command$/, '').toLowerCase();
  }

  private getCommandName(command: Command): string {
    return command.constructor.name
      .replace(/Command$/, '')
      .replace(/([A-Z])/g, ' $1')
      .trim();
  }

  private hasCommand(id: string): boolean {
    return this.registeredCommands.has(id);
  }
}
```

### NotificationsService for Notice Lifecycle Management
```typescript
// In apps/obsidian-plugin/src/services/notifications.ts

// 1. Imports
import { Notice } from 'obsidian';
import type { App } from 'obsidian';
import { injectable, inject } from '@needle-di/core';
import type { ObsidianApp } from '../di/tokens';

// 2. Error messages
const Errors = {
  notification_failed: "Failed to create notification",
  cleanup_failed: "Failed to cleanup notification",
} as const;

// 3. Constants
const DEFAULT_TIMEOUT = 5000 as const;
const MAX_ACTIVE_NOTIFICATIONS = 10 as const;

// 4. Type contracts
interface Options {
  message: string;
  timeout?: number;
  type?: 'info' | 'success' | 'warning' | 'error';
}

type Result = {
  notice: Notice;
  id: string;
};

// 5. Custom exceptions
export class NotificationError extends Error {
  static createFailed = (message: string, cause?: unknown) =>
    Object.assign(new NotificationError(`${Errors.notification_failed}: ${message}`), { cause });
}

// 6. Pure utilities
const generateId = (): string => `notice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const shouldAutoCleanup = (timeout?: number): timeout is number =>
  typeof timeout === 'number' && timeout > 0;

// 7. Main composable class
@injectable()
export class Notifications {
  private readonly activeNotices = new Map<string, Notice>();

  constructor(private app = inject(ObsidianApp)) {}

  // Static factory for clean API
  static show = (message: string, options: Partial<Options> = {}): Promise<Result> => {
    // Implementation would use container to get instance
    throw new Error("Static factory requires DI container");
  };

  show(options: Options): Result {
    try {
      // Extract complex configuration
      const config = {
        timeout: options.timeout ?? DEFAULT_TIMEOUT,
        message: options.message,
      };

      const notice = new Notice(config.message, config.timeout);
      const id = generateId();

      this.activeNotices.set(id, notice);

      // Auto-cleanup with extracted condition
      if (shouldAutoCleanup(config.timeout)) {
        setTimeout(() => this.remove(id), config.timeout);
      }

      return { notice, id };
    } catch (error) {
      throw NotificationError.createFailed(options.message, error);
    }
  }

  remove(id: string): void {
    try {
      const notice = this.activeNotices.get(id);
      if (notice) {
        notice.hide();
        this.activeNotices.delete(id);
      }
    } catch (error) {
      // Log error but don't throw - cleanup should be resilient
      console.warn(`${Errors.cleanup_failed}: ${id}`, error);
    }
  }

  clearAll(): void {
    for (const [id] of this.activeNotices) {
      this.remove(id);
    }
  }

  getActiveCount(): number {
    return this.activeNotices.size;
  }

  // Extracted repeated condition
  private hasCapacity(): boolean {
    return this.activeNotices.size < MAX_ACTIVE_NOTIFICATIONS;
  }
}
```

### DI Token Definitions
```typescript
// In apps/obsidian-plugin/src/di/tokens.ts
import { InjectionToken } from '@needle-di/core';
import type { Notice } from 'obsidian';

// Command collection token
export const Commands = new InjectionToken<Command[]>('Commands');

// Notifications service token
export const NotificationsService = new InjectionToken<NotificationsService>('NotificationsService');

// Notification config token (optional for customization)
export const NotificationConfig = new InjectionToken<NotificationConfig>('NotificationConfig');

// Organized tokens object for clean imports
export const Tokens = {
  Commands,
  NotificationsService,
  NotificationConfig,
  AiProviders,
  TarsPlugin,
  ObsidianApp,
  AppSettings,
  // ... other tokens
} as const;
```

### Usage Examples with New Token Structure
```typescript
// Import individual tokens
import { Commands, AiProviders } from './di/tokens';

// Or import the organized Tokens object
import { Tokens } from './di/tokens';

// Usage in services
@injectable()
export class SomeService {
  constructor(
    private commands = inject(Tokens.Commands, { multi: true }),
    private providers = inject(AiProviders, { multi: true }),
    private notifications = inject(Tokens.NotificationsService)
  ) {}
}

// Usage in container setup
container.bind({ provide: Tokens.Commands, useClass: SelectMessageCommand, multi: true });
container.bind({ provide: Tokens.NotificationsService, useClass: NotificationsService });
```

---

## Provider Migration Strategy (DRY with Multi-Registration)

### Complete Provider List
All 15+ providers must be migrated to DI classes:
- **T018**: OpenAIProvider (already in US1)
- **T019**: ClaudeProvider (already in US1)
- **T031**: DeepSeekProvider
- **T032**: GeminiProvider
- **T033**: PerplexityProvider
- **T034**: GroqProvider
- **T035**: All remaining providers (Ollama, LocalAI, etc.)

### Multi-Registration Pattern (Official Needle DI v1.1.0)
```typescript
// In apps/obsidian-plugin/src/providers/openai.ts
@injectable()
export class OpenAI {
  constructor(private settings = inject(AppSettings)) {}

  async *stream(options: Options): AsyncGenerator<Event, Result> {
    // Implementation with proper async generator pattern
    try {
      const response = await this.createCompletion(options);

      for await (const chunk of response) {
        yield { type: 'content', data: chunk };
      }

      return { type: 'complete', usage: response.usage };
    } catch (error) {
      throw Object.assign(
        new Error("OpenAI streaming failed"),
        { cause: error }
      );
    }
  }

  private async createCompletion(options: Options) {
    // Extracted configuration
    const config = {
      model: options.model ?? this.settings.defaultModel,
      temperature: options.temperature ?? 0.7,
    };

    // Implementation
  }
}

// Generic types for provider domain
interface Options {
  model?: string;
  temperature?: number;
  signal?: AbortSignal;
}

type Event =
  | { type: 'content'; data: string }
  | { type: 'tool_call'; data: any };

type Result = {
  type: 'complete';
  usage: TokenUsage;
};

// In DI setup - bind each provider with multi flag
container.bind({ provide: AiProviders, useClass: OpenAI, multi: true });
container.bind({ provide: AiProviders, useClass: Claude, multi: true });
container.bind({ provide: AiProviders, useClass: DeepSeek, multi: true });
container.bind({ provide: AiProviders, useClass: Gemini, multi: true });

// Services inject with clean destructuring
constructor(
  private providers = inject(AiProviders, { multi: true })
) {}
```

### DRY Multi-Registration with Factory
```typescript
// Factory function for bulk provider registration
export function registerAllProviders(container: Container) {
  const providers = [
    OpenAIProvider,
    ClaudeProvider,
    DeepSeekProvider,
    GeminiProvider,
    // ... all other providers
  ];

  providers.forEach(Provider => {
    container.bind({ provide: AiProviders, useClass: Provider, multi: true });
  });
}

// Usage in container setup
registerAllProviders(container);
```

### DRY Implementation
- **Base Class**: `BaseVendorOptions` handles common functionality
- **Pattern**: All providers follow same injectable class structure
- **Registration**: `registerAllProviders()` factory function handles bulk registration
- **Configuration**: Unified validation and schema system for all providers
- **Multi-Token**: Single `AiProviders` token with `multi: true` flag for collection injection
- **Commands**: `Commands` multi-token for bulk command registration via `plugin.addCommand()`
- **Notifications**: `Tokens.NotificationsService` for centralized Notice lifecycle management
- **DRY Factory**: `registerAllCommands()` factory for command bulk registration
- **Token Organization**: All tokens organized in `Tokens` object for clean imports

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P1 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on User Story 1 for base patterns
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on User Story 1 for provider structure
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Depends on User Stories 1, 2, 3 for facade implementations
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on User Stories 1-4 for comprehensive error handling

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD requirement)
- Core interfaces before implementations
- Base classes before concrete providers
- Registration before resolution
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All tests for a user story marked [P] can run in parallel
- Provider conversions marked [P] can run in parallel
- Facade implementations marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members (after dependencies satisfied)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for OpenAI provider injection in apps/obsidian-plugin/tests/di/test-openai-provider.test.ts"
Task: "Contract test for Claude provider injection in apps/obsidian-plugin/tests/di/test-claude-provider.test.ts"
Task: "Integration test for mock settings injection in apps/obsidian-plugin/tests/di/test-settings-injection.test.ts"
Task: "Integration test for child container isolation in apps/obsidian-plugin/tests/di/test-child-containers.test.ts"

# Launch all provider conversions for User Story 1 together:
Task: "Convert OpenAI provider to injectable class in apps/obsidian-plugin/src/providers/openai.ts"
Task: "Convert Claude provider to injectable class in apps/obsidian-plugin/src/providers/claude.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 4 → Test independently → Deploy/Demo (Critical P1)
5. Add User Story 3 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Base DI patterns)
   - Developer B: User Story 2 (Provider registration)
   - Developer C: User Story 4 (API compatibility - critical)
3. Stories complete and integrate independently
4. Developer A: User Story 3 (Configuration updates)
5. Developer B: User Story 5 (Debugging)
6. Team: Polish and compliance review

---

## TypeScript Excellence Compliance

### Code Structure Standards (Per @docs/rules-typescript-code.md)

#### 1. Domain-Scoped File Structure
- **File as Library**: Each file exports a composable suite, not single functions
- **No Redundant Prefixes**: `openai.ts` exports `OpenAI`, not `OpenAIProvider`
- **Generic Type Names**: Use `Options`, `Result`, `Config`, `Event` within domains
- **Context from Path**: File name provides domain context

#### 2. File Organization Template
```typescript
// 1. Imports (external → workspace → relative)
import { EventEmitter } from "node:events";
import { injectable, inject } from '@needle-di/core';

// 2. Error constants (i18n-ready)
const Errors = {
  operation_failed: "Operation failed",
  timeout_reached: "Operation timed out",
} as const;

// 3. Constants
const DEFAULT_TIMEOUT = 30000 as const;
const MAX_RETRIES = 3 as const;

// 4. Type contracts (generic names)
interface Options {
  signal?: AbortSignal;
  timeout?: number;
}

type Result = { success: true } | { success: false; error: Error };
type Event = { type: 'data'; data: string } | { type: 'complete' };

// 5. Custom exceptions with cause preservation
export class DomainError extends Error {
  static timeout = (cause?: unknown) =>
    Object.assign(new DomainError(Errors.timeout_reached), { cause });
}

// 6. Pure utilities
const withTimeout = <T>(operation: Promise<T>, ms: number): Promise<T> => {
  // Pure function implementation
};

// 7. Main composable class
@injectable()
export class ServiceName {
  constructor(private dependency = inject(DependencyToken)) {}

  // Static factory for clean API
  static create(dependency: Dependency): ServiceName {
    return new ServiceName(dependency);
  }
}
```

#### 3. Architectural Patterns
- **Composition over Inheritance**: Small, focused classes working together
- **EventEmitter for Reactivity**: Replace conditional logic with event emission
- **Async Generators**: Use `yield` for streaming, `return` for final results
- **AbortSignal First-Class**: All async operations support cancellation
- **Static Factories**: Clean declarative APIs over complex constructors
- **Side-Effect Isolation**: Pure core logic, I/O at application edges

#### 4. Error Handling Standards
```typescript
// ✅ Correct: Preserve error chain
try {
  await riskyOperation();
} catch (error) {
  throw Object.assign(
    new DomainError("Operation failed"),
    { cause: error }
  );
}

// ✅ Static factory for errors
export class ProviderError extends Error {
  static configurationInvalid = (details: string, cause?: unknown) =>
    Object.assign(new ProviderError(`Invalid configuration: ${details}`), { cause });
}
```

#### 5. Reactive Design Patterns
```typescript
// ✅ Use EventEmitter for reactive systems
@injectable()
export class CommandRegistry extends EventEmitter {
  register(): void {
    this.commands.forEach(command => {
      this.plugin.addCommand({
        id: command.id,
        editorCallback: (editor, view) => {
          // Emit event instead of direct execution
          this.emit('execute', { command, editor, view });
        }
      });
    });

    // Emit completion event
    this.emit('registered', { count: this.commands.length });
  }
}
```

### Compliance Validation Tasks

All TypeScript Excellence tasks (T081-T091) must ensure:
- Domain-scoped naming without redundant prefixes
- Generic type names (Options, Result, Config, Event) in each domain
- Proper error cause preservation using Object.assign
- Async generator patterns for streaming operations
- EventEmitter reactive patterns instead of conditional logic
- Side-effect isolation with pure core logic
- Static factory methods for clean APIs
- Extracted configuration objects and utility functions
- AbortSignal support for cancellation
- Composable suite exports from each file

---

## Critical Success Factors

### Test-First Development (TDD) Mandate

- **Red Phase**: Write tests first, ensure they FAIL
- **Green Phase**: Implement minimal code to make tests pass
- **Refactor Phase**: Improve code while keeping tests green
- **Coverage**: 85%+ code and branch coverage required
- **Format**: All unit tests MUST include Given/When/Then comments
- **Focus**: Test comments MUST focus on business value, not implementation details

### Performance Requirements

- **Initialization**: DI container setup must add ≤50ms overhead
- **Configuration**: Settings changes must propagate within 10ms
- **Bundle Size**: Total increase must be ~7KB (Needle DI + infrastructure)
- **Memory**: DI containers must not significantly increase memory footprint

### Backward Compatibility

- **Zero Breaking Changes**: All existing APIs must work identically
- **Facade Pattern**: Maintain existing interfaces while delegating to DI
- **Gradual Migration**: DI and direct instantiation coexist during transition
- **API Preservation**: Method signatures and return values unchanged

### DI Architecture Standards

- **Needle DI v1.1.0+**: Strict version requirement with stage-3 decorators
- **Constructor Injection**: All dependencies via inject() in constructors
- **Child Containers**: Test isolation using child containers
- **Configuration Tokens**: Type-safe binding for all settings
- **Lifecycle Management**: Proper singleton, transient, and scoped lifecycles
- **Multi-Registration**: All providers registered with `multi` flag following DRY principles
- **Complete Migration**: ALL providers migrated to DI, not just OpenAI/Claude

### Quality Gates & Commit Standards

- **GREEN State Required**: Each task must pass all quality gates before completion
  - Type checking: `pnpm typecheck` must pass without errors
  - Linting: `pnpm lint` must pass without warnings/errors
  - Build: `pnpm build` must succeed
  - Tests: `pnpm test` must pass with 85%+ coverage
- **Individual Commits**: Each task gets its own semantic git commit
  - Commit only when task is complete AND all quality gates pass
  - Use conventional commit format: `feat:`, `fix:`, `test:`, `refactor:`, etc.
  - Include task ID in commit message for traceability
- **Validation Pipeline**:
  1. Complete task implementation
  2. Run quality gates and fix any failures
  3. Verify tests pass with coverage requirements
  4. Commit with semantic message including task ID
  5. Move to next task

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD requirement)
- **CRITICAL**: Each task MUST pass all quality gates (typecheck, lint, build, test) before commit
- **CRITICAL**: Each task gets its own semantic git commit only when GREEN state achieved
- **CRITICAL**: ALL providers must be migrated to DI with multi-registration following DRY principles
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **CRITICAL**: All tests MUST be written first and fail before implementation (TDD constitutional requirement)
- **CRITICAL**: Quality gates must pass: pnpm typecheck, pnpm lint, pnpm build, pnpm test (85%+ coverage)
- **CRITICAL**: Use semantic commit messages with task IDs: feat(di): T001 add needle-di dependency