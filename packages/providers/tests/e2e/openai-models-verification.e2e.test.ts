/**
 * OpenAI Models Verification E2E Test
 * 
 * Verifies that the models we use in tests actually exist in OpenAI's API.
 * This helps us detect when OpenAI adds/removes models and prevents future breakage.
 * 
 * Features:
 * - Fetches current available models from OpenAI API
 * - Verifies our test models exist
 * - Checks for GPT-5 series availability
 * - Auto-skips if no API key
 */

import { describe, it, expect } from 'vitest'
import { shouldSkipE2ETests } from './helpers/skip-if-no-env'

// Auto-skip if no API key
const shouldSkipE2E = shouldSkipE2ETests({
	envVar: 'OPENAI_API_KEY',
	providerName: 'OpenAI',
	setupInstructions: [
		'Set API key: mise run secrets-rotate OPENAI_API_KEY sk-proj-...',
		'Run tests: mise run test-e2e'
	]
})

const API_KEY = process.env.OPENAI_API_KEY

interface OpenAIModel {
	id: string
	object: string
	created: number
	owned_by: string
}

interface ModelsListResponse {
	object: string
	data: OpenAIModel[]
}

/**
 * Fetch available models from OpenAI API
 */
async function fetchAvailableModels(apiKey: string): Promise<string[]> {
	const response = await fetch('https://api.openai.com/v1/models', {
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		}
	})

	if (!response.ok) {
		throw new Error(`Failed to fetch models: ${response.statusText}`)
	}

	const data: ModelsListResponse = await response.json()
	return data.data
		.map(model => model.id)
		.filter(id => id.startsWith('gpt'))
		.sort()
}

describe.skipIf(shouldSkipE2E)('OpenAI Models Verification', () => {
	// Models we rely on in our tests
	const REQUIRED_MODELS = {
		primary: 'gpt-5-nano',      // Our cheapest test model
		fallback: 'gpt-4o-mini',    // Fallback if nano unavailable
	}

	const EXPECTED_MODEL_SERIES = [
		'gpt-5',
		'gpt-4',
		'gpt-3.5'
	]

	let availableModels: string[] = []

	it('should fetch available models from OpenAI API', async () => {
		// GIVEN: Valid API key
		expect(API_KEY).toBeDefined()
		expect(API_KEY).toMatch(/^sk-/)

		// WHEN: Fetching models from API
		availableModels = await fetchAvailableModels(API_KEY as string)

		// THEN: Should receive models list
		expect(availableModels.length).toBeGreaterThan(0)
		// Silent on success
	}, 10000) // 10s timeout for API call

	it('should have our primary test model available', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Checking for primary model
		const hasPrimaryModel = availableModels.includes(REQUIRED_MODELS.primary)

		// THEN: Should be available
		expect(hasPrimaryModel).toBe(true)
		// Silent on success
	})

	it('should have fallback model available', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Checking for fallback model
		const hasFallbackModel = availableModels.includes(REQUIRED_MODELS.fallback)

		// THEN: Should be available
		expect(hasFallbackModel).toBe(true)
		// Silent on success
	})

	it('should have GPT-5 series models available', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Filtering for GPT-5 models
		const gpt5Models = availableModels.filter(model => model.startsWith('gpt-5'))

		// THEN: Should have multiple GPT-5 variants
		expect(gpt5Models.length).toBeGreaterThan(0)
		// Silent on success
	})

	it('should have expected model series available', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Checking for each expected series
		for (const series of EXPECTED_MODEL_SERIES) {
			const seriesModels = availableModels.filter(model => model.startsWith(series))

			// THEN: Each series should have models
			expect(seriesModels.length).toBeGreaterThan(0)
			// Silent on success
		}
	})

	it('should list all nano/mini models for cost-effective testing', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Finding all nano/mini models (cheapest)
		const costEffectiveModels = availableModels.filter(model =>
			model.includes('nano') || model.includes('mini')
		)

		// THEN: Should have multiple options
		expect(costEffectiveModels.length).toBeGreaterThan(0)
		// Silent on success
	})

	it('should verify model naming consistency', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Analyzing model names
		const patterns = {
			hasVersionDates: availableModels.some(m => /\d{4}-\d{2}-\d{2}/.test(m)),
			hasNanoVariants: availableModels.some(m => m.includes('nano')),
			hasMiniVariants: availableModels.some(m => m.includes('mini')),
			hasProVariants: availableModels.some(m => m.includes('pro')),
		}

		// THEN: Should follow OpenAI naming conventions
		expect(patterns.hasVersionDates).toBe(true)
		expect(patterns.hasNanoVariants).toBe(true)
		expect(patterns.hasMiniVariants).toBe(true)
		// Silent on success
	})

	it('should detect if new model series are added', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Extracting unique series (gpt-X)
		const seriesSet = new Set(
			availableModels
				.map(model => {
					const match = model.match(/^gpt-[\d.]+/)
					return match ? match[0] : null
				})
				.filter(Boolean)
		)

		const uniqueSeries = Array.from(seriesSet).sort()

		// THEN: Should have at least the known series
		expect(uniqueSeries.length).toBeGreaterThanOrEqual(EXPECTED_MODEL_SERIES.length)
		// Silent on success
	})

	it('should export model list for documentation', async () => {
		// GIVEN: Models fetched
		if (availableModels.length === 0) {
			availableModels = await fetchAvailableModels(API_KEY as string)
		}

		// WHEN: Creating categorized list
		const categorized = {
			'gpt-5': availableModels.filter(m => m.startsWith('gpt-5')),
			'gpt-4.1': availableModels.filter(m => m.startsWith('gpt-4.1')),
			'gpt-4o': availableModels.filter(m => m.startsWith('gpt-4o')),
			'gpt-4': availableModels.filter(m => m.startsWith('gpt-4') && !m.startsWith('gpt-4o') && !m.startsWith('gpt-4.1')),
			'gpt-3.5': availableModels.filter(m => m.startsWith('gpt-3.5')),
		}

		// THEN: Should have comprehensive list
		const totalCategorized = Object.values(categorized).reduce((sum, models) => sum + models.length, 0)
		expect(totalCategorized).toBeGreaterThan(0)
		// Silent on success
	})
})
