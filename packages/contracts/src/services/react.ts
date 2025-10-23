/**
 * React Bridge service interface for managing React components in Obsidian
 */

import type { App } from 'obsidian'

// Generic React component type to avoid direct React dependency
export type ReactComponentType<T extends Record<string, unknown> = Record<string, unknown>> = (props: T) => unknown

export interface IReactBridge {
	/**
	 * Mount a React component into a container element
	 */
	mount<T extends Record<string, unknown>>(container: HTMLElement, component: ReactComponentType<T>, props: T): void

	/**
	 * Unmount a React component from a container element
	 */
	unmount(container: HTMLElement): void

	/**
	 * Unmount all mounted React components
	 */
	unmountAll(): void

	/**
	 * Check if a container has a mounted React component
	 */
	hasRoot(container: HTMLElement): boolean

	/**
	 * Get the number of currently mounted components
	 */
	getMountedCount(): number
}

export interface IReactBridgeManager {
	/**
	 * Get the React bridge instance
	 */
	getReactBridge(): IReactBridge

	/**
	 * Initialize the React bridge with Obsidian app
	 */
	initialize(app: App): void

	/**
	 * Clean up all React components
	 */
	dispose(): void

	/**
	 * Check if React bridge is ready
	 */
	isReady(): boolean
}
