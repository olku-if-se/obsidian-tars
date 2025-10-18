# Providers Package Test Organization

This document outlines the reorganized test structure for the `@tars/providers` package, following the principle of "one subject of testing per file" and clear separation of concerns.

## Test Structure Overview

```
tests/
├── infrastructure/           # Low-value infrastructure and build tests
│   └── package-structure.test.ts
├── unit/                     # Unit tests for individual components
│   ├── mcp/                 # MCP-related unit tests
│   │   ├── mcp-integration-helper.test.ts
│   │   ├── mcp-tool-injector.test.ts
│   │   └── gemini-tool-converter.test.ts
│   └── providers/           # Provider-specific unit tests
│       └── (future provider unit tests)
├── integration/              # Integration tests for component interaction
│   ├── mcp/                 # MCP integration tests
│   │   ├── mcp-injection-e2e.test.ts
│   │   ├── mcp-format-compliance.test.ts
│   │   └── mcp-schema-validation.test.ts
│   └── providers/           # Provider integration tests
│       ├── deepseek-integration.test.ts
│       ├── siliconflow-integration.test.ts
│       ├── grok-integration.test.ts
│       └── gemini-integration.test.ts
├── mocks/                    # Mock infrastructure
│   ├── mcp-infrastructure-mocks.ts
│   └── obsidian.ts
└── MCP_TOOL_INJECTION_TDD_SPEC.md
```

## Test Categories and Value Assessment

### Infrastructure Tests (Low Business Value)
**Location**: `tests/infrastructure/`

These tests validate build system and package structure but don't test business functionality:
- `package-structure.test.ts` - Validates package.json, file structure, exports

**Metadata**: Marked with `test.meta({ type: 'infrastructure', value: 'low' })`

### Unit Tests (High Business Value)
**Location**: `tests/unit/`

These tests test individual components in isolation:

#### MCP Unit Tests
- `mcp-integration-helper.test.ts` - MCP integration helper utilities
- `mcp-tool-injector.test.ts` - Core MCP tool injection logic
- `gemini-tool-converter.test.ts` - Gemini-specific format conversion

**Metadata**: TypeScript compliance tests marked with `test.meta({ type: 'typescript-compliance', value: 'low' })`

### Integration Tests (High Business Value)
**Location**: `tests/integration/`

These tests test component interaction and end-to-end flows:

#### MCP Integration Tests
- `mcp-injection-e2e.test.ts` - End-to-end MCP injection flow
- `mcp-format-compliance.test.ts` - Provider-specific format compliance
- `mcp-schema-validation.test.ts` - Schema validation and sanitization

#### Provider Integration Tests
- `deepseek-integration.test.ts` - DeepSeek provider MCP integration
- `siliconflow-integration.test.ts` - SiliconFlow provider MCP integration
- `grok-integration.test.ts` - Grok provider MCP integration
- `gemini-integration.test.ts` - Gemini provider MCP integration

## File Organization Principles

### 1. Single Responsibility Per File
Each test file focuses on a single subject:
- **Provider-specific tests** are in dedicated files (`deepseek-integration.test.ts`)
- **MCP functionality** is split by concern (`e2e`, `format-compliance`, `schema-validation`)
- **Infrastructure concerns** are isolated from business logic tests

### 2. Clear Test Hierarchy
- **Infrastructure** → Build system validation (low value)
- **Unit** → Component logic (high value)
- **Integration** → Component interaction (high value)

### 3. Metadata-Based Test Classification
Tests are categorized using Vitest metadata:
- `type: 'infrastructure', value: 'low'` - Build system tests
- `type: 'typescript-compliance', value: 'low'` - Interface compliance tests
- No metadata → Business value tests (default)

## Testing Philosophy

### TDD Approach
The codebase follows Test-Driven Development:
- Tests are written before implementations
- Tests initially fail and drive implementation
- Comprehensive test coverage for critical functionality

### Mock Strategy
- External APIs (OpenAI, Anthropic, Google AI) are mocked
- Obsidian plugin interfaces are mocked
- MCP infrastructure components are mocked
- Mocks are centralized in `tests/mocks/`

### Error Handling Focus
- Extensive testing of error scenarios
- Graceful degradation verification
- Resilience testing for MCP failures

## Running Tests

### All Tests
```bash
pnpm test
```

### Specific Categories

#### Infrastructure Tests (Low Value)
```bash
pnpm test -- tests/infrastructure/
```

#### Unit Tests
```bash
pnpm test -- tests/unit/
```

#### Integration Tests
```bash
pnpm test -- tests/integration/
```

#### Provider-Specific Tests
```bash
pnpm test -- tests/integration/providers/deepseek-integration.test.ts
```

#### MCP-Specific Tests
```bash
pnpm test -- tests/integration/mcp/
```

### Filtering by Metadata

#### Exclude Low-Value Tests
```bash
# Run only high-value tests (exclude infrastructure and compliance tests)
pnpm test --exclude="infrastructure" --exclude="typescript-compliance"
```

#### Run Only High-Value Tests
```bash
# Using grep to filter out low-value test patterns
pnpm test | grep -v "infrastructure\|typescript-compliance"
```

## Migration Notes

### What Was Split
- `integration/mcp-tool-injection-concrete.test.ts` (1,117 lines) → 3 focused files:
  - `mcp-injection-e2e.test.ts` - End-to-end flow
  - `mcp-format-compliance.test.ts` - Format validation
  - `mcp-schema-validation.test.ts` - Schema validation

- `provider-integration.test.ts` (423 lines) → 4 provider-specific files:
  - `deepseek-integration.test.ts`
  - `siliconflow-integration.test.ts`
  - `grok-integration.test.ts`
  - `gemini-integration.test.ts`

- `unit/basic.test.ts` → `infrastructure/package-structure.test.ts` (moved and marked as low value)

### What Was Added
- Metadata markers for low-value tests
- Provider-specific test isolation
- Clear separation of concerns
- Comprehensive documentation

## Benefits of New Organization

1. **Improved Maintainability**: Smaller, focused files are easier to understand and modify
2. **Better Test Coverage**: Clear separation ensures comprehensive testing of each concern
3. **Faster Test Execution**: Selective test running based on functionality
4. **Enhanced Readability**: Test files clearly indicate their purpose and scope
5. **Easier Debugging**: Isolated tests make it easier to identify and fix issues
6. **Value Clarity**: Metadata clearly marks low-value infrastructure tests

## Future Improvements

1. **Unit Test Expansion**: Add more provider-specific unit tests in `tests/unit/providers/`
2. **Performance Testing**: Add performance benchmarks for critical paths
3. **Contract Testing**: Add API contract tests for provider integrations
4. **Visual Regression**: Add UI testing for any visual components
5. **Mutation Testing**: Add mutation testing to verify test quality