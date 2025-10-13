# Status Bar UI Architecture

## Atomic Design Structure

This UI follows **Atomic Design** methodology with clear separation of concerns:

```
📄 Pages (Templates + Content)
   ↓
🏗️ Templates (Component layout structure)
   ↓
🧬 Organisms (Complex components - MCPStatusModal, GenerationStatsModal)
   ↓
🔧 Molecules (Component groups - ServerStatusItem, ErrorLogItem)
   ↓
⚛️ Atoms (Atomic elements - LabelValue, TabList, ParagraphList)
```

## Atomic Elements (`./atoms/`)

The smallest, indivisible UI components that cannot be broken down further:

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

## Components (`./`)

### 🏗️ **Organisms** (Complex Components)
- **GenerationStatsModal**: Statistics display with atomic LabelValueList
- **MCPStatusModal**: Complex modal with atomic TabList, InfoSectionList, ParagraphList
- **ErrorDetailView**: Error display using atomic components

### 🔧 **Molecules** (Component Groups)
- **ErrorLogItem**: Error log entry using atomic InfoSectionList
- **ServerStatusItem**: Server info using atomic InfoSectionList

## Benefits of Atomic Design

1. **🎯 Single Responsibility**: Each atom has one clear purpose
2. **🔄 Reusability**: Atoms can be used across different components
3. **🧪 Testability**: Each atom can be tested in isolation
4. **🎨 Consistency**: All similar UI elements use the same atoms
5. **🔧 Maintainability**: Changes to UI patterns only need to be made in one place
6. **📦 Composability**: Larger components are built from smaller, predictable pieces

## Usage Example

```tsx
// Atomic composition in GenerationStatsModal
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

This atomic approach ensures consistent UI patterns, better maintainability, and follows React best practices for component composition.