// Mock obsidian module for testing
export const mockObsidian = {
	// Add any obsidian exports that providers might use
	Platform: {
		isDesktop: true,
		isMobile: false
	},
	requestUrl: async () => null,
	Notice: class {
		constructor(message: string) {
			// Mock Notice class - no output needed
		}
	}
}

export default mockObsidian
