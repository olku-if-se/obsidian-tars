<!--
Sync Impact Report:
Version change: 1.0.0 → 1.1.0 (minor version increase - added MCP integration principle and enhanced development standards)
Modified principles:
- Plugin Architecture Excellence (enhanced with MCP integration requirements)
- Test-First Development (enhanced to emphasize TDD approach)
Added sections:
- VI. MCP Integration Capability (NEW)
- Enhanced TypeScript Development Standards
Removed sections: N/A
Templates requiring updates:
✅ .specify/templates/plan-template.md (Constitution Check section updated with MCP integration gate)
✅ .specify/templates/spec-template.md (functional requirements format compatible)
✅ .specify/templates/tasks-template.md (user story organization compatible)
Follow-up TODOs: N/A
-->

# Tars Constitution

## Core Principles

### I. Plugin Architecture Excellence
Tars is an Obsidian plugin first - all features MUST integrate cleanly with Obsidian's APIs and respect Obsidian's file system, caching, and editor patterns. Plugin code MUST be self-contained, independently testable, and maintain clear separation between AI provider logic, MCP server integration, and Obsidian-specific functionality.

**Rationale**: Ensures compatibility with Obsidian updates and maintainable architecture that doesn't fight the platform's design patterns while enabling extensibility through MCP integration.

### II. Provider Abstraction (NON-NEGOTIABLE)
All AI providers MUST implement the same `Vendor` interface. Provider implementations MUST be isolated from core plugin logic and support streaming responses with proper AbortController handling. No provider-specific logic may leak into core editor or command processing.

**Rationale**: Enables rapid addition of new AI providers without architectural changes and ensures consistent user experience across all providers.

### III. Test-First Development (TDD APPROACH)
Red-Green-Refactor cycle strictly enforced. Tests MUST be written before implementation, MUST fail initially, and only pass after correct implementation. All provider implementations MUST include contract tests validating interface compliance. TDD is the mandatory development approach for all features.

**Rationale**: Prevents regression across multiple AI providers and ensures robust handling of API changes, error conditions, and streaming responses while maintaining high code quality standards.

### IV. Cross-Platform Compatibility
Tars MUST work consistently on desktop and mobile Obsidian clients. All UI interactions MUST support both mouse/keyboard and touch interfaces. File handling MUST respect Obsidian's cross-platform file system abstraction.

**Rationale**: Users expect seamless experience across all Obsidian-supported platforms; mobile usage is significant for note-taking workflows.

### V. Performance & Responsiveness
UI MUST remain responsive during AI text generation. Long operations MUST use streaming responses and proper async handling. File embedding and attachment processing MUST be efficient and never block the main thread.

**Rationale**: Poor performance breaks note-taking flow and frustrates users, especially during longer AI generations.

### VI. MCP Integration Capability (NEW)
Tars MUST support integration with multiple MCP servers that provide additional tools, resources, and prompts for plugin reuse. MCP integrations MUST follow the same abstraction patterns as AI providers, ensuring clean separation between core plugin logic and MCP server implementations. All MCP functionality MUST be independently testable.

**Rationale**: Enables extensibility through the broader MCP ecosystem while maintaining architectural consistency and preventing vendor lock-in.

## Development Standards

### Modern TypeScript Requirements

All code MUST follow these mandatory practices:
- TypeScript strict mode with comprehensive type coverage (no `any` types without explicit justification)
- Modern ES2022+ features when appropriate (async/await, optional chaining, nullish coalescing)
- Comprehensive ESLint compliance with project-specific rules
- Prettier code formatting for consistency
- Clear separation between UI logic, business logic, provider implementations, and MCP integrations
- Comprehensive error handling with user-friendly messages
- No blocking operations in the main thread
- Proper memory management and cleanup for sensitive data

### Obsidian Integration Standards

Tars MUST integrate with Obsidian's core features:
- File cache and embed resolution for proper multimodal content handling
- Editor suggestions API for tag-based autocomplete
- Command palette integration for tag commands
- Status bar updates for real-time generation feedback
- Settings management with proper validation
- Mobile-responsive UI patterns

### Testing Standards

TDD is the MANDATORY development approach:
- Unit tests for all core logic components
- Integration tests for provider and MCP server interactions
- Contract tests ensuring interface compliance
- Mock implementations for external dependencies
- Performance tests for streaming and file handling scenarios

## Security & Privacy

### API Key Management
All API keys MUST be stored in Obsidian's encrypted settings and never exposed in logs, debug output, or error messages. Memory cleanup MUST be implemented for sensitive data.

### Content Privacy
User content and AI conversations MUST NOT be transmitted to any services other than the explicitly configured AI provider or MCP server. Local processing of embeddings and attachments MUST respect user privacy expectations.

### MCP Server Security
MCP server connections MUST be configurable with appropriate security controls. All MCP server communications MUST respect user consent and privacy preferences.

## Governance

This constitution supersedes all other development practices and guides all architectural decisions. Amendments require:
1. Proposal documentation with impact analysis
2. Team approval through pull request review
3. Version update in this constitution following semantic versioning
4. Migration plan for existing code if needed

All pull requests and code reviews MUST verify compliance with these constitutional principles. Complexity beyond these standards MUST be explicitly justified in PR descriptions.

**Version**: 1.1.0 | **Ratified**: 2025-01-24 | **Last Amended**: 2025-01-24