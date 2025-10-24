/**
 * UI system types and interfaces
 */

/**
 * UI configuration
 */
export interface UIConfig {
  /** Theme preference */
  theme: 'light' | 'dark' | 'auto'
  /** Font size */
  fontSize: number
  /** Show status bar */
  showStatusBar: boolean
  /** Show suggestions */
  showSuggestions: boolean
  /** Maximum tokens for generation */
  maxTokens: number
  /** Auto-save settings */
  autoSave: boolean
  /** Auto-save interval in seconds */
  autoSaveInterval: number
  /** Show generation stats */
  showStats: boolean
  /** Compact mode */
  compactMode: boolean
}

// Forward declarations
export interface ProviderCapabilities {
  textGeneration: boolean
  vision: boolean
  imageGeneration: boolean
  webSearch: boolean
  streaming: boolean
  multimodal: boolean
  reasoning: boolean
}

/**
 * Editor status interface
 */
export interface EditorStatus {
  /** Current provider */
  provider?: string
  /** Current model */
  model?: string
  /** Generation in progress */
  isGenerating: boolean
  /** Last generation time */
  lastGenerated?: Date
  /** Generation statistics */
  stats?: GenerationStats
}

/**
 * Status bar types
 */
export type StatusBarType = 'idle' | 'generating' | 'success' | 'error'

export interface StatusBarContent {
  /** Main status text */
  text: string
  /** Optional detail text */
  detail?: string
  /** Status icon class */
  icon?: string
  /** Status color */
  color?: string
  /** Progress indicator (0-1) */
  progress?: number
}

export interface StatusBarState {
  /** Status type */
  type: StatusBarType
  /** Status content */
  content: StatusBarContent
  /** Timestamp */
  timestamp: Date
  /** Error information if applicable */
  error?: ErrorInfo
}

/**
 * Generation statistics
 */
export interface GenerationStats {
  /** Tokens generated */
  tokensGenerated: number
  /** Tokens used as input */
  tokensInput: number
  /** Total tokens */
  totalTokens: number
  /** Generation time in milliseconds */
  generationTime: number
  /** Tokens per second */
  tokensPerSecond: number
  /** Provider used */
  provider: string
  /** Model used */
  model: string
  /** Cost estimation */
  estimatedCost?: number
}

/**
 * Error information for UI display
 */
export interface ErrorInfo {
  /** Error message */
  message: string
  /** Error code */
  code?: string
  /** Provider where error occurred */
  provider?: string
  /** Model where error occurred */
  model?: string
  /** Timestamp */
  timestamp: Date
  /** Stack trace */
  stack?: string
  /** Whether error is retryable */
  retryable?: boolean
}

/**
 * Modal types
 */
export interface ModalConfig {
  /** Modal title */
  title: string
  /** Modal content */
  content: string
  /** Modal buttons */
  buttons?: ModalButton[]
  /** Modal width */
  width?: number
  /** Modal height */
  height?: number
  /** Whether modal is closable */
  closable?: boolean
}

export interface ModalButton {
  /** Button text */
  text: string
  /** Button action */
  action: () => void | Promise<void>
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'danger'
  /** Whether button is disabled */
  disabled?: boolean
}

/**
 * Suggestion types
 */
export interface SuggestionItem {
  /** Display text */
  text: string
  /** Suggestion type */
  type: 'provider' | 'model' | 'tag' | 'command'
  /** Description */
  description?: string
  /** Icon */
  icon?: string
  /** Metadata */
  metadata?: Record<string, unknown>
}

export interface SuggestionContext {
  /** Current editor position */
  position: {
    line: number
    ch: number
  }
  /** Current word */
  currentWord: string
  /** Line content */
  lineContent: string
  /** File path */
  filePath: string
}

/**
 * Theme types
 */
export type ThemeVariant = 'light' | 'dark'
export type ThemeColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'background'
  | 'surface'
  | 'text'

export interface ThemeColors {
  [key in ThemeColor]: string
}