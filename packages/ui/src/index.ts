// Main entry point for @tars/ui package

// Re-export commonly used React hooks and types
export type { ComponentProps, FC, ReactNode } from 'react'
export * from './atoms'
export * from './bridge/ReactBridge'
export * from './components'
export * from './types'
export * from './views'

// Specific exports from providers to avoid naming conflicts
export { SettingsProvider, useReactFeatures } from './providers/settings/SettingsProvider'
export type { ReactFeatures as SettingsReactFeatures } from './providers/settings/SettingsProvider'
