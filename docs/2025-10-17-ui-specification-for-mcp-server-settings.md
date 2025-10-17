# MCP Server Settings UI Design Specification

**Date**: 2025-10-17
**Component**: MCPServerSettings UI Interface
**Target Implementation**: Framework-agnostic specification for Obsidian plugin
**Specification Quality**: 9.0/10 (Ready for implementation)

---

## 1. Executive Summary

This specification defines a comprehensive user interface for configuring Model Context Protocol (MCP) servers within the Obsidian Tars plugin. The interface provides global MCP settings management, individual server configuration with multi-format support, quick-add functionality for popular servers, and comprehensive testing capabilities.

**Design Philosophy**: Comprehensive feature set with progressive disclosure through collapsible sections, maintaining the rich functionality of the existing implementation while improving usability through thoughtful organization.

---

## 2. Architecture Overview

### 2.1 Integration Strategy
- **Approach**: Tight integration with existing plugin architecture
- **Target Components**:
  - `packages/plugin/src/settings/MCPServerSettings.ts` (replacement)
  - `packages/plugin/src/mcp/managerMCPUse.ts` (integration point)
  - `@tars/mcp-hosting` package (validation and parsing utilities)
- **Data Persistence**: Continue using `plugin.saveSettings()` pattern with immediate save on changes

### 2.2 State Management Architecture

```typescript
interface MCPSettingsState {
  // Core data
  globalSettings: GlobalMCPSettings
  servers: MCPServerConfig[]

  // UI state
  uiState: {
    expandedServers: Set<string>
    activeFormats: Record<string, 'url' | 'command' | 'json'>
    validationStates: Record<string, ValidationState>
    loadingStates: Record<string, LoadingState>
  }
}

interface ValidationState {
  isValid: boolean
  errors: string[]
  warnings: string[]
  formatInfo?: string
}

interface LoadingState {
  testing: boolean
  saving: boolean
  lastOperation?: string
}
```

### 2.3 Platform Compatibility Strategy
- **Detection**: Automatic OS detection for platform-appropriate command templates
- **Templates**: Platform-specific quick-add configurations (Windows PowerShell vs Unix shell)
- **Warnings**: Cross-platform compatibility alerts when applicable
- **User Control**: Allow users to customize commands for their specific environment

---

## 3. Component Hierarchy & Layout

### 3.1 Container Structure

```
MCP Settings Container (root)
├── Global Settings Section
│   ├── Global Timeout (text input, placeholder 30000, persists when >0)
│   ├── Concurrent Limit (text input, placeholder 3, persists when >0)
│   ├── Session Limit (text input, placeholder 25, accepts -1)
│   ├── Parallel Execution Toggle (boolean, default disabled)
│   ├── Insert LLM Utility Section Toggle (boolean, default enabled)
│   └── Max Parallel Tools (text input, placeholder 3, enabled independent of toggle state)
├── Server List Section
│   ├── Empty State Message (when no servers configured)
│   └── Server Section (collapsible, per server)
│       ├── Server Summary (header with name + status)
│       ├── Server Controls Row (Enable/Disable | Test | Delete buttons)
│       ├── Server Name Input (text field with uniqueness validation)
│       ├── Configuration Section
│       │   ├── Configuration Header with Format Toggle
│       │   ├── Configuration Container (adaptive based on format)
│       │   │   ├── URL Input (simple format, auto-preview)
│       │   │   ├── Command/JSON Textarea (complex format)
│       │   │   └── Preview Container (URL mode only)
│       │   └── Feedback Container
│       │       ├── Error Display (conditional, with copy button)
│       │       └── Format Information (conditional)
├── Quick Add Section
│   ├── Section Header & Description (“Quick Add Popular Servers” with helper copy)
│   └── Quick Add Buttons (fixed set: “+ Exa Search”, “+ Filesystem Server”)
└── Add Custom Server Section
    └── Add Custom Server Button
```

### 3.2 Layout System

**CSS Variables & Spacing:**
- Use Obsidian's CSS custom properties for consistent theming
- Standard spacing: `var(--size-4-2)` (8px), `var(--size-4-3)` (12px), `var(--size-4-4)` (16px)
- Component padding: `var(--size-2-2)` (6px) internal, `var(--size-2-3)` (8px) external
- Button dimensions: `min-height: 32px`, `min-width: 80px` for consistency

**Responsive Behavior:**
- Full-width inputs with `width: 100%` and `box-sizing: border-box`
- Vertical textarea resizing with `resize: vertical`
- Horizontal button groups with flex layout and wrapping
- Collapsible sections using HTML5 `<details>`/`<summary>` elements

