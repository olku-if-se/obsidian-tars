# @tars/providers

AI provider implementations for TARS - a standalone package containing vendor-specific LLM integrations.

## Purpose

The `@tars/providers` package serves as the core abstraction layer for various AI service providers (OpenAI, Claude, Azure, Ollama, etc.). It provides a unified interface for interacting with different LLM APIs while maintaining provider-specific features and capabilities.

## Package Responsibilities

### Core Responsibilities

- **Vendor Abstraction**: Provide a consistent `Vendor` interface across all AI providers
- **API Implementations**: Handle provider-specific API communication, authentication, and request/response formatting
- **Capability Management**: Define and expose provider capabilities (Tool Calling, Vision, Reasoning, etc.)
- **Model Management**: Maintain lists of supported models for each provider
- **Connection Testing**: Provide utilities to test provider connectivity and validate credentials
- **Configuration Defaults**: Supply sensible default configurations for each provider

### Boundary: What This Package Does NOT Handle

- ❌ **MCP Integration**: Tool calling coordination and MCP server management (handled by plugin package)
- ❌ **Obsidian Integration**: UI components, editor integration, and plugin lifecycle (handled by plugin package)
- ❌ **Conversation Management**: Message parsing, conversation state, and tag processing (handled by plugin package)
- ❌ **Settings Management**: User configuration, settings UI, and persistence (handled by plugin package)
- ❌ **Stream Processing**: Real-time text editing and coordinated updates (handled by `@tars/streams`)

## MCP Tool Integration Analysis

### Overview

This package provides the foundation for Model Context Protocol (MCP) tool injection across different AI providers. The implementation supports two distinct approaches for MCP tool integration:

1. **Advanced Tool-Aware Path** - Full autonomous tool execution with coordination
2. **Simple Tool Injection Path** - Basic tool parameter injection

### Provider MCP Support Status

