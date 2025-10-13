# @tars/streams

Concurrent, anchor-aware text editing streams with piece table implementation for efficient text manipulation.

## Features

- **Concurrent Editing**: Multiple actors can safely edit text simultaneously using anchor-based locking
- **Anchor Management**: Invisible anchors that automatically adjust as text changes
- **Piece Table Buffer**: Efficient text buffer implementation with low memory overhead
- **Stream Compatible**: Works with Node.js streams for reading and writing
- **History Tracking**: Bounded history with snapshot compaction for long sessions
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @tars/streams
```

## Quick Start

```typescript
import { TextEditStream, SimpleAsyncLock, LockMap } from '@tars/streams'

// Create a text stream
const stream = new TextEditStream('Hello, World!')

// Add an anchor at the end
const cursor = stream.addAnchor('cursor', stream.getText().length)

// Insert text at the anchor
await stream.applyChange('user', 'cursor', ' Welcome to TARS!')

console.log(stream.getText())
// Output: "Hello, World! Welcome to TARS!"
```

## Core Classes

### TextEditStream

The main class for concurrent text editing with anchor management.

```typescript
class TextEditStream extends Duplex {
  constructor(initial?: string, lockMap?: LockMap)

  // Anchor management
  addAnchor(id: string, position: number): Anchor
  findAnchor(id: string): Anchor

  // Text editing
  applyChange(actor: string, anchorId: string, text: string, offset?: number | ((anchor: Anchor) => number)): Promise<void>
  replaceRange(actor: string, range: Range, text: string): Promise<void>
  deleteRange(actor: string, range: Range): Promise<void>
  insertRelative(actor: string, anchorId: string, text: string, position: 'before' | 'after'): Promise<void>

  // Stream operations
  getText(): string
  toJSON(): { text: string, anchors: Anchor[] }
}
```

### SimplePieceTable

Efficient text buffer implementation using piece table data structure.

```typescript
class SimplePieceTable implements TextBuffer {
  constructor(initial?: string)

  insert(offset: number, text: string): void
  delete(offset: number, length: number): void
  getText(): string
  length(): number
}
```

### Lock Management

```typescript
// Simple lock for exclusive operations
class SimpleAsyncLock implements AsyncLock {
  runExclusive<T>(fn: () => Promise<T> | T): Promise<T>
}

// Map-based lock management for multiple anchors
class LockMap {
  get(key: string): AsyncLock
}
```

## Advanced Usage

### Concurrent Operations

```typescript
const stream = new TextEditStream('The quick brown fox')

// Multiple actors can edit simultaneously
stream.addAnchor('noun', 4)    // Position of "quick"
stream.addAnchor('adj', 10)    // Position of "brown"
stream.addAnchor('verb', 16)   // Position of "fox"

// These operations run concurrently without conflicts
await Promise.all([
  stream.applyChange('actor1', 'noun', 'slow'),
  stream.applyChange('actor2', 'adj', 'red'),
  stream.applyChange('actor3', 'verb', 'jumps')
])

console.log(stream.getText())
// Output: "The slow red fox jumps"
```

### Range Operations

```typescript
const stream = new TextEditStream('Hello, cruel world!')
stream.addAnchor('start', 7)  // Position of "c"
stream.addAnchor('end', 12)    // Position of "!" (after "world")

const range = new Range(stream.findAnchor('start'), stream.findAnchor('end'))
await stream.replaceRange('user', range, 'wonderful')

console.log(stream.getText())
// Output: "Hello, wonderful world!"
```

### Custom Lock Implementation

```typescript
import { AsyncLock } from '@tars/streams'

class CustomLock implements AsyncLock {
  async runExclusive<T>(fn: () => Promise<T> | T): Promise<T> {
    // Your custom locking logic
    return await fn()
  }
}

const customLockMap = new LockMap(() => new CustomLock())
const stream = new TextEditStream('Initial text', customLockMap)
```

## Architecture

The package is designed around several key abstractions:

- **TextBuffer**: Abstract interface for text storage (implemented by SimplePieceTable)
- **AsyncLock**: Abstract interface for concurrency control (implemented by SimpleAsyncLock)
- **Anchor**: Position markers that auto-adjust as text changes
- **Range**: Span of text defined by two anchors
- **LockMap**: Maps anchor IDs to locks for fine-grained concurrency control

## Performance

- **Piece Table**: O(log n) insert/delete operations with low memory overhead
- **Anchor Adjustment**: O(n) where n is number of anchors (typically small)
- **Lock Management**: Minimal overhead for concurrent operations
- **History Compaction**: Bounded memory usage for long editing sessions

## License

MIT