### 3.3 Server Section Breakdown

Each server entry is rendered inside an HTML `<details>` element with a clickable summary that mirrors the Obsidian plugin implementation in `packages/plugin/src/settings/MCPServerSettings.ts`:

- **Summary Row:** `${server.name} (✓ Enabled | ✗ Disabled | ✗ Error)` text with a status-specific class (`mcp-status-enabled`, `mcp-status-disabled`, `mcp-status-error`).
- **Controls Row:** `Enable/Disable`, `Test`, and `Delete` buttons. The `Enable/Disable` button flips its label and tooltip to match the new state. `Test` transitions to “Testing…” with a disabled state while validation + `mcp-use` checks run, and restores afterwards. `Delete` is styled as destructive and re-renders the list.
- **Name Field:** Obsidian `Setting` with `Server name` label. Inline validation enforces uniqueness and injects an error div (`⚠️ Server name must be unique`) while also toggling the input border to `var(--text-error)`.
- **Configuration Block:**
  - **Remote URL input** (simple mode) with preview pane that converts URLs into the generated command via `remoteUrlToCommand`.
  - **Command / JSON textarea** pre-populated with MCP examples. Textarea updates save instantly and back-propagate into the URL preview when applicable.
  - **Feedback area** that can show validation errors (with clipboard button) and format detection info (e.g. “✓ Detected: COMMAND format | Server: filesystem”).
  - **Format toggle button** labelled with the next available display mode (`Show as URL`, `Show as JSON`, etc.) which cycles through supported conversions using `detectConversionCapability` and `convertConfigTo`.

The layout must preserve the three-column grouping from the plugin: simple URL input on top, textarea beneath, and metadata / preview below, all full-width within the section.

---

## 4. Interaction Patterns

### 4.1 Core Interactions

**Server Management:**
- **Enable/Disable**: Toggle server state with immediate MCP manager reinitialization
- **Test Connection**: Async operation with loading state, detailed feedback, and error handling. Button text switches to “Testing…” and a Notice displays success/failure with tool counts pulled from `mcp-use`.
- **Delete Server**: Warning-styled button with immediate removal and settings refresh. Triggers full settings re-render.
- **Server Naming**: Real-time uniqueness validation with visual error states and inline warning copy (`⚠️ Server name must be unique`).

**Quick Add Buttons:**
- **Exa Search**: Adds a disabled server pre-populated with `npx -y exa-mcp-server` JSON config, warns users to set `EXA_API_KEY`, and re-renders the list.
- **Filesystem Server**: Adds a disabled server with the command `npx -y @modelcontextprotocol/server-filesystem /path/to/files` and prompts the user to edit the path before enabling.
- **Notices**: Each quick add fires an Obsidian `Notice` confirming the action and supplying follow-up instructions.

**Add Custom MCP Server:**
- Single button labelled “Add Custom MCP Server” that appends a blank record (`displayMode: 'command'`, `enabled: false`) and forces a full settings re-render.

**Configuration Input:**
- **Multi-format Support**: Seamless switching between URL, Command, and JSON formats using the “Configuration format” cycle button. Only show the toggle when multiple formats are available.
- **Real-time Validation**: Immediate parsing feedback via `parseConfigInput` with errors rendered in a bordered panel and copy-to-clipboard affordance.
- **Format Conversion**: Smart conversion with data preservation warnings handled in code (`convertConfigTo`). Preview and input fields stay synchronized when formats change.
- **Preview Generation**: Live command preview for URL inputs using `remoteUrlToCommand`. Preview text updates on every keystroke and shows helper copy when the URL is invalid.

**Global Settings:**
- **Immediate Persistence**: All changes saved instantly with toast confirmation
- **Input Validation**: Range validation for numeric inputs, visual feedback on errors
- **Conditional Display**: Show/hide related settings based on toggle states
- **Utility Toggle**: “Insert LLM utility section” defaults to enabled and persists independently of parallel execution.

### 4.2 Advanced Interactions

**Format Conversion Strategy:**
- **Smart Conversion**: Preserve maximum data while allowing format flexibility
- **Loss Warnings**: Clear notifications when conversion may lose or modify data
- **User Confirmation**: Required for potentially destructive conversions
- **Rollback Support**: Ability to undo conversion if result is unsatisfactory

