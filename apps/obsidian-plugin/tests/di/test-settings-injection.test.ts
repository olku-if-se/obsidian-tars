import { Container } from '@needle-di/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { Tokens } from '../../src/di/tokens'
import type { PluginSettings } from '../../src/settings'

describe('Settings Injection Integration', () => {
  let container: Container
  let mockSettings: PluginSettings

  beforeEach(() => {
    // GIVEN: A test container with comprehensive mock settings
    mockSettings = {
      providers: {
        openai: {
          apiKey: 'test-openai-key',
          baseURL: 'https://api.openai.com/v1',
          model: 'gpt-4',
          parameters: {},
        },
        claude: {
          apiKey: 'test-claude-key',
          baseURL: 'https://api.anthropic.com',
          model: 'claude-3-opus-20240229',
          parameters: {},
        },
      },
      tags: {
        user: '#User:',
        assistant: '#Claude:',
        system: '#System:',
        newChat: '#NewChat:',
      },
      enableStatusBar: true,
      enableTagSuggestion: true,
      maxResponseLength: 4000,
      temperature: 0.7,
    }

    container = new Container()
  })

  it('should inject and retrieve complete settings object', () => {
    // WHEN: Settings are bound to container
    container.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })

    // THEN: Settings should be retrievable with all properties
    const retrievedSettings = container.get(Tokens.AppSettings)
    expect(retrievedSettings).toBe(mockSettings)
    expect(retrievedSettings.providers?.openai?.apiKey).toBe('test-openai-key')
    expect(retrievedSettings.providers?.claude?.model).toBe('claude-3-opus-20240229')
    expect(retrievedSettings.tags?.user).toBe('#User:')
    expect(retrievedSettings.enableStatusBar).toBe(true)
  })

  it('should allow partial settings override in child container', () => {
    // WHEN: Parent container has full settings
    container.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })

    const childContainer = container.createChild()
    const partialOverride = {
      ...mockSettings,
      enableStatusBar: false, // Override this property
      temperature: 0.9, // Override this property
    }

    childContainer.bind({
      provide: Tokens.AppSettings,
      useValue: partialOverride,
    })

    // THEN: Child container should have overridden values
    const childSettings = childContainer.get(Tokens.AppSettings)
    expect(childSettings.enableStatusBar).toBe(false)
    expect(childSettings.temperature).toBe(0.9)

    // AND: Parent container should have original values
    const parentSettings = container.get(Tokens.AppSettings)
    expect(parentSettings.enableStatusBar).toBe(true)
    expect(parentSettings.temperature).toBe(0.7)
  })

  it('should handle empty settings gracefully', () => {
    // WHEN: Empty settings are provided
    const emptySettings: Partial<PluginSettings> = {}
    container.bind({
      provide: Tokens.AppSettings,
      useValue: emptySettings,
    })

    // THEN: Container should still resolve the token
    const retrievedSettings = container.get(Tokens.AppSettings)
    expect(retrievedSettings).toBe(emptySettings)
  })

  it('should validate settings type safety', () => {
    // WHEN: Settings are bound with wrong type
    expect(() => {
      // @ts-expect-error - Testing type safety
      container.bind({
        provide: Tokens.AppSettings,
        useValue: { invalidProperty: 'should fail type check' },
      })
    }).not.toThrow() // Runtime doesn't enforce TypeScript types

    // THEN: The container still resolves, but TypeScript would catch this at compile time
    const retrievedSettings = container.get(Tokens.AppSettings)
    expect(retrievedSettings).toHaveProperty('invalidProperty')
  })
})
