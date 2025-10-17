# UI Architecture

## Component Structure

This UI follows a **simplified atomic design** approach with clear separation of concerns:

```
📄 Views (Complete user-facing interfaces)
   ↓
🧬 Components (Bigger UI elements with logic, composable)
   ↓
⚛️ Atoms (Shared building blocks - Button, Input, LabelValue)
```

## Atoms (`./atoms/`)

The smallest, reusable UI building blocks that can be composed together:

### 🏷️ **LabelValue** & **LabelValueList**
- **Purpose**: Renders semantic label-value pairs
- **Use Case**: Stats displays, forms, key-value information
- **Atomic Property**: Cannot be split into smaller meaningful parts

### 📄 **InfoSection** & **InfoSectionList**
- **Purpose**: Groups related information items
- **Use Case**: Server info panels, status metadata
- **Atomic Property**: Represents single semantic grouping

### 🔀 **ConditionalList**
- **Purpose**: Conditionally renders items based on data
- **Use Case**: Dynamic UI elements, status-dependent content
- **Atomic Property**: Smallest conditional rendering unit

### 📑 **TabList**
- **Purpose**: Interactive tab navigation
- **Use Case**: Modal tabs, navigation interfaces
- **Atomic Property**: Smallest interactive navigation unit

### 📝 **ParagraphList**
- **Purpose**: Lists textual content
- **Use Case**: Descriptions, summaries, documentation
- **Atomic Property**: Smallest text unit

## Components (`./components/`)

### 🧬 **Components** (Bigger UI elements with logic)
- **GenerationStatsModal**: Statistics display with composable LabelValueList
- **MCPStatusModal**: Complex modal with composable TabList, InfoSectionList
- **ErrorDetailView**: Error display using atomic components
- **ToolBrowserModal**: Interactive tool selection and parameter generation
- **ProviderSettings**: Provider configuration with validation and testing

## Views (`./views/`)

### 📄 **Views** (Complete user-facing interfaces)
- **SettingsTab**: Complete settings interface with tabs and forms
- **StatusBar**: Status display with interactive elements
- **TabComponents**: Reusable tab components that can be used in different contexts

## Benefits of this Approach

1. **🎯 Single Responsibility**: Each component has one clear purpose
2. **🔄 Reusability**: Atoms can be used across different components and views
3. **🧪 Testability**: Each component can be tested in isolation
4. **🎨 Consistency**: All similar UI elements use the same atoms
5. **🔧 Maintainability**: Changes to UI patterns only need to be made in one place
6. **📦 Composability**: Larger components are built from smaller, predictable pieces
7. **🔄 Flexibility**: Views can be reused in different UI contexts (like Tab components)

## Rules To apply during development

1. Never attach inline style; rely on className + scoped CSS for customization.
2. Use clsx whenever multiple CSS classes need to be combined.
3. When a component needs more than five props, bundle them into a well-named object. Keep data props and UI-state props separate. Reserve event handlers (on*), className, key, ref, and index for direct props. UI-state values should initialize internal state only.
4. Ship a Storybook story for every component.
5. Prefer existing Atom components—even if they need small upgrades—before creating new elements.
6. Externalize every user-visible string into a strings helper to keep components i18n-ready.
7. Define sensible defaults so components work with partial prop sets.
8. Scope CSS to the component; avoid global styles.
9. Introduce TypeScript aliases when generics hurt readability.
10. Let components manage their own state. If the parent must stay in sync, expose an onChange(oldState, newState) callback and fire it on each state update.

```tsx
const props = {
  /* many properties */   
}

<LabelValueList className={clsx(styles.labelValueList, props.className)} 
  onClick={clickHandler} 
  {...props} />
```

## Usage Example

```tsx
// Component composition in GenerationStatsModal
const statsRows = [
  { label: 'Round:', value: stats.round.toString() },
  { label: 'Model:', value: stats.model },
  // ... data-driven configuration
]

<LabelValueList
  rows={statsRows}
  rowClassName={styles.statRow}
  labelClassName={styles.statLabel}
  valueClassName={styles.statValue}
/>
```

This simplified approach ensures consistent UI patterns, better maintainability, maximum reusability, and follows React best practices for component composition.