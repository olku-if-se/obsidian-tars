/**
 * Event system types and interfaces
 */

/**
 * Event listener function type
 */
export type EventListener<T = unknown> = (event: T) => void | Promise<void>

/**
 * Event listener with error handling
 */
export type SafeEventListener<T = unknown> = (
  event: T,
  errorHandler?: (error: Error) => void
) => void | Promise<void>

/**
 * Event bus interface
 */
export interface EventBus {
  /**
   * Register an event listener
   */
  on<T = unknown>(eventType: EventType, listener: EventListener<T>): () => void

  /**
   * Register a one-time event listener
   */
  once<T = unknown>(eventType: EventType, listener: EventListener<T>): () => void

  /**
   * Remove an event listener
   */
  off<T = unknown>(eventType: EventType, listener: EventListener<T>): void

  /**
   * Emit an event
   */
  emit<T = unknown>(event: T): Promise<void>

  /**
   * Remove all listeners for an event type
   */
  clear(eventType?: EventType): void

  /**
   * Get listener count for an event type
   */
  listenerCount(eventType: EventType): number

  /**
   * Get all registered event types
   */
  eventTypes(): EventType[]
}

/**
 * Event types
 */
export type EventType =
  | // Provider events
  | 'provider:initialized'
  | 'provider:error'
  | 'provider:registered'
  | 'provider:unregistered'
  | 'provider:rate-limited'
  | 'provider:quota-exceeded'

  // MCP events
  | 'mcp:connected'
  | 'mcp:disconnected'
  | 'mcp:error'
  | 'mcp:tool-called'
  | 'mcp:resource-read'

  // Conversation events
  | 'conversation:started'
  | 'conversation:completed'
  | 'conversation:cancelled'
  | 'conversation:error'
  | 'message:sent'
  | 'message:received'

  // Generation events
  | 'generation:started'
  | 'generation:progress'
  | 'generation:completed'
  | 'generation:failed'
  | 'generation:cancelled'
  | 'generation:timeout'

  // Settings events
  | 'settings:changed'
  | 'settings:loaded'
  | 'settings:saved'
  | 'settings:reset'

  // UI events
  | 'ui:modal-opened'
  | 'ui:modal-closed'
  | 'ui:suggestion-selected'
  | 'ui:command-executed'

  // System events
  | 'system:ready'
  | 'system:shutdown'
  | 'system:error'
  | 'system:warning'

/**
 * Base event interface
 */
export interface BaseEvent<T extends EventType = EventType> {
  /** Event type */
  type: T
  /** Event timestamp */
  timestamp: Date
  /** Event source */
  source: string
  /** Event ID */
  id: string
  /** Optional correlation ID */
  correlationId?: string
  /** Event version */
  version?: string
}

/**
 * Provider events
 */
export interface ProviderInitializedEvent extends BaseEvent<'provider:initialized'> {
  /** Provider ID */
  providerId: string
  /** Provider name */
  providerName: string
  /** Initialization time */
  initTime: number
}

export interface ProviderErrorEvent extends BaseEvent<'provider:error'> {
  /** Provider ID */
  providerId: string
  /** Error details */
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  /** Whether error is retryable */
  retryable: boolean
}

/**
 * Generation events
 */
export interface GenerationStartedEvent extends BaseEvent<'generation:started'> {
  /** Request ID */
  requestId: string
  /** Provider ID */
  providerId: string
  /** Model ID */
  modelId: string
  /** Messages being processed */
  messageCount: number
}

export interface GenerationProgressEvent extends BaseEvent<'generation:progress'> {
  /** Request ID */
  requestId: string
  /** Progress percentage (0-1) */
  progress: number
  /** Tokens generated so far */
  tokensGenerated: number
  /** Current content */
  content?: string
  /** Reasoning content if available */
  reasoning?: string
}

export interface GenerationCompletedEvent extends BaseEvent<'generation:completed'> {
  /** Request ID */
  requestId: string
  /** Final content */
  content: string
  /** Token usage */
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  /** Processing time */
  processingTime: number
  /** Tokens per second */
  tokensPerSecond: number
}

/**
 * MCP events
 */
export interface MCPConnectedEvent extends BaseEvent<'mcp:connected'> {
  /** Server ID */
  serverId: string
  /** Server name */
  serverName: string
  /** Connection time */
  connectionTime: number
  /** Server capabilities */
  capabilities: {
    tools: boolean
    resources: boolean
    prompts: boolean
    sampling: boolean
  }
}

export interface MCPToolCalledEvent extends BaseEvent<'mcp:tool-called'> {
  /** Server ID */
  serverId: string
  /** Tool name */
  toolName: string
  /** Tool arguments */
  arguments: Record<string, unknown>
  /** Execution result */
  result: {
    success: boolean
    content?: unknown
    error?: string
  }
  /** Execution time */
  executionTime: number
}

/**
 * Settings events
 */
export interface SettingsChangedEvent extends BaseEvent<'settings:changed'> {
  /** Changed settings */
  changes: {
    key: string
    oldValue: unknown
    newValue: unknown
  }[]
  /** Settings path */
  path: string
}

/**
 * Event middleware
 */
export type EventMiddleware<T = unknown> = (
  event: T,
  next: () => Promise<void>
) => Promise<void>

/**
 * Event filter
 */
export type EventFilter<T = unknown> = (event: T) => boolean

/**
 * Event transformer
 */
export type EventTransformer<T = unknown, R = unknown> = (event: T) => R

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  /** Maximum number of times to fire */
  maxTimes?: number
  /** Timeout in milliseconds */
  timeout?: number
  /** Event filter */
  filter?: EventFilter
  /** Event transformer */
  transform?: EventTransformer
  /** Error handler */
  errorHandler?: (error: Error) => void
}

/**
 * Event subscription handle
 */
export interface EventSubscription {
  /** Subscription ID */
  id: string
  /** Event type */
  eventType: EventType
  /** Unsubscribe function */
  unsubscribe: () => void
  /** Check if subscription is active */
  isActive: boolean
}

/**
 * Event store interface for persisting events
 */
export interface EventStore {
  /**
   * Store an event
   */
  store(event: BaseEvent): Promise<void>

  /**
   * Get events by type
   */
  getEvents(
    eventType: EventType,
    options?: {
      limit?: number
      offset?: number
      startTime?: Date
      endTime?: Date
    }
  ): Promise<BaseEvent[]>

  /**
   * Get events by correlation ID
   */
  getEventsByCorrelationId(correlationId: string): Promise<BaseEvent[]>

  /**
   * Clear old events
   */
  clear(olderThan: Date): Promise<number>

  /**
   * Get event statistics
   */
  getStatistics(options?: {
    eventType?: EventType
    startTime?: Date
    endTime?: Date
  }): Promise<EventStatistics>
}

/**
 * Event statistics
 */
export interface EventStatistics {
  /** Total events */
  totalEvents: number
  /** Events by type */
  eventsByType: Record<EventType, number>
  /** Events by source */
  eventsBySource: Record<string, number>
  /** Average processing time */
  averageProcessingTime: number
  /** Error rate */
  errorRate: number
}