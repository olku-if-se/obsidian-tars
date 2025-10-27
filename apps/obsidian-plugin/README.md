# Tars Obsidian Plugin

AI-powered text generation using tag-based conversations in Obsidian.

## Overview

Tars enables you to have conversations with multiple AI providers (Claude, OpenAI, DeepSeek, Gemini, and more) directly within your Obsidian notes using a simple tag-based syntax.

## Features

- **Multiple AI Providers**: Support for 12+ AI providers including Claude, OpenAI, DeepSeek, Gemini, Ollama, and more
- **Tag-Based Conversations**: Use intuitive tags like `#User:`, `#Claude:`, `#System:` to structure conversations
- **Multimodal Support**: Include images and PDFs in conversations for vision-capable providers
- **Image Generation**: Generate images directly in your notes with supported providers
- **Streaming Responses**: Real-time response streaming for interactive conversations
- **Custom Prompt Templates**: Save and reuse prompt templates for common tasks
- **Cross-Platform**: Works on both desktop and mobile Obsidian clients

## Quick Start

### Installation

1. Download the latest release from the [Releases page](https://github.com/ae86jack/obsidian-tars/releases)
2. Copy the files to your Obsidian vault's plugins directory
3. Enable the plugin in Obsidian's Community Plugins settings

### Configuration

1. Open Tars settings in Obsidian
2. Configure your preferred AI providers with API keys
3. Adjust conversation tags and templates as needed

### Basic Usage

```markdown
# User: Explain quantum computing in simple terms

# Claude: [AI response will appear here]

# User: Can you give me a practical example?

# Claude: [Follow-up response will appear here]
```

## Supported AI Providers

### Text Generation
- **OpenAI**: GPT-3.5, GPT-4, GPT-4 Turbo
- **Claude**: Claude 2, Claude 3, Claude 3.5
- **DeepSeek**: DeepSeek Chat, DeepSeek Coder
- **Gemini**: Gemini Pro, Gemini Pro Vision
- **OpenRouter**: Access to 100+ models via OpenRouter
- **SiliconFlow**: Various open source models
- **Qwen**: Qwen Chat models
- **Ollama**: Local models via Ollama
- **Together AI**: Open source models
- **Groq**: Fast inference models
- **Perplexity**: Search-augmented generation
- **Mock**: For testing and development

### Specialized Capabilities
- **Vision**: Image analysis with Claude, Gemini Pro Vision, GPT-4 Vision
- **Image Generation**: DALL-E 3, Midjourney (via API)
- **Web Search**: Perplexity, Bing Search integration

## Conversation Tags

Default conversation tags (customizable in settings):

- `#User:` - User messages and questions
- `#Claude:` - Claude/AI assistant responses
- `#System:` - System prompts and instructions
- `#NewChat:` - Start a new conversation

## Features in Detail

### Multimodal Content

Include images and PDFs in your conversations:

```markdown
# User: What do you see in this image? ![Description](path/to/image.png)

# Claude: [AI will analyze the image]
```

### Prompt Templates

Save and reuse common prompts:

1. Create a prompt in your notes
2. Use the "Save as Template" command
3. Access templates via command palette or suggestion

### Streaming Responses

Watch AI responses generate in real-time with the ability to:
- Stop generation at any time
- Continue from where you left off
- Edit responses and regenerate

## Settings

### General Settings
- Conversation tags customization
- Response formatting options
- Auto-save behavior
- Performance preferences

### Provider Configuration
- API key management (encrypted storage)
- Model selection per provider
- Default parameters (temperature, max tokens)
- Provider-specific settings

### Advanced Features
- Custom system prompts
- Response filtering
- Conversation history management
- Integration settings

## Development

This plugin is built as part of the Tars monorepo using modern tooling:
- TypeScript with strict mode
- pnpm workspaces for package management
- Turbo for build orchestration
- Vitest for testing

### Building

```bash
# From monorepo root
pnpm build

# Or specifically for the plugin
pnpm --filter @tars/obsidian-plugin build
```

### Development

```bash
# Start development mode with file watching
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck
```

## Architecture

The plugin is organized as part of a monorepo structure:

```
apps/obsidian-plugin/          # Main plugin (IIFE bundle)
├── src/
│   ├── main.ts               # Plugin entry point
│   ├── settings.ts           # Settings management
│   ├── editor.ts             # Core text processing
│   ├── suggest.ts            # Tag suggestions
│   └── ...                   # Other plugin components
├── manifest.json             # Obsidian plugin manifest
├── styles.css               # Plugin styles
└── README.md                # This file
```

### Dependencies

The plugin depends on several workspace packages:
- `@tars/types` - Shared TypeScript definitions
- `@tars/shared` - Common utilities
- `@tars/core` - Core plugin logic
- `@tars/providers` - AI provider implementations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build: `pnpm quality`
5. Submit a pull request

## Troubleshooting

### Common Issues

**Plugin doesn't load**: Check that all dependencies are built and the manifest.json is correct.

**AI provider errors**: Verify API keys are correctly configured in settings.

**Slow responses**: Check your internet connection and consider adjusting model parameters.

**Mobile issues**: Some features may be limited on mobile due to platform constraints.

### Debug Mode

Enable debug mode in settings to see detailed logs in the developer console.

## License

MIT License - see [LICENSE](../../LICENSE) file for details.

## Support

- **Issues**: Report bugs via [GitHub Issues](https://github.com/ae86jack/obsidian-tars/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/ae86jack/obsidian-tars/discussions) for questions
- **Documentation**: See [docs/](../../docs/) for comprehensive guides

## Changelog

See [versions.json](versions.json) for version history and [CHANGELOG.md](../../CHANGELOG.md) for detailed changes.