import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../components/Button';

describe('Button', () => {
	it('renders children correctly', () => {
		render(<Button>Click me</Button>);
		expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
	});

	it('handles click events', () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		screen.getByRole('button').click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('applies variant classes', () => {
		render(<Button variant="primary">Primary</Button>);
		const button = screen.getByRole('button');
		// CSS Modules generate scoped class names, so we check if the class contains 'primary'
		expect(button.className).toContain('primary');
	});

	it('applies default variant when none specified', () => {
		render(<Button>Default</Button>);
		const button = screen.getByRole('button');
		expect(button.className).toContain('button');
		expect(button.className).not.toContain('primary');
		expect(button.className).not.toContain('danger');
	});

	it('applies size classes', () => {
		render(<Button size="lg">Large</Button>);
		const button = screen.getByRole('button');
		expect(button.className).toContain('lg');
	});

	it('applies custom className', () => {
		render(<Button className="custom-class">Custom</Button>);
		const button = screen.getByRole('button');
		expect(button.className).toContain('custom-class');
	});

	it('is disabled when disabled prop is true', () => {
		render(<Button disabled>Disabled</Button>);
		expect(screen.getByRole('button')).toBeDisabled();
	});
});
