import { type LlmCapability, toLlmModels } from '@tars/contracts/providers'

// Simple exports to get the basic structure working
export const createSimpleVendor = (name: string) => {
	const capabilities: LlmCapability[] = ['Text Generation']
	return {
		name,
		defaultOptions: {
			apiKey: '',
			baseURL: '',
			model: '',
			parameters: {}
		},
		models: toLlmModels(['test-model'], capabilities),
		websiteToObtainKey: 'https://example.com',
		capabilities,
		sendRequestFunc: () =>
			async function* () {
				yield 'Simple response'
			}
	}
}
