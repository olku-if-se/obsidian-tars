/**
 * DI-enabled React Bridge
 * Handles mounting and unmounting React components in Obsidian with dependency injection
 */

import { injectable, inject } from '@needle-di/core'
import { createRoot, type Root } from 'react-dom/client'
import React from 'react'
import type { App } from 'obsidian'
import type { IReactBridge, ILoggingService, ReactComponentType } from '@tars/contracts'
import { LoggingServiceToken } from '@tars/contracts'

export interface BridgeComponentProps {
	app: App
}

/**
 * DI-enabled React Bridge implementation
 * Fully migrated to dependency injection with enhanced logging
 */
@injectable()
export class ReactBridge implements IReactBridge {
	private roots: Map<HTMLElement, Root> = new Map()

	constructor(
		private app: App,
		private loggingService = inject(LoggingServiceToken)
	) {
		this.loggingService.debug('React bridge initialized with DI', {
			app: !!app
		})
	}

	/**
	 * Mount a React component into a container element
	 */
	mount<T extends Record<string, any>>(container: HTMLElement, component: ReactComponentType<T>, props: T): void {
		this.loggingService.debug('Mounting React component', {
			componentName: component.name || 'Anonymous',
			containerTag: container.tagName,
			hasExistingRoot: this.roots.has(container)
		})

		// Clean up any existing root for this container
		this.unmount(container)

		try {
			// Create React 18 root
			const root = createRoot(container)

			// Render the component with props including the Obsidian app
			const enhancedProps = {
				...props,
				app: this.app
			} as T

			root.render(React.createElement(component, enhancedProps))

			// Store the root for later cleanup
			this.roots.set(container, root)

			this.loggingService.debug('React component mounted successfully', {
				componentName: component.name || 'Anonymous',
				totalMounted: this.roots.size
			})
		} catch (error) {
			this.loggingService.error('Failed to mount React component', {
				error,
				componentName: component.name || 'Anonymous',
				containerTag: container.tagName
			})
			throw error
		}
	}

	/**
	 * Unmount a React component from a container element
	 */
	unmount(container: HTMLElement): void {
		const root = this.roots.get(container)
		if (root) {
			this.loggingService.debug('Unmounting React component', {
				containerTag: container.tagName,
				totalMounted: this.roots.size
			})

			try {
				root.unmount()
				this.roots.delete(container)

				this.loggingService.debug('React component unmounted successfully', {
					containerTag: container.tagName,
					remainingMounted: this.roots.size
				})
			} catch (error) {
				this.loggingService.error('Failed to unmount React component', {
					error,
					containerTag: container.tagName
				})
				// Still remove from tracking even if unmount failed
				this.roots.delete(container)
			}
		}
	}

	/**
	 * Unmount all mounted React components
	 */
	unmountAll(): void {
		const mountCount = this.roots.size
		if (mountCount === 0) {
			this.loggingService.debug('No React components to unmount')
			return
		}

		this.loggingService.info(`Unmounting all ${mountCount} React components`)

		let successCount = 0
		let errorCount = 0

		for (const [container, root] of this.roots) {
			try {
				root.unmount()
				successCount++
			} catch (error) {
				errorCount++
				this.loggingService.error('Failed to unmount React component during cleanup', {
					error,
					containerTag: container.tagName
				})
			}
		}

		this.roots.clear()

		this.loggingService.info('React bridge cleanup completed', {
			successCount,
			errorCount,
			totalProcessed: mountCount
		})
	}

	/**
	 * Check if a container has a mounted React component
	 */
	hasRoot(container: HTMLElement): boolean {
		return this.roots.has(container)
	}

	/**
	 * Get the number of currently mounted components
	 */
	getMountedCount(): number {
		return this.roots.size
	}

	/**
	 * Get information about mounted components for debugging
	 */
	getDebugInfo(): { mountedCount: number; containers: string[] } {
		const containers = Array.from(this.roots.keys()).map(
			(container) =>
				`${container.tagName.toLowerCase()}${container.id ? '#' + container.id : ''}${container.className ? '.' + container.className.split(' ').join('.') : ''}`
		)

		return {
			mountedCount: this.roots.size,
			containers
		}
	}
}
