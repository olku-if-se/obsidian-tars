import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactSettingsTab } from '../../src/reactSettingsTab'
import type TarsPlugin from '../../src/main'

// Mock React components - we'll test the class behavior, not React rendering
vi.mock('../../src/reactSettingsTab', async (importOriginal) => {
	const actual = await importOriginal()
	return {
		ReactSettingsTab: actual.ReactSettingsTab
	}
})

// Mock the UI components that ReactSettingsTab uses
vi.mock('@tars/ui/providers', () => ({
	SettingsProvider: ({ children }: { children: React.ReactNode }) => children
}))

vi.mock('@tars/ui/views', () => ({
	SettingsTab: () => null
}))

// Mock React DOM
vi.mock('react-dom/client', () => ({
	createRoot: vi.fn(() => ({
		render: vi.fn(),
		unmount: vi.fn()
	}))
}))

// Mock the adapter
vi.mock('../../src/adapters/reactSettingsAdapter', () => ({
	adaptObsidianToReact: vi.fn((settings) => ({
		providers: [],
		messageTags: {
			newChatTags: settings.newChatTags || [],
			userTags: settings.userTags || [],
			systemTags: settings.systemTags || [],
			roleEmojis: settings.roleEmojis || {}
		},
		reactFeatures: settings.features || {}
	})),
	mergeReactChanges: vi.fn((original, reactState) => ({ ...original, ...reactState }))
}))

