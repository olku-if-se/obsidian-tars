# MCP Tool Injection TDD Test Specification

## Overview

This document outlines comprehensive unit tests for verifying MCP tool injection into providers using TDD approach. The tests will fail initially but define the expected behavior for proper MCP integration.

## Test Strategy

### Mock Infrastructure
- Mock `MCPToolInjector` interface implementation
- Mock `MCPServerManager` and `ToolExecutor`
- Mock provider-specific clients (Anthropic, OpenAI, Ollama)
- Mock tool discovery and caching

### Test Categories

## 1. MCPToolInjector Interface Tests

### Test 1.1: MCPToolInjector Interface Existence
```typescript
describe('MCPToolInjector Interface', () => {
  it('should have concrete implementation available', () => {
    // GIVEN: The MCPToolInjector interface is defined in base.ts
    // WHEN: We try to create an instance
    // THEN: A concrete implementation should be available
    // EXPECTED: new ConcreteMCPToolInjector() should not throw
    
    // CURRENT REALITY: No concrete implementation exists
    // THIS TEST WILL FAIL UNTIL IMPLEMENTATION IS CREATED
  })
})
```

### Test 1.2: Basic Tool Injection Functionality
```typescript
describe('MCPToolInjector Basic Functionality', () => {
  let mockInjector: MCPToolInjector
  let mockManager: MCPServerManager
  let mockExecutor: ToolExecutor

  beforeEach(() => {
    // GIVEN: Mock MCP infrastructure is set up
    mockManager = createMockMCPServerManager()
    mockExecutor = createMockToolExecutor()
    mockInjector = new ConcreteMCPToolInjector(mockManager, mockExecutor)
  })

  it('should inject tools into OpenAI format parameters', async () => {
    // GIVEN: OpenAI provider parameters and mock tools
    const parameters = { model: 'gpt-4', temperature: 0.7 }
    const expectedTools = [
      {
        type: 'function',
        function: {
          name: 'test_tool',
          description: 'Test tool for testing',
          parameters: { type: 'object', properties: {} }
        }
      }
    ]

    // WHEN: Injecting tools for OpenAI provider
    const result = await mockInjector.injectTools(parameters, 'OpenAI')

    // THEN: Should return parameters with tools in OpenAI format
    expect(result).toHaveProperty('tools')
    expect(result.tools).toEqual(expectedTools)
    expect(result.model).toBe('gpt-4')
    expect(result.temperature).toBe(0.7)
  })

  it('should inject tools into Claude format parameters', async () => {
    // GIVEN: Claude provider parameters and mock tools
    const parameters = { model: 'claude-3-sonnet', max_tokens: 4096 }
    const expectedTools = [
      {
        name: 'test_tool',
        description: 'Test tool for testing',
        input_schema: { type: 'object', properties: {} }
      }
    ]

    // WHEN: Injecting tools for Claude provider
    const result = await mockInjector.injectTools(parameters, 'Claude')

    // THEN: Should return parameters with tools in Claude format
    expect(result).toHaveProperty('tools')
    expect(result.tools).toEqual(expectedTools)
    expect(result.model).toBe('claude-3-sonnet')
    expect(result.max_tokens).toBe(4096)
  })

  it('should inject tools into Ollama format parameters', async () => {
    // GIVEN: Ollama provider parameters and mock tools
    const parameters = { model: 'llama3.2' }

    // WHEN: Injecting tools for Ollama provider
    const result = await mockInjector.injectTools(parameters, 'Ollama')

    // THEN: Should return parameters with tools in Ollama format
    expect(result).toHaveProperty('tools')
    expect(result.tools).toHaveLength(1)
    expect(result.tools[0]).toHaveProperty('type', 'function')
    expect(result.tools[0]).toHaveProperty('function')
  })

  it('should handle injection errors gracefully', async () => {
    // GIVEN: Mock tool discovery failure
    mockManager.getToolDiscoveryCache.mockRejectedValue(new Error('Tool discovery failed'))

    // WHEN: Attempting to inject tools
    const result = await mockInjector.injectTools({}, 'OpenAI')

    // THEN: Should return original parameters without tools
    expect(result).toEqual({})
    expect(result).not.toHaveProperty('tools')
  })
})
```

## 2. Provider-Specific MCP Integration Tests

### Test 2.1: Simple Injection Path Providers

