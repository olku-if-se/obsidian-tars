// Simple exports to get the basic structure working
export const createSimpleVendor = (name: string) => ({
	name,
	defaultOptions: {
		apiKey: '',
		baseURL: '',
		model: '',
		parameters: {}
	},
	models: ['test-model'],
	websiteToObtainKey: 'https://example.com',
	capabilities: ['Text Generation'] as const,
	sendRequestFunc: () =>
		async function* () {
			yield 'Simple response'
		}
})
