/**
 * URN namespace definitions for token naming
 * Following RFC 8141 (Uniform Resource Name)
 *
 * Format: urn:namespace:type:identifier
 * Examples:
 * - urn:tars:service:logger
 * - urn:tars:provider:llm-providers
 * - urn:tars:capability:text-generation
 */

export const URN = {
	// Base namespace
	NAMESPACE: 'tars',

	// Resource types
	SERVICE: 'service',
	PROVIDER: 'provider',
	CAPABILITY: 'capability',
	CONFIG: 'config',
	ADAPTER: 'adapter',
	MANAGER: 'manager',
	FACTORY: 'factory'
} as const

/**
 * Build URN token names
 */
export function createUrn(type: string, identifier: string): string {
	return `urn:${URN.NAMESPACE}:${type}:${identifier}`
}

// Helper functions for common URN patterns
export const urn = {
	service: (id: string) => createUrn(URN.SERVICE, id),
	provider: (id: string) => createUrn(URN.PROVIDER, id),
	capability: (id: string) => createUrn(URN.CAPABILITY, id),
	config: (id: string) => createUrn(URN.CONFIG, id),
	adapter: (id: string) => createUrn(URN.ADAPTER, id),
	manager: (id: string) => createUrn(URN.MANAGER, id),
	factory: (id: string) => createUrn(URN.FACTORY, id)
}