| Provider         | MCP Support | Integration Type | Documentation                                                                                               | Status      |
| ---------------- | ----------- | ---------------- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| **Claude**       | ✅ Full      | Advanced Path    | [Anthropic Tool Use](https://docs.anthropic.com/claude/docs/tool-use)                                       | **WORKING** |
| **OpenAI**       | ✅ Full      | Advanced Path    | [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)                         | **WORKING** |
| **Azure OpenAI** | ✅ Full      | Advanced Path    | [Azure Function Calling](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/function-calling) | **WORKING** |
| **Ollama**       | ✅ Full      | Advanced Path    | [Ollama Tool Calling](https://docs.ollama.com/capabilities/tool-calling)                                    | **WORKING** |
| **OpenRouter**   | ✅ Full      | Advanced Path    | [OpenRouter Tool Calling](https://openrouter.ai/docs/features/tool-calling)                                 | **WORKING** |
| **DeepSeek**     | ⚠️ Partial   | Simple Path      | [DeepSeek Function Calling](https://api-docs.deepseek.com/guides/function_calling)                          | **BROKEN**  |
| **SiliconFlow**  | ⚠️ Partial   | Simple Path      | [SiliconFlow Function Calling](https://docs.siliconflow.cn/cn/userguide/guides/function-calling)            | **BROKEN**  |
| **Grok**         | ⚠️ Partial   | Simple Path      | [Grok Function Calling](https://docs.x.ai/docs/guides/function-calling)                                     | **BROKEN**  |
| **Gemini**       | ❌ None      | Not Implemented  | [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)                           | **MISSING** |

### MCP Integration Architecture

#### Interface Definitions

```typescript
// Base interface for simple tool injection
export interface MCPToolInjector {
    injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>>
}

// Advanced integration with coordination
export interface MCPIntegration {
    mcpToolInjector: MCPToolInjector
    toolCallingCoordinator?: unknown
    providerAdapter?: unknown
    createToolCallingCoordinator?: () => unknown
    createProviderAdapter?: (config: unknown) => unknown
}
```

#### Provider Implementation Patterns

**Advanced Path (Claude, OpenAI, Azure, Ollama, OpenRouter):**
```typescript
// Tool-aware path with autonomous execution
if (mcpIntegration?.toolCallingCoordinator && mcpIntegration?.providerAdapter) {
    const coordinator = mcpIntegration.toolCallingCoordinator
    const adapter = mcpIntegration.providerAdapter
    
    yield* coordinator.generateWithTools(formattedMessages, adapter, mcpExec, {
        documentPath: documentPath || 'unknown.md',
        parallelExecution: pluginOpts?.mcpParallelExecution ?? false,
        maxParallelTools: pluginOpts?.mcpMaxParallelTools ?? 3,
        documentWriteLock,
        onBeforeToolExecution: beforeToolExecution
    })
}
```

**Simple Path (DeepSeek, SiliconFlow, Grok):**
```typescript
// Basic tool injection
let requestParams: Record<string, unknown> = { model, ...remains }
if (mcpToolInjector) {
    try {
        requestParams = await mcpToolInjector.injectTools(requestParams, 'ProviderName')
    } catch (error) {
        logger.warn('failed to inject MCP tools', error)
    }
}
```

### Tool Format Compliance

#### Claude (Anthropic) - ✅ Compliant
```typescript
// Matches Anthropic Tool Use API specification
{
    name: string,
    description: string,
    input_schema: JSONSchema
}
```

#### OpenAI-Compatible - ✅ Compliant
```typescript
// Matches OpenAI Function Calling API specification
{
    type: 'function',
    function: {
        name: string,
        description: string,
        parameters: JSONSchema
    }
}
```

#### Ollama - ✅ Compliant
```typescript
// Matches Ollama Tool Calling API specification
{
    type: 'function',
    function: {
        name: string,
        description: string,
        parameters: object
    }
}
```

### Critical Issues and Gaps

#### 🚨 **Critical Missing Implementations**

1. **MCPToolInjector Concrete Class**
   - Interface exists but no implementation found
   - Required for simple injection path (3 providers broken)
   - Located in: `src/interfaces/base.ts:48`

2. **Gemini MCP Integration**
   - Completely missing implementation
   - TODO comment in `src/implementations/gemini.ts:27`
   - Should use Google's function calling format

#### ⚠️ **Design Issues**

1. **Schema Validation Missing**
   ```typescript
   // Current: Blind casting with no validation
   input_schema: tool.inputSchema as AnthropicTool['input_schema']
   ```
   - No validation of JSON Schema compliance
   - No provider-specific constraint checking

2. **Inconsistent Error Handling**
   - Different error handling patterns across providers
   - No standardized fallback behavior

3. **Legacy Field Deprecation**
   ```typescript
   // Deprecated but still used
   mcpManager?: unknown
   mcpExecutor?: unknown
   ```

### MCP Tool Registration Flow

#### Registration Process

1. **Provider Options Injection** (`editor.ts:516-527`)
   ```typescript
   if (mcpManager && mcpExecutor) {
       provider.options.mcpManager = mcpManager
       provider.options.mcpExecutor = mcpExecutor
       provider.options.documentPath = env.filePath
       provider.options.statusBarManager = statusBarManager
       provider.options.pluginSettings = pluginSettings
   }
   ```

2. **Tool Discovery** (`ToolDiscoveryCache`)
   ```typescript
   const snapshot = await manager.getToolDiscoveryCache().getSnapshot()
   ```

3. **Context Building** (`providerIntegration.ts:14-70`)
   ```typescript
   const toolContext = await buildAIToolContext(manager, executor)
   ```

4. **Format Conversion** (`providerToolIntegration.ts`)
   ```typescript
   const tools = await buildToolsForProvider(providerName, manager, executor)
   ```

#### Execution Process

**Advanced Path:**
1. `ToolCallingCoordinator.generateWithTools()`
2. Provider adapter handles tool formatting
3. Autonomous tool execution with parallel processing
4. Result integration into conversation

**Simple Path:**
1. `MCPToolInjector.injectTools()` - **MISSING IMPLEMENTATION**
2. Native provider tool calling
3. Basic tool result handling

### Testing Coverage

#### Existing Tests
- ✅ Format compliance validation (`providerToolIntegration.test.ts`)
- ✅ Provider adapter functionality (`claudeProviderAdapter.test.ts`, `openaiProviderAdapter.test.ts`)
- ✅ Tool format generation for all providers

#### Missing Tests
- ❌ Schema validation testing
- ❌ Error handling scenarios
- ❌ Provider-specific constraint validation
- ❌ Integration testing for simple injection path

### Provider-Specific Requirements

#### Claude (Anthropic)
- **Documentation**: [Anthropic Tool Use API](https://docs.anthropic.com/claude/docs/tool-use)
- **Tool Format**: `{name, description, input_schema}`
- **Constraints**: Tool names must match regex `^[a-zA-Z0-9_-]{1,64}$`
- **Limits**: Up to 100 tools per request

#### OpenAI
- **Documentation**: [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- **Tool Format**: `{type: 'function', function: {name, description, parameters}}`
- **Constraints**: Tool names must match regex `^[a-zA-Z0-9_-]{1,64}$`
- **Limits**: Up to 128 tools per request

#### Ollama
- **Documentation**: [Ollama Tool Calling](https://docs.ollama.com/capabilities/tool-calling)
- **Tool Format**: `{type: 'function', function: {name, description, parameters}}`
- **Constraints**: Follows OpenAI format
- **Limits**: Model-specific, typically lower than cloud providers

#### Azure OpenAI
- **Documentation**: [Azure Function Calling](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/function-calling)
- **Tool Format**: Same as OpenAI
- **Constraints**: Additional Azure endpoint configuration
- **Limits**: Same as OpenAI

#### OpenRouter
- **Documentation**: [OpenRouter Tool Calling](https://openrouter.ai/docs/features/tool-calling)
- **Tool Format**: OpenAI-compatible
- **Constraints**: Provider-specific variations
- **Limits**: Depends on underlying model

#### DeepSeek
- **Documentation**: [DeepSeek Function Calling](https://api-docs.deepseek.com/guides/function_calling)
- **Tool Format**: OpenAI-compatible
- **Status**: Format correct, but infrastructure missing

#### SiliconFlow
- **Documentation**: [SiliconFlow Function Calling](https://docs.siliconflow.cn/cn/userguide/guides/function-calling)
- **Tool Format**: OpenAI-compatible
- **Status**: Format correct, but infrastructure missing

#### Grok (xAI)
- **Documentation**: [Grok Function Calling](https://docs.x.ai/docs/guides/function-calling)
- **Tool Format**: OpenAI-compatible
- **Status**: Format correct, but infrastructure missing

#### Gemini
- **Documentation**: [Gemini Function Calling](https://ai.google.dev/gemini-api/docs/function-calling)
- **Tool Format**: Google-specific function declaration format
- **Status**: No implementation found

### Recommendations

#### Immediate Actions (Critical)
1. **Implement MCPToolInjector concrete class** - Required for 3 providers
2. **Complete Gemini MCP integration** - Currently completely missing
3. **Add schema validation** - Prevent runtime errors

#### Short-term Improvements (Important)
1. **Standardize error handling** across all providers
2. **Clean up legacy deprecated fields** in interfaces
3. **Add comprehensive integration tests** for simple injection path

#### Long-term Enhancements (Nice to have)
1. **Provider-specific constraint validation**
2. **Performance optimization** for tool discovery caching
3. **Enhanced error reporting** with provider-specific context

### Development Guidelines for MCP Integration

When adding MCP support to new providers:

1. **Choose Integration Path**
   - Use Advanced Path for full-featured integration
   - Use Simple Path for basic compatibility

2. **Implement Tool Format**
   - Follow provider's official API specification
   - Use proper TypeScript interfaces
   - Include comprehensive error handling

3. **Add Comprehensive Tests**
   - Test tool format generation
   - Test adapter functionality
   - Test error scenarios

4. **Document Requirements**
   - Link to official API documentation
   - Specify tool format requirements
   - Document any provider-specific constraints

## Provider-Specific Documentation

Detailed MCP integration documentation is available for each provider:

### Full Support (Advanced Path)
- **[Claude (Anthropic)](docs/claude.md)** - Complete tool calling coordinator integration
- **[OpenAI](docs/openai.md)** - Full function calling with parallel execution
- **[Ollama](docs/ollama.md)** - Local model tool calling with autonomous execution
- **[Azure OpenAI](docs/azure.md)** - Enterprise OpenAI with deployment-specific features
- **[OpenRouter](docs/openrouter.md)** - Multi-provider routing with cost management

### Partial Support (Simple Path)
- **[DeepSeek](docs/deepseek.md)** - Requires MCPToolInjector implementation
- **[SiliconFlow](docs/siliconflow.md)** - Requires MCPToolInjector implementation
- **[Grok](docs/grok.md)** - Requires MCPToolInjector implementation

### No Implementation
- **[Gemini](docs/gemini.md)** - Missing tool format conversion implementation
- **[Remaining Providers](docs/remaining-providers.md)** - Qwen, Kimi, Zhipu, Doubao, QianFan, GPT Image

### Implementation Status Summary

| Provider | Status | Integration Type | Blocking Issue |
|----------|--------|------------------|----------------|
| Claude | ✅ WORKING | Advanced Path | None |
| OpenAI | ✅ WORKING | Advanced Path | None |
| Ollama | ✅ WORKING | Advanced Path | None |
| Azure | ✅ WORKING | Advanced Path | None |
| OpenRouter | ✅ WORKING | Advanced Path | None |
| DeepSeek | ⚠️ BROKEN | Simple Path | MCPToolInjector missing |
| SiliconFlow | ⚠️ BROKEN | Simple Path | MCPToolInjector missing |
| Grok | ⚠️ BROKEN | Simple Path | MCPToolInjector missing |
| Gemini | ❌ MISSING | Not Implemented | Format conversion needed |
| Others | ❌ MISSING | Simple Path | MCPToolInjector missing |

### Development Priorities

**Critical (Immediate)**
1. **Implement MCPToolInjector** - Unblocks 7+ providers
2. **Complete Gemini integration** - Add tool format conversion

**Important (Short-term)**
1. **Schema validation** - Prevent runtime errors
2. **Error handling standardization** - Consistent patterns

**Nice-to-have (Long-term)**
1. **Advanced path for all providers** - Full tool coordinator support
2. **Performance optimization** - Provider-specific improvements

---

*Last updated: 2025-10-18*
*Analysis conducted by comprehensive code review and provider documentation verification*

## Architecture

### Core Interfaces

```typescript
interface Vendor {
  name: string
  defaultOptions: BaseOptions
  sendRequestFunc: SendRequest
  models: string[]
  websiteToObtainKey: string
  capabilities: string[]
}

interface BaseOptions {
  apiKey: string
  baseURL: string
  model: string
  parameters: Record<string, unknown>
  documentPath?: string
  mcpManager?: unknown
  mcpExecutor?: unknown
}
```

### Provider Structure

Each provider follows this consistent structure:

```typescript
// src/openAI.ts - Example provider structure
export const openAIVendor: Vendor = {
  name: 'OpenAI',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4',
    parameters: {}
  },
  sendRequestFunc: (options) => async function* (messages, controller) {
    // Streaming implementation using async generators
  },
  models: [...], // Supported models
  websiteToObtainKey: 'https://platform.openai.com',
  capabilities: ['Text Generation', 'Tool Calling', 'Image Vision']
}
```

## Supported Providers

| Provider         | Capabilities                                            | Notes                             |
| ---------------- | ------------------------------------------------------- | --------------------------------- |
| **OpenAI**       | Text Generation, Tool Calling, Image Vision             | Full OpenAI API support           |
| **Claude**       | Text Generation, Tool Calling                           | Anthropic Claude API              |
| **Azure OpenAI** | Text Generation, Tool Calling, Reasoning                | Azure-hosted OpenAI models        |
| **Ollama**       | Text Generation, Tool Calling                           | Local models, no API key required |
| **OpenRouter**   | Text Generation, Tool Calling, Image Vision, PDF Vision | Multi-provider routing service    |
| **DeepSeek**     | Text Generation, Tool Calling                           | DeepSeek API                      |
| **Gemini**       | Text Generation, Tool Calling                           | Google Gemini API                 |

## Development

### Adding a New Provider

1. **Create Provider File**: Add `src/newProvider.ts`

```typescript
import type { BaseOptions, SendRequest, Vendor } from './base'

export const newProviderVendor: Vendor = {
  name: 'NewProvider',
  defaultOptions: {
    apiKey: '',
    baseURL: 'https://api.newprovider.com/v1',
    model: 'default-model',
    parameters: {}
  },
  sendRequestFunc: (options) => async function* (messages, controller) {
    // Implement streaming request logic
    // Use async generator pattern
    for await (const chunk of streamResponse(options)) {
      yield chunk
    }
  },
  models: ['model-1', 'model-2'],
  websiteToObtainKey: 'https://newprovider.com/api-keys',
  capabilities: ['Text Generation', 'Tool Calling']
}
```

2. **Export in Index**: Add to `src/index.ts`

```typescript
export { newProviderVendor } from './newProvider'
export const allVendors = [
  // ... existing vendors
  newProviderVendor
]
```

3. **Update Tests**: Add provider verification in `tests/unit/basic.test.ts`

4. **Build Package**: `pnpm --filter @tars/providers build`

### Provider Implementation Guidelines

#### Async Generator Pattern
All providers must use async generators for streaming:

```typescript
sendRequestFunc: (options: BaseOptions) => async function* (
  messages: Message[],
  controller: AbortController
): AsyncGenerator<string> {
  try {
    for await (const chunk of streamResponse) {
      // Check for abort signal
      if (controller.signal.aborted) {
        throw new Error('Request aborted')
      }
      yield chunk
    }
  } catch (error) {
    // Handle provider-specific errors
    throw error
  }
}
```

#### Error Handling
- Implement provider-specific error handling
- Convert API errors to standard format
- Handle rate limits, timeouts, and network issues

#### Authentication
- Support API key authentication
- Handle provider-specific auth mechanisms (Azure endpoint + API key, etc.)
- Never log sensitive authentication data

#### Model Management
- Maintain accurate lists of supported models
- Include model-specific capability information
- Update models regularly as providers add new ones

## Building

```bash
# Build for production
pnpm --filter @tars/providers build

# Development with watch mode
pnpm --filter @tars/providers dev

# Type checking only
pnpm --filter @tars/providers typecheck
```

The build process creates:
- `dist/index.js` - CommonJS build
- `dist/index.mjs` - ES modules build
- Source maps for debugging

## Testing

### Test Structure

Due to package dependencies and circular import issues, tests focus on package structure validation rather than runtime behavior:

```
tests/
├── unit/
│   └── basic.test.ts     # Package structure and export validation
└── mocks/
    └── obsidian.ts       # Mock for Obsidian peer dependency
```

### Running Tests

```bash
# Run all tests
pnpm --filter @tars/providers test

# Run in watch mode
pnpm --filter @tars/providers test:watch

# Run with coverage
pnpm --filter @tars/providers test:coverage
```

### Test Approach

**Why Simplified Tests?**
- The providers package has `obsidian` as a peer dependency
- Full integration tests require Obsidian API context
- Runtime behavior is tested in the plugin package integration tests
- Focus on validating package structure and exports

**What Gets Tested?**
- ✅ Package.json configuration
- ✅ Source file structure and existence
- ✅ Build output generation
- ✅ Export completeness in index.ts
- ✅ Presence of required vendor modules

**What's NOT Tested Here?**
- ❌ Actual API calls to providers
- ❌ Streaming response handling
- ❌ Authentication logic
- ❌ Error handling in live scenarios

These aspects are tested in the plugin package's integration tests where the full Obsidian context is available.

## Dependencies

### Runtime Dependencies
- `@tars/logger`: Shared logging utilities
- `@anthropic-ai/sdk`: Claude API client
- `@google/generative-ai`: Gemini API client
- `openai`: OpenAI and Azure API client
- `ollama`: Ollama API client
- `axios`: HTTP client for custom providers
- `zod`: Schema validation
- `nanoid`: ID generation
- `jose`: JWT handling (for some providers)
- `async-mutex`: Concurrency control

### Peer Dependencies
- `obsidian`: Obsidian plugin API (required but mocked in tests)

### Development Dependencies
- `vitest`: Test framework
- `tsup`: Build tool
- `typescript`: Type checking
- `@vitest/coverage-v8`: Test coverage

## Usage

### Basic Usage

```typescript
import { openAIVendor, claudeVendor, testProviderConnection } from '@tars/providers'

// Use a specific vendor
const response = openAIVendor.sendRequestFunc({
  apiKey: 'your-api-key',
  model: 'gpt-4',
  baseURL: 'https://api.openai.com/v1',
  parameters: { temperature: 0.7 }
})

// Test connection
const connectionTest = await testProviderConnection(openAIVendor, {
  apiKey: 'your-api-key',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4',
  parameters: {}
})
```

### Streaming Pattern

```typescript
const stream = vendor.sendRequestFunc(options)
for await (const chunk of stream(messages, abortController)) {
  console.log(chunk) // Process streaming text
}
```

### Getting All Vendors

```typescript
import { allVendors } from '@tars/providers'

for (const vendor of allVendors) {
  console.log(`${vendor.name}: ${vendor.capabilities.join(', ')}`)
}
```

## Integration Notes

### For Plugin Developers

This package provides the raw provider implementations. When integrating:

1. **Import providers**: `import { openAIVendor } from '@tars/providers'`
2. **Handle authentication**: Manage API keys securely
3. **Stream responses**: Use the async generator pattern
4. **Error handling**: Implement proper error boundaries
5. **Abort signals**: Respect cancellation requests

### MCP Integration

The plugin package handles MCP tool calling integration. This package provides:
- Tool calling capable providers (those with 'Tool Calling' capability)
- Provider-specific tool formatting utilities
- Base interfaces for tool injection

Providers with tool calling capability can receive MCP tools through the plugin's integration layer.

## Versioning

This package follows semantic versioning:
- **Major**: Breaking changes to vendor interfaces
- **Minor**: New providers, new capabilities, non-breaking feature additions
- **Patch**: Bug fixes, model updates, documentation improvements

When updating providers:
- Add models without breaking changes (patch)
- Add capabilities without breaking changes (patch)
- Modify vendor interfaces carefully (major/minor depending on impact)
- Remove deprecated models/providers in major versions

## Contributing

### Development Workflow

1. **Setup**: Ensure you have the monorepo dependencies installed
2. **Create provider**: Follow the "Adding a New Provider" guidelines
3. **Test structure**: Verify package structure tests pass
4. **Build**: Ensure package builds successfully
5. **Integration**: Test in plugin package context
6. **Documentation**: Update provider documentation

### Code Standards

- Use TypeScript for all implementations
- Follow async generator pattern for streaming
- Include comprehensive error handling
- Document provider-specific requirements
- Maintain consistent interface implementation

### Provider Maintenance

- Regularly update supported models
- Monitor API changes from providers
- Test with different API key formats
- Update capability definitions as needed
- Maintain documentation for new features

## Troubleshooting

### Common Issues

**Build Failures**: Usually due to TypeScript errors or missing dependencies
- Check imports and type definitions
- Verify all dependencies are installed
- Ensure proper TypeScript configuration

**Test Failures**: Typically related to missing build outputs
- Run `pnpm --filter @tars/providers build` first
- Check that dist/ directory contains expected files
- Verify package.json exports are correct

**Import Errors**: Often due to circular dependencies or incorrect paths
- Use relative imports within the package
- Avoid importing from packages that depend on this one
- Check peer dependency setup

### Getting Help

1. Check this README for common patterns
2. Review existing provider implementations
3. Examine test files for usage examples
4. Consult the main monorepo documentation
5. Check plugin package integration examples

---

This package is part of the TARS (Tag-based AI Response System) monorepo. See the main README for overall project context and usage guidelines.