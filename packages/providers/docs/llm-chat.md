## Tools


```typescript
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

const WeatherFunctionParams = z.object({
  location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  unit: z.enum(["celsius", "fahrenheit"]).optional(),
});

const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_weather",
      description: "Get the current weather in a given location",
      parameters: zodToJsonSchema(WeatherFunctionParams),
    },
  },
];

/** Manages tool execution via an EventEmitter. */
class ToolManager extends EventEmitter {
  async execute(toolCall: any): Promise<any> {
    const eventName = toolCall.function.name;
    if (this.listenerCount(eventName) === 0) {
      return { role: "tool" as const, tool_call_id: toolCall.id, content: `Error: No handler for tool '${eventName}'.` };
    }
    const listener = this.listeners(eventName)[0];
    return typeof listener === 'function' ? await listener(toolCall) : { role: "tool" as const, tool_call_id: toolCall.id, content: `Error: Handler for '${eventName}' is not a function.` };
  }
}

// --- 3. Tool Handlers ---

async function getWeatherHandler(toolCall: any): Promise<any> {
  try {
    const params = WeatherFunctionParams.parse(JSON.parse(toolCall.function.arguments));
    const { location, unit = "fahrenheit" } = params;
    const temperature = unit === "celsius" ? 22 : 72;
    const result = `The weather in ${location} is ${temperature}°${unit[0].toUpperCase()} and sunny.`;
    return { role: "tool" as const, tool_call_id: toolCall.id, content: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        role: "tool" as const, 
        tool_call_id: toolCall.id, 
        content: 'Error: Invalid arguments. ' + error.errors.map(e => e.message).join(', ') 
      };
    }
    return { role: "tool" as const, tool_call_id: toolCall.id, content: 'Error: Could not process weather request.' };
  }
}

const toolManager = new ToolManager();
toolManager.on('get_weather', getWeatherHandler);

const toolsExecutor = <Q, T> (queue: Q, message: Array<T>) => async (toolCalls: any[]) => {
    messages.push({ role: "assistant", content: null, tool_calls: toolCalls });
    const toolMessages = await Promise.all(toolCalls.map(tc => toolManager.execute(tc)));
    messages.push(...toolMessages);
    queue.push(CompletionsStream.from(messages, streamOptions));
  }

```

## Follow-Up Stream Processing In Queue

```typescript
/** A generic queue for managing multiple async streams. */
class StreamQueue implements AsyncIterable {
  private queue: AsyncIterator[] = [];
  private isDone = false;

  constructor(initialStream?: AsyncIterable, private signal?: AbortSignal) {
    if (initialStream) {
      this.push(initialStream);
    }
  }

  push(stream: AsyncIterable) {
    this.queue.push(stream[Symbol.asyncIterator]());
  }

  close() {
    this.isDone = true;
    if (this.signal) {
      this.signal.abort();
    }
  }

  async *[Symbol.asyncIterator](): AsyncIterator {
    while (true) {
      if (this.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      if (this.queue.length === 0 && this.isDone) return;
      if (this.queue.length === 0) {
        await Promise.race([
          new Promise(resolve => setTimeout(resolve, 100)),
          new Promise((_, reject) => {
            this.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          })
        ]).catch(() => {});
        continue;
      }
      const stream = this.queue.shift()!;
      yield* stream;
    }
  }
}
```

## OpenAI Chat Stream

