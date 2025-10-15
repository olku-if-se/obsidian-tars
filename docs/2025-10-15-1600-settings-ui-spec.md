# MCP Server Settings UI Design Specification

**Document ID**: 2025-10-15-1600-settings-ui-spec
**Status**: Final
**Target**: Obsidian Tars Plugin v2.0
**Author**: Claude Code Agent Collaboration

---

## **Executive Summary**

This document provides a comprehensive UI design specification for the MCP Server Settings interface in the Obsidian Tars plugin. The specification was developed through collaborative analysis between code-to-ui-spec and ui-spec-validator agents, with human clarification on critical requirements.

**Key Decisions:**
- **Template Source**: Hardcoded templates bundled with plugin
- **Community Involvement**: None (maintain quality/security control)
- **Performance vs Features**: Minimalistic approach prioritizing speed and reliability
- **Security Model**: Minimalistic validation focused on preventing obvious mistakes
- **Deployment Strategy**: Major release with clean migration path

---

## **1. Overview & Architecture**

### **1.1 Purpose**
The MCP Server Settings interface provides comprehensive configuration management for Model Context Protocol (MCP) servers within the Obsidian Tars plugin. It supports global execution limits, individual server configuration with multi-format input, real-time validation, and server testing capabilities.

### **1.2 Design Philosophy**
- **Minimalistic**: Essential functionality without unnecessary complexity
- **Reliable**: Robust error handling and data persistence
- **Responsive**: Mobile-first design with touch optimization
- **Accessible**: Screen reader support and keyboard navigation
- **Secure**: Basic validation to prevent common mistakes

### **1.3 Container Hierarchy**
```
MCP Settings Container (collapsible section)
├── Global Settings Section
├── Server List Section
│   ├── Server Section (collapsible, per server)
│   │   ├── Server Controls Row
│   │   ├── Server Name Input
│   │   └── Configuration Section
│   │       ├── Configuration Header
│   │       ├── Configuration Input Area
│   │       ├── Format Toggle Button
│   │       └── Feedback Area
│   └── Empty State (when no servers)
├── Quick Add Section
└── Add Custom Server Section
```

---

## **2. Layout & Spacing System**

### **2.1 Vertical Spacing**
- **Section spacing**: 16px margin between major sections
- **Setting spacing**: Default Obsidian Setting component spacing (~12px)
- **Control spacing**: 8px margin between control buttons
- **Error spacing**: 4px margin-top for error containers
- **Configuration container**: 8px margin-bottom for input elements

### **2.2 Horizontal Spacing**
- **Button groups**: 8px gap between adjacent buttons
- **Label-input alignment**: Standard Obsidian Setting layout with left-aligned labels (~150px width)
- **Status indicators**: 4px margin-left between server name and status

### **2.3 Container Padding**
- **Collapsible section content**: Default Obsidian padding (16px)
- **Configuration container**: No additional padding (inherits from parent)
- **Error containers**: No explicit padding (text styling provides separation)

### **2.4 Alignment Rules**
- **Labels**: Left-aligned, fixed width for consistent alignment
- **Descriptions**: Left-aligned, full width below labels
- **Input controls**: Left-aligned, consistent positioning
- **Status text**: Left-aligned with color coding
- **Error messages**: Left-aligned with warning icon prefix

---

## **3. Component Specifications**

### **3.1 Global Settings Group**

**Purpose**: Configure system-wide MCP execution limits and behavior

**Components**:
- Global timeout input (numeric, ms)
- Concurrent limit input (numeric)
- Session limit input (numeric, -1 for unlimited)
- Parallel execution toggle
- LLM utility section toggle
- Max parallel tools input (numeric, conditional)

**Layout Pattern**: Vertical stack of Obsidian Setting components

**Validation**:
- Timeout: 1000ms - 300000ms (1 second - 5 minutes)
- Concurrent: 1 - 10 executions
- Session: -1 or 1 - 100 executions per document
- Max parallel: 1 - 5 tools (only when parallel execution enabled)

### **3.2 Individual Server Section**

