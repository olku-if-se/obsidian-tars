import type { ReactBridge } from './ReactBridge'

export interface ReactContainerOptions {
	// Additional configuration for the container
	destroyOnUnmount?: boolean
	onMount?: (element: HTMLElement) => void
	onUnmount?: (element: HTMLElement) => void
}

/**
 * Creates a reusable React container wrapper that handles mounting/unmounting
 */
export function createReactContainer(bridge: ReactBridge, options: ReactContainerOptions = {}) {
	const { destroyOnUnmount = false, onMount, onUnmount } = options

	return {
		/**
		 * Mount a React component to a container element
		 */
		mount<T extends Record<string, any>>(container: HTMLElement, component: React.ComponentType<T>, props: T): void {
			// Clear container
			container.empty()

			// Call mount callback if provided
			onMount?.(container)

			// Mount React component
			bridge.mount(container, component, props)
		},

		/**
		 * Unmount React component from container
		 */
		unmount(container: HTMLElement): void {
			// Call unmount callback if provided
			onUnmount?.(container)

			// Unmount React component
			bridge.unmount(container)

			// Optionally destroy container
			if (destroyOnUnmount) {
				container.remove()
			}
		},

		/**
		 * Check if container has React component mounted
		 */
		isMounted(container: HTMLElement): boolean {
			return bridge.hasRoot(container)
		}
	}
}

/**
 * Factory function to create a preconfigured React container
 */
export function createReactContainerFactory(bridge: ReactBridge, defaultOptions: ReactContainerOptions = {}) {
	return (options: ReactContainerOptions = {}) => {
		return createReactContainer(bridge, { ...defaultOptions, ...options })
	}
}