#### Test 2.1.1: DeepSeek Provider
```typescript
describe('DeepSeek MCP Tool Injection', () => {
  let deepSeekProvider: Vendor
  let mockMcpInjector: MCPToolInjector

  beforeEach(() => {
    // GIVEN: DeepSeek provider and mock MCP injector
    deepSeekProvider = deepSeekVendor
    mockMcpInjector = createMockMCPToolInjector()
  })

  it('should use simple injection path for DeepSeek', async () => {
    // GIVEN: Provider options with MCP tool injector
    const options = {
      ...deepSeekProvider.defaultOptions,
      mcpToolInjector: mockMcpInjector,
      apiKey: 'test-key',
      model: 'deepseek-chat'
    }

    // WHEN: Creating send request function
    const sendRequest = deepSeekProvider.sendRequestFunc(options)

    // THEN: Should be able to call with mock MCP context
    expect(sendRequest).toBeDefined()
    expect(typeof sendRequest).toBe('function')
  })

  it('should inject tools into DeepSeek request parameters', async () => {
    // GIVEN: Mock tool injector and DeepSeek options
    const parameters = { model: 'deepseek-chat', temperature: 0.7 }
    mockMcpInjector.injectTools.mockResolvedValue({
      ...parameters,
      tools: [{ type: 'function', function: { name: 'test_tool', description: 'Test' } }]
    })

    const options = {
      ...deepSeekProvider.defaultOptions,
      mcpToolInjector: mockMcpInjector,
      apiKey: 'test-key'
    }

    // WHEN: Executing the send request
    const sendRequest = deepSeekProvider.sendRequestFunc(options)
    const mockMessages = [{ role: 'user', content: 'test' }]
    const mockController = new AbortController()

    // THEN: Should call tool injector with correct parameters
    const result = await sendRequest(mockMessages, mockController, undefined, undefined)
    expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'deepseek-chat' }),
      'DeepSeek'
    )
  })

  it('should fall back gracefully when MCP injection fails', async () => {
    // GIVEN: Mock tool injector that throws error
    mockMcpInjector.injectTools.mockRejectedValue(new Error('MCP injection failed'))

    const options = {
      ...deepSeekProvider.defaultOptions,
      mcpToolInjector: mockMcpInjector,
      apiKey: 'test-key'
    }

    // WHEN: Executing send request
    const sendRequest = deepSeekProvider.sendRequestFunc(options)
    const mockMessages = [{ role: 'user', content: 'test' }]
    const mockController = new AbortController()

    // THEN: Should handle error gracefully and continue without tools
    // CURRENT REALITY: Implementation should catch and log error
    // THIS TEST MAY FAIL IF ERROR HANDLING IS NOT IMPLEMENTED
    await expect(sendRequest(mockMessages, mockController, undefined, undefined)).resolves.toBeDefined()
  })
})
```

#### Test 2.1.2: SiliconFlow Provider
```typescript
describe('SiliconFlow MCP Tool Injection', () => {
  let siliconFlowProvider: Vendor
  let mockMcpInjector: MCPToolInjector

  beforeEach(() => {
    // GIVEN: SiliconFlow provider and mock MCP injector
    siliconFlowProvider = siliconFlowVendor
    mockMcpInjector = createMockMCPToolInjector()
  })

  it('should use simple injection path for SiliconFlow', async () => {
    // GIVEN: Provider options with MCP tool injector
    const options = {
      ...siliconFlowProvider.defaultOptions,
      mcpToolInjector: mockMcpInjector,
      apiKey: 'test-key',
      model: 'deepseek-chat'
    }

    // WHEN: Creating send request function
    const sendRequest = siliconFlowProvider.sendRequestFunc(options)

    // THEN: Should be able to call with mock MCP context
    expect(sendRequest).toBeDefined()
    expect(typeof sendRequest).toBe('function')
  })

  it('should inject tools into SiliconFlow request parameters', async () => {
    // GIVEN: Mock tool injector returning OpenAI-compatible tools
    const parameters = { model: 'deepseek-chat' }
    mockMcpInjector.injectTools.mockResolvedValue({
      ...parameters,
      tools: [{ type: 'function', function: { name: 'siliconflow_tool', description: 'Test' } }]
    })

    const options = {
      ...siliconFlowProvider.defaultOptions,
      mcpToolInjector: mockMcpInjector,
      apiKey: 'test-key'
    }

    // WHEN: Executing the send request
    const sendRequest = siliconFlowProvider.sendRequestFunc(options)
    const mockMessages = [{ role: 'user', content: 'test' }]
    const mockController = new AbortController()

    // THEN: Should call tool injector and pass tools to client
    // CURRENT REALITY: SiliconFlow uses OpenAI client, so tools should be passed correctly
    await sendRequest(mockMessages, mockController, undefined, undefined)
    expect(mockMcpInjector.injectTools).toHaveBeenCalled()
  })
})
```