**Purpose**: Configure and manage a single MCP server

**Components**:
- Server summary (header with name and status)
- Control buttons row (Enable/Disable, Test, Delete)
- Server name input with validation
- Multi-format configuration interface
- Status indicators and feedback

**Status Indicators**:
- `✓ Enabled` (green, class: `mcp-status-enabled`)
- `✗ Disabled` (red/orange, class: `mcp-status-disabled`)
- `✗ Error` (red, class: `mcp-status-error`)

**Behaviors**:
- Collapsible sections with independent state
- Real-time status updates reflecting server health
- Unique naming with automatic conflict resolution
- Instant save on critical changes

### **3.3 Configuration Input System**

**Purpose**: Provide flexible input methods for server configuration

**Formats Supported**:
- **URL Format**: HTTP/HTTPS endpoints for remote servers
- **Command Format**: Shell commands with environment variables
- **JSON Format**: Structured Claude Desktop MCP format

**Features**:
- Format toggle button with dynamic availability
- Live validation with inline error display
- Bidirectional format conversion when possible
- Command preview for URL mode

**Input Patterns**:
- URL: `https://mcp.example.com?token=value`
- Command: `npx @modelcontextprotocol/server-memory`
- JSON: `{"mcpServers": {"server-name": {"command": "...", "args": [...]}}}`

---

## **4. Validation Rules**

### **4.1 URL Format Validation**
```typescript
function validateUrlFormat(url: string): string | null {
  if (!url.trim()) return 'URL is required'

  try {
    const parsed = new URL(url.trim())

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return 'URL must use http:// or https:// protocol'
    }

    if (!parsed.hostname) {
      return 'URL must have a valid hostname'
    }

    if (url.length > 2048) {
      return 'URL is too long (max 2048 characters)'
    }

    return null
  } catch (error) {
    return 'Invalid URL format'
  }
}
```

**Requirements**:
- HTTP/HTTPS protocols only
- Valid hostname required
- Maximum 2048 characters
- Standard URL format validation

### **4.2 Command Format Validation**
```typescript
const DANGEROUS_COMMANDS = [
  'rm', 'rmdir', 'mv', 'cp', 'chmod', 'chown',
  'sudo', 'su', 'doas', 'pkexec',
  'systemctl', 'service', 'init',
  'shutdown', 'reboot', 'halt', 'poweroff'
]

function validateCommandFormat(command: string): string | null {
  const trimmed = command.trim()
  if (!trimmed) return 'Command is required'

  const parts = trimmed.split(/\s+/).filter(p => p.length > 0)
  const [baseCommand, ...args] = parts

  if (DANGEROUS_COMMANDS.includes(baseCommand)) {
    return `Dangerous command not allowed: ${baseCommand}`
  }

  if (args.length > 100) {
    return 'Too many arguments (max 100)'
  }

  for (const arg of args) {
    if (arg.length > 1000) {
      return 'Argument too long (max 1000 characters)'
    }
  }

  return null
}
```

**Requirements**:
- No dangerous system commands
- Maximum 100 arguments
- Each argument max 1000 characters
- Basic shell syntax validation

### **4.3 JSON Format Validation**
```typescript
function validateJsonFormat(jsonString: string): string | null {
  if (!jsonString.trim()) return 'JSON configuration is required'

  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    return `Invalid JSON: ${error.message}`
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return 'JSON must be an object'
  }

  // Claude Desktop format validation
  if (parsed.mcpServers) {
    if (typeof parsed.mcpServers !== 'object' || parsed.mcpServers === null) {
      return 'mcpServers must be an object'
    }

    const serverNames = Object.keys(parsed.mcpServers)
    if (serverNames.length === 0) {
      return 'At least one server must be defined in mcpServers'
    }
  }
  // Direct format validation
  else if ('command' in parsed) {
    if (!parsed.command || typeof parsed.command !== 'string') {
      return 'Server configuration must have a command field'
    }
  }
  else {
    return 'JSON must contain either mcpServers object or command field'
  }

  return null
}
```

