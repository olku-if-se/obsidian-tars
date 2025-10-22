# Archived Tests

This directory contains tests from the old provider architecture (pre-streaming refactor).

## Why Archived?

These tests were written for the legacy provider implementations that used:
- Direct `sendRequestFunc` generators
- Inline MCP integration without abstraction
- No StreamQueue or unified error handling
- Provider files in flat structure

## New Architecture

The providers have been refactored to use the streaming architecture based on llm-chat.md:
- `StreamQueue` for multi-stream management
- `CompletionsStream` abstraction
- `ToolManager` for tool execution
- `StreamingProviderBase` with built-in retry/timeout
- Provider subfolders with their own test suites

## Test Location for New Architecture

New tests are located in provider subfolders:
- `src/providers/openai/__tests__/`
- `src/providers/claude/__tests__/`
- `src/streaming/__tests__/`
- `src/tools/__tests__/`
- etc.

## Archived Tests

- `claude-di.test.ts` - Legacy Claude provider DI tests
- `ollama-di.test.ts` - Legacy Ollama provider DI tests
- `openai-di.test.ts` - Legacy OpenAI provider DI tests

These tests can be used as reference for migrating other providers, but should not be run in the new architecture.

## Migration Date

Archived on: October 22, 2025
Architecture version: llm-chat.md streaming refactor
