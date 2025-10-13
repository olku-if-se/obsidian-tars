# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Obsidian Tars** is an Obsidian plugin that provides AI text generation through tag-based conversations. Users interact with multiple LLM providers (Claude, OpenAI, DeepSeek, Gemini, etc.) by typing tags like `#User :` and `#Claude :` in their notes. The plugin also features Model Context Protocol (MCP) integration for AI tool calling.

## Monorepo Structure

This project uses a **monorepo** setup with **pnpm** and **Turborepo**:

```
obsidian-tars/                  # Monorepo root
├── packages/
│   ├── plugin/                 # Main Obsidian plugin
│   │   ├── src/                # Source code
│   │   ├── tests/              # Test files
│   │   ├── scripts/            # Build scripts
│   │   └── package.json        # Plugin dependencies
│   ├── logger/                 # @tars/logger - Shared logging utilities
│   ├── mcp-hosting/           # @tars/mcp-hosting - MCP server infrastructure
│   ├── streams/               # @tars/streams - Text editing utilities
│   └── ui/                    # @tars/ui - React components with Storybook
├── pnpm-workspace.yaml         # Workspace configuration
├── turbo.json                  # Turborepo pipeline
├── biome.json                  # Code quality config
├── mise.toml                   # Task runner configuration
└── package.json                # Root package.json
```

### Workspace Packages

**@tars/logger (packages/logger/)**
- Shared logging utilities using debug library
- Workspace dependency for consistent logging across packages

**@tars/mcp-hosting (packages/mcp-hosting/)**
- Standalone MCP server hosting infrastructure
- Docker container lifecycle management
- Tool execution with concurrency limits
- Published to npm as public package

**@tars/streams (packages/streams/)**
- Text editing utilities for real-time manipulation
- TextEditStream for coordinated editor updates
- Piece table implementation for concurrent editing

**@tars/ui (packages/ui/)**
- React component library with Storybook
- Shared UI components for future web interface

## Development Commands

**Note**: All commands can be run from the monorepo root.

### Quick Start with Mise
The project includes **mise** task runner for convenient shortcuts:
```bash
# Complete test workflow (build → vault → launch)
mise test

# Start development watch mode
mise dev

# Build for production
mise build

# Run all quality checks (lint + format + tests)
mise check

# Setup development environment with symlinked vault
mise dev-setup
```

### Build and Run
```bash
# Development with watch mode (auto-rebuild on changes)
pnpm dev
# Or target plugin specifically:
pnpm --filter obsidian-tars dev

# Production build (TypeScript check + esbuild + copy files to dist/)
pnpm build
# Or target plugin:
pnpm --filter obsidian-tars build

# Type check only
pnpm typecheck:build
pnpm typecheck:tests
```

### Code Quality
```bash
# Lint with Biome (from root)
pnpm lint

# Format code with Biome
pnpm format

# Check and auto-fix issues (lint + format)
pnpm check
```

### Testing
```bash
# Run all tests
pnpm test

# Run with coverage report
pnpm test:coverage

# Watch mode with UI
pnpm test:watch

# Run specific test file
pnpm --filter obsidian-tars test -- tests/mcp/managerMCPUse.test.ts
```

### Quick Testing Workflow
The project includes shell scripts for rapid testing:
```bash
# Complete workflow (build + setup + launch)
packages/plugin/scripts/test-workflow.sh

# Or step by step:
pnpm --filter obsidian-tars build
packages/plugin/scripts/setup-test-vault.sh
packages/plugin/scripts/launch-obsidian.sh
```

After launching Obsidian, enable the plugin in Settings → Community plugins → Tars.

### Docker and MCP Tools
```bash
# Check Docker containers and MCP servers
mise docker-status

# View MCP container logs
mise docker-logs

# Stop all MCP containers
mise docker-stop
```

## Development Tooling

