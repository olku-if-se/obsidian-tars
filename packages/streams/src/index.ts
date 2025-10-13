// Core types and interfaces

// Lock implementations
export { LockMap, SimpleAsyncLock } from './async-lock'
// Main text editing stream
export { TextEditStream } from './edit-stream'
// Text buffer implementation
export { SimplePieceTable } from './piece-table'
export type { Anchor, AsyncLock, TextBuffer, TextChange } from './types'
export { Range } from './types'
