import { Container } from '@needle-di/core'
import { beforeEach, describe, expect, it } from 'vitest'
import { Tokens } from '../../src/di/tokens'
import type { PluginSettings } from '../../src/settings'

describe('Child Container Isolation', () => {
  let parentContainer: Container
  let mockSettings: PluginSettings

  beforeEach(() => {
    // GIVEN: A parent container with base configuration
    mockSettings = {
      providers: {
        openai: {
          apiKey: 'parent-openai-key',
          baseURL: 'https://api.openai.com/v1',
          model: 'gpt-4',
          parameters: {},
        },
      },
      tags: {
        user: '#User:',
        assistant: '#Claude:',
      },
      enableStatusBar: true,
    }

    parentContainer = new Container()
    parentContainer.bind({
      provide: Tokens.AppSettings,
      useValue: mockSettings,
    })
  })

  it('should create isolated child containers', () => {
    // WHEN: Creating a child container
    const childContainer = parentContainer.createChild()

    // THEN: Child should inherit parent bindings
    const childSettings = childContainer.get(Tokens.AppSettings)
    expect(childSettings).toBe(mockSettings)

    // AND: Child should be a separate instance
    expect(childContainer).not.toBe(parentContainer)
  })

  it('should allow overriding settings in child container', () => {
    // WHEN: Creating child container with overridden settings
    const childContainer = parentContainer.createChild()
    const childSettings = {
      ...mockSettings,
      providers: {
        ...mockSettings.providers,
        openai: {
          ...mockSettings.providers?.openai,
          apiKey: 'child-overridden-key', // Override API key
        },
      },
    }

    childContainer.bind({
      provide: Tokens.AppSettings,
      useValue: childSettings,
    })

    // THEN: Child should have overridden values
    const retrievedChildSettings = childContainer.get(Tokens.AppSettings)
    expect(retrievedChildSettings.providers?.openai?.apiKey).toBe('child-overridden-key')

    // AND: Parent should retain original values
    const retrievedParentSettings = parentContainer.get(Tokens.AppSettings)
    expect(retrievedParentSettings.providers?.openai?.apiKey).toBe('parent-openai-key')
  })

  it('should maintain isolation between multiple child containers', () => {
    // WHEN: Creating multiple child containers with different overrides
    const child1 = parentContainer.createChild()
    const child2 = parentContainer.createChild()

    const child1Settings = { ...mockSettings, enableStatusBar: false }
    const child2Settings = { ...mockSettings, enableStatusBar: true }

    child1.bind({
      provide: Tokens.AppSettings,
      useValue: child1Settings,
    })

    child2.bind({
      provide: Tokens.AppSettings,
      useValue: child2Settings,
    })

    // THEN: Each child should have its own isolated settings
    const settings1 = child1.get(Tokens.AppSettings)
    const settings2 = child2.get(Tokens.AppSettings)

    expect(settings1.enableStatusBar).toBe(false)
    expect(settings2.enableStatusBar).toBe(true)

    // AND: Parent should be unaffected
    const parentSettings = parentContainer.get(Tokens.AppSettings)
    expect(parentSettings.enableStatusBar).toBe(true)
  })

  it('should support nested child containers', () => {
    // WHEN: Creating nested child containers
    const child1 = parentContainer.createChild()
    const grandchild = child1.createChild()

    // THEN: Grandchild should inherit from child, which inherits from parent
    const grandchildSettings = grandchild.get(Tokens.AppSettings)
    expect(grandchildSettings).toBe(mockSettings)

    // WHEN: Overriding in child
    const child1Override = { ...mockSettings, enableStatusBar: false }
    child1.bind({
      provide: Tokens.AppSettings,
      useValue: child1Override,
    })

    // THEN: Grandchild should get the overridden value
    const overriddenGrandchildSettings = grandchild.get(Tokens.AppSettings)
    expect(overriddenGrandchildSettings.enableStatusBar).toBe(false)
  })

  it('should enable test isolation with independent state', () => {
    // GIVEN: Test-specific scenario with provider settings
    const testSettings1 = {
      ...mockSettings,
      providers: {
        openai: {
          apiKey: 'test-key-1',
          baseURL: 'https://api.openai.com/v1',
          model: 'gpt-3.5-turbo',
          parameters: {},
        },
      },
    }

    const testSettings2 = {
      ...mockSettings,
      providers: {
        openai: {
          apiKey: 'test-key-2',
          baseURL: 'https://api.openai.com/v1',
          model: 'gpt-4-turbo',
          parameters: {},
        },
      },
    }

    // WHEN: Creating separate test containers
    const testContainer1 = parentContainer.createChild()
    const testContainer2 = parentContainer.createChild()

    testContainer1.bind({
      provide: Tokens.AppSettings,
      useValue: testSettings1,
    })

    testContainer2.bind({
      provide: Tokens.AppSettings,
      useValue: testSettings2,
    })

    // THEN: Tests should be completely isolated
    const settings1 = testContainer1.get(Tokens.AppSettings)
    const settings2 = testContainer2.get(Tokens.AppSettings)

    expect(settings1.providers?.openai?.apiKey).toBe('test-key-1')
    expect(settings1.providers?.openai?.model).toBe('gpt-3.5-turbo')

    expect(settings2.providers?.openai?.apiKey).toBe('test-key-2')
    expect(settings2.providers?.openai?.model).toBe('gpt-4-turbo')
  })
})