### Environment Configuration
- **Node 22.20.0** (managed via mise and Volta)
- **pnpm 10.18.2** for package management
- **Docker** required for MCP server functionality
- **Biome** for linting and formatting
- **Vitest** for testing with jsdom environment

### Workspace Dependencies
- Internal packages use `workspace:*` dependencies
- Shared logging via @tars/logger
- MCP infrastructure via @tars/mcp-hosting
- Text utilities via @tars/streams
- UI components via @tars/ui (React + Storybook)

## High-Level Architecture

### Core Plugin Flow

1. **main.ts (TarsPlugin)**: Plugin entry point that orchestrates initialization
   - Registers tag commands for each configured AI assistant
   - Initializes MCP server manager and executor
   - Sets up status bar manager
   - Registers editor suggests for tag completion

2. **Tag-Based Conversation System**
   - Users write conversations using markdown tags: `#User :`, `#Claude :`, `#System :`
   - Tag commands transform text at cursor into proper message format
   - `suggest.ts (TagEditorSuggest)`: Auto-completion when typing tags + space
   - Messages parsed from markdown and sent to appropriate provider

3. **Provider Architecture** (`src/providers/`)
   - Each LLM vendor has a dedicated module (claude.ts, openAI.ts, deepSeek.ts, etc.)
   - All implement the `Vendor` interface with `sendRequestFunc`
   - Providers yield text chunks via async generators for streaming responses
   - Provider adapters in `src/mcp/adapters/` convert MCP tools to provider-specific formats

4. **MCP Integration** (`src/mcp/`)
   - **MCPServerManager**: Manages lifecycle of Docker-based or remote MCP servers
   - **ToolExecutor**: Executes MCP tools with concurrency limits, session tracking, and cancellation
   - **CodeBlockProcessor**: Renders tool invocations and results in markdown code blocks
   - **Tool Calling Coordinator**: Orchestrates multi-turn AI conversations with autonomous tool execution
   - **Provider Adapters**: Convert MCP tools to native tool formats (OpenAI functions, Claude tools, Ollama tools)

### MCP Architecture Key Points

**Server Deployment Types:**
- **Managed + Stdio**: Docker containers spawned on-demand via `docker run -i --rm <image>`
- **Managed + SSE**: Pre-created Docker containers exposing HTTP endpoints
- **External + Stdio**: Connect to existing containers via `docker exec -i`
- **External + SSE**: Connect to remote HTTP servers

**Tool Execution Flow:**
1. User writes code block: ````markdown ```ServerName\ntool: create_entities\narg: value``` ````
2. CodeBlockProcessor parses YAML tool invocation
3. ToolExecutor validates limits (concurrent, session per document)
4. Executor calls MCPServerManager's client to execute tool
5. Results rendered back into the code block with metadata

**AI-Driven Tool Calling:**
- Providers with tool calling capability (OpenAI, Claude, Ollama) receive MCP tools via `injectMCPTools()`
- During generation, if AI requests a tool, `ToolCallingCoordinator` intercepts and executes it
- Tool results fed back to AI in provider-specific format
- Coordinator manages multi-turn loops until AI produces final text response

### Editor Integration

**editor.ts**: Core text generation logic
- `generate()`: Main function that reads messages from editor, sends to provider, streams response back
- `buildRunEnv()`: Resolves internal links (`[[filename]]`) to actual file content before sending to AI
- Handles abort signals, status bar updates, and error propagation

