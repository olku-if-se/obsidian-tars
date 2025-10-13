import { createRoot, type Root } from 'react-dom/client'
import React from 'react'
import type { App } from 'obsidian'

export interface BridgeComponentProps {
	app: App
}

export class ReactBridge {
	private roots: Map<HTMLElement, Root> = new Map()

	constructor(private app: App) {}

	mount<T extends Record<string, any>>(container: HTMLElement, component: React.ComponentType<T>, props: T): void {
		// Clean up any existing root for this container
		this.unmount(container)

		// Create React 18 root
		const root = createRoot(container)

		// Render the component with props including the Obsidian app
		root.render(
			React.createElement(component, {
				...props,
				app: this.app
			} as T)
		)

		// Store the root for later cleanup
		this.roots.set(container, root)
	}

	unmount(container: HTMLElement): void {
		const root = this.roots.get(container)
		if (root) {
			root.unmount()
			this.roots.delete(container)
		}
	}

	unmountAll(): void {
		for (const [_container, root] of this.roots) {
			root.unmount()
		}
		this.roots.clear()
	}

	hasRoot(container: HTMLElement): boolean {
		return this.roots.has(container)
	}

	getMountedCount(): number {
		return this.roots.size
	}

	// Utility method to check if React is available
	static isReactAvailable(): boolean {
		try {
			require('react')
			require('react-dom/client')
			return true
		} catch {
			return false
		}
	}
}