**Requirements**:
- Valid JSON syntax
- Must contain mcpServers object or command field
- Command field required for direct format
- Basic structure validation

---

## **5. Error Handling & Recovery**

### **5.1 Error Recovery Strategy**

**Progressive Validation**:
- Real-time validation with debounced feedback (500ms)
- Auto-revert to last known good state for critical issues
- Inline error display with specific guidance
- Block saving only for critical validation failures

**Connection Testing Failures**:
- Smart retry with exponential backoff (1s → 2s → 4s)
- User choice at failure threshold (retry/disable)
- Temporary vs permanent failure differentiation
- Detailed error reporting with troubleshooting tips

**Name Conflicts**:
- Intelligent auto-suffix with numeric suffixes
- User override option for manual resolution
- Visual indication of naming conflicts
- Automatic validation on blur

### **5.2 Data Persistence**

**Intelligent Save Strategy**:
```typescript
// Debounced save for non-critical updates (500ms delay)
const debouncedSaveSettings = debounce(async () => {
  await this.saveSettings();
}, 500);

// Immediate save for critical changes
const immediateSaveSettings = async () => {
  await this.saveSettings();
};
```

**Save Classification**:
- **Immediate**: Server enable/disable, deletions, global limits
- **Debounced**: Server names, configuration inputs, format changes
- **Manual**: Bulk imports, advanced settings with validation

**Error Recovery**:
- Retry logic with exponential backoff (max 3 attempts)
- Fallback in-memory storage for failed saves
- User notification with manual save option
- Automatic backup creation before major changes

---

## **6. Connection Testing**

### **6.1 Testing Behavior**

**Progressive Timeouts**:
- **Stdio connections**: 8s → 12s → 16s
- **SSE connections**: 5s → 7.5s → 10s
- Separate from global timeout settings

**Retry Logic**:
- 3 retry attempts with exponential backoff
- 1s → 2s → 4s delays between attempts
- Transient error detection for automatic retry
- Test-specific error classification

**Results Display**:
- **Success**: Latency, tool count, sample tools, version info
- **Failure**: Error type, troubleshooting tips, retry countdown
- **Progress**: Multi-step testing with real-time status
- **History**: Last 5 attempts with performance metrics

### **6.2 Test Isolation**
- Dedicated test clients separate from live operations
- Resource limits for test processes
- Guaranteed cleanup even on failures
- Original server state preservation during tests

---

## **7. Mobile Optimization**

### **7.1 Responsive Design**

**Breakpoints**:
- **Desktop**: > 768px (full layout)
- **Tablet**: 481px - 768px (compressed layout)
- **Mobile**: ≤ 480px (stacked layout)

**Mobile Adaptations**:
```css
@media (max-width: 768px) {
  .settingRow {
    flex-direction: column;
    align-items: stretch;
    gap: var(--size-2-1);
  }

  .settingRow-label {
    margin-bottom: var(--size-1-1);
  }

  .settingRow-control {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .serverCard {
    padding: var(--size-3-2);
    margin-bottom: var(--size-3-1);
  }

  .controlsContainer {
    gap: var(--size-1-1);
  }
}
```

### **7.2 Touch Optimization**

**Touch Targets**:
- Minimum 44x44px for all interactive elements
- Enhanced spacing between touch targets
- Swipe gestures for common actions (test, delete)
- Long press for context menus

**Input Optimization**:
- Smart keyboard types (URL, numeric, text)
- Voice input support for configuration fields
- QR code scanning for URL configuration
- Paste intelligence with auto-formatting

---

## **8. Template System**

### **8.1 Template Library**

**Essential Templates (15 total)**:

**Productivity**:
- Memory Server (knowledge graph)
- Filesystem Server (file operations)
- Exa Search (web search)

**Development**:
- GitHub Server (repository management)
- Git Server (version control)

**Data & Analytics**:
- Postgres Server (database operations)
- SQLite Server (local database)

**AI & Machine Learning**:
- Ollama Server (local LLM)

**System & Utilities**:
- Docker Server (container management)
- System Info Server (system monitoring)

