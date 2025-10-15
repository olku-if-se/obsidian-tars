import React from 'react'

// Prop validation utilities for React components

// Type guards
export const isValidString = (value: unknown): value is string => {
	return typeof value === 'string' && value.length > 0
}

export const isValidReactNode = (value: unknown): value is React.ReactNode => {
	return (
		value === null ||
		value === undefined ||
		typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'boolean' ||
		(value as any)?.$$typeof === Symbol.for('react.element') ||
		Array.isArray(value)
	)
}

// Security utilities
export const sanitizeHtml = (html: string): string => {
	// Basic HTML sanitization - in a real app, use DOMPurify
	return html
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+\s*=/gi, '')
}

export const validateUrl = (url: string): boolean => {
	try {
		const parsed = new URL(url)
		return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)
	} catch {
		return false
	}
}

export const validateAriaLabel = (label: string): boolean => {
	return isValidString(label) && label.length <= 100
}

// Prop validation with warnings
export const validateProps = <T extends Record<string, any>>(
	props: T,
	validators: Partial<Record<keyof T, (value: any) => boolean>>,
	componentName: string
): boolean => {
	let isValid = true

	Object.entries(validators).forEach(([prop, validator]) => {
		const value = props[prop]
		if (value !== undefined && validator && !validator(value)) {
			console.warn(
				`Invalid prop "${prop}" supplied to ${componentName}. ` +
				`Received: ${typeof value} (${JSON.stringify(value)})`
			)
			isValid = false
		}
	})

	return isValid
}

// Event handler validation
export const validateEventHandler = (handler: unknown): boolean => {
	return handler === null || handler === undefined || typeof handler === 'function'
}

// Children validation
export const validateChildren = (children: React.ReactNode): boolean => {
	if (children === null || children === undefined) return true

	// Check for dangerous content
	const childrenString = React.Children.toArray(children).join('')

	// Basic security check
	if (typeof childrenString === 'string') {
		return !childrenString.includes('<script') &&
			   !childrenString.includes('javascript:')
	}

	return true
}

// Common validation rules
export const VALIDATION_RULES = {
	required: (value: unknown) => value !== undefined && value !== null,
	string: isValidString,
	node: isValidReactNode,
	eventHandler: validateEventHandler,
	url: validateUrl,
	ariaLabel: validateAriaLabel,
	children: validateChildren
} as const