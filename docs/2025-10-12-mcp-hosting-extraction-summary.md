# MCP Hosting Extraction - Quick Reference

**Epic**: Epic-1200: MCP Hosting Package Extraction
**Priority**: P1 - Critical
**Story Points**: 34 SP
**Duration**: 5-7 days (2025-10-12 to 2025-10-19)
**Status**: 📋 Planning

---

## 🎯 What Are We Extracting?

Extract MCP server hosting logic from Obsidian plugin into standalone `@tars/mcp-hosting` package.

**Logic to Extract**:
- ✅ Server lifecycle management (start, stop, health monitoring)
- ✅ Tool execution with limits (concurrent, session, timeout)
- ✅ Caching layer (result cache, tool discovery cache)
- ✅ Retry logic (exponential backoff, error classification)
- ✅ Document-scoped session tracking
- ✅ Error handling and sanitization

**Stays in Plugin**:
- ❌ UI components (code blocks, modals, status bar, settings)
- ❌ Obsidian-specific integrations (editor, commands, suggests)
- ❌ AI provider adapters (defer to v3.6.0)

---

## 📦 Package Structure

```
packages/mcp-hosting/
├── src/
│   ├── manager/          # MCPServerManager, health monitoring
│   ├── executor/         # ToolExecutor, session tracking
│   ├── caching/          # ResultCache, ToolDiscoveryCache
│   ├── retry/            # Retry logic, error classification
│   ├── adapters/         # Abstract interfaces (ILogger, etc.)
│   ├── types/            # Core type definitions
│   ├── errors/           # Error classes
│   └── index.ts          # Public API
├── tests/
│   ├── unit/             # Unit tests (>90% coverage target)
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
└── docs/
    ├── API.md            # API reference
    ├── INTEGRATION.md    # Integration guide
    └── EXAMPLES.md       # Usage examples
```

---

## 🔌 Abstract Interfaces

Key to making package reusable:

```typescript
// Host provides logging implementation
interface ILogger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: Error, context?: Record<string, unknown>): void
}

// Host provides status reporting implementation
interface IStatusReporter {
  reportServerStatus(serverId: string, status: 'connected' | 'disconnected' | 'error' | 'retrying'): void
  reportActiveExecutions(count: number): void
  reportSessionCount(documentPath: string, count: number, limit: number): void
  reportError(type: string, message: string, error: Error, context?: Record<string, unknown>): void
}

// Host provides notification implementation
interface INotificationHandler {
  onSessionLimitReached(documentPath: string, limit: number, current: number): Promise<'continue' | 'cancel'>
  onSessionReset(documentPath: string): void
  onServerAutoDisabled(serverId: string, serverName: string, failureCount: number): void
}
```

**Default Implementations**: NoOpLogger, ConsoleLogger, NoOpStatusReporter, DefaultNotificationHandler

**Plugin Implements**: ObsidianLogger, StatusBarReporter, ModalNotifier

---

## 📋 Task Breakdown

### Feature-1200-10: Package Structure & Core Logic (8 SP)

**UserStory-1200-10-5: Create Package Structure (3 SP)**
- Initialize package directory, package.json, tsconfig.json
- Define abstract interfaces with default implementations

**UserStory-1200-10-10: Extract Server Manager (5 SP)**
- Extract MCPServerManager core logic
- Extract supporting files (mcpUseAdapter, utils, ServerHealth)
- Create manager unit tests

---

### Feature-1200-20: Execution & Caching Layer (10 SP)

**UserStory-1200-20-5: Extract Tool Executor (5 SP)**
- Extract ToolExecutor core logic
- Extract ExecutionTracker, DocumentSessionManager
- Create executor unit tests

**UserStory-1200-20-10: Extract Caching Layer (5 SP)**
- Extract ResultCache, ToolResultCache
- Extract ToolDiscoveryCache
- Create cache unit tests

---

### Feature-1200-30: Retry & Error Handling (6 SP)

**UserStory-1200-30-5: Extract Retry Logic (3 SP)**
- Extract retry policy and executor
- Extract error classes
- Create retry unit tests

---

### Feature-1200-40: Testing & Validation (5 SP)

**UserStory-1200-40-5: Create Integration Tests (3 SP)**
- Copy and update integration tests from plugin
- Create E2E tests for full workflow

**UserStory-1200-40-10: Validate Plugin Integration (2 SP)**
- Update plugin to use package
- Create Obsidian adapters
- Run full plugin test suite (all 429+ tests must pass)

---

### Feature-1200-50: Documentation & Migration (5 SP)

**UserStory-1200-50-5: Create Package Documentation (3 SP)**
- Write API documentation
- Write integration guide with examples
- Update project documentation

**UserStory-1200-50-10: Create Migration Guide (2 SP)**
- Document what was extracted, what changed
- Testing strategy and rollback plan

---

## 🚀 Quick Start After Extraction

**Using in Plugin**:
```typescript
import { MCPServerManager, ToolExecutor } from '@tars/mcp-hosting'
import { ObsidianLogger, StatusBarReporter, ModalNotifier } from './mcp/adapters'

// Initialize with Obsidian-specific adapters
const manager = new MCPServerManager({
  logger: new ObsidianLogger(this.app),
  statusReporter: new StatusBarReporter(this.statusBarManager),
  failureThreshold: 3
})

await manager.initialize(this.settings.mcpServers)

const executor = new ToolExecutor(manager, {
  concurrentLimit: this.settings.mcpConcurrentLimit,
  sessionLimit: this.settings.mcpSessionLimit,
  logger: new ObsidianLogger(this.app),
  statusReporter: new StatusBarReporter(this.statusBarManager),
  notificationHandler: new ModalNotifier(this.app)
})
```

