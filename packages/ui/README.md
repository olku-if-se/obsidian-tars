# @tars/ui

UI component library for Obsidian TARS plugin built with React 19 and Storybook.

## Overview

This package provides reusable React components with Obsidian-compatible styling and theming. It's designed to work seamlessly with Obsidian's design system while providing modern React patterns.

## Getting Started

### Development

```bash
# Install dependencies
pnpm install

# Start Storybook for component development
pnpm run storybook

# Run tests
pnpm run test

# Build the package
pnpm run build
```

### Storybook

Storybook runs on `http://localhost:6006` and provides:

- **Component Playground**: Interactive component exploration
- **Visual Testing**: See components in different states
- **Documentation**: Auto-generated component docs
- **Theme Support**: Light/dark Obsidian themes

## Architecture

### Component Structure

```
src/components/
├── Button.tsx          # Basic button component
├── Button.module.css   # Scoped CSS modules
├── Input.tsx           # Form input component
├── Input.module.css    # Scoped CSS modules
└── index.ts           # Component exports
```

### Styling Strategy

- **CSS Modules**: Scoped styles with `.module.css` files
- **Obsidian Variables**: Uses Obsidian's CSS custom properties
- **Theme Support**: Automatic light/dark theme switching
- **Fallback Values**: Graceful degradation for non-Obsidian environments

### Testing

- **Vitest**: Fast unit testing with JSDOM
- **React Testing Library**: Component interaction testing
- **Visual Testing**: Storybook screenshots for regression testing

## Component API

### Button

```tsx
import { Button } from '@tars/ui';

<Button variant="primary" size="lg" onClick={handleClick}>
  Click me
</Button>
```

**Props:**
- `variant?: 'default' | 'danger' | 'primary'`
- `size?: 'sm' | 'md' | 'lg'`
- `disabled?: boolean`
- All standard button HTML attributes

### Input

```tsx
import { Input } from '@tars/ui';

<Input
  label="Username"
  placeholder="Enter username"
  error={errors.username}
/>
```

**Props:**
- `label?: string`
- `error?: string`
- `size?: 'sm' | 'md' | 'lg'`
- All standard input HTML attributes

## Integration with Obsidian Plugin

This package is designed to be used alongside the main Obsidian TARS plugin. Components will be gradually migrated from the vanilla DOM implementation to React components.

### Bridge Pattern

Components are integrated via a React bridge that mounts React components into Obsidian's DOM:

```tsx
// In the plugin
import { ReactBridge } from './bridge/ReactBridge';
import { SettingsTab } from '@tars/ui';

const bridge = new ReactBridge(app);
bridge.mount(containerEl, SettingsTab, { plugin: this });
```

## Migration Strategy

This package supports the gradual migration from vanilla DOM manipulation to React:

1. **Phase 0**: Foundation setup (this package)
2. **Phase 1**: Shared components (Button, Input, etc.)
3. **Phase 2**: Settings components
4. **Phase 3**: Modal components
5. **Phase 4**: Status bar components

Each component maintains feature parity with the original implementation while providing improved developer experience.

## Contributing

### Adding New Components

1. Create component in `src/components/`
2. Add CSS modules in `src/components/[Component].module.css`
3. Export from `src/components/index.ts`
4. Create Storybook stories in `stories/`
5. Add unit tests
6. Update this README

### Storybook Stories

All components should have comprehensive Storybook stories covering:
- Default state
- All variants and sizes
- Loading/disabled states
- Error states
- Interactive examples

## Publishing

This is a private package within the TARS monorepo. It's not published to npm but consumed by the main plugin package.

```json
// In packages/plugin/package.json
{
  "dependencies": {
    "@tars/ui": "workspace:*"
  }
}
```
