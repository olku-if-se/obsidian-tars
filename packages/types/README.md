# @tars/types

TypeScript type definitions and interfaces for the Tars ecosystem.

## Overview

This package contains shared TypeScript definitions used across all Tars packages, including interfaces for AI providers, conversations, and plugin functionality.

## Installation

```bash
pnpm add @tars/types
```

## Contents

### Core Types

```typescript
// Conversation system
interface Conversation {
  id: string;
  messages: Message[];
  metadata?: ConversationMetadata;
}

interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
  timestamp: string;
}

// Provider system
interface Vendor {
  id: string;
  name: string;
  capabilities: ProviderCapabilities;
  sendRequest: SendRequestFunction;
}
```

### Provider Types

```typescript
interface ProviderCapabilities {
  textGeneration: boolean;
  vision: boolean;
  imageGeneration: boolean;
  webSearch: boolean;
  streaming: boolean;
  multimodal: boolean;
}

interface VendorConfig {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}
```

### Message Types

```typescript
type MessageRole = 'system' | 'user' | 'assistant' | 'newChat';

interface MessageContent {
  type: 'text' | 'image' | 'file' | 'multimodal';
  text?: string;
  images?: ImageContent[];
  files?: FileContent[];
}
```

## Usage

```typescript
import { Conversation, Message, Vendor } from '@tars/types';

// Create a conversation
const conversation: Conversation = {
  id: 'conv-123',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: {
        type: 'text',
        text: 'Hello, AI!'
      },
      timestamp: new Date().toISOString()
    }
  ]
};

// Configure a provider
const vendorConfig: VendorConfig = {
  apiKey: 'your-api-key',
  model: 'gpt-4',
  temperature: 0.7
};
```

## Development

This is part of the Tars monorepo. See the [main documentation](../../docs/monorepo-setup.md) for development setup.

## License

MIT License