**Using in Standalone App**:
```typescript
import { MCPServerManager, ToolExecutor, ConsoleLogger } from '@tars/mcp-hosting'

// Initialize with console logger (no UI)
const manager = new MCPServerManager({
  logger: new ConsoleLogger('[MCP]'),
  failureThreshold: 3
})

await manager.initialize([
  {
    id: 'filesystem',
    name: 'Filesystem',
    configInput: 'npx @modelcontextprotocol/server-filesystem /path',
    enabled: true,
    failureCount: 0,
    autoDisabled: false
  }
])

const executor = new ToolExecutor(manager, {
  concurrentLimit: 3,
  sessionLimit: 50,
  logger: new ConsoleLogger('[MCP]')
})

// Execute tool
const result = await executor.executeTool({
  serverId: 'filesystem',
  toolName: 'read_file',
  parameters: { path: '/path/to/file.txt' },
  source: 'user-codeblock',
  documentPath: 'document.md'
})
```

---

## ✅ Success Criteria

### Must Have (Blocking)

- ✅ All 429+ plugin tests pass
- ✅ All new package tests pass (unit + integration + E2E)
- ✅ Package test coverage >90%
- ✅ Plugin functionality unchanged (zero regression)
- ✅ No Obsidian dependencies in `@tars/mcp-hosting`
- ✅ Clean public API with TypeScript definitions
- ✅ Abstract interfaces defined and documented

### Should Have (Important)

- ✅ API documentation complete
- ✅ Integration guide complete
- ✅ Migration guide complete
- ✅ Architecture diagrams updated

### Nice to Have (Future)

- ⚠️ Package published to npm (defer to v3.6.0)
- ⚠️ CLI tool using package (defer to v3.6.0)
- ⚠️ Provider adapters extracted (defer to v3.6.0)

---

## 🔄 Workflow

### Phase 1: Package Setup (Day 1-2)
1. Create package structure
2. Define abstract interfaces
3. Validate build and tests run

### Phase 2: Core Extraction (Day 2-4)
1. Extract MCPServerManager
2. Extract ToolExecutor
3. Extract caching layer
4. Extract retry logic
5. Update imports and types

### Phase 3: Testing (Day 4-5)
1. Move unit tests to package
2. Move integration tests to package
3. Create E2E tests
4. Validate all tests pass

### Phase 4: Plugin Integration (Day 5-6)
1. Create Obsidian adapters
2. Update plugin to use package
3. Remove old files from plugin
4. Test plugin in Obsidian

### Phase 5: Documentation (Day 6-7)
1. Write API documentation
2. Write integration guide
3. Update project docs
4. Create migration guide

### Phase 6: Final Validation (Day 7)
1. Run validation script
2. Create PR
3. Merge to main

---

## 🔙 Rollback Plan

### Quick Rollback (feature branch)
```bash
git checkout main
git branch -D feature/mcp-hosting-extraction
```

### Manual Rollback (after merge)
```bash
git revert <merge-commit-sha> -m 1
```

**Prevention**: Work on feature branch, validate thoroughly before merge

---

## 📊 Timeline

| Day | Phase | Tasks |
|-----|-------|-------|
| **Day 1-2** | Package Setup | Structure, interfaces, validation |
| **Day 2-4** | Core Extraction | Manager, executor, caching, retry |
| **Day 4-5** | Testing | Unit, integration, E2E tests |
| **Day 5-6** | Plugin Integration | Adapters, validation |
| **Day 6-7** | Documentation | API docs, guides |
| **Day 7** | Final Validation | PR, merge |

**Total**: 5-7 days

---

## 🎭 Architecture Decisions

**ADR-004**: Extract MCP Hosting to Standalone Package
- **Decision**: Extract for reusability
- **Benefit**: Use in any Node.js app
- **Cost**: Initial extraction effort (~5-7 days)

**ADR-005**: Use Abstract Interfaces for Host Integration
- **Decision**: Define ILogger, IStatusReporter, INotificationHandler
- **Benefit**: Works in any environment, clear contract
- **Cost**: Plugin must implement adapters (~50 lines each)

**ADR-006**: Keep Provider Adapters in Plugin (For Now)
- **Decision**: Defer provider adapter extraction to v3.6.0
- **Benefit**: Faster initial extraction, lower risk
- **Cost**: Some duplication if other hosts need providers

---

## 📚 Related Documents

- **Full Plan**: [`2025-10-12-mcp-hosting-extraction-plan.md`](./2025-10-12-mcp-hosting-extraction-plan.md)
- **Monorepo Migration**: [`2025-10-12-monorepo-migration-plan.md`](./2025-10-12-monorepo-migration-plan.md)
- **Current Planning**: [`2025-10-12-planning.md`](./2025-10-12-planning.md)

---

## 🚦 Next Steps

1. **Review this plan** and get approval
2. **Create Trello cards** for Epic-1200
3. **Create feature branch** `feature/mcp-hosting-extraction`
4. **Execute extraction** following detailed plan
5. **Validate thoroughly** (all tests must pass!)
6. **Update documentation**
7. **Merge to main**

---

**Status**: 📋 Awaiting Approval
**Owner**: Development Team
**Created**: 2025-10-12