### **8.2 Template Structure**
```typescript
interface MCPServerTemplate {
  id: string
  name: string
  category: string
  description: string
  longDescription: string
  configurations: TemplateConfiguration[]
  useCases: string[]
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  requirements: TemplateRequirements
  documentation: string
}

interface TemplateConfiguration {
  name: string
  command: string
  requirements: string[]
  setupInstructions: string
  envVars?: Record<string, EnvVarConfig>
}
```

**Template Categories**:
- Productivity (essential tools)
- Development (coding utilities)
- Data & Analytics (data processing)
- AI & Machine Learning (AI tools)
- System & Utilities (system management)

### **8.3 Template Management**
- Hardcoded templates bundled with plugin
- Template validation on application
- Setup assistance with step-by-step guidance
- Template search and filtering capabilities

---

## **9. Help Integration**

### **9.1 Progressive Help Disclosure**

**Tier 1: Embedded Help**:
- Field labels with descriptive text
- Inline validation messages with guidance
- Placeholder text with examples
- Icon indicators for complex fields

**Tier 2: Contextual Help**:
- Question mark icons next to complex fields
- Help buttons in major sections
- Keyboard shortcuts (F1, Ctrl+?)
- Automatic help for error conditions

**Tier 3: Documentation Links**:
- Links to comprehensive documentation
- External tutorials and guides
- Community resources and examples
- Troubleshooting guides

### **9.2 Help Content Strategy**

**Essential Topics**:
- MCP server configuration basics
- Format-specific guidance (URL vs Command vs JSON)
- Security best practices
- Common troubleshooting steps
- Template usage instructions

**Content Delivery**:
- Embedded within plugin (no external dependencies)
- Context-sensitive triggers
- Clear, concise explanations
- Actionable guidance

---

## **10. Data Persistence**

### **10.1 Persistence Architecture**

**Intelligent Debounced Saving**:
- 500ms debounce for non-critical changes
- Immediate save for critical changes
- Queue management to prevent concurrent saves
- Conflict resolution for simultaneous changes

**Save Operation Classification**:
```typescript
const saveOperations = {
  immediate: [
    'server.enable',
    'server.disable',
    'server.delete',
    'global.limits.change'
  ],
  debounced: [
    'server.name.change',
    'server.config.change',
    'server.format.change'
  ],
  manual: [
    'bulk.import',
    'settings.reset',
    'advanced.config.change'
  ]
}
```

### **10.2 Performance Optimization**

**Memory Management**:
- Pending changes tracking with Map structure
- Save queue with Promise chaining
- Efficient change detection and batching
- Memory usage monitoring

**I/O Optimization**:
- Non-blocking save operations
- Compressed settings storage
- Incremental save for large configurations
- Background save processing

---

## **11. Accessibility**

### **11.1 Keyboard Navigation**

**Tab Order**:
- Logical progression through form controls
- Proper focus management in collapsible sections
- Keyboard shortcuts for common actions
- Focus trapping in modal dialogs

**Keyboard Shortcuts**:
- `Tab`/`Shift+Tab`: Navigate between fields
- `Enter`: Confirm actions, toggle settings
- `Space`: Toggle checkboxes, expand/collapse sections
- `Escape`: Cancel operations, close dialogs
- `F1`/`Ctrl+?`: Open help

### **11.2 Screen Reader Support**

**ARIA Implementation**:
- Proper label/input associations
- Dynamic content change announcements
- Error message associations with form controls
- Status indicators with appropriate roles

**Semantic Structure**:
- Proper heading hierarchy
- List structures for server collections
- Form labels and descriptions
- Live regions for dynamic updates

### **11.3 Visual Accessibility**

**Color & Contrast**:
- Sufficient contrast ratios (4.5:1 minimum)
- Error indication not solely dependent on color
- Focus indicators for keyboard navigation
- Respect system color preferences

**Typography**:
- Respect system font size preferences
- Clear, readable fonts
- Adequate spacing between text elements
- Consistent text sizing hierarchy

---

## **12. Implementation Roadmap**

### **12.1 Phase 1: Core Foundation (2-3 weeks)**

