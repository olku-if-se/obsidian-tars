## Plan: Universal Provider Architecture with Flexible Emitter-Based Tool System

### Overview
Create a truly universal provider architecture where providers stay generic, `StreamingContext` is a simple emitter factory, and `prepareStreamContext` callback allows flexible tool handler registration. Divide callbacks into Observer (state watching) and Mutation (behavior modification) categories.

## PHASE 1: Universal Architecture Foundation (CRITICAL PATH)

### Step 1.1: Simple StreamingContext with Emitter Factory

**Minimal StreamingContext Implementation:**
```typescript
import { TypedEmitter } from 'tseep'
import type { StreamEvent, ToolCall } from '../streaming'

export interface StreamEvents {
  content: (chunk: string) => void
  tool_calls: (toolCalls: ToolCall[]) => void
  stream_end: () => void
  error: (error: Error) => void
  // Users can extend this with custom events
}

export class StreamingContext extends TypedEmitter<StreamEvents> {
  private messages: Message[]
  private config: StreamConfig

  constructor(
    config: StreamConfig,
    initialMessages: Message[] = []
  ) {
    super()
    this.config = config
    this.messages = [...initialMessages]
    
    // Pre-register default handlers

    // Default content handler - just emits events
    this.on('content', this.contentHandler)
    
    // Default tool_calls handler - creates follow-up stream
    this.on('tool_calls', this.toolCallsHandler)
    
    this.on('error', this.errorHandler)

    this.on('stream_end', this.streamEndHandler)

    // ... other default handlers ...

    this.on('*', this.defaultEventHandler) // for unknown events
  }

  // === Simple Message Management ===
  
  getMessages(): Message[] { return [...this.messages] }
  addMessages(newMessages: Message[]): void { this.messages.push(...newMessages) }

  // === Default Handler Registration ===
  
  protected contentHandler(chunk: string): void {
     // ...implementation of chunk processing ...
  }

  protected toolCallsHandler(toolCalls: ToolCall[]): void {
    // ...convert ToolCall to event to the emitter...
    // register message (tool call request)
    messages.push({ role: "assistant", content: null, tool_calls: toolCalls });
    
    // register tool call reply
    const toolMessages = await Promise.all(toolCalls.map(tc => this.execute(tc)));
    
    messages.push(...toolMessages);
  }

  protected errorHandler(error: Error): void {
    // ...implementation of error handling...
  }

  protected streamEndHandler(): void {
    // ...implementation of stream end handling...
  }

  // === Utility Methods ===
  protected execute(toolCall: any): Promise<any> {
    const eventName = toolCall.function.name;

    // ...reserve for extra wrappers logic: retry, timeouts, abort, concurrency limits...

    return await this.emit(eventName, toolCall)
  }

  createStream(providerMethod: (messages: Message[], config: StreamConfig) => ICompletionsStream): ICompletionsStream {
    return providerMethod(this.getMessages(), this.config)
  }

  toResourcesEventArgs(): ResourcesEventArgs {
    // prepare data structure for callback call
  }
}
```

### Step 1.2: Callback Categories - Observer vs Mutation

**Reorganized ComprehensiveCallbacks:**
```typescript
export interface ComprehensiveCallbacks {
  // === Mutation Callbacks (modify behavior) ===
  
  /** Prepare context and register custom handlers */
  prepareStreamContext?: (hook: PrepareStreamContextHook) => Promise<void>
  
  /** Request available tools (flexible - can be other things in future) */
  onResourcesRequest?: (hook: OnResourcesRequestHook) => Promise<OnResourcesRequestResult>

  // === Observer Callbacks (watch state) ===
  
  /** Stream lifecycle */
  onStreamStart?: (hook: OnStreamStartHook) => Promise<void>
  onStreamEnd?: (hook: OnStreamEndHook) => Promise<void>
  
  /** Chunk processing */
  onContentChunk?: (hook: OnContentHook) => Promise<void>
  beforeChunk?: (hook: BeforeChunkHook) => Promise<BeforeChunkResult>
  afterChunk?: (hook: AfterChunkHook) => Promise<void>
  
  /** Tool execution observation */
  onToolCall?: (hook: OnToolCallHook) => Promise<void>
  onToolExecutionStart?: (hook: OnToolExecutionStartHook) => Promise<void>
  onToolExecutionSuccess?: (hook: OnToolExecutionSuccessHook) => Promise<void>
  onToolExecutionError?: (hook: OnToolExecutionErrorHook) => Promise<void>
  
  /** Error and retry observation */
  onError?: (hook: OnErrorHook) => Promise<OnErrorResult>
  onBeforeRetry?: (hook: OnBeforeRetryHook) => Promise<void>
  onRetrySuccess?: (hook: OnRetrySuccessHook) => Promise<void>
  
  /** Timeout observation */
  onLongWaiting?: (hook: OnLongWaitingHook) => Promise<OnLongWaitingResult>
  onTimeout?: (hook: OnTimeoutHook) => Promise<void>
  
  /** Generic event observation */
  onStreamEvent?: (event: StreamEvent) => Promise<void>
}
```

### Step 1.3: Universal StreamingProviderBase with Flexible Pattern

