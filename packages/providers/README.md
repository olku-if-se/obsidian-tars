# @tars/providers

AI provider implementations and interfaces for the Tars ecosystem.

## Overview

This package contains implementations of various AI providers, offering a unified interface for text generation, image analysis, image generation, and more.

## Installation

```bash
pnpm add @tars/providers
```

## Supported Providers

### Text Generation
- **OpenAI**: GPT-3.5, GPT-4, GPT-4 Turbo
- **Claude**: Claude 2, Claude 3, Claude 3.5
- **DeepSeek**: DeepSeek Chat, DeepSeek Coder
- **Gemini**: Gemini Pro, Gemini Pro Vision
- **OpenRouter**: Access to 100+ models
- **SiliconFlow**: Various open source models
- **Qwen**: Qwen Chat models
- **Ollama**: Local models
- **Together AI**: Open source models
- **Groq**: Fast inference models
- **Perplexity**: Search-augmented generation

### Specialized Capabilities
- **Vision**: Image analysis with multimodal models
- **Image Generation**: DALL-E 3, Midjourney integration
- **Web Search**: Enhanced capabilities with search integration

## Usage

### Basic Usage

```typescript
import { createVendor } from '@tars/providers';

// Create a provider instance
const openai = createVendor('openai', {
  apiKey: 'your-api-key',
  model: 'gpt-4'
});

// Send a request
const response = await openai.sendRequest({
  messages: [
    { role: 'user', content: 'Hello, AI!' }
  ],
  stream: true
});

// Handle streaming response
for await (const chunk of response) {
  console.log(chunk.content);
}
```

### Provider Configuration

```typescript
import { createVendor, VendorConfig } from '@tars/providers';

// OpenAI configuration
const openaiConfig: VendorConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000
};

// Claude configuration
const claudeConfig: VendorConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.5
};

// Ollama configuration (local)
const ollamaConfig: VendorConfig = {
  baseUrl: 'http://localhost:11434',
  model: 'llama2'
};
```

### Multimodal Content

```typescript
import { createVendor, MessageContent } from '@tars/providers';

const claude = createVendor('claude', claudeConfig);

const content: MessageContent = {
  type: 'multimodal',
  text: 'What do you see in this image?',
  images: [
    {
      data: 'base64-image-data',
      mimeType: 'image/jpeg',
      filename: 'example.jpg'
    }
  ]
};

const response = await claude.sendRequest({
  messages: [
    { role: 'user', content }
  ]
});
```

### Streaming Responses

```typescript
import { createVendor } from '@tars/providers';

const provider = createVendor('openai', config);

const response = await provider.sendRequest({
  messages: [{ role: 'user', content: 'Write a story' }],
  stream: true
};

// Process streaming response
const controller = new AbortController();
for await (const chunk of response) {
  console.log(chunk.content);

  // Stop generation if needed
  if (shouldStop) {
    controller.abort();
    break;
  }
}
```

### Provider Capabilities

```typescript
import { getProviderCapabilities } from '@tars/providers';

const capabilities = getProviderCapabilities('claude');
console.log(capabilities);
// {
//   textGeneration: true,
//   vision: true,
//   streaming: true,
//   multimodal: true,
//   imageGeneration: false,
//   webSearch: false
// }
```

## Provider Implementation

### Creating Custom Providers

```typescript
import { BaseVendor, VendorCapabilities } from '@tars/providers';

class CustomProvider extends BaseVendor {
  id = 'custom';
  name = 'Custom AI';
  capabilities: VendorCapabilities = {
    textGeneration: true,
    streaming: true,
    vision: false,
    imageGeneration: false,
    webSearch: false,
    multimodal: false
  };

  async sendRequest(request: RequestData) {
    // Implement your provider logic here
    return this.createResponse(responseData);
  }
}

// Register the provider
registerVendor('custom', CustomProvider);
```

### Base Vendor Interface

```typescript
abstract class BaseVendor {
  abstract id: string;
  abstract name: string;
  abstract capabilities: VendorCapabilities;

  abstract sendRequest(request: RequestData): AsyncGenerator<Chunk>;

  protected createResponse(data: any): AsyncGenerator<Chunk> {
    // Helper method for creating standardized responses
  }

  protected validateRequest(request: RequestData): void {
    // Request validation logic
  }
}
```

## CLI Tools

```bash
# Run provider demo
tsx packages/providers/bin/provider-demo.ts --provider openai

# Test provider connection
tsx packages/providers/bin/provider-demo.ts --test claude

# List available providers
tsx packages/providers/bin/provider-demo.ts --list

# Compare providers
tsx packages/providers/bin/provider-demo.ts --compare openai claude
```

## Features

- **Unified Interface**: Consistent API across all providers
- **Streaming Support**: Real-time response streaming
- **Multimodal**: Text, image, and file content support
- **Error Handling**: Robust error handling and retry logic
- **Configuration**: Flexible provider configuration
- **Type Safety**: Full TypeScript support
- **Extensibility**: Easy to add new providers

## Dependencies

- `@tars/types` - Shared TypeScript definitions
- `@tars/shared` - Common utilities

## Development

This is part of the Tars monorepo. See the [main documentation](../../docs/monorepo-setup.md) for development setup.

### Building

```bash
# From monorepo root
pnpm --filter @tars/providers build
```

### Testing

```bash
# Run tests
pnpm --filter @tars/providers test

# Run provider demos
pnpm --filter @tars/providers demo
```

## Architecture

```
src/
├── index.ts           # Package exports
├── base.ts           # Base vendor interface
├── registry.ts       # Provider registry
├── openai.ts         # OpenAI implementation
├── claude.ts         # Claude implementation
├── others/           # Other provider implementations
└── demo/             # Demo scripts and CLI tools
```

## License

MIT License