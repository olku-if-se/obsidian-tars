/**
 * Mock implementations for MCP infrastructure testing
 * Following TDD approach - these mocks will be used to test the concrete implementations
 */

import { vi } from 'vitest'
import type { MCPToolInjector } from '../../src/interfaces'

/**
 * Mock MCP Server Manager
 */
export function createMockMCPServerManager() {
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

/**
 * Mock Tool Executor
 */
export function createMockToolExecutor() {
	return {
		executeTool: vi.fn().mockResolvedValue({
			content: { result: 'success' },
			contentType: 'json',
			executionDuration: 100
		})
	}
}

/**
 * Mock Tool Calling Coordinator
 */
export function createMockToolCallingCoordinator() {
	return {
		generateWithTools: vi.fn().mockImplementation(async function* () {
			yield 'Mock tool result'
		})
	}
}

/**
 * Mock Provider Adapter
 */
export function createMockProviderAdapter() {
	return {
		initialize: vi.fn().mockResolvedValue(undefined),
		findServer: vi.fn().mockReturnValue({ id: 'server1', name: 'Server 1' }),
		formatToolResult: vi.fn()
	}
}

/**
 * Mock MCP Tool Injector
 */
export function createMockMCPToolInjector(): MCPToolInjector {
	return {
		injectTools: vi.fn().mockResolvedValue({})
	}
}

/**
 * Mock tool discovery snapshot with sample tools
 */
export function createMockToolSnapshot() {
	const mockTool = {
		name: 'test_tool',
		description: 'Test tool for testing',
		inputSchema: {
			type: 'object',
			properties: {
				param: { type: 'string', description: 'Test parameter' }
			},
			required: ['param']
		}
	}

	return {
		mapping: new Map([['test_tool', { id: 'server1', name: 'Server 1' }]]),
		servers: [
			{
				serverId: 'server1',
				serverName: 'Server 1',
				tools: [mockTool]
			}
		]
	}
}

/**
 * Mock weather tool snapshot
 */
export function createMockWeatherToolSnapshot() {
	const weatherTool = {
		name: 'get_weather',
		description: 'Get current weather information for a location',
		inputSchema: {
			type: 'object',
			properties: {
				location: { type: 'string', description: 'City name' },
				units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
			},
			required: ['location']
		}
	}

	return {
		mapping: new Map([['get_weather', { id: 'weather_server', name: 'Weather Server' }]]),
		servers: [
			{
				serverId: 'weather_server',
				serverName: 'Weather Server',
				tools: [weatherTool]
			}
		]
	}
}

/**
 * Mock calculator tool snapshot
 */
export function createMockCalculatorToolSnapshot() {
	const calculatorTool = {
		name: 'calculator',
		description: 'Perform mathematical calculations',
		inputSchema: {
			type: 'object',
			properties: {
				expression: { type: 'string', description: 'Mathematical expression to evaluate' }
			},
			required: ['expression']
		}
	}

	return {
		mapping: new Map([['calculator', { id: 'calc_server', name: 'Calculator Server' }]]),
		servers: [
			{
				serverId: 'calc_server',
				serverName: 'Calculator Server',
				tools: [calculatorTool]
			}
		]
	}
}

/**
 * Create mock snapshot with multiple tools
 */
export function createMockMultiToolSnapshot() {
	const tools = [
		{
			name: 'get_weather',
			description: 'Get weather information',
			inputSchema: {
				type: 'object',
				properties: { location: { type: 'string' } },
				required: ['location']
			}
		},
		{
			name: 'calculator',
			description: 'Perform calculations',
			inputSchema: {
				type: 'object',
				properties: { expression: { type: 'string' } },
				required: ['expression']
			}
		}
	]

	return {
		mapping: new Map([
			['get_weather', { id: 'server1', name: 'Server 1' }],
			['calculator', { id: 'server2', name: 'Server 2' }]
		]),
		servers: [
			{
				serverId: 'server1',
				serverName: 'Server 1',
				tools: [tools[0]]
			},
			{
				serverId: 'server2',
				serverName: 'Server 2',
				tools: [tools[1]]
			}
		]
	}
}

/**
 * Mock error scenarios
 */
export const mockErrorScenarios = {
	toolDiscoveryFailure: new Error('Tool discovery failed'),
	networkTimeout: new Error('Network timeout'),
	invalidSchema: new Error('Invalid tool schema'),
	serverUnavailable: new Error('MCP server unavailable')
}
