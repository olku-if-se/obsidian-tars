import type { EventEmitter } from 'node:events'

// Simple EventBus type definition
export type EventBus = EventEmitter & {
  emit: (event: string, ...args: unknown[]) => boolean
  on: (event: string, listener: (...args: unknown[]) => void) => EventBus
  off: (event: string, listener: (...args: unknown[]) => void) => EventBus
}
