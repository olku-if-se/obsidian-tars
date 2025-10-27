// Testing utilities and fixtures for Tars
// This package provides common testing utilities for the Tars ecosystem
import { createPlugin } from '@tars/core'
import { createPluginLogger, summarizeMessage } from '@tars/shared'
import type { AIResponse, Message } from '@tars/types'

const testLogger = createPluginLogger('tars-testing')

// Placeholder for testing utilities - will be expanded as migration progresses
export const TEST_UTILS = {
  version: '3.6.0',
  package: '@tars/testing',
  plugin: createPlugin('testing-utils'),
}

export function createTestResponse(message: Message): AIResponse {
  testLogger.debug('Creating test response', {
    summary: summarizeMessage(message),
  })

  return {
    content: `TEST: ${message.content}`,
    done: false,
  }
}
