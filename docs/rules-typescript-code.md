# 🧑‍💻 TypeScript Code Excellence Guidelines (The Elegance Edition)

Transform any TypeScript code into an **elegant, composable, and resilient asynchronous system**.
Follow these rules to build production-grade applications that are a joy to maintain and extend.

---

## 🎨 Core Architecture Principles

### 1. **Domain-Scoped File Structure**
- A file's path defines its domain and should export a **suite of composable components**, not just a single function.
- **Avoid redundant domain prefixes** on types and classes; the file name provides context.
- A file should feel like a self-contained library for its domain.
- Examples:
  - In `completions.stream.ts` → export `CompletionsStream`, `Options`, not `CompletionStream`.
  - In `auth.service.ts` → export `AuthService`, `AuthError`, `Validator`, not `ServiceValidator`.

### 2. **Generic Type Names Within Domain**
- Use clear, generic names for types within their domain file.
- This enhances readability and makes types feel like natural language constructs.
```typescript
// In completions.stream.ts
interface Options { signal?: AbortSignal; model?: string; }
type Event = { type: 'content'; data: string } | { type: 'tool_calls'; data: any[] };

// In auth.service.ts
type Result = { ok: true; user: User } | { ok: false; error: AuthError };
type Validator = (token: string) => Promise<Result>;
```

### 3. **Error Handling with Cause Chain**
- Always preserve the original error as the `cause` to maintain a full, traceable error chain.
```typescript
try {
  const result = await riskyOperation();
} catch (error) {
  throw Object.assign(
    new DomainError("Operation failed: unable to process request"),
    { cause: error }
  );
}
```

---

## 🏗️ Code Organization Template

```typescript
// 1. Imports ALWAYS FIRST (external → workspace → relative)
import { EventEmitter } from "node:events";
import { z } from "zod";
import type { Logger } from "@ab-se/logger";
import { CONFIG } from "./config";

// 2. Debug logger (immediately after imports if needed)
const log = Debug("ab:stream");

// 3. Error Messages (i18n-ready)
const Errors = {
  spawn_failed: "Failed to spawn process",
  stream_timed_out: "Stream timed out due to inactivity",
} as const;

// 4. Constants & Configuration
const MAX_RETRIES = 3 as const;
const DEFAULT_TIMEOUT = 30000 as const;

// 5. Type Contracts & Interfaces
// Use generic names, define the shape of options and events.
interface Options {
  signal?: AbortSignal;
  model?: string;
  timeout?: number;
}

type Event = { type: 'data'; data: string } | { type: 'end'; data: any };

// 6. Custom Exceptions
export class ProcessError extends Error {
  static spawnFailed = (reason: string, cause?: unknown) => 
    Object.assign(new ProcessError(`${Errors.spawn_failed}: ${reason}`), { cause });
}

// 7. Pure Utilities
// Helper functions that are pure and testable.
const withTimeout = <T>(iterable: AsyncIterable<T>, signal: AbortSignal, timeoutMs: number): AsyncIterable<T> => {
  // ... implementation
};

// 8. Main, Composable Class
// The primary export of the domain. It's configurable and manages its state.
export class DataStream extends EventEmitter implements AsyncIterable<Event> {
  private readonly signal?: AbortSignal;
  private readonly model: string;

  constructor(private input: any, private options: Options = {}) {
    super();
    this.signal = options.signal;
    this.model = options.model || "gpt-4-turbo-preview";
  }

  // A static factory for a clean, declarative API.
  static from(input: any, options?: Options): DataStream {
    return new DataStream(input, options);
  }

  // The core async iterator that yields events.
  async *[Symbol.asyncIterator](): AsyncIterableIterator<Event> {
    // ... implementation that yields { type: 'data', ... } and returns { type: 'end', ... }
  }
}
```

---

## 💡 Refined Style Guidelines

### Domain Context Awareness
```typescript
// ❌ Bad: Redundant domain prefixes in pty.terminal.ts
type PtyResult = { ok: boolean };
type PtyRunner = () => Promise<PtyResult>;
type PtyConfig = { term: string };

// ✅ Good: Generic names, domain is implicit from file
type Result = { ok: boolean };
type Runner = () => Promise<Result>;
type Config = { term: string };
```

### Extract Repeated Conditions to Utilities
```typescript
// ❌ Bad: Repeated condition checks
if (process.stdin.isTTY) {
  previousMode = process.stdin.isRaw;
  process.stdin.setRawMode(true);
}
// ... later
if (process.stdin.isTTY && previousMode !== undefined) {
  process.stdin.setRawMode(previousMode);
}

// ✅ Good: Extracted utilities
const activateRawMode = (): boolean | undefined => {
  if (!process.stdin.isTTY) return;
  const previous = process.stdin.isRaw;
  process.stdin.setRawMode(true);
  return previous;
};

const recoverRawMode = (previous?: boolean): void => {
  if (!process.stdin.isTTY || previous === undefined) return;
  process.stdin.setRawMode(previous);
};
```

