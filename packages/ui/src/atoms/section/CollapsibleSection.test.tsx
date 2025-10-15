import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { CollapsibleSection } from './CollapsibleSection'

describe('CollapsibleSection', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('renders title correctly', () => {
		render(
			<CollapsibleSection title='Test Section'>
				<p>Content</p>
			</CollapsibleSection>
		)

		expect(screen.getByText('Test Section')).toBeInTheDocument()
	})

	it('renders children when open', () => {
		render(
			<CollapsibleSection title='Test Section' defaultOpen>
				<p>Content</p>
			</CollapsibleSection>
		)

		expect(screen.getByText('Content')).toBeInTheDocument()
	})

	it('does not render children when closed', () => {
		render(
			<CollapsibleSection title='Test Section' defaultOpen={false}>
				<p>Content</p>
			</CollapsibleSection>
		)

		expect(screen.queryByText('Content')).not.toBeInTheDocument()
	})

	it('handles controlled state correctly', () => {
		const handleToggle = vi.fn()
		render(
			<CollapsibleSection title='Test Section' open={false} onToggle={handleToggle}>
				<p>Content</p>
			</CollapsibleSection>
		)

		const summary = screen.getByText('Test Section').closest('summary')
		fireEvent.click(summary!)

		expect(handleToggle).toHaveBeenCalledWith(true)
	})

	it('handles uncontrolled state correctly', () => {
		render(
			<CollapsibleSection title='Test Section' defaultOpen={false}>
				<p>Content</p>
			</CollapsibleSection>
		)

		const summary = screen.getByText('Test Section').closest('summary')
		fireEvent.click(summary!)

		expect(screen.getByText('Content')).toBeInTheDocument()
	})

	it('calls onToggle when toggled', async () => {
		const handleToggle = vi.fn()
		render(
			<CollapsibleSection title='Test Section' onToggle={handleToggle}>
				<p>Content</p>
			</CollapsibleSection>
		)

		const summary = screen.getByText('Test Section').closest('summary')
		fireEvent.click(summary!)

		expect(handleToggle).toHaveBeenCalledWith(true)
	})

	it('handles async onToggle without errors', async () => {
		const handleToggle = vi.fn().mockResolvedValue(undefined)
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

		render(
			<CollapsibleSection title='Test Section' onToggle={handleToggle}>
				<p>Content</p>
			</CollapsibleSection>
		)

		const summary = screen.getByText('Test Section').closest('summary')
		fireEvent.click(summary!)

		// Wait for async operation
		await vi.waitFor(() => expect(handleToggle).toHaveBeenCalled())

		expect(consoleSpy).not.toHaveBeenCalled()
		consoleSpy.mockRestore()
	})

	it('warns about controlled/uncontrolled mismatch in development', () => {
		const originalEnv = process.env.NODE_ENV
		process.env.NODE_ENV = 'development'
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

		const { rerender } = render(
			<CollapsibleSection title='Test Section'>
				<p>Content</p>
			</CollapsibleSection>
		)

		// Switch to controlled
		rerender(
			<CollapsibleSection title='Test Section' open={true}>
				<p>Content</p>
			</CollapsibleSection>
		)

		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('changing from uncontrolled to controlled')
		)

		consoleSpy.mockRestore()
		process.env.NODE_ENV = originalEnv
	})

	it('applies custom className correctly', () => {
		render(
			<CollapsibleSection title='Test Section' className='custom-class'>
				<p>Content</p>
			</CollapsibleSection>
		)

		const details = screen.getByRole('group')
		expect(details).toHaveClass('custom-class')
	})

	it('has correct accessibility attributes', () => {
		render(
			<CollapsibleSection title='Test Section' open>
				<p>Content</p>
			</CollapsibleSection>
		)

		const details = screen.getByRole('group')
		expect(details).toHaveAttribute('open')
		expect(details).toHaveAttribute('data-state', 'open')

		const arrow = screen.getByText('▼')
		expect(arrow).toHaveAttribute('aria-hidden', 'true')
		expect(arrow).toHaveAttribute('data-open', 'true')
	})

	it('matches snapshot', () => {
		const { asFragment } = render(
			<CollapsibleSection title='Test Section' defaultOpen>
				<p>Content</p>
			</CollapsibleSection>
		)

		expect(asFragment()).toMatchSnapshot()
	})
})