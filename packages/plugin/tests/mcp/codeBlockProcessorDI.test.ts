/**
 * Test for DI-enabled CodeBlockProcessor
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Container } from '@needle-di/core'
import { CodeBlockProcessor } from '../../src/mcp/codeBlockProcessor'
import { ServerConfigManager } from '../../src/mcp/serverConfigManagerDI'
import { ObsidianLoggingService } from '../../src/services/ObsidianLoggingService'
import {
	LoggingServiceToken,
	ServerConfigManagerToken,
	CodeBlockProcessorToken,
	MCPServerConfig
} from '@tars/contracts'

describe('DI CodeBlockProcessor', () => {
	let container: Container
	let mockLoggingService: any
	let mockServerConfigManager: any

	beforeEach(() => {
		container = new Container()

		// Mock logging service
		mockLoggingService = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		}

		// Mock server config manager
		mockServerConfigManager = {
			getServerConfigs: vi.fn(),
			getServerByName: vi.fn(),
			updateServerConfigs: vi.fn(),
			getServerById: vi.fn(),
			getEnabledServers: vi.fn(),
			validateConfig: vi.fn(),
			addServerConfig: vi.fn(),
			removeServerConfig: vi.fn(),
			setServerEnabled: vi.fn()
		}

		// Register mock services
		container.bind(LoggingServiceToken).toValue(mockLoggingService)
		container.bind(ServerConfigManagerToken).toValue(mockServerConfigManager)
		container.bind(CodeBlockProcessorToken).toClass(CodeBlockProcessor)
	})

	it('should be injectable and work with DI', () => {
		const processor = container.get(CodeBlockProcessorToken)
		expect(processor).toBeInstanceOf(CodeBlockProcessor)
	})

	it('should parse tool invocations using DI services', () => {
		// Setup mock server config
		const mockServerConfig: MCPServerConfig = {
			id: 'test-server',
			name: 'TestServer',
			enabled: true,
			deploymentType: 'managed',
			transport: 'stdio'
		}

		mockServerConfigManager.getServerByName.mockReturnValue(mockServerConfig)

		const processor = container.get(CodeBlockProcessorToken)
		const result = processor.parseToolInvocationExtended('tool: test_tool\nparam1: value1', 'TestServer')

		expect(result).toEqual({
			serverId: 'test-server',
			toolName: 'test_tool',
			parameters: { param1: 'value1' }
		})

		expect(mockLoggingService.debug).toHaveBeenCalledWith('Parsed tool invocation', {
			serverId: 'test-server',
			toolName: 'test_tool',
			parameterCount: 1
		})
	})

	it('should handle missing server config gracefully', () => {
		mockServerConfigManager.getServerByName.mockReturnValue(undefined)

		const processor = container.get(CodeBlockProcessorToken)
		const result = processor.parseToolInvocationExtended('tool: test_tool', 'NonExistentServer')

		expect(result).toBeNull()
		expect(mockLoggingService.debug).toHaveBeenCalledWith('No server configuration found for language: NonExistentServer')
	})

	it('should validate tool invocations', () => {
		const processor = container.get(CodeBlockProcessorToken)

		// Valid invocation
		expect(processor.validateInvocation('tool: test_tool')).toBe(true)

		// Invalid invocation
		expect(processor.validateInvocation('not a tool invocation')).toBe(false)
	})

	it('should process code blocks', async () => {
		// Setup mock server config
		const mockServerConfig: MCPServerConfig = {
			id: 'test-server',
			name: 'TestServer',
			enabled: true,
			deploymentType: 'managed',
			transport: 'stdio'
		}

		mockServerConfigManager.getServerByName.mockReturnValue(mockServerConfig)

		const processor = container.get(CodeBlockProcessorToken)
		const result = await processor.processCodeBlock('TestServer', 'tool: test_tool')

		expect(result).toContain('test_tool')
		expect(result).toContain('parsed successfully')
	})

	it('should render results in markdown format', () => {
		const processor = container.get(CodeBlockProcessorToken)
		const testData = { key: 'value', number: 42 }

		const result = processor.renderResults(testData)

		expect(result).toContain('key')
		expect(result).toContain('value')
		expect(result).toContain('number')
		expect(result).toContain('42')
	})
})