### Extract Complex Object Literals
```typescript
// ❌ Bad: Inline complex objects
const pty = spawn("env", ["-i", ...envCommand, "sh", "-s"], {
  name: term,
  cols: process.stdout.columns || 80,
  rows: process.stdout.rows || 24,
  cwd,
});

// ✅ Good: Named configuration objects
const spawnOptions = {
  name: term,
  cols: process.stdout.columns || MIN_COLS,
  rows: process.stdout.rows || MIN_ROWS,
  cwd,
};

const pty = spawn("env", ["-i", ...envCommand, "sh", "-s"], spawnOptions);
```

### Error Cause Preservation
```typescript
// ❌ Bad: Losing original error context
try {
  const data = await fetchData();
} catch (error) {
  throw new CustomError("Failed to fetch data");
}

// ✅ Good: Preserving error chain
try {
  const data = await fetchData();
} catch (error) {
  throw Object.assign(
    new CustomError("Failed to fetch data"),
    { cause: error }
  );
}

// Alternative with static factory
export class DataError extends Error {
  static fetchFailed = (cause: unknown) => 
    Object.assign(
      new DataError("Failed to fetch data from remote source"),
      { cause }
    );
}
```

---

## 🚀 Advanced Architectural Patterns

### 1. **Composable and Reactive Design**
- Favor composition over inheritance. Design small, focused classes that work together.
- Use `EventEmitter` to create reactive, decoupled systems where components react to events without tight coupling.
- This eliminates complex conditional logic in the main orchestration flow.
```typescript
// ✅ Good: Simple, reactive bridge
for await (const event of stream) {
  this.emitter.emit(event.type, event.data);
}

// ❌ Avoid: Complex conditional logic
for await (const item of stream) {
  if (item.type === 'data') { /* ... */ }
  else if (item.type === 'end') { /* ... */ }
}
```

### 2. **Purity and Side-Effect Isolation**
- Core logic components should be pure. They should not perform I/O like `console.log` or `process.stdout.write`.
- Side effects are the responsibility of the outermost application layer (the "orchestrator" or "entry point"), which consumes the pure components. This makes the core logic reusable and testable.

### 3. **Mastering Asynchronous Streams**
- Use `async function*` to model streams that produce both intermediate values (`yield`) and a final result (`return`). This perfectly aligns with APIs like OpenAI's.
- The `yield` keyword emits streamable data as it arrives.
- The `return` keyword provides the final payload once the stream is fully complete.
```typescript
async *[Symbol.asyncIterator]() {
  for await (const chunk of rawStream) {
    yield { type: 'content', data: chunk }; // Intermediate value
  }
  return { type: 'tool_calls', data: finalPayload }; // Final result
}
```

### 4. **Design for Cancellation**
- Make `AbortSignal` a first-class citizen. Pass it through all async operations to allow for graceful, top-down cancellation.
- This creates a single source of truth for stopping operations, whether triggered by a user or a timeout.
```typescript
const stream = await openai.chat.completions.create({ /* ... */, signal: this.signal });
```

### 5. **Declarative APIs with Factories & Options**
- Provide a clean, declarative way to create instances, hiding constructor complexity.
- Make APIs clean and scalable by collecting optional parameters into a single object.
```typescript
// ✅ Good: Clean, declarative, and extensible
const stream = DataStream.from(myInput, { signal: controller.signal, model: 'gpt-4' });

// ❌ Avoid: Exposing constructor complexity
const stream = new DataStream(myInput, controller.signal, 'gpt-4', /* ... */);
```

---

## 📋 Enhanced Style Rules Summary

1.  **Imports always first** - Enforced by linters
2.  **Debug logger immediately after imports** - First const after imports
3.  **Avoid redundant domain prefixes** - File name provides context
4.  **Use generic type names** - Result, Runner, Config, Answer, Reply
5.  **Extract repeated conditions** - Create utility functions
6.  **Named configuration objects** - Extract complex literals
7.  **Preserve error causes** - Use Object.assign with cause property
8.  **One-liners when < 120 chars** - Keep it concise
9.  **Functions over classes** - Unless inheritance needed
10. **Meaningful constant prefixes** - MAX_, MIN_, PRESET_, _internal
11. **Compose, Don't Monolith** - Build systems from small, focused, composable classes.
12. **React, Don't Branch** - Use `EventEmitter` to create reactive systems and avoid `if/else` chains.
13. **Isolate Side Effects** - Keep core logic pure; handle I/O at the application's edge.
14. **Static Factories > Constructors** - Provide clean, declarative entry points for creating objects.
15. **Options Objects > Long Params** - Design APIs that are easy to read and extend.
16. **Async Generators for Streams** - Model complex streams with `yield` for data and `return` for the final result.
17. **Cancellation is a First-Class Citizen** - Design every async operation to be cancellable via `AbortSignal`.

✅ **Result**: Clean, context-aware TypeScript that leverages file domain context, maintains error traceability, and is built from composable, resilient, and elegant asynchronous patterns.