**Universal Provider Flow:**
```typescript
async *stream(messages: Message[], config: StreamConfig = {}): AsyncGenerator<string, void, unknown> {
  const callbacks = config.callbacks as ComprehensiveCallbacks | undefined

  // 1. CREATE CONTEXT
  const context = new StreamingContext(config, messages)
  
  // 2. REQUEST RESOURCES (flexible - tools today, other things tomorrow)
  await this.invokeCallback(callbacks?.onResourcesRequest, context.toResourcesEventArgs())

  // 3. PREPARE CONTEXT - register custom handlers, mutate the context during the call
  await this.invokeCallback(callbacks?.prepareStreamContext, context.toPrepareStreamContextArgs())

  // 4. START STREAMING
  const initialStream = this.createCompletionStream(context.getMessages(), context.config)
  const streamQueue = new StreamQueue(initialStream, context.config.signal)

  context.onFollowUpStream(() => {
    streamQueue.push(this.createCompletionStream(context.getMessages(), context.config))
  })

  // 5. PROCESS EVENTS through context emitter
  for await (const event of streamQueue) {
    // ...call callbacks...

    // Emit through context - context will route all to the right places
    const result = await context.emit(event.type, event.data)

    // ...call callbacks...

    yield result
  }

  // ...call callbacks...
}
```

### Step 1.4: User Tool Handler Registration Pattern

**Example Usage Following llm-chat.md Pattern:**
```typescript
// User creates provider instance
const provider = new OpenAIStreamingProvider(logger, settings)

// User defines custom tool handlers
const weatherHandler = async (toolCall: ToolCall) => {
  const params = WeatherFunctionParams.parse(JSON.parse(toolCall.function.arguments))
  const { location, unit = "fahrenheit" } = params
  const temperature = unit === "celsius" ? 22 : 72
  return {
    role: "tool" as const,
    tool_call_id: toolCall.id,
    content: `The weather in ${location} is ${temperature}°${unit[0].toUpperCase()} and sunny.`
  }
}

const prepareStreamContext = async (hook: PrepareStreamContextHook) => {
  // register tools handlers
  hook.context.on('get_weather', weatherHandler)

  // ...modify context configuration if needed...

  // ...inject into messages available tools... 
}

// User streams with custom handler registration
for await (const chunk of provider.stream(messages, { callbacks: { prepareStreamContext }})) {
  console.log(chunk)
}
```

### Step 1.5: Enhanced OpenAI E2E Tests - Flexible Architecture Testing

**New Test Scenarios for Universal Architecture:**

**Current Coverage (✅):**
- 13 callback hooks, real API calls, tool injection, message transformation

**Missing Coverage to Add (❌):**
- **prepareStreamContext Testing** - Test user handler registration in context
- **Observer vs Mutation Callback Testing** - Test both callback categories
- **Flexible Resource Request Testing** - Test onResourcesRequest with different resource types
- **Custom Tool Handler Testing** - Test user-registered handlers in context emitter
- **Universal Provider Pattern Testing** - Test provider works with any handler type
- **Default Handler Override Testing** - Test users can override default context handlers

### Step 1.6: OpenAI Provider - Truly Universal Implementation

**OpenAI Provider - Universal Pattern (~35 lines):**
```typescript
@injectable()
export class OpenAIStreamingProvider extends StreamingProviderBase {
  readonly name = 'openai'
  readonly displayName = 'OpenAI'
  // ... metadata ...

  private client: OpenAI | null = null
  private providerOptions: OpenAIProviderOptions | null = null

  constructor(logger = inject(tokens.Logger), settings = inject(tokens.Settings)) {
    super(logger, settings)
  }

  // === Universal Provider Interface ===
  
  get models(): LlmModel[] { /* model definitions */ }
  get defaultOptions(): OpenAIProviderOptions { /* default config */ }

  initialize(options: OpenAIProviderOptions): void {
    this.providerOptions = options
    this.config = this.mergeConfig(this.defaultOptions, options)

    this.client = new OpenAI({ /* this.config */ })

    // ...configure callbacks for intercepting events if needed... 
  }

  // === Single Universal Responsibility ===
  protected createCompletionStream(messages: Message[], config: StreamConfig): ICompletionsStream {
    if (!this.client) throw new Error('OpenAI provider not initialized')
    
    return OpenAICompletionsStream.from(
      messages,
      this.client,
      this.config      
    )
  }
}
```

## PHASE 2: Universal Provider Refactoring

### Step 2.1: Apply Universal Pattern to All Providers

**Universal Provider Characteristics:**
1. **No tool-specific logic** - Providers don't know about tools
2. **Simple emitter integration** - Just create streams, emit events
3. **Flexible handler registration** - Users register any handlers via prepareStreamContext
4. **Observer callback support** - All providers support state watching
5. **Mutation callback support** - All providers support behavior modification

### Benefits of Universal Architecture

**Maximum Flexibility:**
- **Providers are truly universal** - Work with any handler type
- **User-controlled tool execution** - Users define how tools are executed
- **Extensible resource system** - Today tools, tomorrow other resources
- **Clean separation of concerns** - Providers stream, users handle logic

**Consistent Behavior:**
- **Same pattern across all providers** - Universal streaming interface
- **Predictable callback behavior** - Observer vs Mutation categories
- **Flexible handler registration** - Works with any emitter pattern
- **Easy testing** - Same patterns work for all providers

### Success Criteria

**Phase 1 Success (Universal Architecture):**
- OpenAI provider reduced to ~35 lines with universal pattern
- StreamingContext is simple emitter factory with default handlers
- prepareStreamContext callback allows flexible handler registration
- Observer vs Mutation callback categories clearly separated
- Tool handler registration follows llm-chat.md pattern exactly
- All 14+ callbacks tested with universal architecture

**Phase 2 Success (All Providers Universal):**
- All 9 providers follow the same universal pattern
- No provider-specific tool logic anywhere
- Flexible handler registration works for all providers
- Users can register any type of handler (tools, other resources)
- All existing e2e tests continue to pass with universal architecture