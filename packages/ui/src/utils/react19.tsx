import { type ComponentProps, forwardRef } from 'react'

// React 19 utility types and patterns
export interface PolymorphicProps<E extends React.ElementType> {
  /**
   * The component to render as
   * @default 'div'
   */
  as?: E
}

// Helper for polymorphic components with React 19
export function createPolymorphicComponent<
  P extends { as?: React.ElementType },
  E extends React.ElementType = 'div'
>(defaultElement: E) {
  return forwardRef<any, P & ComponentProps<E>>(
    ({ as: Component = defaultElement, ...props }, ref) => {
      return <Component ref={ref} {...props} />
    }
  )
}

// React 19 startTransition utility wrapper
export function withStartTransition<T extends any[], R>(
  fn: (...args: T) => R | Promise<R>
) {
  return async (...args: T): Promise<R> => {
    // Import dynamically to avoid SSR issues
    const { startTransition } = await import('react')

    return new Promise<R>((resolve, reject) => {
      startTransition(() => {
        try {
          const result = fn(...args)
          if (result instanceof Promise) {
            result.then(resolve).catch(reject)
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }
      })
    })
  }
}

// React 19 concurrent feature utilities
export function createDeferredUpdater<T>(
  setter: React.Dispatch<React.SetStateAction<T>>
) {
  return (value: React.SetStateAction<T>) => {
    import('react').then(({ startTransition }) => {
      startTransition(() => {
        setter(value)
      })
    })
  }
}

// Utility for safe concurrent state updates
export function useConcurrentState<T>(initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // This would be implemented with React 19's useTransition
  // For now, it's a placeholder for future React 19 migration
  throw new Error('useConcurrentState is a placeholder for React 19 migration')
}