# Comprehensive Callbacks - Usage Examples

## Overview

This document shows how to use the comprehensive callback system for advanced LLM streaming control.

---

## 1. Tool Injection

### Inject Tools Before Streaming

```typescript
import type { ComprehensiveCallbacks } from './ComprehensiveCallbacks'

const callbacks: ComprehensiveCallbacks = {
  // Provide tools when provider requests them
  onToolsRequest: async ({ provider, model, messages }) => {
    // Fetch available tools from MCP or tool registry
    const tools = await toolRegistry.getTools()
    
    return {
      tools: tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.schema
        }
      })),
      executor: async (toolCalls) => {
        // Execute tools and return results
        return await toolManager.executeMany(toolCalls)
      }
    }
  }
}
```

---

## 2. Message Transformation

### Modify Messages Before Sending

```typescript
const callbacks: ComprehensiveCallbacks = {
  beforeStreamStart: async ({ messages, provider, tools }) => {
    // Add system context
    const enhancedMessages = [
      {
        role: 'system',
        content: 'You are a helpful assistant with access to tools.'
      },
      ...messages
    ]
    
    // Filter tools based on user permissions
    const allowedTools = tools?.filter(tool => 
      userPermissions.canUse(tool.function.name)
    )
    
    return {
      messages: enhancedMessages,
      tools: allowedTools,
      // Can also modify provider options
      providerOptions: {
        temperature: 0.7,
        max_tokens: 2000
      }
    }
  }
}
```

### Cancel Streaming Based on Conditions

```typescript
const callbacks: ComprehensiveCallbacks = {
  beforeStreamStart: async ({ messages, provider }) => {
    // Check if user has quota
    const hasQuota = await quotaService.check(userId)
    
    if (!hasQuota) {
      return {
        cancel: true,
        cancelReason: 'User has exceeded quota'
      }
    }
    
    return { messages }
  }
}
```

---

## 3. Chunk Pre/Post Processing

### Transform Chunks Before Display

```typescript
const callbacks: ComprehensiveCallbacks = {
  // Before chunk processing
  beforeChunk: async ({ chunk, index, accumulated }) => {
    // Filter sensitive information
    const filtered = filterSensitiveData(chunk)
    
    // Skip empty chunks
    if (filtered.trim() === '') {
      return { skip: true }
    }
    
    // Translate chunk
    const translated = await translator.translate(filtered)
    
    return {
      chunk: translated,
      metadata: {
        original: chunk,
        filtered: true,
        translated: true
      }
    }
  },
  
  // After chunk processing
  afterChunk: async ({ originalChunk, processedChunk, index, accumulated }) => {
    // Log chunk for analytics
    analytics.trackChunk({
      index,
      length: processedChunk.length,
      duration: Date.now() - startTime
    })
    
    // Update UI progress
    progressBar.update(index + 1)
    
    // Store chunk in cache
    await cache.store(`chunk_${index}`, processedChunk)
  }
}
```

---

## 4. Utility Events

### Stream Lifecycle

```typescript
const callbacks: ComprehensiveCallbacks = {
  // Stream start
  onStreamStart: async ({ provider, model, messageCount }) => {
    console.log(`🚀 Starting stream: ${provider}/${model}`)
    console.log(`📊 Processing ${messageCount} messages`)
    
    // Show loading indicator
    ui.showLoading(`Connecting to ${provider}...`)
    
    // Start timer
    performanceMonitor.start('stream')
  },
  
  // Stream end
  onStreamEnd: async ({ provider, totalChunks, duration }) => {
    console.log(`✅ Stream complete: ${totalChunks} chunks in ${duration}ms`)
    
    // Hide loading
    ui.hideLoading()
    
    // Record metrics
    metrics.record({
      provider,
      chunks: totalChunks,
      duration,
      timestamp: Date.now()
    })
  }
}
```

### Error Handling with Retry Control

```typescript
const callbacks: ComprehensiveCallbacks = {
  // Error occurred
  onError: async ({ error, recoverable, attemptNumber, provider }) => {
    console.error(`❌ Error in ${provider}:`, error.message)
    
    // Decide whether to retry
    const shouldRetry = recoverable && attemptNumber < 3
    
    // Show notification if not retrying
    const notify = !shouldRetry
    
    return {
      retry: shouldRetry,
      retryDelay: 1000 * Math.pow(2, attemptNumber), // Exponential backoff
      notify,
      notificationMessage: notify ? 
        `Error: ${error.message}. Please try again.` : 
        undefined
    }
  },
  
  // Before retry
  onBeforeRetry: async ({ attemptNumber, retryDelay, maxAttempts }) => {
    console.log(`🔄 Retry ${attemptNumber}/${maxAttempts} in ${retryDelay}ms`)
    
    // Show retry notification
    ui.showNotification(`Retrying... (${attemptNumber}/${maxAttempts})`)
  },
  
  // Retry succeeded
  onRetrySuccess: async ({ attempts, duration }) => {
    console.log(`✅ Retry successful after ${attempts} attempts (${duration}ms)`)
    
    // Hide notification
    ui.hideNotification()
  }
}
```

### Timeout Warning (75% threshold)