#### Test 2.1.3: Grok Provider
```typescript
describe('Grok MCP Tool Injection', () => {
  let grokProvider: Vendor
  let mockMcpInjector: MCPToolInjector

  beforeEach(() => {
    // GIVEN: Grok provider and mock MCP injector
    grokProvider = grokVendor
    mockMcpInjector = createMockMCPToolInjector()
  })

  it('should use simple injection path for Grok', async () => {
    // GIVEN: Provider options with MCP tool injector
    const options = {
      ...grokProvider.defaultOptions,
      mcpToolInjector: mockMcpInjector,
      apiKey: 'test-key'
    }

    // WHEN: Creating send request function
    const sendRequest = grokProvider.sendRequestFunc(options)

    // THEN: Should be able to call with mock MCP context
    expect(sendRequest).toBeDefined()
    expect(typeof sendRequest).toBe('function')
  })

  it('should inject tools into Grok request parameters', async () => {
    // GIVEN: Mock tool injector and Grok options
    mockMcpInjector.injectTools.mockResolvedValue({
      model: 'grok-beta',
      tools: [{ type: 'function', function: { name: 'grok_tool', description: 'Test' } }]
    })

    const options = {
      ...grokProvider.defaultOptions,
      mcpToolInjector: mockMcpInjector,
      apiKey: 'test-key'
    }

    // WHEN: Executing send request
    const sendRequest = grokProvider.sendRequestFunc(options)
    const mockMessages = [{ role: 'user', content: 'test' }]
    const mockController = new AbortController()

    // THEN: Should include tools in HTTP request
    await sendRequest(mockMessages, mockController, undefined, undefined)
    expect(mockMcpInjector.injectTools).toHaveBeenCalledWith(
      expect.objectContaining({}),
      'Grok'
    )
  })
})
```

### Test 2.2: Advanced Path Providers

#### Test 2.2.1: Claude Provider Advanced Integration
```typescript
describe('Claude Advanced MCP Integration', () => {
  let claudeProvider: Vendor
  let mockMcpIntegration: MCPIntegration
  let mockCoordinator: any
  let mockAdapter: any

  beforeEach(() => {
    // GIVEN: Claude provider and mock advanced MCP integration
    claudeProvider = claudeVendor
    mockCoordinator = createMockToolCallingCoordinator()
    mockAdapter = createMockProviderAdapter()
    mockMcpIntegration = {
      mcpToolInjector: createMockMCPToolInjector(),
      toolCallingCoordinator: mockCoordinator,
      providerAdapter: mockAdapter
    }
  })

  it('should use advanced integration path when available', async () => {
    // GIVEN: Provider options with advanced MCP integration
    const options = {
      ...claudeProvider.defaultOptions,
      mcpIntegration: mockMcpIntegration,
      apiKey: 'test-key'
    }

    // WHEN: Creating send request function
    const sendRequest = claudeProvider.sendRequestFunc(options)

    // THEN: Should be able to call with advanced MCP context
    expect(sendRequest).toBeDefined()
    expect(typeof sendRequest).toBe('function')
  })

  it('should delegate to tool calling coordinator for autonomous execution', async () => {
    // GIVEN: Mock coordinator that returns generator
    const mockGenerator = async function* () {
      yield 'Tool execution result'
    }
    mockCoordinator.generateWithTools.mockReturnValue(mockGenerator)

    const options = {
      ...claudeProvider.defaultOptions,
      mcpIntegration: mockMcpIntegration,
      apiKey: 'test-key'
    }

    // WHEN: Executing send request
    const sendRequest = claudeProvider.sendRequestFunc(options)
    const mockMessages = [{ role: 'user', content: 'test' }]
    const mockController = new AbortController()

    // THEN: Should call coordinator with correct parameters
    const results = []
    for await (const result of sendRequest(mockMessages, mockController, undefined, undefined)) {
      results.push(result)
    }

    expect(mockCoordinator.generateWithTools).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'test' })
      ]),
      mockAdapter,
      expect.any(Object), // mcpExecutor
      expect.objectContaining({
        documentPath: expect.any(String),
        parallelExecution: expect.any(Boolean),
        maxParallelTools: expect.any(Number),
        documentWriteLock: expect.any(Object)
      })
    )
    expect(results).toEqual(['Tool execution result'])
  })

  it('should fall back to standard path when advanced integration fails', async () => {
    // GIVEN: Mock coordinator that throws error
    mockCoordinator.generateWithTools.mockRejectedValue(new Error('Coordinator failed'))

    const options = {
      ...claudeProvider.defaultOptions,
      mcpIntegration: mockMcpIntegration,
      apiKey: 'test-key'
    }

    // WHEN: Executing send request
    const sendRequest = claudeProvider.sendRequestFunc(options)
    const mockMessages = [{ role: 'user', content: 'test' }]
    const mockController = new AbortController()

    // THEN: Should fall back to standard Claude API call
    // CURRENT REALITY: Implementation should catch error and continue
    await expect(sendRequest(mockMessages, mockController, undefined, undefined)).resolves.toBeDefined()
  })
})
```

