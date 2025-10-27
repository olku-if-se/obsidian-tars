# @tars/shared

Shared utilities, constants, and helper functions for the Tars ecosystem.

## Overview

This package contains common functionality used across multiple Tars packages, including utilities, constants, parsers, and file handlers.

## Installation

```bash
pnpm add @tars/shared
```

## Contents

### Utilities

```typescript
import {
  generateId,
  formatTimestamp,
  sanitizeText,
  parseConversationTags
} from '@tars/shared';

// Generate unique IDs
const id = generateId(); // "uuid-v4"

// Format timestamps
const formatted = formatTimestamp(new Date());

// Sanitize text content
const clean = sanitizeText(userInput);

// Parse conversation tags
const parsed = parseConversationTags("#User: Hello\n#Claude: Hi there!");
```

### Constants

```typescript
import {
  DEFAULT_TAGS,
  SUPPORTED_PROVIDERS,
  MESSAGE_ROLES
} from '@tars/shared';

// Default conversation tags
DEFAULT_TAGS.USER // "#User:"
DEFAULT_TAGS.ASSISTANT // "#Claude:"

// Supported AI providers
SUPPORTED_PROVIDERS.OPENAI // "openai"
SUPPORTED_PROVIDERS.CLAUDE // "claude"

// Message roles
MESSAGE_ROLES.USER // "user"
MESSAGE_ROLES.ASSISTANT // "assistant"
```

### Conversation Parser

```typescript
import { ConversationParser } from '@tars/shared';

const parser = new ConversationParser();
const conversation = parser.parse(text);

// Extract messages, metadata, and structure
console.log(conversation.messages);
console.log(conversation.metadata);
```

### File Handler

```typescript
import { FileHandler } from '@tars/shared';

const handler = new FileHandler();

// Handle embedded images
const imageData = await handler.processEmbed(imageEmbed);

// Handle file attachments
const fileData = await handler.processAttachment(attachment);

// Resolve file paths
const resolved = await handler.resolvePath(filePath);
```

### Cache Manager

```typescript
import { CacheManager } from '@tars/shared';

const cache = new CacheManager({
  maxSize: 100,
  ttl: 3600000 // 1 hour
});

// Cache responses
await cache.set('key', data);

// Retrieve cached data
const cached = await cache.get('key');

// Clear cache
await cache.clear();
```

## CLI Utilities

```typescript
// Command-line interface utilities
import {
  validateConfig,
  formatOutput,
  parseArguments
} from '@tars/shared/cli';

// Validate configuration
const isValid = validateConfig(config);

// Format CLI output
console.log(formatOutput(data, 'json'));

// Parse command line arguments
const args = parseArguments(process.argv);
```

## Features

- **ID Generation**: UUID-based unique identifier generation
- **Text Processing**: Sanitization, formatting, and validation
- **Tag Parsing**: Robust parsing of conversation tag syntax
- **File Handling**: Support for images, PDFs, and attachments
- **Caching**: In-memory caching with TTL support
- **CLI Tools**: Utilities for command-line interfaces
- **Constants**: Centralized configuration and defaults

## Development

This is part of the Tars monorepo. See the [main documentation](../../docs/monorepo-setup.md) for development setup.

## License

MIT License