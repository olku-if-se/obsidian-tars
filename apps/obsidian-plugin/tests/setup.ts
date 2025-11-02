import { vi } from 'vitest'

// Mock window object and localStorage
Object.defineProperty(global, 'window', {
  value: {
    localStorage: {
      getItem: vi.fn(() => 'en'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    },
  },
  writable: true,
})

// Mock localStorage directly
global.localStorage = {
  getItem: vi.fn(() => 'en'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
} as any

// Mock Obsidian API
vi.mock('obsidian', () => ({
  App: class MockApp {},
  Plugin: class MockPlugin {
    app: any
    settings: any
    constructor(app: any) {
      this.app = app
    }
    async loadSettings() {}
    async saveSettings() {}
  },
  Notice: class MockNotice {
    constructor(message: string) {
      console.log(`Notice: ${message}`)
    }
  },
  Modal: class MockModal {},
  Setting: class MockSetting {},
  SuggestModal: class MockSuggestModal {},
}))

// Mock fetch if needed
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    body: {
      getReader: () => ({
        read: () => Promise.resolve({ done: true, value: null }),
        cancel: () => Promise.resolve(),
      }),
    },
  })
) as any