**Priority 1 - Essential Components**:
1. **Configuration Input Interface**
   - Multi-format input component (URL/Command/JSON)
   - Real-time validation with inline feedback
   - Format toggle with dynamic availability
   - Basic error handling and recovery

2. **Enhanced Validation Engine**
   - URL format validation
   - Command safety checking
   - JSON syntax validation
   - Cross-format compatibility

3. **Intelligent Data Persistence**
   - Debounced save implementation
   - Critical vs non-critical change classification
   - Basic error recovery and retry logic
   - Conflict resolution

4. **Connection Testing UI**
   - Enhanced test button with loading states
   - Basic retry logic with exponential backoff
   - Improved error messages and feedback
   - Test result display

### **12.2 Phase 2: Essential Polish (1-2 weeks)**

**Priority 2 - User Experience**:
1. **Mobile Responsiveness**
   - Touch target optimization (44x44px minimum)
   - Responsive layout for tablets and phones
   - Swipe gestures for common actions
   - Smart keyboard types

2. **Error Handling Enhancement**
   - Comprehensive error recovery strategies
   - Clear error messages with guidance
   - Auto-revert functionality for critical issues
   - User-friendly error notifications

3. **Help System Integration**
   - Basic tooltips and inline help
   - Context-sensitive help triggers
   - Links to documentation
   - Progressive help disclosure

4. **Template System Foundation**
   - 15 essential hardcoded templates
   - Template validation and setup assistance
   - Basic template search and filtering
   - Template application workflow

### **12.3 Phase 3: Release Preparation (1 week)**

**Priority 3 - Final Polish**:
1. **Performance Optimization**
   - Remove unnecessary complexity
   - Optimize for large server lists
   - Memory usage optimization
   - Save operation performance tuning

2. **Security Review**
   - Validate minimal security measures
   - Review command validation rules
   - Test input sanitization
   - Security audit of validation system

3. **Testing & Quality Assurance**
   - Comprehensive testing of core workflows
   - Mobile device testing
   - Accessibility testing
   - Performance benchmarking

4. **Documentation**
   - Clear setup instructions
   - Usage documentation
   - Troubleshooting guide
   - Migration guide for v2.0

---

## **13. Technical Specifications**

### **13.1 Component Interfaces**

**Core Components**:
```typescript
interface MCPServerSettingsProps {
  servers: MCPServerConfig[]
  globalSettings: GlobalSettings
  onServerChange: (server: MCPServerConfig) => void
  onGlobalSettingsChange: (settings: GlobalSettings) => void
  onServerAdd: (template?: MCPServerTemplate) => void
  onServerDelete: (serverId: string) => void
  onServerTest: (serverId: string) => Promise<TestResult>
}

interface ConfigurationInputProps {
  config: MCPServerConfig
  onConfigChange: (config: string) => void
  validation: ValidationResult
  disabled?: boolean
}
```

**Data Models**:
```typescript
interface MCPServerConfig {
  id: string
  name: string
  configInput: string
  displayMode: 'command' | 'json' | 'url'
  enabled: boolean
  failureCount: number
  autoDisabled: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  formatCompatibility: {
    canShowAsCommand: boolean
    canShowAsJson: boolean
    canShowAsUrl: boolean
  }
}
```

### **13.2 State Management**

**Component State**:
```typescript
interface MCPServerSettingsState {
  servers: MCPServerConfig[]
  globalSettings: GlobalSettings
  pendingChanges: Map<string, any>
  isSaving: boolean
  saveError: string | null
  testingServers: Set<string>
  expandedSections: Set<string>
}
```

**Event Handling**:
```typescript
interface ServerEvents {
  serverNameChange: (serverId: string, name: string) => void
  serverConfigChange: (serverId: string, config: string) => void
  serverToggle: (serverId: string, enabled: boolean) => void
  serverTest: (serverId: string) => Promise<void>
  serverDelete: (serverId: string) => void
  globalSettingsChange: (settings: Partial<GlobalSettings>) => void
}
```

### **13.3 Performance Requirements**

