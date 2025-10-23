import type { DocumentWriteLock, MCPIntegration, MCPToolInjector } from '@tars/contracts'
import { z } from 'zod'

// Zod schemas for type safety and validation
export const documentWriteLockSchema = z.custom<DocumentWriteLock>((value) => {
	if (!value || typeof value !== 'object') {
		return false
	}
	const candidate = value as Partial<DocumentWriteLock>
	return typeof candidate.runExclusive === 'function'
}, 'Document write lock is required')

export const mcpIntegrationSchema = z.custom<MCPIntegration>(
	(value) => typeof value === 'object' && value !== null,
	'MCP integration is required'
)

export const mcpToolInjectorSchema = z.custom<MCPToolInjector>((value) => {
	if (!value || typeof value !== 'object') {
		return false
	}
	return typeof (value as MCPToolInjector).injectTools === 'function'
}, 'MCP tool injector is required')

export const AzureOptionsSchema = z.object({
	apiKey: z.string().min(1, 'API key is required'),
	endpoint: z.string().url('Invalid Azure endpoint URL'),
	apiVersion: z.string().min(1, 'API version is required'),
	model: z.string().min(1, 'Model is required'),
	baseURL: z.string().optional(),
	parameters: z.record(z.unknown()).default({})
})

export const MessageSchema = z.object({
	role: z.enum(['user', 'assistant', 'system']),
	content: z.union([z.string(), z.array(z.any())]),
	embeds: z.array(z.any()).optional()
})

export type ValidatedAzureOptions = z.infer<typeof AzureOptionsSchema>
export type ValidatedMessage = z.infer<typeof MessageSchema>