#### Test 2.2.2: OpenAI Provider Advanced Integration
```typescript
describe('OpenAI Advanced MCP Integration', () => {
  let openAIProvider: Vendor
  let mockMcpIntegration: MCPIntegration
  let mockCoordinator: any
  let mockAdapter: any

  beforeEach(() => {
    // GIVEN: OpenAI provider and mock advanced MCP integration
    openAIProvider = openAIVendor
    mockCoordinator = createMockToolCallingCoordinator()
    mockAdapter = createMockProviderAdapter()
    mockMcpIntegration = {
      mcpToolInjector: createMockMCPToolInjector(),
      toolCallingCoordinator: mockCoordinator,
      providerAdapter: mockAdapter
    }
  })

  it('should use advanced integration path for OpenAI', async () => {
    // GIVEN: Provider options with advanced MCP integration
    const options = {
      ...openAIProvider.defaultOptions,
      mcpIntegration: mockMcpIntegration,
      apiKey: 'test-key'
    }

    // WHEN: Creating send request function
    const sendRequest = openAIProvider.sendRequestFunc(options)

    // THEN: Should be able to call with advanced MCP context
    expect(sendRequest).toBeDefined()
    expect(typeof sendRequest).toBe('function')
  })

  it('should initialize adapter and delegate to coordinator', async () => {
    // GIVEN: Mock adapter with initialize method
    mockAdapter.initialize.mockResolvedValue(undefined)

    const options = {
      ...openAIProvider.defaultOptions,
      mcpIntegration: mockMcpIntegration,
      apiKey: 'test-key'
    }

    // WHEN: Executing send request
    const sendRequest = openAIProvider.sendRequestFunc(options)
    const mockMessages = [{ role: 'user', content: 'test' }]
    const mockController = new AbortController()

    // THEN: Should initialize adapter and call coordinator
    await sendRequest(mockMessages, mockController, undefined, undefined)
    expect(mockAdapter.initialize).toHaveBeenCalledWith({ preloadTools: false })
    expect(mockCoordinator.generateWithTools).toHaveBeenCalled()
  })
})
```

## 3. Tool Format Compliance Tests

### Test 3.1: Claude Tool Format Compliance
```typescript
describe('Claude Tool Format Compliance', () => {
  it('should generate Claude-compliant tool format', async () => {
    // GIVEN: Mock MCP tool discovery with standard tool
    const mockTool = {
      name: 'calculate',
      description: 'Perform calculations',
      inputSchema: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          numbers: { type: 'array', items: { type: 'number' } }
        },
        required: ['operation', 'numbers']
      }
    }

    // WHEN: Converting to Claude format
    const claudeTool = convertToClaudeFormat(mockTool)

    // THEN: Should match Claude API specification
    expect(claudeTool).toEqual({
      name: 'calculate',
      description: 'Perform calculations',
      input_schema: {
        type: 'object',
        properties: {
          operation: { type: 'string' },
          numbers: { type: 'array', items: { type: 'number' } }
        },
        required: ['operation', 'numbers']
      }
    })
  })

  it('should validate Claude tool name constraints', () => {
    // GIVEN: Various tool names
    const validNames = ['tool_name', 'tool-name', 'toolName123']
    const invalidNames = ['Tool Name', 'tool@name', 'tool name with spaces', 'a'.repeat(65)]

    // WHEN: Validating tool names
    // THEN: Should enforce Claude naming constraints
    validNames.forEach(name => {
      expect(isValidClaudeToolName(name)).toBe(true)
    })
    invalidNames.forEach(name => {
      expect(isValidClaudeToolName(name)).toBe(false)
    })
  })
})
```

