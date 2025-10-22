# Provider Update Template - Gold Standard Pattern

## Pattern to Apply

Add this `stream()` method to each provider:

```typescript
import type { ComprehensiveCallbacks, BeforeStreamStartResult, ToolDefinition } from '../../config/ComprehensiveCallbacks'

/**
 * Stream with comprehensive callbacks (Gold Standard)
 */
async *stream(
  messages: Message[],
  config: StreamConfig = {}
): AsyncGenerator<string, void, unknown> {
  const callbacks = config.callbacks as ComprehensiveCallbacks | undefined
  const startTime = Date.now()
  let chunkCount = 0
  let accumulated = ''

  try {
    // 1. REQUEST TOOLS
    let tools: ToolDefinition[] | undefined
    if (callbacks?.onToolsRequest) {
      const toolsResult = await callbacks.onToolsRequest({
        provider: this.name,
        model: this.providerOptions!.model,
        messages
      })
      tools = toolsResult.tools
      this.loggingService.debug('Received tools', { count: tools?.length || 0 })
    }

    // 2. BEFORE STREAM START
    let finalMessages = messages
    let finalTools = tools
    let finalOptions = config.providerOptions
    
    if (callbacks?.beforeStreamStart) {
      const beforeResult: BeforeStreamStartResult = await callbacks.beforeStreamStart({
        messages,
        provider: this.name,
        model: this.providerOptions!.model,
        tools,
        providerOptions: config.providerOptions
      })
      
      if (beforeResult.cancel) {
        this.loggingService.warn('Stream cancelled', { reason: beforeResult.cancelReason })
        return
      }
      
      finalMessages = beforeResult.messages || messages
      finalTools = beforeResult.tools !== undefined ? beforeResult.tools : tools
      finalOptions = beforeResult.providerOptions || config.providerOptions
    }

    // 3. CREATE STREAM
    const completionStream = this.createCompletionStreamWithTools(
      finalMessages,
      { ...config, providerOptions: finalOptions },
      finalTools
    )

    // 4. STREAM START
    if (callbacks?.onStreamStart) {
      await callbacks.onStreamStart({
        provider: this.name,
        model: this.providerOptions!.model,
        messageCount: finalMessages.length,
        hasTools: !!finalTools && finalTools.length > 0,
        timestamp: Date.now()
      })
    }

    // 5. PROCESS CHUNKS
    for await (const event of completionStream) {
      if (event.type === 'content' && event.data) {
        const originalChunk = event.data
        let processedChunk = originalChunk
        let skipChunk = false
        
        // BEFORE CHUNK
        if (callbacks?.beforeChunk) {
          const beforeChunkResult = await callbacks.beforeChunk({
            chunk: originalChunk,
            index: chunkCount,
            accumulated,
            timestamp: Date.now()
          })
          
          if (beforeChunkResult.skip) {
            skipChunk = true
          } else {
            processedChunk = beforeChunkResult.chunk || originalChunk
          }
        }
        
        if (skipChunk) continue
        
        accumulated += processedChunk
        chunkCount++
        
        yield processedChunk
        
        // AFTER CHUNK
        if (callbacks?.afterChunk) {
          await callbacks.afterChunk({
            originalChunk,
            processedChunk,
            index: chunkCount - 1,
            accumulated,
            duration: Date.now() - startTime,
            timestamp: Date.now()
          })
        }
      }
      
      // TOOL CALLS
      if (event.type === 'tool_calls' && event.data && callbacks?.onToolCall) {
        const toolCallResult = await callbacks.onToolCall({
          toolCalls: event.data,
          messages: finalMessages,
          provider: this.name
        })
        // Handle tool results (implementation specific)
      }
      
      // ERROR
      if (event.type === 'error' && event.data) {
        if (callbacks?.onError) {
          await callbacks.onError({
            error: event.data,
            recoverable: false,
            attemptNumber: 0,
            provider: this.name
          })
        }
        throw event.data
      }
    }

    // 6. STREAM END
    if (callbacks?.onStreamEnd) {
      await callbacks.onStreamEnd({
        provider: this.name,
        model: this.providerOptions!.model,
        totalChunks: chunkCount,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      })
    }

  } catch (error) {
    this.loggingService.error('Stream failed', { error })
    if (callbacks?.onError) {
      await callbacks.onError({
        error: error instanceof Error ? error : new Error(String(error)),
        recoverable: false,
        attemptNumber: 0,
        provider: this.name
      })
    }
    throw error
  }
}

// Helper method to create stream with tools
private createCompletionStreamWithTools(
  messages: Message[],
  config: StreamConfig,
  tools?: ToolDefinition[]
): ICompletionsStream {
  const updatedConfig = {
    ...config,
    providerOptions: {
      ...config.providerOptions,
      tools
    }
  }
  return this.createCompletionStream(messages, updatedConfig)
}
```

## Changes Needed Per Provider

1. **Add import**:
   ```typescript
   import type { ComprehensiveCallbacks, BeforeStreamStartResult, ToolDefinition } from '../../config/ComprehensiveCallbacks'
   ```

2. **Add `stream()` method** (full implementation above)

3. **Add helper method** `createCompletionStreamWithTools()`

4. **Keep existing**:
   - Constructor (2 services)
   - `createCompletionStream()` method
   - All other methods

## Apply To

- [x] OpenAI (reference implementation)
- [ ] Grok
- [ ] Deepseek
- [ ] OpenRouter
- [ ] SiliconFlow
