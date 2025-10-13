# MCP Hosting Package Extraction Plan - Epic-1200

**Created**: 2025-10-12
**Priority**: P1 - Critical (unblocks future standalone MCP usage)
**Total Story Points**: 34 SP
**Estimated Duration**: 5-7 days
**Status**: 📋 Planning

---

## Executive Summary

This document outlines the plan to extract MCP server hosting and execution logic from `packages/plugin/src/mcp/` into a standalone `packages/mcp-hosting/` package. The extraction will:

- Create reusable MCP hosting infrastructure for any Node.js application
- Define abstract interfaces for host-specific integration (logging, status reporting, notifications)
- Maintain 100% plugin functionality through adapter pattern
- Enable future standalone MCP tools (CLI, web apps, other editors)

**Key Deliverables**:
1. New `@tars/mcp-hosting` package with clean API
2. Abstract interfaces for Obsidian-specific functionality
3. Obsidian adapter implementations in plugin
4. Complete test coverage (unit + integration + E2E)
5. Comprehensive documentation

---

## Table of Contents

- [Overview](#overview)
- [Scope](#scope)
- [Architecture](#architecture)
- [Implementation Plan](#implementation-plan)
- [Testing Strategy](#testing-strategy)
- [Migration Strategy](#migration-strategy)
- [Risk Management](#risk-management)
- [Success Criteria](#success-criteria)

---

## Overview

### Problem Statement

**Current State**:
- MCP server lifecycle, execution, caching, and retry logic tightly coupled to Obsidian plugin
- Cannot reuse MCP infrastructure outside Obsidian context
- Testing requires Obsidian API mocks
- No way to publish standalone MCP hosting capabilities

**Pain Points**:
- Want to create CLI tools using same MCP infrastructure → blocked
- Want to test MCP logic in isolation → requires complex mocking
- Want to version MCP hosting independently → not possible
- Want to use MCP in web applications → blocked

### Solution

Extract core MCP hosting logic into standalone `@tars/mcp-hosting` package with:
- **Zero Obsidian dependencies**
- **Abstract interfaces** for host integration (ILogger, IStatusReporter, INotificationHandler)
- **Complete test coverage** without mocks
- **Clean public API** for any Node.js application
- **Adapter pattern** for plugin integration

### Benefits

**Immediate**:
- ✅ Clearer separation of concerns (hosting vs UI)
- ✅ Easier to test MCP logic in isolation
- ✅ Reduced Obsidian mock complexity

**Future**:
- ✅ Reusable in CLI tools, web apps, other editors
- ✅ Publishable to npm for community use
- ✅ Independent versioning and release cycle
- ✅ Potential for community contributions to hosting layer

---

## Scope

### In Scope

**Core Logic to Extract**:
1. **Server Management** (`managerMCPUse.ts`)
   - Server lifecycle (start, stop, restart)
   - Health monitoring
   - Auto-disable after failures
   - Retry logic with exponential backoff
   - Server event emitters

2. **Tool Execution** (`executor.ts`)
   - Tool execution with timeout
   - Concurrent execution limits
   - Document-scoped session tracking
   - Execution history
   - Cancellation support (AbortController)

3. **Caching Layer** (`resultCache.ts`, `toolDiscoveryCache.ts`, `toolResultCache.ts`)
   - Tool result caching with TTL
   - Tool discovery caching for performance
   - Cache invalidation strategies
   - Cache statistics and metrics

4. **Retry Logic** (`retryUtils.ts`)
   - Exponential backoff
   - Jitter for thundering herd prevention
   - Transient error classification
   - Retry policy configuration

5. **Type Definitions** (`types.ts`, `config.ts`)
   - Core types (MCPServerConfig, ToolExecutionResult, etc.)
   - Enums (ConnectionState, ExecutionStatus, etc.)
   - Type guards and validators

6. **Error Handling** (`errors.ts`)
   - Custom error classes
   - Error categorization
   - Parameter sanitization for logging

7. **Utilities** (`utils.ts`, `mcpUseAdapter.ts`)
   - Configuration adapters
   - Helper functions
   - Logging utilities

### Out of Scope (Remain in Plugin)

**UI-Specific Logic**:
- Code block processor (`codeBlockProcessor.ts`) - Obsidian markdown rendering
- Settings UI (`settingTab.ts`, `MCPServerSettings.ts`) - Obsidian settings panel
- Modals (`toolBrowserModal.ts`, `errorDetailModal.ts`) - Obsidian modals
- Suggests (`mcpToolSuggest.ts`, `mcpParameterSuggest.ts`) - Obsidian editor suggestions
- Commands (`mcpCommands.ts`) - Obsidian command palette integration
- Document handlers (`documentSessionHandlers.ts`) - Obsidian-specific hooks

**AI Provider Integration** (defer to v3.6.0):
- Provider adapters (`providerAdapters.ts`) - OpenAI, Claude, Ollama adapters
- Tool calling coordinator (`toolCallingCoordinator.ts`) - AI autonomous tool calling
- Provider tool integration (`providerToolIntegration.ts`) - Native tool calling
- Tool response parsers (`toolResponseParser.ts`) - Streaming response parsing

**Rationale**: Provider adapters have some Obsidian type dependencies (Message, Editor) and extracting them would increase complexity and timeline. Can be extracted later if needed.

### Dependencies

**Required**:
- `@modelcontextprotocol/sdk` (^1.18.2) - Core MCP SDK
- `mcp-use` (^0.1.0) - MCP client library
- `async-mutex` (^0.5.0) - Concurrency control
- `p-limit` (^7.1.1) - Parallel execution limits
- `debug` (^4.4.3) - Debugging utilities

**Dev Dependencies**:
- TypeScript, Vitest, tsup (build tooling)
- Coverage tools, linters

---

## Architecture

### Current Architecture

```
packages/plugin/src/mcp/
├── managerMCPUse.ts           # Server lifecycle - EXTRACT
├── executor.ts                 # Tool execution - EXTRACT
├── resultCache.ts              # Result caching - EXTRACT
├── toolDiscoveryCache.ts       # Discovery caching - EXTRACT
├── toolResultCache.ts          # Document cache - EXTRACT
├── retryUtils.ts               # Retry logic - EXTRACT
├── errors.ts                   # Error types - EXTRACT
├── types.ts                    # Core types - EXTRACT
├── config.ts                   # Config types - EXTRACT
├── utils.ts                    # Utilities - EXTRACT
├── mcpUseAdapter.ts            # MCP-use adapter - EXTRACT
│
├── codeBlockProcessor.ts       # UI - KEEP
├── toolCallingCoordinator.ts   # AI integration - KEEP (for now)
├── providerAdapters.ts         # AI providers - KEEP (for now)
├── providerToolIntegration.ts  # AI tools - KEEP (for now)
├── toolResponseParser.ts       # AI parsing - KEEP (for now)
├── displayMode.ts              # UI utility - KEEP
├── toolResultFormatter.ts      # UI formatting - KEEP
└── ...
```

### Target Architecture

```
packages/
├── mcp-hosting/                    # NEW: Standalone MCP hosting package
│   ├── src/
│   │   ├── manager/
│   │   │   ├── MCPServerManager.ts      # Server lifecycle (extracted)
│   │   │   ├── ServerHealth.ts          # Health monitoring
│   │   │   ├── mcpUseAdapter.ts         # MCP-use config adapter
│   │   │   └── utils.ts                 # Manager utilities
│   │   │
│   │   ├── executor/
│   │   │   ├── ToolExecutor.ts          # Tool execution (extracted)
│   │   │   ├── ExecutionTracker.ts      # Concurrent/session tracking
│   │   │   └── DocumentSessionManager.ts # Document-scoped sessions
│   │   │
│   │   ├── caching/
│   │   │   ├── ResultCache.ts           # Tool result cache (extracted)
│   │   │   ├── ToolDiscoveryCache.ts    # Tool discovery cache (extracted)
│   │   │   ├── ToolResultCache.ts       # Document tool cache (extracted)
│   │   │   └── CacheStrategy.ts         # Pluggable cache backends
│   │   │
│   │   ├── retry/
│   │   │   ├── RetryPolicy.ts           # Retry configuration
│   │   │   ├── RetryExecutor.ts         # Exponential backoff logic
│   │   │   └── ErrorClassifier.ts       # Transient vs permanent errors
│   │   │
│   │   ├── adapters/
│   │   │   ├── ILogger.ts               # Logger interface (abstract)
│   │   │   ├── IStatusReporter.ts       # Status reporting interface (abstract)
│   │   │   └── INotificationHandler.ts  # Notification interface (abstract)
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts                 # Core type exports
│   │   │   ├── config.ts                # Configuration types
│   │   │   ├── results.ts               # Result types
│   │   │   └── events.ts                # Event types
│   │   │
│   │   ├── errors/
│   │   │   └── index.ts                 # Error classes
│   │   │
│   │   └── index.ts                     # Public API
│   │
│   ├── tests/
│   │   ├── unit/                        # Unit tests (moved from plugin)
│   │   │   ├── manager/
│   │   │   ├── executor/
│   │   │   ├── caching/
│   │   │   └── retry/
│   │   ├── integration/                 # Integration tests (moved)
│   │   ├── e2e/                         # End-to-end tests (new)
│   │   └── fixtures/                    # Test fixtures
│   │
│   ├── docs/
│   │   ├── API.md                       # API reference
│   │   ├── INTEGRATION.md               # Integration guide
│   │   └── EXAMPLES.md                  # Usage examples
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── README.md
│
└── plugin/                         # UPDATED: Plugin uses mcp-hosting package
    ├── src/
    │   ├── mcp/
    │   │   ├── adapters/                # Obsidian-specific adapters (NEW)
    │   │   │   ├── ObsidianLogger.ts    # Implements ILogger
    │   │   │   ├── StatusBarReporter.ts # Implements IStatusReporter
    │   │   │   └── ModalNotifier.ts     # Implements INotificationHandler
    │   │   │
    │   │   ├── codeBlockProcessor.ts    # Code block UI (KEEP)
    │   │   ├── providerAdapters.ts      # AI provider adapters (KEEP)
    │   │   ├── toolCallingCoordinator.ts # AI tool calling (KEEP)
    │   │   ├── displayMode.ts           # UI utility (KEEP)
    │   │   ├── toolResultFormatter.ts   # UI formatting (KEEP)
    │   │   └── index.ts                 # Re-exports + plugin-specific
    │   │
    │   └── main.ts                      # Uses @tars/mcp-hosting
    │
    ├── tests/
    │   └── mcp/                         # Plugin-specific tests only
    │
    └── package.json                # dependency: "@tars/mcp-hosting": "workspace:*"
```

### Abstract Interfaces

The key to making the extracted package reusable is defining abstract interfaces for host-specific concerns:

```typescript
// ILogger: Host provides logging implementation
export interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error, context?: Record<string, unknown>): void
}

// IStatusReporter: Host provides status reporting implementation
export interface IStatusReporter {
  reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void
  reportActiveExecutions(count: number): void
  reportSessionCount(documentPath: string, count: number, limit: number): void
  reportError(type: 'generation' | 'mcp' | 'tool' | 'system', message: string, error: Error, context?: Record<string, unknown>): void
}

// INotificationHandler: Host provides user notification implementation
export interface INotificationHandler {
  onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'>
  onSessionReset(documentPath: string): void
  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void
}
```

**Default Implementations**:
- `NoOpLogger` - Silent logger (default)
- `ConsoleLogger` - Console output logger (for testing)
- `NoOpStatusReporter` - No status reporting (default)
- `DefaultNotificationHandler` - Always cancels at limits (default)

**Obsidian Implementations** (in plugin):
- `ObsidianLogger` - Uses plugin logger (with debug levels)
- `StatusBarReporter` - Updates Obsidian status bar
- `ModalNotifier` - Shows Obsidian modals/notices

---

## Implementation Plan

### Epic-1200: MCP Hosting Package Extraction

**Total Story Points**: 34 SP
**Timeline**: 5-7 days
**Priority**: P1

---

### Feature-1200-10: Package Structure & Core Logic (8 SP)

#### UserStory-1200-10-5: Create Package Structure (3 SP)

**Tasks**:

**Task-1200-10-5-1: Initialize Package Directory (1 SP)**

Create directory structure, `package.json`, `tsconfig.json`, `README.md`, update monorepo config.

**Acceptance Criteria**:
- `packages/mcp-hosting/` exists with correct structure
- `pnpm install` recognizes workspace package
- Package builds successfully with `pnpm build`

---

**Task-1200-10-5-2: Define Abstract Interfaces (2 SP)**

Create `src/adapters/ILogger.ts`, `IStatusReporter.ts`, `INotificationHandler.ts` with default implementations.

**Acceptance Criteria**:
- Interfaces defined with clear contracts
- Default no-op implementations provided
- Console logger available for testing
- Types compile correctly

---

#### UserStory-1200-10-10: Extract Server Manager (5 SP)

**Tasks**:

**Task-1200-10-10-1: Extract MCPServerManager Core (2 SP)**

Copy `managerMCPUse.ts` → `src/manager/MCPServerManager.ts`, refactor to use abstract interfaces.

**Acceptance Criteria**:
- Manager class extracted
- Uses ILogger, IStatusReporter interfaces
- No Obsidian dependencies
- Compiles successfully

---

**Task-1200-10-10-2: Extract Supporting Manager Files (2 SP)**

Extract `mcpUseAdapter.ts`, `utils.ts`, create `ServerHealth.ts` for health monitoring.

**Acceptance Criteria**:
- Supporting files extracted
- Health monitoring separated
- Clean module boundaries
- All imports resolve

---

**Task-1200-10-10-3: Create Manager Tests (1 SP)**

Copy and refactor tests from `packages/plugin/tests/mcp/managerMCPUse.test.ts`.

**Acceptance Criteria**:
- Unit tests pass
- No Obsidian mocks required
- Test coverage >90%

---

### Feature-1200-20: Execution & Caching Layer (10 SP)

#### UserStory-1200-20-5: Extract Tool Executor (5 SP)

**Tasks**:

**Task-1200-20-5-1: Extract ToolExecutor Core (2 SP)**

Copy `executor.ts` → `src/executor/ToolExecutor.ts`, refactor to use abstract interfaces.

**Acceptance Criteria**:
- Executor class extracted
- Uses ILogger, IStatusReporter, INotificationHandler
- No Obsidian dependencies
- Session limits work correctly

---

**Task-1200-20-5-2: Extract Execution Tracker (1 SP)**

Create `src/executor/ExecutionTracker.ts` for concurrent/session tracking logic.

**Acceptance Criteria**:
- Execution tracking separated
- Statistics calculation works
- Clean abstraction

---

**Task-1200-20-5-3: Extract Document Session Manager (1 SP)**

Create `src/executor/DocumentSessionManager.ts` for document-scoped session management.

**Acceptance Criteria**:
- Session management separated
- Per-document session tracking works
- Session reset notifications work

---

**Task-1200-20-5-4: Create Executor Tests (1 SP)**

Copy and refactor executor tests.

**Acceptance Criteria**:
- Unit tests pass
- No Obsidian mocks
- Test coverage >90%

---

#### UserStory-1200-20-10: Extract Caching Layer (5 SP)

**Tasks**:

**Task-1200-20-10-1: Extract Result Cache (2 SP)**

Copy `resultCache.ts`, `toolResultCache.ts` → `src/caching/`.

**Acceptance Criteria**:
- Result caching works
- TTL expiration works
- Order-independent parameter hashing works
- Uses ILogger

---

**Task-1200-20-10-2: Extract Tool Discovery Cache (2 SP)**

Copy `toolDiscoveryCache.ts` → `src/caching/ToolDiscoveryCache.ts`.

**Acceptance Criteria**:
- Tool discovery caching works
- Cache invalidation works
- Performance optimization maintained

---

**Task-1200-20-10-3: Create Cache Tests (1 SP)**

Copy and refactor cache tests.

**Acceptance Criteria**:
- Unit tests pass
- Edge cases covered
- Test coverage >90%

---

### Feature-1200-30: Retry & Error Handling (6 SP)

#### UserStory-1200-30-5: Extract Retry Logic (3 SP)

**Tasks**:

**Task-1200-30-5-1: Extract Retry Policy (1 SP)**

Copy `retryUtils.ts` → `src/retry/RetryExecutor.ts`, `RetryPolicy.ts`.

**Acceptance Criteria**:
- Retry logic extracted
- Exponential backoff works
- Jitter works
- Transient error classification works

---

**Task-1200-30-5-2: Create Retry Tests (1 SP)**

Copy and refactor retry tests.

---

**Task-1200-30-5-3: Extract Error Classes (1 SP)**

Copy `errors.ts` → `src/errors/index.ts`.

**Acceptance Criteria**:
- Error classes extracted
- Parameter sanitization works
- Error categorization works

---

### Feature-1200-40: Testing & Validation (5 SP)

#### UserStory-1200-40-5: Create Integration Tests (3 SP)

**Tasks**:

**Task-1200-40-5-1: Copy Integration Tests (2 SP)**

Copy integration tests from plugin, update imports.

---

**Task-1200-40-5-2: Create End-to-End Tests (1 SP)**

Create E2E test exercising full stack without mocks.

---

#### UserStory-1200-40-10: Validate Plugin Integration (2 SP)

**Tasks**:

**Task-1200-40-10-1: Update Plugin to Use Package (1 SP)**

Add dependency, create Obsidian adapters, update plugin to use package, remove old files.

**Acceptance Criteria**:
- Plugin uses extracted package
- All plugin functionality works
- Zero regression

---

**Task-1200-40-10-2: Run Full Plugin Test Suite (1 SP)**

Run all plugin tests, build plugin, test in Obsidian.

**Acceptance Criteria**:
- All 429+ tests pass
- Plugin works in Obsidian
- All MCP features functional

---

### Feature-1200-50: Documentation & Migration (5 SP)

#### UserStory-1200-50-5: Create Package Documentation (3 SP)

**Tasks**:

**Task-1200-50-5-1: Write API Documentation (2 SP)**

Create `docs/API.md`, `INTEGRATION.md`, `EXAMPLES.md`.

---

**Task-1200-50-5-2: Update Project Documentation (1 SP)**

Update `CLAUDE.md`, `docs/MCP_ARCHITECTURE.md`, `README.md`.

---

#### UserStory-1200-50-10: Create Migration Guide (2 SP)

**Tasks**:

**Task-1200-50-10-1: Write Migration Guide (2 SP)**

Create comprehensive migration guide detailing extraction, changes, testing, rollback.

---

## Testing Strategy

### Unit Tests

**Coverage Target**: >90%

**Test Files to Extract** (from `packages/plugin/tests/mcp/`):
- `managerMCPUse.test.ts` → `packages/mcp-hosting/tests/unit/manager/MCPServerManager.test.ts`
- `executor.test.ts` → `packages/mcp-hosting/tests/unit/executor/ToolExecutor.test.ts`
- `resultCache.test.ts` → `packages/mcp-hosting/tests/unit/caching/ResultCache.test.ts`
- `toolDiscoveryCache.test.ts` → `packages/mcp-hosting/tests/unit/caching/ToolDiscoveryCache.test.ts`
- `toolResultCache.test.ts` → `packages/mcp-hosting/tests/unit/caching/ToolResultCache.test.ts`
- `retryUtils.test.ts` → `packages/mcp-hosting/tests/unit/retry/RetryExecutor.test.ts`
- `utils.test.ts` → `packages/mcp-hosting/tests/unit/manager/utils.test.ts`

**Changes Required**:
- Remove Obsidian mock imports
- Use abstract interface mocks instead
- Update import paths to new package

**Test Infrastructure**:
- Vitest (same as plugin)
- JSDOM not needed (no DOM operations)
- Coverage via `@vitest/coverage-v8`

---

### Integration Tests

**Coverage Target**: >80%

**Test Files to Extract** (from `packages/plugin/tests/integration/`):
- `toolExecution.test.ts` → `packages/mcp-hosting/tests/integration/toolExecution.test.ts`
- `documentSessionHandlers.test.ts` → `packages/mcp-hosting/tests/integration/documentSessionHandlers.test.ts`

**New Integration Tests**:
- Manager ↔ Executor interaction
- Executor ↔ Cache interaction
- Retry logic ↔ Manager interaction
- Full execution flow (manager → executor → cache → retry)

---

### End-to-End Tests

**New E2E Tests**:

Create `packages/mcp-hosting/tests/e2e/full-workflow.test.ts`:

```typescript
describe('MCP Hosting E2E', () => {
  it('should execute tool end-to-end', async () => {
    // Initialize manager with real MCP server
    // Create executor
    // Execute tool
    // Verify result
  })

  it('should enforce session limits', async () => {
    // Execute tools until limit
    // Verify limit enforced
    // Reset session
    // Verify can execute again
  })

  it('should cache and reuse results', async () => {
    // Execute tool
    // Execute same tool again
    // Verify cached result returned
    // Verify cache hit indicator
  })

  it('should retry on transient failures', async () => {
    // Simulate transient failure
    // Verify retry logic kicks in
    // Verify eventual success
  })

  it('should auto-disable after repeated failures', async () => {
    // Simulate repeated failures
    // Verify server auto-disabled
    // Verify notification sent
  })
})
```

---

### Plugin Integration Tests

**Test Strategy**:

1. **Before Extraction**: Run full plugin test suite, record results
2. **After Extraction**: Run same suite, compare results
3. **Manual Testing**: Test plugin in Obsidian test vault

**Validation Checklist**:
- [ ] All 429+ plugin tests pass
- [ ] Plugin loads without errors
- [ ] MCP servers start/stop correctly
- [ ] Tools execute correctly
- [ ] Caching works (verify 📦 indicator)
- [ ] Session limits enforced
- [ ] Auto-disable works
- [ ] Error handling works (click status bar, see errors)
- [ ] Status bar updates correctly
- [ ] Modals show at limit
- [ ] Performance unchanged (measure generation times)

---

## Migration Strategy

### Phase 1: Package Setup (Day 1-2)

**Objective**: Create package structure, define interfaces, validate build.

**Tasks**:
1. Create `packages/mcp-hosting/` directory structure
2. Create `package.json`, `tsconfig.json`, `vitest.config.ts`
3. Define abstract interfaces in `src/adapters/`
4. Create basic `src/index.ts` exporting interfaces
5. Validate package builds: `pnpm --filter @tars/mcp-hosting build`
6. Validate tests run: `pnpm --filter @tars/mcp-hosting test`

**Validation**:
- Package recognized by workspace
- Build succeeds
- Tests run (even if no tests yet)

**Rollback**: Delete `packages/mcp-hosting/` directory

---

### Phase 2: Core Extraction (Day 2-4)

**Objective**: Extract manager, executor, caching, retry logic.

**Tasks**:
1. Copy `managerMCPUse.ts` → `src/manager/MCPServerManager.ts`
2. Refactor to use ILogger, IStatusReporter
3. Copy supporting files (mcpUseAdapter, utils, ServerHealth)
4. Copy `executor.ts` → `src/executor/ToolExecutor.ts`
5. Refactor to use ILogger, IStatusReporter, INotificationHandler
6. Extract ExecutionTracker, DocumentSessionManager
7. Copy caching files → `src/caching/`
8. Copy retry files → `src/retry/`
9. Copy error files → `src/errors/`
10. Copy type files → `src/types/`
11. Update all imports
12. Create `src/index.ts` with public API exports

**Validation at Each Step**:
- Package builds: `pnpm build`
- Types check: `pnpm typecheck`
- No Obsidian dependencies: `pnpm list obsidian` (should be empty)

**Rollback**: Revert commits, restore plugin files

---

### Phase 3: Testing (Day 4-5)

**Objective**: Move tests, ensure all pass, achieve >90% coverage.

**Tasks**:
1. Copy unit tests from plugin → package
2. Update imports to use new package
3. Replace Obsidian mocks with interface mocks
4. Run unit tests: `pnpm test`
5. Copy integration tests from plugin → package
6. Update integration test imports
7. Create E2E tests
8. Run all tests: `pnpm test`
9. Generate coverage: `pnpm test:coverage`
10. Validate coverage >90%

**Validation**:
- All tests pass
- Coverage >90%
- No Obsidian imports in tests

**Rollback**: Revert test changes, keep plugin tests

---

### Phase 4: Plugin Integration (Day 5-6)

**Objective**: Update plugin to use extracted package, validate functionality.

**Tasks**:
1. Add `@tars/mcp-hosting` dependency to plugin `package.json`
2. Create `src/mcp/adapters/ObsidianLogger.ts`
3. Create `src/mcp/adapters/StatusBarReporter.ts`
4. Create `src/mcp/adapters/ModalNotifier.ts`
5. Update `src/main.ts` to use package + adapters
6. Update plugin tests to import from package
7. Remove old MCP files from plugin:
   - `git rm src/mcp/managerMCPUse.ts`
   - `git rm src/mcp/executor.ts`
   - `git rm src/mcp/resultCache.ts`
   - `git rm src/mcp/toolDiscoveryCache.ts`
   - `git rm src/mcp/toolResultCache.ts`
   - `git rm src/mcp/retryUtils.ts`
   - `git rm src/mcp/utils.ts`
   - `git rm src/mcp/mcpUseAdapter.ts`
   - `git rm src/mcp/errors.ts`
8. Run plugin tests: `pnpm --filter obsidian-tars test`
9. Build plugin: `pnpm --filter obsidian-tars build`
10. Test in Obsidian test vault

**Validation**:
- All 429+ plugin tests pass
- Plugin loads in Obsidian
- All MCP features work
- No performance regression

**Rollback**: Restore old MCP files, remove adapters, revert main.ts

---

### Phase 5: Documentation (Day 6-7)

**Objective**: Create comprehensive documentation for package and migration.

**Tasks**:
1. Write `packages/mcp-hosting/README.md` (overview, installation, basic usage)
2. Write `packages/mcp-hosting/docs/API.md` (full API reference)
3. Write `packages/mcp-hosting/docs/INTEGRATION.md` (integration guide)
4. Write `packages/mcp-hosting/docs/EXAMPLES.md` (usage examples)
5. Update root `CLAUDE.md` (add mcp-hosting package info)
6. Update `docs/MCP_ARCHITECTURE.md` (update diagrams, add extraction info)
7. Update root `README.md` (add mcp-hosting reference)
8. Create `docs/2025-10-12-mcp-hosting-migration-guide.md` (comprehensive migration guide)

**Validation**:
- Documentation complete
- Examples work
- Architecture diagrams accurate

**Rollback**: Delete new docs, revert updates

---

### Phase 6: Final Validation & Merge (Day 7)

**Objective**: Final checks, create PR, merge to main.

**Tasks**:
1. Run all tests in both packages:
   - `pnpm --filter @tars/mcp-hosting test`
   - `pnpm --filter obsidian-tars test`
2. Build both packages:
   - `pnpm --filter @tars/mcp-hosting build`
   - `pnpm --filter obsidian-tars build`
3. Test plugin in Obsidian (full manual testing checklist)
4. Run validation script: `./scripts/validate-extraction.sh` (create this)
5. Check git status, review all changes
6. Create PR with comprehensive description
7. Review PR
8. Merge to main
9. Update Trello board

**Validation Script** (`scripts/validate-extraction.sh`):
```bash
#!/bin/bash
set -e

echo "🔍 Validating MCP Hosting extraction..."

# 1. Build both packages
echo "📦 Building packages..."
pnpm --filter @tars/mcp-hosting build
pnpm --filter obsidian-tars build

# 2. Run tests
echo "🧪 Running tests..."
pnpm --filter @tars/mcp-hosting test
pnpm --filter obsidian-tars test

# 3. Check coverage
echo "📊 Checking coverage..."
pnpm --filter @tars/mcp-hosting test:coverage

# 4. Lint
echo "🔍 Linting..."
pnpm --filter @tars/mcp-hosting lint
pnpm --filter obsidian-tars lint

# 5. Type check
echo "📝 Type checking..."
pnpm --filter @tars/mcp-hosting typecheck
pnpm --filter obsidian-tars typecheck:build
pnpm --filter obsidian-tars typecheck:tests

# 6. Check for Obsidian dependencies in mcp-hosting
echo "🚫 Checking for Obsidian dependencies in mcp-hosting..."
cd packages/mcp-hosting
if pnpm list obsidian 2>/dev/null | grep -q "obsidian"; then
  echo "❌ ERROR: mcp-hosting has Obsidian dependency!"
  exit 1
fi
cd ../..

echo "✅ All validation checks passed!"
```

**Rollback**: Revert merge commit if issues found after merge

---

## Risk Management

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tests fail after extraction | Medium | High | Incremental extraction, test at each step, feature branch |
| Plugin breaks after integration | Medium | High | Thorough testing, validation checklist, rollback plan |
| Missing dependencies in package | Low | Medium | Audit dependencies before extraction, test build early |
| API design too rigid | Low | Medium | Start with interfaces matching current usage, iterate |
| Performance regression | Low | Medium | Run benchmarks before/after, measure generation times |
| Type errors after extraction | Medium | Medium | Type check at each step, use strict TypeScript |
| Integration complexity | Medium | Medium | Create adapters early, test integration incrementally |
| Documentation incomplete | Medium | Low | Create docs as part of extraction, not after |
| Git history confusion | Low | Low | Use `git mv`, clear commit messages |

---

### Mitigation Strategies

**For Test Failures**:
- Test after each extraction step (don't batch)
- Keep plugin tests running during extraction
- Use feature branch, don't merge until all pass

**For Plugin Breakage**:
- Create adapters first, test individually
- Update plugin incrementally
- Full manual testing checklist before merge

**For Missing Dependencies**:
- Audit `package.json` before extraction
- Check imports for external deps
- Test build early and often

**For API Design Issues**:
- Start with current plugin usage patterns
- Can refactor API in v3.6.0 if needed
- Get feedback from AI/community

**For Performance Regression**:
- Measure before: generation times, test duration
- Measure after: same metrics
- Compare and investigate if >10% difference

---

## Success Criteria

### Must Have (Blocking)

- ✅ All 429+ plugin tests pass
- ✅ All new package tests pass (unit + integration + E2E)
- ✅ Package test coverage >90%
- ✅ Plugin functionality unchanged (zero regression)
- ✅ Package builds successfully
- ✅ Plugin builds successfully
- ✅ No Obsidian dependencies in `@tars/mcp-hosting`
- ✅ Clean public API with type definitions
- ✅ Abstract interfaces defined and documented
- ✅ Plugin integration via adapters works correctly

### Should Have (Important but not blocking)

- ✅ API documentation complete (`API.md`)
- ✅ Integration guide complete (`INTEGRATION.md`)
- ✅ Usage examples complete (`EXAMPLES.md`)
- ✅ Migration guide complete
- ✅ Architecture diagrams updated
- ✅ Package README comprehensive

### Nice to Have (Future work)

- ⚠️ Package published to npm (can defer to v3.6.0)
- ⚠️ CLI tool using package (can defer to v3.6.0)
- ⚠️ Provider adapters extracted (can defer to v3.6.0)
- ⚠️ Performance benchmarks documented

---

## Timeline

| Phase | Duration | Days | Tasks |
|-------|----------|------|-------|
| **Phase 1** | 1-2 days | Day 1-2 | Package setup, interface definition, validation |
| **Phase 2** | 2-3 days | Day 2-4 | Extract manager, executor, caching, retry |
| **Phase 3** | 1 day | Day 4-5 | Move tests, ensure coverage |
| **Phase 4** | 1 day | Day 5-6 | Plugin integration, adapters, validation |
| **Phase 5** | 1 day | Day 6-7 | Documentation, migration guide |
| **Phase 6** | 0.5 days | Day 7 | Final validation, PR, merge |

**Total**: 5-7 days

**Start Date**: 2025-10-12
**Target Completion**: 2025-10-19

---

## Architecture Decision Records

### ADR-004: Extract MCP Hosting to Standalone Package

**Status**: Accepted

**Context**:
- MCP hosting logic tightly coupled to Obsidian plugin
- Cannot reuse in other applications (CLI, web, other editors)
- Testing requires complex Obsidian mocks
- Cannot publish MCP hosting independently

**Decision**: Extract MCP server lifecycle, execution, caching, and retry logic into `@tars/mcp-hosting` package with abstract interfaces.

**Consequences**:
- ✅ Reusable in any Node.js application
- ✅ Testable without Obsidian mocks
- ✅ Clear separation of concerns (hosting vs UI)
- ✅ Publishable to npm for community use
- ✅ Independent versioning
- ⚠️ Requires adapter layer in plugin (one-time cost)
- ⚠️ Initial extraction effort (~5-7 days)

---

### ADR-005: Use Abstract Interfaces for Host Integration

**Status**: Accepted

**Context**:
- Package needs to log, report status, show notifications
- Cannot depend on Obsidian APIs
- Want flexibility for different hosts (CLI, web, editors)
- Want clear integration contract

**Decision**: Define abstract interfaces (`ILogger`, `IStatusReporter`, `INotificationHandler`) with default no-op implementations.

**Consequences**:
- ✅ Package works in any environment
- ✅ Clear integration contract
- ✅ Easy to test with mocks
- ✅ Flexible for future hosts
- ✅ Host chooses implementation (console, file, UI, metrics)
- ⚠️ Plugin must implement adapters (straightforward, ~50 lines each)

---

### ADR-006: Keep Provider Adapters in Plugin (For Now)

**Status**: Accepted

**Context**:
- Provider adapters could be extracted
- They have some Obsidian type dependencies (Message, Editor)
- Extracting would increase complexity and timeline
- May want to extract later if other hosts need them

**Decision**: Keep provider adapters (`providerAdapters.ts`, `toolCallingCoordinator.ts`, etc.) in plugin for initial extraction. Defer to v3.6.0 or later.

**Consequences**:
- ✅ Faster initial extraction
- ✅ Lower risk of breaking changes
- ✅ Can extract later if needed
- ✅ Plugin keeps ownership of AI integration details
- ⚠️ Some duplication if other hosts need provider adapters
- ⚠️ Future extraction may require breaking changes

**Rationale**: Provider integration is plugin-specific for now. If other hosts (CLI, web) need AI integration, we can extract then with lessons learned.

---

## Post-Extraction Next Steps

After successful extraction:

### v3.5.0 (Immediate)

1. Ship v3.5.0 with extracted package
2. Monitor for issues in production
3. Gather feedback on API

### v3.6.0 (1-2 months)

1. Publish `@tars/mcp-hosting` to npm
2. Create CLI tool using package (validates reusability)
3. Extract provider adapters if other hosts need them
4. Consider extracting `@tars/mcp-providers` package
5. Add more cache strategies (Redis, file-based)
6. Add execution history viewer UI

### v4.0.0 (3-6 months)

1. React migration (see `docs/migrate-to-react/`)
2. Consider web-based MCP tool browser
3. Consider Obsidian mobile support (if feasible)

---

## Appendix

### File Mapping

**From Plugin → To Package**:

| Plugin File | Package File | Notes |
|-------------|--------------|-------|
| `src/mcp/managerMCPUse.ts` | `src/manager/MCPServerManager.ts` | Refactor: use ILogger, IStatusReporter |
| `src/mcp/executor.ts` | `src/executor/ToolExecutor.ts` | Refactor: use ILogger, IStatusReporter, INotificationHandler |
| `src/mcp/resultCache.ts` | `src/caching/ResultCache.ts` | Refactor: use ILogger |
| `src/mcp/toolDiscoveryCache.ts` | `src/caching/ToolDiscoveryCache.ts` | Refactor: use ILogger |
| `src/mcp/toolResultCache.ts` | `src/caching/ToolResultCache.ts` | Refactor: use ILogger |
| `src/mcp/retryUtils.ts` | `src/retry/RetryExecutor.ts` | Extract: RetryPolicy separate file |
| `src/mcp/errors.ts` | `src/errors/index.ts` | Copy as-is |
| `src/mcp/types.ts` | `src/types/index.ts` | Copy as-is, may split |
| `src/mcp/config.ts` | `src/types/config.ts` | Copy as-is |
| `src/mcp/utils.ts` | `src/manager/utils.ts` | Copy as-is |
| `src/mcp/mcpUseAdapter.ts` | `src/manager/mcpUseAdapter.ts` | Copy as-is |

**Tests from Plugin → To Package**:

| Plugin Test | Package Test | Notes |
|-------------|--------------|-------|
| `tests/mcp/managerMCPUse.test.ts` | `tests/unit/manager/MCPServerManager.test.ts` | Remove Obsidian mocks |
| `tests/mcp/executor.test.ts` | `tests/unit/executor/ToolExecutor.test.ts` | Remove Obsidian mocks |
| `tests/mcp/resultCache.test.ts` | `tests/unit/caching/ResultCache.test.ts` | Remove Obsidian mocks |
| `tests/mcp/toolDiscoveryCache.test.ts` | `tests/unit/caching/ToolDiscoveryCache.test.ts` | Remove Obsidian mocks |
| `tests/mcp/toolResultCache.test.ts` | `tests/unit/caching/ToolResultCache.test.ts` | Remove Obsidian mocks |
| `tests/mcp/retryUtils.test.ts` | `tests/unit/retry/RetryExecutor.test.ts` | Remove Obsidian mocks |
| `tests/integration/toolExecution.test.ts` | `tests/integration/toolExecution.test.ts` | Remove Obsidian mocks |
| `tests/integration/documentSessionHandlers.test.ts` | `tests/integration/documentSessionHandlers.test.ts` | Remove Obsidian mocks |

---

### Dependencies Audit

**Required in Package**:
- `@modelcontextprotocol/sdk`: ^1.18.2 (MCP SDK)
- `mcp-use`: ^0.1.0 (MCP client library)
- `async-mutex`: ^0.5.0 (Concurrency control)
- `p-limit`: ^7.1.1 (Parallel execution limits)
- `debug`: ^4.4.3 (Debugging - optional, could use ILogger instead)

**NOT Required** (Obsidian-specific):
- `obsidian`: Plugin only
- `axios`: Plugin only (OpenAI, Claude clients)
- `ollama`: Plugin only
- `@anthropic-ai/sdk`: Plugin only
- `@google/generative-ai`: Plugin only
- `openai`: Plugin only

**Dev Dependencies**:
- TypeScript, Vitest, tsup (build tooling)
- Standard dev tools

---

### Public API Surface

**Classes**:
- `MCPServerManager` - Server lifecycle management
- `ToolExecutor` - Tool execution with limits
- `ResultCache` - Tool result caching
- `ToolDiscoveryCache` - Tool discovery caching
- `DocumentToolCache` - Document-scoped tool cache
- `ServerHealthMonitor` - Health monitoring
- `ExecutionStatistics` - Execution statistics

**Interfaces**:
- `ILogger` - Logging interface
- `IStatusReporter` - Status reporting interface
- `INotificationHandler` - Notification interface

**Default Implementations**:
- `NoOpLogger` - Silent logger
- `ConsoleLogger` - Console logger
- `NoOpStatusReporter` - No-op status reporter
- `DefaultNotificationHandler` - Default notification handler

**Types**:
- `MCPServerConfig` - Server configuration
- `ToolExecutionRequest` - Tool execution request
- `ToolExecutionResult` - Tool execution result
- `DocumentSessionState` - Document session state
- `RetryPolicy` - Retry policy configuration
- `ServerHealthStatus` - Server health status
- `ExecutionHistoryEntry` - Execution history entry
- `ConnectionState` - Connection state enum
- `ExecutionStatus` - Execution status enum

**Factory Functions**:
- `createMCPManager()` - Create manager with defaults
- `createToolExecutor()` - Create executor with defaults
- `createExecutionTracker()` - Create tracker with defaults

**Constants**:
- `DEFAULT_MCP_TIMEOUT` - 30000ms
- `DEFAULT_CONCURRENT_LIMIT` - 3
- `DEFAULT_SESSION_LIMIT` - 50
- `DEFAULT_RETRY_POLICY` - Retry policy configuration

---

## Document Status

**Status**: ✅ Complete
**Epic**: Epic-1200
**Last Updated**: 2025-10-12
**Next Review**: After extraction completion

---

**End of Document**