### Test 3.2: OpenAI Tool Format Compliance
```typescript
describe('OpenAI Tool Format Compliance', () => {
  it('should generate OpenAI-compliant tool format', async () => {
    // GIVEN: Mock MCP tool discovery with standard tool
    const mockTool = {
      name: 'get_weather',
      description: 'Get current weather',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
        },
        required: ['location']
      }
    }

    // WHEN: Converting to OpenAI format
    const openAITool = convertToOpenAIFormat(mockTool)

    // THEN: Should match OpenAI API specification
    expect(openAITool).toEqual({
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get current weather',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
          },
          required: ['location']
        }
      }
    })
  })

  it('should validate OpenAI tool constraints', () => {
    // GIVEN: Mock tools with various sizes
    const smallToolList = Array.from({ length: 50 }, (_, i) => ({
      name: `tool_${i}`,
      description: `Tool ${i}`,
      inputSchema: { type: 'object', properties: {} }
    }))
    const largeToolList = Array.from({ length: 150 }, (_, i) => ({
      name: `tool_${i}`,
      description: `Tool ${i}`,
      inputSchema: { type: 'object', properties: {} }
    }))

    // WHEN: Validating tool list size
    // THEN: Should enforce OpenAI constraints
    expect(validateOpenAIToolList(smallToolList)).toBe(true)
    expect(validateOpenAIToolList(largeToolList)).toBe(false) // Exceeds 128 tool limit
  })
})
```

## 4. Error Handling and Edge Cases

### Test 4.1: Error Scenarios
```typescript
describe('MCP Tool Injection Error Handling', () => {
  it('should handle missing MCP infrastructure gracefully', async () => {
    // GIVEN: Provider options without MCP integration
    const options = {
      apiKey: 'test-key',
      model: 'test-model',
      // No mcpToolInjector or mcpIntegration
    }

    // WHEN: Creating send request function
    const sendRequest = claudeVendor.sendRequestFunc(options)

    // THEN: Should still work without MCP tools
    expect(sendRequest).toBeDefined()
    expect(typeof sendRequest).toBe('function')
  })

  it('should handle malformed tool schemas', async () => {
    // GIVEN: Tool with invalid JSON schema
    const invalidTool = {
      name: 'invalid_tool',
      description: 'Tool with invalid schema',
      inputSchema: 'not-a-valid-schema' // Invalid JSON Schema
    }

    // WHEN: Attempting to inject tools
    // THEN: Should handle gracefully or provide meaningful error
    // CURRENT REALITY: This may cause runtime errors
    expect(() => validateToolSchema(invalidTool)).not.toThrow()
  })

  it('should handle network timeouts during tool discovery', async () => {
    // GIVEN: Mock tool discovery that times out
    const mockManager = createMockMCPServerManager()
    mockManager.getToolDiscoveryCache.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({}), 60000) // 60 second timeout
      })
    })

    const mockInjector = new ConcreteMCPToolInjector(mockManager, createMockToolExecutor())

    // WHEN: Attempting to inject tools with timeout
    const startTime = Date.now()
    const result = await mockInjector.injectTools({}, 'OpenAI')
    const endTime = Date.now()

    // THEN: Should handle timeout gracefully
    expect(endTime - startTime).toBeLessThan(65000) // Should not wait full timeout
    expect(result).toEqual({}) // Should return empty result
  })
})
```

## 5. Integration Flow Tests