**suggests/** : Auto-completion for MCP tools
- `mcpToolSuggest.ts`: Suggests available MCP tools when typing in code blocks
- `mcpParameterSuggest.ts`: Suggests parameter names and values based on tool schema

### Settings & Configuration

**settings.ts**: Defines `PluginSettings` schema with all configuration
- Provider settings (API keys, models, base URLs)
- Tag configurations (user/system/assistant tags)
- MCP server configs (deployment type, transport, Docker settings, retry policies)
- Limits (concurrent executions, session limits, timeouts)

**settingTab.ts**: Renders settings UI in Obsidian
- Uses collapsible sections for better organization
- Handles dynamic addition/removal of providers and MCP servers
- UI state persistence (expanded/collapsed sections)

## Important Patterns and Conventions

### Provider Integration
- When adding a new provider, create `packages/plugin/src/providers/providerName.ts` with a `Vendor` export
- Register in `packages/plugin/src/settings.ts` under `availableVendors`
- If provider supports native tool calling, add adapter in `packages/plugin/src/mcp/adapters/` and update `providerToolIntegration.ts`

### MCP Tool Execution Context
- All tool executions tracked per document (`documentPath`) for session limits
- Tool results cached per document to avoid redundant executions
- Executor provides cancellation via `AbortController` and request IDs

### Message Parsing and Conversation Syntax
**Critical for proper operation:**
- Messages must be separated by **blank lines**
- Single paragraph = single message (no blank lines within)
- Conversation order: `System → (User ↔ Assistant)*` (system optional, then alternating user/assistant)
- Callout blocks (`> [!note]`) are **ignored** (won't be sent to AI - use for notes)
- `#NewChat` tag resets conversation context
- System messages always appear first in conversation
- Code blocks count as part of the message paragraph

**Tag Trigger Logic:**
- Type `#` → Obsidian's native tag completion appears
- Type space after tag → trigger assistant generation (if assistant tag) or format message (if user/system tag)
- Can also type full tag without `#` to trigger
- Tags are case-sensitive and must match settings exactly

**Example Conversation:**
```markdown
#System : You are a helpful assistant.

#User : What is 1+1?

#Claude :
```
When user types space after `#Claude :`, the plugin reads all previous messages, sends to Claude API, streams response back.

### Async Generator Pattern
All providers use async generators for streaming:
```typescript
async function* sendRequest(messages, controller): AsyncGenerator<string> {
  // Stream chunks as they arrive
  yield chunk1
  yield chunk2
  // ...
}
```

## Advanced Implementation Patterns

### Document Write Locking
- **DocumentWriteLock** ensures thread-safe document editing
- Prevents race conditions during streaming responses
- Used extensively in `editor.ts` and MCP tool execution
- Coordinates multiple concurrent text operations

### Stream Processing Architecture
- **TextEditStream** manages real-time text manipulation
- Anchor points maintain cursor position during edits
- Supports concurrent text insertion and tool execution
- Piece table implementation for efficient editing operations

### Error Ring Buffer
- **StatusBarManager** maintains last 50 errors in memory
- Sanitized logging (parameter keys only, no values)
- Click status bar to view detailed error history
- Provides context for debugging MCP and LLM issues

### Provider Integration Guide
When adding new AI providers, follow this pattern:

```typescript
// src/providers/newProvider.ts
export const newProviderVendor: Vendor = {
  name: 'newProvider',
  sendRequestFunc: (options) => async function* (messages, controller) {
    // Streaming implementation with async generators
    for await (const chunk of streamResponse(options)) {
      yield chunk
    }
  }
}
```

1. Create provider file implementing `Vendor` interface
2. Add to `availableVendors` in `settings.ts`
3. If supporting tool calling, create adapter in `src/mcp/adapters/`
4. Update `providerToolIntegration.ts` for tool integration

### Testing Strategy
- **Unit tests**: Mock MCP SDK, Docker client, and Obsidian APIs
- **Integration tests**: Test component interactions (Manager ↔ Executor ↔ CodeBlockProcessor)
- **E2E tests**: Test tool failure recovery, LLM continues after errors (see `tests/e2e/`)
- **Test files**: Organized under `tests/` matching `src/` structure
- Vitest with jsdom environment for Obsidian API mocking
- Test coverage: 279+ tests passing, focusing on error handling and resilience

#### Test Infrastructure
- **Test Structure**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **Mock Strategy**: jsdom environment for Obsidian API mocking, Docker client mocking
- **Coverage Configuration**: V8 provider with HTML reports in `coverage/`
- **Test Commands**: `pnpm test`, `pnpm test:coverage`, `pnpm test:watch`

## Common Development Tasks

### Adding a New LLM Provider
1. Create `src/providers/newProvider.ts` implementing `Vendor` interface
2. Add to `availableVendors` in `settings.ts`
3. If supporting tool calling, implement adapter in `src/mcp/adapters/NewProviderAdapter.ts`
4. Update `providerToolIntegration.ts` to include new provider in `getToolCallingModels()`

### Debugging MCP Issues
- Check Docker connectivity: MCP stdio transport spawns containers directly
- Enable `enableStreamLog` in settings for detailed logging
- Use "Browse MCP Tools" command to inspect available tools
- Check status bar for server health, retry status, and active executions
- **Click status bar on error** to open ErrorDetailModal with full error log
- Use "Copy All Logs" button to export last 50 errors as JSON for debugging
- Check Developer Console: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (macOS)
- Look for `[MCP]` prefixed logs in console for detailed traces

### Running Tests
- All tests under `packages/plugin/tests/` directory
- Use `pnpm test` for quick validation
- Use `pnpm test:coverage` to verify test coverage before PRs
- Integration tests in `packages/plugin/tests/integration/` cover cross-module flows

### Build Output
- esbuild bundles `packages/plugin/src/main.ts` → `packages/plugin/dist/main.js`
- Build script copies `manifest.json` and `styles.css` to `packages/plugin/dist/`
- Plugin loaded from `packages/plugin/dist/` directory in Obsidian vault

## Key Files Reference

**Note**: All source files are under `packages/plugin/`

| File | Purpose |
|------|---------|
| `packages/plugin/src/main.ts` | Plugin entry point, orchestrates initialization |
| `packages/plugin/src/editor.ts` | Core text generation logic, message parsing |
| `packages/plugin/src/suggest.ts` | Tag auto-completion (EditorSuggest) |
| `packages/plugin/src/settings.ts` | Settings schema and defaults |
| `packages/plugin/src/settingTab.ts` | Settings UI rendering |
| `packages/plugin/src/mcp/managerMCPUse.ts` | MCP server lifecycle manager |
| `packages/plugin/src/mcp/executor.ts` | Tool execution with limits and cancellation |
| `packages/plugin/src/mcp/toolCallingCoordinator.ts` | Multi-turn AI tool calling orchestration |
| `packages/plugin/src/mcp/providerToolIntegration.ts` | Inject MCP tools into provider requests |
| `packages/plugin/src/statusBarManager.ts` | Status bar display (character count, MCP status) |
| `packages/plugin/src/commands/asstTag.ts` | Assistant tag command (triggers AI generation) |

## MCP Code Block Syntax

Users execute MCP tools via markdown code blocks. The syntax is critical for proper execution:

````markdown
```ServerName
tool: tool_name
parameter1: value1
parameter2: value2
nested:
  key: value
  list: [1, 2, 3]
```
````

**Important Details:**
- Code fence language **must match** Server Name from settings (case-sensitive)
- First line must be `tool: tool_name`
- Parameters use YAML format (parsed by `yaml` library)
- Execution happens when switching to Reading Mode or in Live Preview
- Results rendered inline by CodeBlockProcessor with collapsible JSON/metadata

**AI Autonomous Tool Calling:**
When AI providers support native tool calling (OpenAI, Claude, Ollama with llama3.2), tools are injected into the request automatically. The AI can decide to call tools during generation, and ToolCallingCoordinator manages the multi-turn loop.

## Error Handling Philosophy

**Resilience First**: Tool failures never block LLM responses. The system follows this pattern:

1. **Error Capture**: All MCP errors caught at Manager, Executor, or Coordinator level
2. **Logging**: Errors logged to StatusBarManager's ring buffer (max 50 entries) with sanitized context
3. **Parameter Sanitization**: Only parameter keys logged, never values (prevents leaking API keys, passwords)
4. **LLM Integration**: Errors formatted as tool result messages and added to conversation
5. **Graceful Degradation**: LLM sees the error, acknowledges it, and continues response

**User Impact:**
- Status bar shows error state (🔴 icon) when errors occur
- Click status bar to open ErrorDetailModal with full log history
- Copy individual errors or all logs for debugging
- LLM responses acknowledge tool failures naturally without exposing technical details

**Error Types:**
- `generation`: LLM API errors (rate limits, invalid keys)
- `mcp`: Server lifecycle errors (start failed, connection lost)
- `tool`: Tool execution errors (timeout, invalid params)
- `system`: Plugin system errors (config issues, initialization failures)

See `docs/mcp-error-handling.md` for comprehensive error handling documentation.

## Configuration Notes

### MCP Server Configuration
MCP servers configured via settings with these fields:
- `id`, `name`, `enabled`: Basic identification
- `deploymentType`: `"managed"` (Tars controls lifecycle) or `"external"` (user-managed)
- `transport`: `"stdio"` (stdin/stdout) or `"sse"` (HTTP/SSE)
- `dockerConfig`: Container image, name, ports (if applicable)
- `sseConfig`: URL for SSE endpoint (if applicable)

### Retry and Health Monitoring
- Auto-retry with exponential backoff for transient failures
- Health checks every 30s detect dead servers
- Servers auto-disabled after reaching failure threshold
- Status bar shows retry status and next retry time

### Tool Execution Limits
- **Concurrent limit**: Max simultaneous tool executions across all servers
- **Session limit**: Max tool executions per document (prevents infinite loops)
- **Timeout**: Per-tool execution timeout (default 30s)

## Environment and Dependencies

### Node Version and Tools
- **Node 22.20.0** (managed via mise and Volta)
- **pnpm 10.18.2** for package management
- **Docker** required for MCP server functionality

### Key Dependencies
- **@modelcontextprotocol/sdk**: MCP integration
- **obsidian**: Obsidian plugin API
- **async-mutex**: Document write locking
- **debug**: Logging throughout application
- **Biome**: Code quality (linting + formatting)
- **Vitest**: Testing framework with jsdom mocking

## Current Development Status

**Active Epic Work** (as of 2025-10):
- **Epic-100 to Epic-400**: ✅ Completed (critical fixes, core features, performance, UX)
- **Epic-900**: 🚧 In Progress (document-scoped sessions, enhanced status bar) - See `docs/2025-10-07-075907-tasks-trimmed.md`
- **Epic-1000**: 📋 Planned (LLM provider connection testing)
- **Epic-500-600**: 📋 Backlog (parallel execution, caching, testing infrastructure)

**For Implementation Work**: Refer to timestamped planning documents for current tasks and acceptance criteria:
- `docs/2025-10-07-075907-tasks-trimmed.md` - Active backlog with task breakdown
- `docs/2025-10-03-planning-v2.md` - Comprehensive implementation plan
- `docs/2025-10-03-115553-planning.md` - Original detailed planning

**Note**: The planning documents use an Epic → Feature → UserStory → Task hierarchy with story points. Always check the "Status" markers in task documents for current progress.

## Additional Documentation

For deeper dives into specific topics, see:

- **`docs/MCP_ARCHITECTURE.md`** - Detailed MCP server deployment types, transport mechanisms, and Docker integration
- **`docs/MCP_USER_GUIDE.md`** - User-facing guide for executing MCP tools via code blocks
- **`docs/MCP_QUICK_START.md`** - 5-minute setup guide for MCP servers
- **`docs/mcp-error-handling.md`** - Comprehensive error handling patterns, logging, and debugging
- **`docs/TESTING.md`** - Manual testing guide, test vault setup, and validation checklists
- **`docs/QUICK-START.md`** - Development workflow with shell scripts
- **`README.md`** - User-facing feature documentation and provider setup

## Linting and Formatting
This project uses **Biome** (migrated from ESLint + Prettier) for all code quality checks. Configuration in `biome.json`.
