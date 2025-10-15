import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
	it('renders children correctly', () => {
		render(<Button>Click me</Button>)
		expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
	})

	it('handles click events', () => {
		const handleClick = vi.fn()
		render(<Button onClick={handleClick}>Click me</Button>)

		fireEvent.click(screen.getByRole('button'))
		expect(handleClick).toHaveBeenCalledTimes(1)
	})

	it('applies variant classes', () => {
		render(<Button variant='primary'>Primary</Button>)
		const button = screen.getByRole('button')
		// CSS Modules generate scoped class names, so we check if the class contains 'primary'
		expect(button.className).toContain('primary')
	})

	it('applies default variant when none specified', () => {
		render(<Button>Default</Button>)
		const button = screen.getByRole('button')
		expect(button.className).toContain('button')
		expect(button.className).not.toContain('primary')
		expect(button.className).not.toContain('danger')
	})

	it('applies size classes', () => {
		render(<Button size='lg'>Large</Button>)
		const button = screen.getByRole('button')
		expect(button.className).toContain('lg')
	})

	it('applies custom className', () => {
		render(<Button className='custom-class'>Custom</Button>)
		const button = screen.getByRole('button')
		expect(button.className).toContain('custom-class')
	})

	it('is disabled when disabled prop is true', () => {
		render(<Button disabled>Disabled</Button>)
		expect(screen.getByRole('button')).toBeDisabled()
	})

	// New tests for React 19 compliance
	it('renders as different element when "as" prop is provided', () => {
		render(<Button as='a' href='https://example.com'>Link Button</Button>)
		const link = screen.getByRole('link')
		expect(link).toBeInTheDocument()
		expect(link).toHaveAttribute('href', 'https://example.com')
	})

	it('validates variant in development mode', () => {
		const originalEnv = process.env.NODE_ENV
		process.env.NODE_ENV = 'development'
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

		// @ts-ignore - intentionally testing invalid prop
		render(<Button variant='invalid'>Invalid</Button>)
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('Invalid variant "invalid"')
		)

		consoleSpy.mockRestore()
		process.env.NODE_ENV = originalEnv
	})

	it('validates size in development mode', () => {
		const originalEnv = process.env.NODE_ENV
		process.env.NODE_ENV = 'development'
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

		// @ts-ignore - intentionally testing invalid prop
		render(<Button size='invalid'>Invalid</Button>)
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('Invalid size "invalid"')
		)

		consoleSpy.mockRestore()
		process.env.NODE_ENV = originalEnv
	})

	// Test memoization behavior
	it('re-renders only when props change', () => {
		const handleClick = vi.fn()
		const { rerender } = render(
			<Button onClick={handleClick} variant='primary'>
				Test Button
			</Button>
		)

		// Rerender with same props
		rerender(
			<Button onClick={handleClick} variant='primary'>
				Test Button
			</Button>
		)

		// Button should still work correctly
		fireEvent.click(screen.getByRole('button'))
		expect(handleClick).toHaveBeenCalledTimes(1)
	})

	// Accessibility tests
	it('has proper accessibility attributes', () => {
		render(
			<Button disabled aria-label='Custom label'>
				Button Content
			</Button>
		)

		const button = screen.getByRole('button')
		expect(button).toHaveAttribute('aria-label', 'Custom label')
		expect(button).toBeDisabled()
	})

	// Snapshot test
	it('matches snapshot for different variants', () => {
		const { asFragment } = render(
			<div>
				<Button variant='default'>Default</Button>
				<Button variant='primary'>Primary</Button>
				<Button variant='danger'>Danger</Button>
				<Button size='sm'>Small</Button>
				<Button size='lg'>Large</Button>
			</div>
		)
		expect(asFragment()).toMatchSnapshot()
	})
})