```typescript
const callbacks: ComprehensiveCallbacks = {
  // Long waiting (75% of timeout)
  onLongWaiting: async ({ elapsed, timeout, percentage, chunksReceived }) => {
    console.warn(`⏰ Long wait: ${elapsed}ms / ${timeout}ms (${percentage}%)`)
    console.warn(`📊 Chunks received: ${chunksReceived}`)
    
    // Show warning to user
    const shouldWarn = chunksReceived === 0 // No response yet
    
    // Maybe extend timeout if making progress
    const extendTimeout = chunksReceived > 0 ? 10000 : undefined
    
    return {
      showWarning: shouldWarn,
      warningMessage: 'The model is taking longer than expected...',
      extendTimeout
    }
  },
  
  // Timeout occurred
  onTimeout: async ({ timeout, chunksReceived, partialContent, provider }) => {
    console.error(`⏰ Timeout after ${timeout}ms`)
    console.error(`📊 Received ${chunksReceived} chunks`)
    
    // Save partial result if any
    if (partialContent) {
      await savePartialResult(partialContent)
      ui.showNotification('Timeout occurred. Partial result saved.')
    } else {
      ui.showError(`${provider} did not respond in time.`)
    }
  }
}
```

---

## 5. Tool Execution with Callbacks

### Handle Tool Calls

```typescript
const callbacks: ComprehensiveCallbacks = {
  onToolCall: async ({ toolCalls, messages, provider }) => {
    console.log(`🔧 Tool calls requested: ${toolCalls.length}`)
    
    // Execute tools in parallel
    const responses = await Promise.all(
      toolCalls.map(async (call) => {
        try {
          // Execute tool
          const result = await toolManager.execute(call)
          
          // Log execution
          console.log(`✅ Tool ${call.function.name} executed successfully`)
          
          return {
            tool_call_id: call.id,
            content: JSON.stringify(result),
            success: true
          }
        } catch (error) {
          console.error(`❌ Tool ${call.function.name} failed:`, error)
          
          return {
            tool_call_id: call.id,
            content: `Error: ${error.message}`,
            success: false,
            error: error.message
          }
        }
      })
    )
    
    // Show tool results in UI
    ui.showToolResults(responses)
    
    return {
      responses,
      continueStreaming: true // Continue after tool execution
    }
  }
}
```

---

## 6. Complete Example: Obsidian Plugin Integration

```typescript
import { ComprehensiveCallbacks } from '@tars/providers/config'

// In Obsidian plugin
class TarsPlugin {
  async streamWithCallbacks(messages: Message[]) {
    const callbacks: ComprehensiveCallbacks = {
      // 1. Tool injection from MCP
      onToolsRequest: async () => {
        const tools = await this.mcpManager.getTools()
        return {
          tools,
          executor: (calls) => this.mcpManager.execute(calls)
        }
      },
      
      // 2. Modify messages - add document context
      beforeStreamStart: async ({ messages }) => {
        const context = await this.getDocumentContext()
        return {
          messages: [
            { role: 'system', content: context },
            ...messages
          ]
        }
      },
      
      // 3. Pre-process chunks - filter markdown
      beforeChunk: async ({ chunk }) => {
        const processed = this.markdownProcessor.process(chunk)
        return { chunk: processed }
      },
      
      // 4. Post-process chunks - update document
      afterChunk: async ({ processedChunk, accumulated }) => {
        await this.editor.append(processedChunk)
        await this.documentService.save(accumulated)
      },
      
      // 5. Show notifications on error
      onError: async ({ error, recoverable }) => {
        new Notice(`Error: ${error.message}`)
        return { retry: recoverable, notify: true }
      },
      
      // 6. Warn user on long wait
      onLongWaiting: async ({ percentage }) => {
        return {
          showWarning: true,
          warningMessage: 'Model is still thinking...'
        }
      },
      
      // 7. Track completion
      onStreamEnd: async ({ totalChunks, duration }) => {
        console.log(`✅ Generated ${totalChunks} chunks in ${duration}ms`)
        new Notice('Generation complete!')
      }
    }
    
    // Stream with comprehensive callbacks
    const provider = this.container.get(OpenAIStreamingProvider)
    
    for await (const content of provider.stream(messages, { callbacks })) {
      // Additional processing if needed
    }
  }
}
```

---

## Benefits

### 1. Full Control
- Modify messages before sending
- Transform chunks before display
- Control retry behavior
- Extend timeouts dynamically

### 2. Clean Separation
- Provider = Pure streaming logic
- Consumer = Integration via callbacks
- No UI dependencies in provider

### 3. Composable
- Mix and match callbacks
- Add/remove as needed
- Chain multiple processors

### 4. Type-Safe
- Full TypeScript support
- Clear interfaces
- IDE autocomplete

---

## Migration from Simple Callbacks

### Old (Simple)
```typescript
{
  onContent: (chunk) => append(chunk),
  onError: (error) => show(error)
}
```

### New (Comprehensive)
```typescript
{
  afterChunk: async ({ processedChunk }) => {
    await append(processedChunk)
  },
  onError: async ({ error, recoverable }) => {
    return {
      notify: true,
      retry: recoverable
    }
  }
}
```

---

*Design Date: October 22, 2025*  
*Principle: Comprehensive Callbacks for Maximum Control*
