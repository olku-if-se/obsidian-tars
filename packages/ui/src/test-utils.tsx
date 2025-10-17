import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'

// Test providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	// Add future providers here (i18n, theme, etc.)
	return <>{children}</>
}

// Custom render function with providers
const customRender = <T = {}>(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'> & T): RenderResult =>
	render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything from testing-library
export * from '@testing-library/react'
export { customRender as render }

// Test utilities
export const createMockProps = <T extends Record<string, any>>(defaults: T, overrides: Partial<T> = {}): T => ({
	...defaults,
	...overrides
})

// Accessibility testing helper
export const checkAccessibility = (container: HTMLElement) => {
	// This would integrate with @testing-library/jest-dom's accessibility checks
	// or a11y library when available
	return true
}

// Mock data generators
export const createMockError = (overrides = {}) => ({
	id: 'test-error-1',
	name: 'Test Error',
	message: 'This is a test error',
	timestamp: new Date(),
	type: 'error' as const,
	...overrides
})

export const createMockStatusBarState = (overrides = {}) => ({
	type: 'idle' as const,
	content: {
		text: 'Ready',
		tooltip: 'Ready to help'
	},
	timestamp: new Date(),
	...overrides
})