```typescript
/** Manages a single OpenAI completion stream. */
interface CompletionsStreamOptions {
  signal?: AbortSignal;
  model?: string;
  temperature?: number;
}

class CompletionsStream implements AsyncIterable {
  private readonly signal?: AbortSignal;
  private readonly model: string;

  constructor(private messages: any[], private options?: CompletionsStreamOptions) {
    this.signal = options?.signal;
    this.model = options?.model || "gpt-4-turbo-preview";
  }

  static from(messages: any[], options?: CompletionsStreamOptions): CompletionsStream {
    return new CompletionsStream(messages, options);
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<{type: string, data: any}> {
    const stream = await openai.chat.completions.create({
      model: this.model,
      messages: this.messages,
      tools,
      tool_choice: "auto",
      stream: true,
      signal: this.signal,
    });
    
    const toolCalls: any[] = [];
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta.content) yield { type: 'content', data: delta.content };
      if (delta.tool_calls) {
        for (const toolCallChunk of delta.tool_calls) {
          const index = toolCallChunk.index;
          toolCalls[index] = toolCalls[index] || { id: "", type: "function", function: { name: "", arguments: "" } };
          const toolCall = toolCalls[index];
          if (toolCallChunk.function?.name) toolCall.function.name += toolCallChunk.function.name;
          if (toolCallChunk.function?.arguments) toolCall.function.arguments += toolCallChunk.function.arguments;
        }
      }
    }

    if (toolCalls.length > 0) return { type: 'tool_calls', data: toolCalls };
    return { type: 'stream_end', data: null };
  }
}
```

## Timeouts

```typescript
/**
 * Wraps an async iterable, adding a timeout to each iteration.
 * If no item is yielded within `timeoutMs`, the provided AbortController is triggered.
 */
function withTimeout<T>(
  iterable: AsyncIterable<T>,
  abortController: AbortController,
  timeoutMs: number = 30000 // 30 second default timeout
): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      const iterator = iterable[Symbol.asyncIterator]();
      return {
        async next(): Promise<IteratorResult<T>> {
          return Promise.race([
            iterator.next(),
            new Promise<IteratorResult<T>>((_, reject) => {
              const timeoutId = setTimeout(() => {
                abortController.abort();
                reject(new Error(`Stream timed out after ${timeoutMs}ms of inactivity.`));
              }, timeoutMs);

              abortController.signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
              });
            }),
          ]);
        },
      };
    },
  };
}

// usage
const resilientStream = withTimeout(stream, this.signal);

for await (const chunk of resilientStream) {
  // ...code...
}
```

## Chat

```typescript
import { OpenAI } from 'openai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { EventEmitter } from 'events';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const controller = new AbortController();
const emitter = new EventEmitter();
const streamOptions = { signal: controller.signal };

// Errors handling
const ErrorAbort = 'The conversation was aborted.'
const ErrorUnknown = 'An unexpected error occurred during the conversation.'
const toMessage = (error: unknown) =>  error instanceof Error && error.name === 'AbortError' ? ErrorAbort : ErrorUnkown;

async function runConversation() {
  // multable array, into which added all new messages from LLM chat streams
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What's the weather like in Boston, MA? Use Celsius." },
  ];
 
  const queue = new StreamQueue(CompletionsStream.from(messages, streamOptions), controller.signal);
  
  const toolsHandler = async (toolCalls: any[]) => {
    // register message (tool call request)
    messages.push({ role: "assistant", content: null, tool_calls: toolCalls });
    
    // register tool call reply
    const toolMessages = await Promise.all(toolCalls.map(tc => toolManager.execute(tc)));
    messages.push(...toolMessages);
    
    // create follow-up stream to continue chat with tools reply delivered to LLM
    queue.push(CompletionsStream.from(messages, streamOptions));
  }

  // The content listener is removed, making the stream silent.
  // emitter.on('content', (chunk: string) => process.stdout.write(chunk));

  // Tools Handler
  emitter.on('tool_calls', toolsHandler);

  // abort and End of Stream processing
  emitter.on('stream_end', () => queue.close());
  controller.signal.addEventListener('abort', () => { queue.close(); });

  try {
    for await (const item of queue) {
      emitter.emit(item.type, item.data);
    }
  } catch (error: unknown) {
    // Repack the error into a standard Error object with context.
    throw Object.assign(new Error(toMessage(error)), { cause: error, messages });
  }
}

// --- Application Entry Point ---

// This is the only place that interacts with the console.
runConversation()
  .catch(console.error);
```