**Error Handling & Recovery:**
- **Immediate Save Pattern**: All changes persisted instantly to prevent data loss
- **Toast Notifications**: Non-intrusive feedback for all operations
- **Error Copy Function**: Clipboard access for debugging error messages
- **Graceful Degradation**: System remains functional even with individual server failures
- **Testing Notices**: Use Obsidian `Notice` to surface in-progress and result feedback (success, failure with hints for Docker / env vars).

---

## 5. Data Models & Validation

### 5.1 Core Data Structures

```typescript
interface MCPServerConfig {
  id: string                    // Unique identifier (timestamp-based)
  name: string                  // User-friendly display name (must be unique)
  configInput: string           // Configuration in URL/Command/JSON format
  displayMode: 'simple' | 'command'  // Persisted format (simple = URL view, command = textarea view)
  enabled: boolean              // Server activation state
  failureCount: number          // Health tracking for auto-disable
  autoDisabled: boolean         // Automatic disable state from errors
}

interface GlobalMCPSettings {
  mcpGlobalTimeout?: number     // Tool execution timeout (ms)
  mcpConcurrentLimit?: number   // Max simultaneous executions
  mcpSessionLimit?: number      // Max executions per session (-1 unlimited)
  mcpParallelExecution?: boolean // Enable parallel tool execution
  mcpMaxParallelTools?: number  // Max tools in parallel when enabled
  enableUtilitySection?: boolean // Insert LLM utility sections
}
```

### 5.2 Configuration Input Formats

**URL Format:**
- **Pattern**: `https://mcp.example.com` or `http://localhost:3000`
- **Conversion**: Auto-converts to `mcp-remote` command with appropriate arguments
- **Validation**: Protocol validation, reachability testing, format parsing
- **Preview**: Command preview below the field updates live and explains when URLs are invalid

**Command Format:**
- **Pattern**: Shell commands like `npx -y @modelcontextprotocol/server-memory`
- **Platform Support**: Automatic template adjustment for Windows vs Unix systems
- **Validation**: Command structure validation, package availability checking
- **Sync**: Keeps the URL field in sync via `remoteUrlToCommand` when conversion is lossless

**JSON Format:**
- **Pattern**: Claude Desktop compatible JSON structure
- **Structure**: `{"mcpServers": {"serverName": {"command": "...", "args": [...], "env": {...}}}}`
- **Validation**: JSON parsing, schema validation, required field checking
- **Conversion**: Reuses the conversion helpers to populate the command textarea when possible

> **Note:** The UI cycles through `url → command → json` for display, but only `'simple' | 'command'` persist back to the plugin settings. Ensure conversions keep `configInput` consistent with the selected display.

### 5.3 Validation Rules

**Server Name Validation:**
- **Uniqueness**: Must be unique across all configured servers
- **Characters**: Alphanumeric with hyphens and underscores allowed
- **Length**: 1-50 characters, no leading/trailing whitespace
- **Feedback**: Real-time validation with visual error states

**Configuration Validation:**
- **Format Detection**: Automatic detection of input format type
- **Parsing Validation**: Structure validation for each format type
- **Error Reporting**: Specific, actionable error messages with line numbers
- **Help Suggestions**: Contextual tips for common configuration issues

---

## 6. Visual Design System

### 6.1 Typography & Colors

**Typography:**
- **UI Text**: `var(--font-ui-medium)` for labels, `var(--font-ui-small)` for descriptions
- **Code/Commands**: `var(--font-monospace)` for configuration inputs and previews
- **Status Indicators**: `var(--font-ui-small)` with color coding

**Color Scheme:**
- **Enabled Status**: `var(--text-success)` (green indicators)
- **Disabled Status**: `var(--text-muted)` (gray indicators)
- **Error States**: `var(--text-error)` (red indicators and borders)
- **Focus States**: `var(--interactive-accent)` (blue borders and highlights)
- **Backgrounds**: `var(--background-primary)` and `var(--background-secondary)`

### 6.2 Component Styling

**Input Fields:**
- **Borders**: `1px solid var(--background-modifier-border)`
- **Focus State**: `1px solid var(--interactive-accent)` with subtle shadow
- **Error State**: `1px solid var(--text-error)` with reddish background tint
- **Padding**: `var(--size-2-2)` (6px) for comfortable touch targets

**Buttons:**
- **Primary Actions**: `var(--interactive-accent)` background with white text
- **Secondary Actions**: `var(--interactive-normal)` with standard text
- **Warning Actions**: `var(--text-error)` background for destructive operations
- **Disabled State**: `var(--background-modifier-error-hover)` with muted text

**Status Indicators:**
- **Server Status**: Color-coded text with icon symbols (✓, ✗, ⚠️)
- **Loading States**: Animated spinners or progress indicators
- **Validation States**: Border colors and background changes

