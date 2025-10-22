# OpenAI Provider - Reference Implementation Example

## Overview

This file demonstrates how to use the OpenAI provider as a reference implementation with comprehensive callbacks.

**File**: `OpenAIStreamingProvider.comprehensive.ts`

---

## Complete Usage Example

```typescript
import { OpenAIStreamingProvider } from './OpenAIStreamingProvider.comprehensive'
import type { ComprehensiveCallbacks } from '../../config/ComprehensiveCallbacks'
import type { Message } from '@tars/contracts'

// ============================================================================
// SETUP
// ============================================================================

// Initialize provider
const provider = container.get(OpenAIStreamingProvider)
provider.initialize({
  apiKey: 'sk-...',
  model: 'gpt-4o',
  baseURL: 'https://api.openai.com/v1',
  temperature: 0.7
})

// ============================================================================
// COMPREHENSIVE CALLBACKS
// ============================================================================

const callbacks: ComprehensiveCallbacks = {
  
  // ========================================
  // 1. TOOL INJECTION
  // ========================================
  
  onToolsRequest: async ({ provider, model, messages }) => {
    console.log(`🔧 Provider requesting tools: ${provider}/${model}`)
    
    // Fetch tools from MCP or tool registry
    const tools = await mcpManager.getAvailableTools()
    
    return {
      tools: tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.schema
        }
      })),
      
      // Provide executor for tool calls
      executor: async (toolCalls) => {
        return await Promise.all(
          toolCalls.map(async (call) => {
            try {
              const result = await mcpManager.executeTool(
                call.function.name,
                JSON.parse(call.function.arguments)
              )
              
              return {
                tool_call_id: call.id,
                content: JSON.stringify(result),
                success: true
              }
            } catch (error) {
              return {
                tool_call_id: call.id,
                content: error.message,
                success: false,
                error: error.message
              }
            }
          })
        )
      }
    }
  },
  
  // ========================================
  // 2. MESSAGE TRANSFORMATION
  // ========================================
  
  beforeStreamStart: async ({ messages, provider, tools, providerOptions }) => {
    console.log(`📝 Transforming messages before stream start`)
    
    // Add system context from document
    const context = await documentService.getContext()
    const enhancedMessages: Message[] = [
      {
        role: 'system',
        content: `You are a helpful assistant. Context: ${context}`
      },
      ...messages
    ]
    
    // Filter tools based on user permissions
    const allowedTools = tools?.filter(tool => 
      userPermissions.canUseTool(tool.function.name)
    )
    
    // Check quota
    const hasQuota = await quotaService.check(userId)
    if (!hasQuota) {
      return {
        cancel: true,
        cancelReason: 'User has exceeded quota'
      }
    }
    
    // Return modified setup
    return {
      messages: enhancedMessages,
      tools: allowedTools,
      providerOptions: {
        ...providerOptions,
        max_tokens: 2000
      }
    }
  },
  
  // ========================================
  // 3. CHUNK PRE-PROCESSING
  // ========================================
  
  beforeChunk: async ({ chunk, index, accumulated }) => {
    console.log(`⬅️  Chunk ${index}: ${chunk.length} chars`)
    
    // Filter sensitive data
    let processed = chunk
    
    // Remove API keys, tokens, etc.
    processed = processed.replace(/sk-[a-zA-Z0-9]{48}/g, '[REDACTED]')
    processed = processed.replace(/\b[A-Z0-9]{32}\b/g, '[TOKEN]')
    
    // Skip empty chunks
    if (processed.trim() === '') {
      return { skip: true }
    }
    
    // Apply text transformations
    // - Fix markdown
    // - Apply grammar corrections
    // - Translate if needed
    if (translationEnabled) {
      processed = await translator.translate(processed, targetLang)
    }
    
    return {
      chunk: processed,
      metadata: {
        original_length: chunk.length,
        processed_length: processed.length,
        filtered: true
      }
    }
  },
  
  // ========================================
  // 4. CHUNK POST-PROCESSING
  // ========================================
  
  afterChunk: async ({ originalChunk, processedChunk, index, accumulated, duration }) => {
    console.log(`➡️  Processed chunk ${index}: ${processedChunk.length} chars`)
    
    // Update document in real-time
    await documentService.append(processedChunk)
    
    // Update UI progress
    ui.updateProgress({
      current: index + 1,
      content: accumulated
    })
    
    // Track analytics
    analytics.trackChunk({
      index,
      length: processedChunk.length,
      duration,
      timestamp: Date.now()
    })
    
    // Save to cache for retry/recovery
    await cache.store(`stream_${sessionId}_chunk_${index}`, {
      chunk: processedChunk,
      accumulated,
      timestamp: Date.now()
    })
  },
  
  // ========================================
  // 5. LIFECYCLE EVENTS
  // ========================================
  
  onStreamStart: async ({ provider, model, messageCount, hasTools }) => {
    console.log(`🚀 Stream started: ${provider}/${model}`)
    console.log(`📊 Messages: ${messageCount}, Tools: ${hasTools}`)
    
    // Show loading UI
    ui.showLoading(`Connecting to ${provider}...`)
    
    // Start performance monitoring
    performanceMonitor.start('stream')
    
    // Initialize progress tracking
    progressTracker.init({
      provider,
      model,
      startTime: Date.now()
    })
  },
  
  onStreamEnd: async ({ provider, totalChunks, duration }) => {
    console.log(`✅ Stream complete: ${totalChunks} chunks in ${duration}ms`)
    
    // Hide loading UI
    ui.hideLoading()
    
    // Show completion notification
    ui.showNotification('Generation complete!')
    
    // Record metrics
    metrics.record({
      provider,
      chunks: totalChunks,
      duration,
      success: true,
      timestamp: Date.now()
    })
    
    // Finalize document
    await documentService.finalize()
  },
  
  // ========================================
  // 6. TOOL EXECUTION
  // ========================================
  
  onToolCall: async ({ toolCalls, messages, provider }) => {
    console.log(`🔧 Tool calls requested: ${toolCalls.length}`)
    
    // Show tool execution UI
    ui.showToolExecution(toolCalls)
    
    // Execute tools in parallel
    const responses = await Promise.all(
      toolCalls.map(async (call) => {
        const startTime = Date.now()
        
        try {
          console.log(`  → Executing: ${call.function.name}`)
          
          const result = await toolManager.execute({
            name: call.function.name,
            arguments: JSON.parse(call.function.arguments)
          })
          
          console.log(`  ✅ Success: ${call.function.name} (${Date.now() - startTime}ms)`)
          
          return {
            tool_call_id: call.id,
            content: JSON.stringify(result),
            success: true
          }
        } catch (error) {
          console.error(`  ❌ Failed: ${call.function.name}`, error)
          
          return {
            tool_call_id: call.id,
            content: `Error: ${error.message}`,
            success: false,
            error: error.message
          }
        }
      })
    )
    
    // Update UI with results
    ui.showToolResults(responses)
    
    return {
      responses,
      continueStreaming: true
    }
  },
  
  // ========================================
  // 7. ERROR HANDLING
  // ========================================
  
  onError: async ({ error, recoverable, attemptNumber, provider }) => {
    console.error(`❌ Error in ${provider}:`, error.message)
    
    // Determine if should retry
    const shouldRetry = recoverable && attemptNumber < 3
    
    // Calculate backoff delay
    const retryDelay = 1000 * Math.pow(2, attemptNumber)
    
    // Show notification if not retrying
    const notify = !shouldRetry
    
    if (notify) {
      ui.showError(`Error: ${error.message}. Please try again.`)
    } else {
      ui.showWarning(`Error occurred. Retrying in ${retryDelay}ms...`)
    }
    
    // Log error
    logger.error('Stream error', {
      provider,
      error: error.message,
      attemptNumber,
      willRetry: shouldRetry
    })
    
    return {
      retry: shouldRetry,
      retryDelay,
      notify,
      notificationMessage: notify ? error.message : undefined
    }
  },
  
  onBeforeRetry: async ({ attemptNumber, retryDelay, maxAttempts }) => {
    console.log(`🔄 Retry ${attemptNumber}/${maxAttempts} in ${retryDelay}ms`)
    
    // Show retry UI
    ui.showRetry({
      attempt: attemptNumber,
      max: maxAttempts,
      delay: retryDelay
    })
    
    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, retryDelay))
  },
  
  onRetrySuccess: async ({ attempts, duration }) => {
    console.log(`✅ Retry successful after ${attempts} attempts (${duration}ms)`)
    
    // Hide retry UI
    ui.hideRetry()
    
    // Show success
    ui.showSuccess('Connection restored')
  },
  
  // ========================================
  // 8. TIMEOUT HANDLING
  // ========================================
  
  onLongWaiting: async ({ elapsed, timeout, percentage, chunksReceived }) => {
    console.warn(`⏰ Long wait: ${elapsed}ms / ${timeout}ms (${percentage}%)`)
    console.warn(`📊 Chunks received: ${chunksReceived}`)
    
    // Show warning if no response yet
    const showWarning = chunksReceived === 0
    
    // Extend timeout if making progress
    const extendTimeout = chunksReceived > 0 ? 10000 : undefined
    
    if (showWarning) {
      ui.showWarning('The model is taking longer than expected...')
    }
    
    return {
      showWarning,
      warningMessage: 'Still processing...',
      extendTimeout
    }
  },
  
  onTimeout: async ({ timeout, chunksReceived, partialContent, provider }) => {
    console.error(`⏰ Timeout after ${timeout}ms`)
    console.error(`📊 Received ${chunksReceived} chunks`)
    
    // Save partial result if any
    if (partialContent) {
      await documentService.savePartial(partialContent)
      ui.showError('Timeout occurred. Partial result saved.')
    } else {
      ui.showError(`${provider} did not respond in time.`)
    }
    
    // Log timeout
    logger.error('Stream timeout', {
      provider,
      timeout,
      chunksReceived,
      hasPartialContent: !!partialContent
    })
  }
}

// ============================================================================
// USAGE
// ============================================================================

const messages: Message[] = [
  {
    role: 'user',
    content: 'Write a function to calculate fibonacci numbers and test it'
  }
]

const config = {
  signal: abortController.signal,
  callbacks
}

// Stream with comprehensive callbacks
try {
  let fullResponse = ''
  
  for await (const chunk of provider.stream(messages, config)) {
    fullResponse += chunk
    // Chunk is already processed by callbacks
    // Just accumulate or display
  }
  
  console.log('Full response:', fullResponse)
  
} catch (error) {
  console.error('Stream failed:', error)
  // Error already handled by onError callback
}
```

