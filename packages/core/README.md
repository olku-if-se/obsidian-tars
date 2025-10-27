# @tars/core

Core plugin logic and Obsidian integration for the Tars ecosystem.

## Overview

This package contains the core functionality that powers the Tars Obsidian plugin, including plugin management, settings, commands, and event handling.

## Installation

```bash
pnpm add @tars/core
```

## Contents

### Plugin Core

```typescript
import { TarsPlugin } from '@tars/core';

// Main plugin class
const plugin = new TarsPlugin(app, manifest);
await plugin.load();
```

### Settings Management

```typescript
import { SettingsManager, defaultSettings } from '@tars/core';

// Create settings manager
const settings = new SettingsManager(plugin);

// Get current settings
const current = settings.getSettings();

// Update settings
await settings.updateSettings({
  providers: { openai: { apiKey: 'new-key' } }
});

// Reset to defaults
await settings.resetToDefaults();
```

### Command System

```typescript
import { CommandManager } from '@tars/core';

// Register commands
const commands = new CommandManager(plugin);

// Register tag-based commands
commands.registerTagCommands();

// Execute commands
await commands.executeCommand('tars:send-message');
```

### Provider Registry

```typescript
import { ProviderRegistry } from '@tars/core';

// Get available providers
const registry = new ProviderRegistry();
const providers = registry.getAvailableProviders();

// Get specific provider
const openai = registry.getProvider('openai');

// Register custom provider
registry.registerProvider('custom', customProvider);
```

### Event Bus

```typescript
import { EventBus } from '@tars/core';

const events = new EventBus();

// Subscribe to events
events.on('message:sent', (data) => {
  console.log('Message sent:', data);
});

events.on('provider:error', (error) => {
  console.error('Provider error:', error);
});

// Emit events
events.emit('conversation:started', { id: 'conv-123' });
```

## Features

### Plugin Management
- **Lifecycle Management**: Load, unload, and cleanup operations
- **Settings Integration**: Seamless integration with Obsidian settings
- **Command Registration**: Dynamic command registration and execution
- **Status Bar Integration**: Real-time status updates

### Settings System
- **Structured Configuration**: Type-safe settings management
- **Validation**: Automatic validation of settings values
- **Migration**: Settings migration between versions
- **Encryption**: Secure storage of API keys and sensitive data

### Command System
- **Tag-Based Commands**: Dynamic command generation from conversation tags
- **Context Awareness**: Commands that adapt to current context
- **Keyboard Shortcuts**: Configurable hotkey support
- **Palette Integration**: Integration with Obsidian command palette

### Provider Management
- **Dynamic Registration**: Runtime provider registration and discovery
- **Configuration Management**: Centralized provider configuration
- **Capability Detection**: Automatic detection of provider capabilities
- **Error Handling**: Robust error handling and recovery

### Event System
- **Publish-Subscribe**: Decoupled event communication
- **Type Safety**: Strongly typed event definitions
- **Error Isolation**: Error handling that doesn't crash the plugin
- **Performance**: Efficient event propagation

## CLI Tools

```bash
# Run TARS CLI
tsx packages/core/bin/tars-cli.ts --help

# Validate configuration
tsx packages/core/bin/tars-cli.ts config validate

# List providers
tsx packages/core/bin/tars-cli.ts providers list

# Test connection
tsx packages/core/bin/tars-cli.ts test openai
```

## Dependencies

- `@tars/types` - Shared TypeScript definitions
- `@tars/shared` - Common utilities and constants
- `obsidian` - Obsidian API types

## Development

This is part of the Tars monorepo. See the [main documentation](../../docs/monorepo-setup.md) for development setup.

### Building

```bash
# From monorepo root
pnpm --filter @tars/core build
```

### Testing

```bash
# Run tests
pnpm --filter @tars/core test

# Type checking
pnpm --filter @tars/core typecheck
```

## Architecture

The core package follows a modular architecture:

```
src/
├── plugin.ts           # Main plugin class
├── settings.ts         # Settings management
├── commands/           # Command system
├── events.ts           # Event bus
├── registry.ts         # Provider registry
└── cli/               # CLI tools
```

## License

MIT License