describe('ReactSettingsTab - Unit Tests', () => {
	let mockPlugin: Partial<TarsPlugin>
	let mockApp: any

	beforeEach(() => {
		// Mock app
		mockApp = {
			vault: {}
		}

		// Mock plugin with settings
		mockPlugin = {
			app: mockApp,
			settings: {
				providers: [],
				newChatTags: ['#NewChat'],
				userTags: ['#User'],
				systemTags: ['#System'],
				roleEmojis: {
					newChat: '🆕',
					user: '👤',
					system: '⚙️',
					assistant: '✨'
				},
				confirmRegenerate: true,
				enableInternalLink: true,
				enableDefaultSystemMsg: false,
				defaultSystemMsg: '',
				features: {
					reactSettingsTab: true,
					reactStatusBar: false,
					reactModals: false,
					reactMcpUI: false
				}
			},
			saveSettings: vi.fn().mockResolvedValue(undefined),
			buildTagCommands: vi.fn()
		}
	})

	describe('Constructor', () => {
		it('should create ReactSettingsTab instance', () => {
			const tab = new ReactSettingsTab(mockApp, mockPlugin as any)

			expect(tab).toBeDefined()
			expect(tab.plugin).toBe(mockPlugin)
		})
	})

	describe('Display Method', () => {
		it('should render fallback message when React settings are disabled', () => {
			const tab = new ReactSettingsTab(mockApp, mockPlugin as any)
			mockPlugin.settings.features!.reactSettingsTab = false

			// Mock container element
			tab.containerEl = {
				empty: vi.fn(),
				createEl: vi.fn().mockReturnValue({
					text: 'test text',
					cls: 'test-class'
				})
			} as any

			tab.display()

			expect(tab.containerEl.empty).toHaveBeenCalled()
			expect(tab.containerEl.createEl).toHaveBeenCalledWith('div', {
				text: 'React settings tab is disabled. Enable it in the React Features section.',
				cls: 'setting-item-info'
			})
		})

		it('should initialize React root when enabled', async () => {
			const { createRoot } = await import('react-dom/client')
			const mockRoot = {
				render: vi.fn(),
				unmount: vi.fn()
			}
			;(createRoot as any).mockReturnValue(mockRoot)

			const tab = new ReactSettingsTab(mockApp, mockPlugin as any)
			mockPlugin.settings.features!.reactSettingsTab = true

			// Mock container element
			tab.containerEl = {
				empty: vi.fn()
			} as any

			tab.display()

			expect(createRoot).toHaveBeenCalledWith(tab.containerEl)
			expect(mockRoot.render).toHaveBeenCalled()
		})
	})

	describe('Hide Method', () => {
		it('should clean up React root and clear debounce timer', async () => {
			const { createRoot } = await import('react-dom/client')
			const mockRoot = {
				render: vi.fn(),
				unmount: vi.fn()
			}
			;(createRoot as any).mockReturnValue(mockRoot)

			const tab = new ReactSettingsTab(mockApp, mockPlugin as any)
			tab.reactRoot = mockRoot as any
			tab.debounceTimer = setTimeout(() => {}, 1000) as any

			tab.hide()

			expect(mockRoot.unmount).toHaveBeenCalled()
			expect(tab.debounceTimer).toBeNull()
			expect(mockPlugin.buildTagCommands).toHaveBeenCalled()
		})
	})

	describe('State Change Handler', () => {
		it('should debounce state changes and save settings', async () => {
			const { createRoot } = await import('react-dom/client')
			const mockRoot = {
				render: vi.fn(),
				unmount: vi.fn()
			}
			;(createRoot as any).mockReturnValue(mockRoot)

			const tab = new ReactSettingsTab(mockApp, mockPlugin as any)
			tab.reactRoot = mockRoot as any

			// Mock React state changes
			const reactState = {
				providers: [],
				messageTags: {
					newChatTags: ['#NewChat'],
					userTags: ['#User', '#Human'],
					systemTags: ['#System'],
					roleEmojis: {
						newChat: '🆕',
						user: '👤',
						system: '⚙️'
					}
				},
				reactFeatures: {
					reactSettingsTab: true,
					reactStatusBar: true,
					reactModals: false,
					reactMcpUI: false
				}
			}

			// Trigger state change
			tab.handleStateChange(reactState)

			// Should debounce - check that save is not called immediately
			await new Promise((resolve) => setTimeout(resolve, 50))
			expect(mockPlugin.saveSettings).not.toHaveBeenCalled()

			// Wait for debounce
			await new Promise((resolve) => setTimeout(resolve, 400))
			expect(mockPlugin.saveSettings).toHaveBeenCalled()
		})

		it('should handle save errors gracefully', async () => {
			const { createRoot } = await import('react-dom/client')
			const mockRoot = {
				render: vi.fn(),
				unmount: vi.fn()
			}
			;(createRoot as any).mockReturnValue(mockRoot)

			const tab = new ReactSettingsTab(mockApp as any)
			tab.reactRoot = mockRoot as any

			// Mock save failure
			mockPlugin.saveSettings = vi.fn().mockRejectedValue(new Error('Save failed'))

			const reactState = {
				providers: [],
				messageTags: {
					newChatTags: ['#NewChat'],
					userTags: ['#User'],
					systemTags: ['#System'],
					roleEmojis: {
						newChat: '🆕',
						user: '👤',
						system: '⚙️'
					}
				},
				reactFeatures: {
					reactSettingsTab: true
				}
			}

			// Should not throw error
			await expect(tab.handleStateChange(reactState)).resolves.not.toThrow()
		})
	})

	describe('Error Handling', () => {
		it('should render error fallback when React rendering fails', async () => {
			const { createRoot } = await import('react-dom/client')
			;(createRoot as any).mockImplementation(() => {
				throw new Error('React rendering failed')
			})

			const tab = new ReactSettingsTab(mockApp as any)
			tab.containerEl = {
				empty: vi.fn(),
				createEl: vi.fn().mockImplementation((tag: string) => {
					if (tag === 'h3') {
						return { text: 'Error Title' }
					}
					if (tag === 'p') {
						return { text: 'Error Message' }
					}
					if (tag === 'details') {
						return {
							createEl: vi.fn().mockReturnValue({ text: 'Error Details' })
						}
					}
					if (tag === 'button') {
						return { onclick: vi.fn() }
					}
					return {}
				})
			} as any

			tab.display()

			expect(tab.containerEl.createEl).toHaveBeenCalledWith('div', { cls: 'setting-item-error' })
		})
	})

	describe('Utility Methods', () => {
		it('should check React initialization status', () => {
			const tab = new ReactSettingsTab(mockApp as any)

			expect(tab.isReactInitialized()).toBe(false)

			tab.reactRoot = {} as any
			expect(tab.isReactInitialized()).toBe(true)
		})

		it('should refresh React settings', async () => {
			const { createRoot } = await import('react-dom/client')
			const mockRoot = {
				render: vi.fn(),
				unmount: vi.fn()
			}
			;(createRoot as any).mockReturnValue(mockRoot)

			const tab = new ReactSettingsTab(mockApp as any)
			tab.reactRoot = mockRoot as any
			tab.display = vi.fn()

			tab.refresh()

			expect(tab.display).toHaveBeenCalled()
		})
	})

	describe('MCP Connection Testing', () => {
		it('should test MCP connection and return results', async () => {
			const { createRoot } = await import('react-dom/client')
			const mockRoot = {
				render: vi.fn(),
				unmount: vi.fn()
			}
			;(createRoot as any).mockReturnValue(mockRoot)

			// Mock MCP manager
			const mockManager = {
				testConnection: vi.fn().mockResolvedValue({
					success: true,
					message: 'Connection successful',
					latency: 150
				})
			}

			// Mock dynamic import
			vi.doMock('@tars/mcp-hosting', () => ({
				MCPServerManager: {
					getInstance: vi.fn().mockReturnValue(mockManager)
				}
			}))

			const tab = new ReactSettingsTab(mockApp as any)
			const result = await tab.handleTestMCPConnection('test-server')

			expect(result).toEqual({
				success: true,
				message: 'Connection successful',
				latency: 150
			})
		})

		it('should handle MCP connection test errors', async () => {
			const { createRoot } = await import('react-dom/client')
			const mockRoot = {
				render: vi.fn(),
				unmount: vi.fn()
			}
			;(createRoot as any).mockReturnValue(mockRoot)

			// Mock MCP manager failure
			const mockManager = {
				testConnection: vi.fn().mockRejectedValue(new Error('Connection failed'))
			}

			vi.doMock('@tars/mcp-hosting', () => ({
				MCPServerManager: {
					getInstance: vi.fn().mockReturnValue(mockManager)
				}
			}))

			const tab = new ReactSettingsTab(mockApp as any)
			const result = await tab.handleTestMCPConnection('test-server')

			expect(result).toEqual({
				success: false,
				message: 'Connection failed'
			})
		})
	})
})
