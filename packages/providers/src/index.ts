// Re-export base types and classes
export {
	BaseProvider,
	type BaseOptions,
	type Capability,
	type Message,
	type MsgRole,
	type Optional,
	type ProviderSettings,
	type ResolveEmbedAsBinary,
	type SaveAttachment,
	type SendRequest,
	type Vendor,
	providerToVendor
} from './base'

// Re-export utility functions
export {
	arrayBufferToBase64,
	convertEmbedToImageUrl,
	getCapabilityEmoji,
	getMimeTypeFromFilename,
	CALLOUT_BLOCK_START,
	CALLOUT_BLOCK_END
} from './utils'

// Export decorator utilities
export { withStreamLogging } from './decorator'

// Export simple vendor for testing
export { createSimpleVendor } from './simple'

// Temporary minimal exports to get build working
export const allVendors = []