---

## 7. Accessibility & Usability

### 7.1 Keyboard Navigation

**Tab Order:**
1. Global settings controls (top to bottom)
2. Server section summaries (for expansion/collapse)
3. Server control buttons (Enable/Disable, Test, Delete)
4. Server name input fields
5. Configuration inputs and format toggles
6. Quick-add buttons
7. Add custom server button

**Keyboard Interactions:**
- **Enter**: Activates buttons, toggles collapsible sections, submits forms
- **Space**: Toggles checkbox and radio button states
- **Escape**: Closes modals, cancels operations, returns focus
- **Arrow Keys**: Navigate between radio buttons and tab groups

### 7.2 Screen Reader Support

**Semantic Structure:**
- **Heading Hierarchy**: Proper nesting of headings for section organization
- **Landmark Roles**: `main`, `section`, `navigation` roles as appropriate
- **ARIA Labels**: Descriptive labels for all interactive elements
- **Live Regions**: `aria-live="polite"` for dynamic content updates

**Alternative Text:**
- **Status Indicators**: Text descriptions for color-coded status information
- **Error Messages**: Clear, actionable error descriptions read aloud
- **Button States**: Current state reflected in button labels (e.g., "Enable Server" vs "Disable Server")

### 7.3 Visual Accessibility

**Color Contrast:**
- **Text Contrast**: Minimum 4.5:1 contrast ratio for normal text
- **Large Text**: Minimum 3:1 contrast ratio for headings and large text
- **Interactive Elements**: Enhanced contrast for buttons and links
- **Status Indicators**: Not color-dependent; include symbols and text

**Focus Management:**
- **Visible Focus**: Clear focus indicators on all interactive elements
- **Focus Trapping**: Within modals and complex interactions
- **Skip Links**: Allow bypassing repetitive navigation

---

## 8. Error Handling & Recovery

### 8.1 Error Classification & Handling

**Generation Errors:**
- **Types**: API failures, rate limits, authentication errors
- **Display**: Toast notifications with specific error messages
- **Recovery**: Retry mechanisms, configuration validation, help links

**MCP Server Errors:**
- **Types**: Connection failures, startup errors, timeout issues
- **Display**: Server status indicators, detailed error modals
- **Recovery**: Automatic retry with exponential backoff, manual test functionality

**Tool Execution Errors:**
- **Types**: Timeout, invalid parameters, server unavailability
- **Display**: Inline error messages, status bar indicators
- **Recovery**: Graceful degradation, error context preservation

### 8.2 Data Loss Prevention

**Immediate Save Pattern:**
- **Frequency**: Save on every input change with debouncing for text fields
- **Validation**: Save only validated data, preserve invalid state for user correction
- **Conflict Resolution**: Last-write-wins with user notification of conflicts

**State Preservation:**
- **UI State**: Maintain expanded/collapsed states during session
- **Form Data**: Preserve unsaved changes during navigation
- **Error Recovery**: Maintain error context across page refreshes

### 8.3 User Communication

**Toast Notifications:**
- **Success**: Brief confirmations for successful operations
- **Warnings**: Non-critical issues that don't block functionality
- **Errors**: Clear, actionable error messages with next steps
- **Duration**: Configurable display duration (2-10 seconds based on type)

**Error Messaging Strategy:**
- **Specificity**: Exact error causes with technical details when helpful
- **Actionability**: Clear next steps for resolution
- **Context**: Error location and relevant configuration values
- **Privacy**: Sanitize error messages to remove sensitive information

---

## 9. Performance Considerations

### 9.1 Rendering Optimization

**Lazy Loading:**
- **Server Sections**: Render server details only when expanded
- **Validation**: Debounce validation for text inputs (300-500ms delay)
- **Preview Generation**: Throttle preview updates during rapid typing

**Memory Management:**
- **Event Listeners**: Proper cleanup of event listeners on component unmount
- **Large Configurations**: Handle large JSON configurations efficiently
- **Error History**: Limit error history to prevent memory leaks

### 9.2 Async Operations

**Non-blocking Operations:**
- **Server Testing**: Asynchronous connection testing with progress indication
- **Validation**: Background validation without blocking UI interactions
- **Save Operations**: Non-blocking save with queuing for rapid changes

**Concurrency Control:**
- **Debouncing**: Prevent excessive API calls during rapid input
- **Cancellation**: Abort ongoing operations when superseded by new requests
- **Queuing**: Queue save operations to prevent data races

---

## 10. Implementation Guidelines