**Response Times**:
- Field validation: < 100ms
- Format conversion: < 200ms
- Save operation: < 50ms immediate, < 200ms debounced
- Connection test initiation: < 100ms

**Memory Usage**:
- Base component: < 5MB
- Per server: < 500KB
- Template cache: < 2MB
- Validation cache: < 1MB

**Concurrency**:
- Maximum concurrent saves: 1
- Maximum concurrent tests: 3
- Maximum pending changes: 50
- Maximum servers per user: 25

---

## **14. Security Considerations**

### **14.1 Minimal Security Model**

**Input Validation**:
- URL protocol validation (HTTP/HTTPS only)
- Command blacklist for dangerous system operations
- JSON syntax validation with size limits
- Basic SQL injection prevention

**Data Protection**:
- No automatic execution of user commands
- Sandboxed validation environment
- Secure storage of sensitive configuration
- No transmission of credentials without encryption

### **14.2 Threat Mitigation**

**Command Injection**:
- Blacklist dangerous commands
- Argument validation and sanitization
- Environment variable validation
- No shell command execution in UI

**Data Corruption**:
- Atomic save operations
- Backup creation before major changes
- Validation rollback on failure
- Data integrity checks

**Information Disclosure**:
- No sensitive data in error messages
- Secure logging practices
- No credential exposure in validation
- Safe error message display

---

## **15. Success Metrics**

### **15.1 User Experience Metrics**

**Usability Targets**:
- Time to add first server: < 2 minutes
- Time to configure server: < 5 minutes
- Connection test success rate: > 90%
- User error rate: < 5%

**Performance Targets**:
- Page load time: < 1 second
- Validation response: < 100ms
- Save operation: < 50ms
- Connection test: < 30 seconds

**Accessibility Targets**:
- WCAG 2.1 AA compliance
- Keyboard navigation support: 100%
- Screen reader compatibility: 95%
- Color contrast compliance: 100%

### **15.2 Technical Metrics**

**Reliability Targets**:
- Save success rate: > 99.9%
- Validation accuracy: > 99%
- Error recovery success: > 95%
- System stability: 99.9% uptime

**Performance Targets**:
- Memory usage: < 50MB total
- CPU usage: < 5% during operations
- Network usage: Minimal (only for testing)
- Storage efficiency: < 1MB for 25 servers

---

## **16. Migration Strategy**

### **16.1 Major Release Approach**

**Clean Migration Path**:
- Automatic detection of legacy settings format
- Seamless upgrade without user intervention
- Backup creation before migration
- Rollback capability if migration fails

**Data Compatibility**:
- Legacy server configuration conversion
- Global settings migration with defaults
- Template system integration
- Validation rule updates

### **16.2 User Communication**

**Release Notes**:
- Clear explanation of new features
- Migration timeline and process
- Benefits of the upgrade
- Troubleshooting guide

**In-App Notifications**:
- Welcome message for v2.0 features
- Guided tour of new interface
- Template introduction
- Help system overview

---

## **17. Conclusion**

This comprehensive specification provides a solid foundation for implementing a modern, user-friendly MCP Server Settings interface. The minimalistic approach prioritizes essential functionality while maintaining high standards for usability, accessibility, and performance.

### **Key Success Factors**:
1. **Start with configuration input interface** - core component foundation
2. **Implement intelligent data persistence early** - prevents user frustration
3. **Focus on validation engine** - security and reliability paramount
4. **Mobile optimization essential** - significant Obsidian mobile usage
5. **Maintain minimalistic approach** - avoid unnecessary complexity

### **Implementation Readiness**:
- ✅ Comprehensive technical specifications
- ✅ Clear component interfaces and data models
- ✅ Detailed implementation roadmap with phases
- ✅ Performance and accessibility requirements
- ✅ Security considerations and migration strategy

The specification is ready for immediate implementation with a clear path from Phase 1 foundation through to production release.

---

**Document Control**:
- **Version**: 1.0 (Final)
- **Date**: 2025-10-15
- **Status**: Ready for Implementation
- **Next Review**: Post-Phase 1 Implementation