---

## Callback Flow

### Stream Lifecycle

```
1. onToolsRequest
   ↓ (if tools needed)
   
2. beforeStreamStart
   ↓ (transform messages/tools/options)
   
3. onStreamStart
   ↓ (stream begins)
   
4. FOR EACH CHUNK:
   ├─ beforeChunk (pre-process)
   ├─ [YIELD CHUNK]
   └─ afterChunk (post-process)
   
5. ON TOOL CALLS:
   └─ onToolCall (execute tools)
   
6. ON ERROR:
   ├─ onError (decide retry)
   ├─ onBeforeRetry (if retrying)
   └─ onRetrySuccess (if retry worked)
   
7. ON TIMEOUT:
   ├─ onLongWaiting (at 75%)
   └─ onTimeout (if timeout occurs)
   
8. onStreamEnd
   ↓ (stream complete)
```

---

## Key Features Demonstrated

### ✅ 1. Tool Injection
- Tools requested from consumer
- Tools filtered by permissions
- Tool execution handled by consumer

### ✅ 2. Message Transformation
- System context added
- Quota checked
- Cancellation supported

### ✅ 3. Chunk Processing
- Sensitive data filtered
- Translation applied
- Empty chunks skipped
- Metadata tracked

### ✅ 4. Document Updates
- Real-time appending
- Progress tracking
- Cache for recovery

### ✅ 5. Error Handling
- Retry with exponential backoff
- User notifications
- Error logging

### ✅ 6. Timeout Management
- 75% warning
- Timeout extension
- Partial result saving

---

## Benefits

### For Provider
- ✅ No UI coupling
- ✅ Pure streaming logic
- ✅ Testable in isolation

### For Consumer
- ✅ Full control over integration
- ✅ Custom processing pipelines
- ✅ Flexible error handling

### For Architecture
- ✅ Clean separation of concerns
- ✅ Event-driven design
- ✅ Composable callbacks

---

*Reference Implementation: OpenAI Provider*  
*Date: October 22, 2025*