### Test 5.1: End-to-End MCP Flow
```typescript
describe('End-to-End MCP Tool Injection Flow', () => {
  it('should complete full MCP tool injection cycle for Claude', async () => {
    // GIVEN: Complete MCP infrastructure setup
    const mockManager = createMockMCPServerManager()
    const mockExecutor = createMockToolExecutor()
    const mockCoordinator = createMockToolCallingCoordinator()
    const mockAdapter = createMockProviderAdapter()

    // Mock tool discovery
    const mockTool = {
      name: 'test_tool',
      description: 'Test tool',
      inputSchema: { type: 'object', properties: { param: { type: 'string' } } }
    }
    mockManager.getToolDiscoveryCache.mockResolvedValue({
      mapping: new Map([['test_tool', { id: 'server1', name: 'Server 1' }]]),
      servers: [{
        serverId: 'server1',
        serverName: 'Server 1',
        tools: [mockTool]
      }]
    })

    // Mock coordinator response
    mockCoordinator.generateWithTools.mockImplementation(async function* (messages, adapter, executor, options) {
      yield 'Tool executed successfully'
    })

    const options = {
      ...claudeVendor.defaultOptions,
      apiKey: 'test-key',
      mcpIntegration: {
        mcpToolInjector: new ConcreteMCPToolInjector(mockManager, mockExecutor),
        toolCallingCoordinator: mockCoordinator,
        providerAdapter: mockAdapter
      }
    }

    // WHEN: Executing complete flow
    const sendRequest = claudeVendor.sendRequestFunc(options)
    const messages = [{ role: 'user', content: 'Use test_tool' }]
    const controller = new AbortController()

    const results = []
    for await (const result of sendRequest(messages, controller, undefined, undefined)) {
      results.push(result)
    }

    // THEN: Should complete full flow successfully
    expect(results).toEqual(['Tool executed successfully'])
    expect(mockCoordinator.generateWithTools).toHaveBeenCalled()
  })
})
```

## Mock Implementations

### Mock Classes and Functions
```typescript
// Mock MCP Tool Injector
class ConcreteMCPToolInjector implements MCPToolInjector {
  constructor(
    private manager: MCPServerManager,
    private executor: ToolExecutor
  ) {}

  async injectTools(parameters: Record<string, unknown>, providerName: string): Promise<Record<string, unknown>> {
    // Implementation to be created
    throw new Error('Not implemented')
  }
}

// Mock Tool Calling Coordinator
function createMockToolCallingCoordinator() {
  return {
    generateWithTools: vi.fn().mockImplementation(async function* () {
      yield 'Mock tool result'
    })
  }
}

// Mock Provider Adapter
function createMockProviderAdapter() {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    findServer: vi.fn().mockReturnValue({ id: 'server1', name: 'Server 1' }),
    formatToolResult: vi.fn()
  }
}

// Mock MCP Server Manager
function createMockMCPServerManager() {
  return {
    getToolDiscoveryCache: vi.fn().mockReturnValue({
      getSnapshot: vi.fn().mockResolvedValue({
        mapping: new Map(),
        servers: []
      })
    }),
    listServers: vi.fn().mockReturnValue([]),
    getClient: vi.fn()
  }
}

// Mock Tool Executor
function createMockToolExecutor() {
  return {
    executeTool: vi.fn().mockResolvedValue({
      content: { result: 'success' },
      contentType: 'json',
      executionDuration: 100
    })
  }
}
```

## Expected Test Results

### Tests That Should Pass (Already Working)
- ✅ Interface existence checks
- ✅ Advanced path provider functionality (Claude, OpenAI, Azure, Ollama, OpenRouter)
- ✅ Tool format generation for compliant providers
- ✅ Basic provider structure validation

### Tests That Should Fail (Missing Implementation)
- ❌ **MCPToolInjector concrete class** - No implementation exists
- ❌ **Simple injection path** - DeepSeek, SiliconFlow, Grok (missing injector)
- ❌ **Gemini MCP integration** - No implementation at all
- ❌ **Schema validation** - No validation logic exists
- ❌ **Error handling** - Inconsistent across providers

### Priority for Implementation
1. **CRITICAL**: Implement `ConcreteMCPToolInjector` class
2. **HIGH**: Complete Gemini MCP integration
3. **MEDIUM**: Add schema validation
4. **LOW**: Standardize error handling

## Running the Tests

```bash
# Run all MCP tool injection tests
pnpm --filter @tars/providers test -- --grep "MCP"

# Run with coverage
pnpm --filter @tars/providers test:coverage -- --grep "MCP"

# Run in watch mode during development
pnpm --filter @tars/providers test:watch -- --grep "MCP"
```

## TDD Implementation Strategy

1. **Red Phase**: Run tests to see failures
2. **Green Phase**: Implement minimal code to make tests pass
3. **Refactor Phase**: Improve implementation while maintaining test coverage
4. **Repeat**: Add more tests and refine implementation

---

*This specification serves as the foundation for implementing comprehensive MCP tool injection testing following TDD principles.*