/**
 * E2E Test Skip Helper
 *
 * Automatically skips E2E tests when required environment variables are not set.
 * Provides helpful console messages guiding developers on how to set up secrets.
 */

export interface SkipConfig {
	/**
	 * Name of the environment variable to check
	 */
	envVar: string

	/**
	 * Provider name for display (e.g., "OpenAI", "Anthropic")
	 */
	providerName: string

	/**
	 * Optional: Custom setup instructions
	 */
	setupInstructions?: string[]
}

/**
 * Check if E2E tests should be skipped due to missing environment variable
 *
 * @param config - Configuration for skip check
 * @returns true if tests should be skipped, false otherwise
 *
 * @example
 * ```typescript
 * const shouldSkip = shouldSkipE2ETests({
 *   envVar: 'E2E_OPENAI_API_KEY',
 *   providerName: 'OpenAI'
 * })
 *
 * describe.skipIf(shouldSkip)('OpenAI E2E Tests', () => {
 *   // Tests here...
 * })
 * ```
 */
export function shouldSkipE2ETests(config: SkipConfig): boolean {
	const { envVar, providerName, setupInstructions } = config
	const hasEnvVar = !!process.env[envVar]

	if (!hasEnvVar) {
		console.warn(`\n⚠️  ${providerName} E2E Tests Skipped: ${envVar} not set`)
		console.warn('💡 To run E2E tests:')

		if (setupInstructions) {
			setupInstructions.forEach((instruction, index) => {
				console.warn(`   ${index + 1}. ${instruction}`)
			})
		} else {
			// Default instructions
			console.warn('   1. Set API key: mise run secrets-init && mise run secrets-edit')
			console.warn('   2. Run tests:   mise run test-e2e')
			console.warn(`   Or directly:    ${envVar}=your-key npm test -- ${providerName.toLowerCase()}-*.e2e.test.ts`)
		}

		console.warn('')
	}

	return !hasEnvVar
}

/**
 * Get environment variable value or throw error with helpful message
 *
 * @param envVar - Name of environment variable
 * @param providerName - Provider name for error message
 * @returns Value of environment variable
 * @throws Error if environment variable not set
 *
 * @example
 * ```typescript
 * const apiKey = requireEnvVar('OPENAI_API_KEY', 'OpenAI')
 * // Returns: 'sk-proj-...'
 * ```
 */
export function requireEnvVar(envVar: string, providerName: string): string {
	const value = process.env[envVar]

	if (!value) {
		throw new Error(
			`${envVar} not set. Run: mise run secrets-init && mise run secrets-edit to configure ${providerName} API key.`
		)
	}

	return value
}

/**
 * Get environment variable with default value
 *
 * @param envVar - Name of environment variable
 * @param defaultValue - Default value if not set
 * @returns Environment variable value or default
 *
 * @example
 * ```typescript
 * const model = getEnvVar('OPENAI_MODEL', 'gpt-5-nano')
 * // Returns: 'gpt-5-nano' if OPENAI_MODEL not set
 * ```
 */
export function getEnvVar(envVar: string, defaultValue: string): string {
	return process.env[envVar] || defaultValue
}

/**
 * Check multiple environment variables
 *
 * @param configs - Array of skip configurations
 * @returns true if any required env var is missing
 *
 * @example
 * ```typescript
 * const shouldSkip = shouldSkipMultipleE2ETests([
 *   { envVar: 'OPENAI_API_KEY', providerName: 'OpenAI' },
 *   { envVar: 'ANTHROPIC_API_KEY', providerName: 'Anthropic' }
 * ])
 * ```
 */
export function shouldSkipMultipleE2ETests(configs: SkipConfig[]): boolean {
	const missing = configs.filter((config) => !process.env[config.envVar])

	if (missing.length > 0) {
		console.warn('\n⚠️  E2E Tests Skipped: Missing required environment variables')
		missing.forEach((config) => {
			console.warn(`   - ${config.envVar} (${config.providerName})`)
		})
		console.warn('\n💡 To run E2E tests:')
		console.warn('   1. Set API keys: mise run secrets-init && mise run secrets-edit')
		console.warn('   2. Run tests:     mise run test-e2e\n')

		return true
	}

	return false
}
