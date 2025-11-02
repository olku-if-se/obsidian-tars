import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { PluginSettings } from '../../src/settings'
import { Container } from '@needle-di/core'
import { SettingsChangeNotifier } from '../../src/di/settings-change-notifier'
import type { SettingsChangeEvent } from '../../src/di/types'
import { Tokens } from '../../src/di/tokens'

describe('Settings Change Notification (Contract Test)', () => {
  let container: Container
  let notifier: SettingsChangeNotifier
  let mockSettings: PluginSettings
  let eventSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // GIVEN: A test container with base plugin settings
    mockSettings = {
      providers: [
        {
          tag: 'openai',
          vendor: 'OpenAI',
          options: {
            apiKey: 'initial-api-key',
            baseURL: 'https://api.openai.com/v1',
            model: 'gpt-4',
            parameters: { temperature: 0.7 },
          },
        },
        {
          tag: 'claude',
          vendor: 'Anthropic',
          options: {
            apiKey: 'initial-claude-key',
            baseURL: 'https://api.anthropic.com',
            model: 'claude-3-5-sonnet-20241022',
            parameters: {},
          },
        },
      ],
      editorStatus: { isTextInserting: false },
      systemTags: ['#System:'],
      newChatTags: ['#NewChat:'],
      userTags: ['#User:'],
      roleEmojis: { assistant: '🤖', system: '⚙️', newChat: '💬', user: '👤' },
      promptTemplates: [],
      enableInternalLink: true,
      enableInternalLinkForAssistantMsg: true,
      confirmRegenerate: false,
      enableTagSuggest: true,
      tagSuggestMaxLineLength: 30,
      answerDelayInMilliseconds: 0,
      enableExportToJSONL: false,
      enableReplaceTag: true,
      enableDefaultSystemMsg: true,
      defaultSystemMsg: 'You are a helpful assistant.',
      enableStreamLog: false,
    }

    container = new Container()
    eventSpy = vi.fn()

    // Bind mock settings
    container.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })

    // Bind the notifier
    container.bind(SettingsChangeNotifier)
    notifier = container.get(SettingsChangeNotifier)

    // Set up event listener
    notifier.on('settingsChanged', eventSpy)
  })

  afterEach(() => {
    notifier?.dispose?.()
    vi.clearAllMocks()
  })

  it('should emit settings change event when configuration is updated', () => {
    // WHEN: Settings are updated
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'new-api-key',
          },
        },
      ],
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Settings change event should be emitted
    expect(eventSpy).toHaveBeenCalledTimes(1)

    const event: SettingsChangeEvent = eventSpy.mock.calls[0][0]
    expect(event.newSettings).toEqual(updatedSettings)
    expect(event.previousSettings).toEqual(mockSettings)
    expect(event.changes).toHaveProperty('providers')
    expect(event.timestamp).toBeTypeOf('number')
  })

  it('should detect specific configuration changes', () => {
    // WHEN: API key is changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        {
          ...mockSettings.providers[0],
          options: {
            ...mockSettings.providers[0].options,
            apiKey: 'changed-api-key',
          },
        },
      ],
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Change should be detected and reported
    const event: SettingsChangeEvent = eventSpy.mock.calls[0][0]
    expect(event.changes.providers).toHaveLength(1)
    expect(event.changes.providers[0]).toMatchObject({
      type: 'modified',
      path: 'providers[0].options.apiKey',
      oldValue: 'initial-api-key',
      newValue: 'changed-api-key',
    })
  })

  it('should detect provider addition', () => {
    // WHEN: New provider is added
    const newProvider = {
      tag: 'gemini',
      vendor: 'Google',
      options: {
        apiKey: 'gemini-key',
        baseURL: 'https://generativelanguage.googleapis.com',
        model: 'gemini-1.5-pro',
        parameters: {},
      },
    }

    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [...mockSettings.providers, newProvider],
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Provider addition should be detected
    const event: SettingsChangeEvent = eventSpy.mock.calls[0][0]
    expect(event.changes.providers).toHaveLength(1)
    expect(event.changes.providers[0]).toMatchObject({
      type: 'added',
      path: 'providers[2]',
      newValue: newProvider,
    })
  })

  it('should detect provider removal', () => {
    // WHEN: Provider is removed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [mockSettings.providers[0]], // Remove Claude provider
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Provider removal should be detected
    const event: SettingsChangeEvent = eventSpy.mock.calls[0][0]
    expect(event.changes.providers).toHaveLength(1)
    expect(event.changes.providers[0]).toMatchObject({
      type: 'removed',
      path: 'providers[1]',
      oldValue: mockSettings.providers[1],
    })
  })

  it('should handle empty changes gracefully', () => {
    // WHEN: Settings are the same
    notifier.notifySettingsChanged(mockSettings, mockSettings)

    // THEN: Event should still be emitted but with no changes
    expect(eventSpy).toHaveBeenCalledTimes(1)

    const event: SettingsChangeEvent = eventSpy.mock.calls[0][0]
    expect(event.changes).toEqual({})
  })

  it('should support multiple event listeners', () => {
    // GIVEN: Multiple event listeners
    const spy1 = vi.fn()
    const spy2 = vi.fn()

    notifier.on('settingsChanged', spy1)
    notifier.on('settingsChanged', spy2)

    // WHEN: Settings are changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      enableTagSuggest: false, // Change a boolean setting
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: All listeners should be notified
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
    expect(eventSpy).toHaveBeenCalledTimes(1) // Original listener from beforeEach
  })

  it('should support removal of event listeners', () => {
    // GIVEN: Event listener that will be removed
    const removableSpy = vi.fn()
    const listener = (event: SettingsChangeEvent) => removableSpy(event)

    notifier.on('settingsChanged', listener)

    // WHEN: Listener is removed before settings change
    notifier.off('settingsChanged', listener)

    const updatedSettings: PluginSettings = {
      ...mockSettings,
      enableTagSuggest: false,
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Removed listener should not be called
    expect(removableSpy).not.toHaveBeenCalled()
    expect(eventSpy).toHaveBeenCalledTimes(1) // Original listener still works
  })

  it('should track change history', () => {
    // WHEN: Multiple changes occur
    const change1: PluginSettings = {
      ...mockSettings,
      enableTagSuggest: false,
    }

    const change2: PluginSettings = {
      ...change1,
      confirmRegenerate: true,
    }

    notifier.notifySettingsChanged(change1, mockSettings)
    notifier.notifySettingsChanged(change2, change1)

    // THEN: Change history should be maintained
    const history = notifier.getChangeHistory()
    expect(history).toHaveLength(2)
    expect(history[0]).toMatchObject({
      changeType: 'settings',
      timestamp: expect.any(Number),
    })
    expect(history[1]).toMatchObject({
      changeType: 'settings',
      timestamp: expect.any(Number),
    })
  })

  it('should support clearing change history', () => {
    // GIVEN: Some changes have occurred
    notifier.notifySettingsChanged(
      { ...mockSettings, enableTagSuggest: false },
      mockSettings
    )

    expect(notifier.getChangeHistory()).toHaveLength(1)

    // WHEN: History is cleared
    notifier.clearChangeHistory()

    // THEN: History should be empty
    expect(notifier.getChangeHistory()).toHaveLength(0)
  })

  it('should provide change statistics', () => {
    // WHEN: Various changes occur
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      providers: [
        { ...mockSettings.providers[0], options: { ...mockSettings.providers[0].options, apiKey: 'new' } },
        { ...mockSettings.providers[1], tag: 'modified-claude' },
        { tag: 'gemini', vendor: 'Google', options: { apiKey: 'key', baseURL: 'url', model: 'gemini', parameters: {} } },
      ],
      enableTagSuggest: false,
      confirmRegenerate: true,
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Statistics should be accurate
    const stats = notifier.getChangeStatistics()
    expect(stats.totalChanges).toBe(1)
    expect(stats.providersModified).toBe(2)
    expect(stats.providersAdded).toBe(1)
    expect(stats.providersRemoved).toBe(0)
    expect(stats.settingsModified).toBe(2) // enableTagSuggest, confirmRegenerate
  })

  it('should handle invalid settings gracefully', () => {
    // WHEN: Invalid settings are provided
    expect(() => {
      notifier.notifySettingsChanged(null as any, mockSettings)
    }).not.toThrow()

    expect(() => {
      notifier.notifySettingsChanged(mockSettings, null as any)
    }).not.toThrow()

    expect(() => {
      notifier.notifySettingsChanged(undefined as any, mockSettings)
    }).not.toThrow()

    expect(() => {
      notifier.notifySettingsChanged(mockSettings, undefined as any)
    }).not.toThrow()
  })

  it('should provide current settings snapshot', () => {
    // WHEN: Settings are changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      enableTagSuggest: false,
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Current settings should be available
    const currentSettings = notifier.getCurrentSettings()
    expect(currentSettings).toEqual(updatedSettings)
    expect(currentSettings.enableTagSuggest).toBe(false)
  })

  it('should support subscription-based change notifications', () => {
    // GIVEN: Subscription-based listener
    const subscriptionSpy = vi.fn()
    const unsubscribe = notifier.subscribe(subscriptionSpy)

    // WHEN: Settings are changed
    const updatedSettings: PluginSettings = {
      ...mockSettings,
      enableTagSuggest: false,
    }

    notifier.notifySettingsChanged(updatedSettings, mockSettings)

    // THEN: Subscription should be called
    expect(subscriptionSpy).toHaveBeenCalledTimes(1)
    expect(subscriptionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        newSettings: updatedSettings,
        previousSettings: mockSettings,
      })
    )

    // WHEN: Unsubscribed
    unsubscribe()
    notifier.notifySettingsChanged(mockSettings, updatedSettings)

    // THEN: Unsubscribed listener should not be called
    expect(subscriptionSpy).toHaveBeenCalledTimes(1)
  })
})