### 10.1 Framework Integration

**Component Architecture:**
- **Modular Design**: Separate components for each major section
- **State Management**: Centralized state with clear update patterns
- **Event Handling**: Consistent event patterns across all interactions

**CSS Architecture:**
- **CSS Variables**: Heavy use of Obsidian's theme variables
- **Component Scoping**: Scoped CSS to prevent conflicts
- **Responsive Design**: Mobile-first approach with progressive enhancement

### 10.2 Testing Strategy

**Unit Testing:**
- **Validation Logic**: Test all validation rules and error conditions
- **Format Conversion**: Test conversion logic between all format types
- **State Management**: Test state updates and side effects

**Integration Testing:**
- **Plugin Integration**: Test integration with existing MCP manager
- **Data Persistence**: Test save/load functionality
- **Error Scenarios**: Test error handling and recovery mechanisms

**User Experience Testing:**
- **Interaction Flows**: Test complete user workflows
- **Accessibility**: Screen reader and keyboard navigation testing
- **Performance**: Test with large numbers of servers and complex configurations

### 10.3 Migration Strategy

**Data Migration:**
- **Backward Compatibility**: Support existing configuration formats
- **Graceful Upgrades**: Automatic migration of legacy configurations
- **Rollback Support**: Ability to revert to previous configuration format

**Feature Rollout:**
- **Progressive Enhancement**: Core functionality first, advanced features later
- **Feature Flags**: Ability to enable/disable advanced features
- **User Communication**: Clear documentation of new features and changes

---

## 11. Success Metrics & Validation

### 11.1 Usability Metrics

**Task Completion Rates:**
- **Server Addition**: >90% success rate for adding new servers
- **Configuration Success**: >85% success rate for valid configuration inputs
- **Error Resolution**: >80% success rate for users resolving common errors

**Time-to-Success:**
- **First Server Setup**: <3 minutes from start to working server
- **Configuration Changes**: <30 seconds for typical configuration updates
- **Error Recovery**: <2 minutes to resolve common configuration issues

### 11.2 Technical Metrics

**Performance Targets:**
- **Initial Render**: <200ms for settings panel to load
- **Interaction Response**: <50ms for UI responses to user input
- **Save Operations**: <100ms for settings persistence

**Error Rate Targets:**
- **Configuration Errors**: <5% of configuration attempts result in unresolvable errors
- **Data Loss**: Zero instances of user data loss due to UI issues
- **System Crashes**: Zero crashes due to settings panel interactions

---

## 12. Future Enhancement Opportunities

### 12.1 Planned Enhancements

**Advanced Server Management:**
- **Server Templates**: Customizable server configuration templates
- **Batch Operations**: Enable/disable/test multiple servers simultaneously
- **Server Groups**: Organize servers into logical groups with shared settings

**Configuration Improvements:**
- **Visual Config Editor**: Drag-and-drop interface for complex configurations
- **Configuration Import/Export**: Share server configurations between instances
- **Version Control**: Track and revert configuration changes over time

### 12.2 Integration Opportunities

**Ecosystem Integration:**
- **Community Templates**: Shared server configurations from the community
- **Auto-discovery**: Automatic detection of MCP servers on local network
- **Cloud Integration**: Integration with cloud-based MCP services

**Advanced Features:**
- **Performance Monitoring**: Built-in performance metrics and optimization suggestions
- **Security Scanning**: Security analysis of server configurations
- **Usage Analytics**: Usage tracking and optimization recommendations

---

## 13. Conclusion

This specification provides a comprehensive blueprint for implementing a modern, accessible, and powerful MCP Server Settings interface. The design maintains the rich functionality of the existing implementation while improving usability through thoughtful organization, progressive disclosure, and comprehensive error handling.

**Key Strengths:**
- Comprehensive feature set with progressive complexity management
- Multi-format configuration support with intelligent conversion
- Robust error handling and user guidance systems
- Full accessibility support and keyboard navigation
- Platform-aware design with cross-platform compatibility

**Implementation Readiness:**
This specification is ready for implementation with clear technical requirements, defined data structures, and detailed interaction patterns. The modular design allows for incremental implementation, starting with core functionality and progressively adding advanced features.

**Success Criteria:**
Implementation success will be measured by improved user task completion rates, reduced configuration errors, and enhanced user satisfaction compared to the existing interface. The comprehensive testing strategy and clear success metrics provide objective measures of implementation quality.

---

**Specification Version**: 1.0
**Last Updated**: 2025-10-17
**Next Review**: 2025-11-17 or as implementation requirements evolve
