export const ReactBridgeToken = Symbol('ReactBridge')
export const ReactBridgeManagerToken = Symbol('ReactBridgeManager')
export const StatusBarElementToken = Symbol('StatusBarElement')

export const AppToken = Symbol('App')
export const TarsPluginToken = Symbol('TarsPlugin')

// Type assertions to help TypeScript understand the token-service relationship
export type ReactBridgeToken = typeof ReactBridgeToken
export type ReactBridgeManagerToken = typeof ReactBridgeManagerToken
export type StatusBarElementToken = typeof StatusBarElementToken
export type AppToken = typeof AppToken
export type TarsPluginToken = typeof TarsPluginToken
