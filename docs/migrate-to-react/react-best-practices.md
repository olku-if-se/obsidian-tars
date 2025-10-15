# TypeScript React Component Development Best Practices Checklist

A verification guide for TypeScript React components with concrete, actionable rules to prevent common issues.

## TypeScript Typing Rules

**Props Declaration:**
- Use `type` for component props in applications to prevent accidental extension via declaration merging, otherwise consumers can modify your props unexpectedly causing encapsulation breaks
- Use `interface` only when building library APIs where consumers need to extend types via module augmentation
- Name prop types as `ComponentNameProps` (never just `Props`) to avoid namespace collisions in large codebases, otherwise multiple `Props` types cause shadowing errors
- Use discriminated unions when props have dependencies (e.g., either `href` OR `onClick`) to enforce valid combinations at compile time, otherwise invalid prop combinations cause runtime errors
- Mark 80%+ of props as required and use `?` sparingly to maintain clear component contracts, otherwise unclear API expectations confuse developers
 - When extending intrinsic element props (e.g., `ComponentPropsWithoutRef<'details'>`), avoid name collisions with native attributes (like `title`, `onToggle`). Prefer `Omit<...,'conflictingKey'>` and define your own prop (e.g., `heading`), or keep the name but omit the native key: `extends Omit<ComponentPropsWithoutRef<'details'>, 'title' | 'onToggle'>`

**Component Functions:**
- Never use `React.FC` by default when writing components to avoid implicit children typing issues, otherwise pre-React 18 apps accept children on all components even when not intended
- Use explicit function syntax `const App = ({ props }: Props) => JSX` to get proper type inference, otherwise TypeScript won't catch incorrect return types like accidental `undefined` returns
- Annotate return type as `JSX.Element | null` when components conditionally render to catch premature returns, otherwise silent bugs with `undefined` returns slip through

**Children Props:**
- Use `React.ReactNode` type for flexible children to accept all valid React content, otherwise strings/numbers/fragments are incorrectly rejected when using restrictive types like `JSX.Element`
- Use `PropsWithChildren<T>` helper to avoid repetitive children declarations
- Never try to restrict children to specific JSX element types in TypeScript—it's impossible and requires runtime validation

**Event Handlers:**
- Let TypeScript infer inline handler types `onClick={(e) => ...}` to minimize boilerplate
- Explicitly type extracted handlers with `React.EventType<HTMLElement>` (e.g., `React.ChangeEvent<HTMLInputElement>`) to prevent `any` types, otherwise event parameters lose type safety causing runtime errors
- Access `event.currentTarget` instead of `event.target` for guaranteed typing, otherwise `target` is generic `EventTarget` with no element-specific properties like `.value`
 - For elements that manage their own state (e.g., `<details>`), read truth from the element (`e.currentTarget.open`) rather than computing `!prev` in handlers; this prevents desync with native toggling

**Event Handler Design (Library Components):**
- Do not await consumer callbacks inside component event handlers—fire `onXxx` synchronously and let consumers handle async work; awaiting creates race conditions and UI rollbacks when multiple events fire quickly
- Never “revert” component state in a `catch` of a consumer callback; library components should not undo user intent due to consumer errors—surface errors via boundaries or consumer logic instead
- For controlled/uncontrolled patterns, expose `value`/`open` and `defaultValue`/`defaultOpen` plus `onChange`/`onToggle`; update internal state only in uncontrolled mode
- If native elements emit state (e.g., `<details>`), either prevent default and control state yourself via click handlers, or read truth from `event.currentTarget` (e.g., `event.currentTarget.open`)—avoid computing next state as `!prev` when DOM can toggle separately
- For async gating (approve/deny before changing), intercept the event (`preventDefault()`), run the async check, and then update the controlled state and notify when allowed; do not rely on native toggling

## Accessibility

- Static/semantic elements should not be made interactive with click/keyboard handlers. Prefer native interactive semantics or add proper roles and keyboard handling. For `<summary>`, avoid custom `onClick` and rely on the parent `<details>` `onToggle` to reflect state changes cleanly. Mark purely decorative icons (e.g., chevrons/arrows) with `aria-hidden="true"`.

**Refs:**
- Provide specific element type to `useRef` with null initialization `useRef<HTMLDivElement>(null)` to enable proper `.current` typing, otherwise TypeScript can't infer element methods
- Always null-check refs before accessing `.current` to prevent runtime "Cannot read property of null" errors
- Use `forwardRef<RefType, PropsType>` with ref type first when forwarding refs (order is ref first despite props parameter coming first!)
- Extract ref type with `ElementRef<typeof Component>` when typing parent refs, otherwise `typeof Component` gives function type not ref type

**Common TypeScript Mistakes:**
- Never use `any` type—use `unknown` with type guards to maintain type safety
- Never use non-null assertion operator `!` to bypass type checking—use proper null checks or optional chaining, otherwise runtime crashes occur
- Use `as const` on custom hook tuple returns to preserve tuple type, otherwise destructured values become union arrays losing positional type information
- Use discriminated unions for complex state with variants to make impossible states unrepresentable, otherwise optional fields allow invalid combinations like both `data` and `error`

## Component Architecture & Organization

**Props Organization (Order in Interfaces):**
1. Required data props (primitives, objects)
2. Optional data props (with `?`)
3. UI state props (visibility, loading, disabled)
4. Event handlers (callbacks starting with `on`)
5. Children (React.ReactNode, last)

Apply this order to reduce cognitive load and make dependencies immediately clear—otherwise mixed ordering obscures required props

**File Structure Order:**
1. External imports (React, libraries)
2. Internal imports (components, hooks, utilities)
3. Type/interface definitions
4. Constants
5. Component implementation
6. Export statement

**Functional Component Internal Order:**
1. All hooks (useState, useEffect, custom hooks)
2. Event handlers
3. Helper functions
4. Effects (useEffect calls)
5. Render logic variables
6. Return JSX

**Naming Conventions:**
- Data props: descriptive nouns (`user`, `items`, `title`)
- Boolean props: `is/has/should/can/will` prefix (`isActive`, `hasError`, `shouldRender`)
- Event handler props: `on` prefix + PascalCase (`onClick`, `onSubmit`)
- Event handler functions: `handle` prefix + PascalCase (`handleClick`, `handleSubmit`)
- Never use DOM prop names (`style`, `className`, `onClick`) for different purposes—people expect these to mean one specific thing

**Component Splitting Rules:**
- Split when experiencing real problems, NOT before: performance issues, code reuse needs, testing difficulties, merge conflicts
- Consider splitting when component exceeds 250-300 lines, has 10-15+ pieces of state, or JSX return exceeds 100 lines
- Extract component only when: parent is simpler using child, child isn't complicated by parent, child is useful independently, parent isn't useful without child
- Split for state isolation when internal state is irrelevant to parent to prevent unnecessary re-renders

**Composition Over Prop Drilling:**
- Use component composition when props pass through 3+ levels unchanged to eliminate prop drilling, otherwise intermediate components become unnecessarily complex
- Pass components as children/props directly to bypass intermediate layers
- Prefer container/presentational pattern: containers manage state and logic, presentational components receive props and handle UI only

## Performance & Re-rendering Rules

**Core Re-rendering Causes:**
- Parent re-renders trigger ALL child re-renders by default regardless of props—this is the #1 cause of performance issues
- State changes are the ONLY way components initiate their own re-render
- Context value changes trigger ALL consuming components to re-render, even if they use different parts of data
- Props changes alone DON'T cause re-renders—if props changed, parent already re-rendered

**React.memo Rules:**
- Use `React.memo` ONLY when ALL props are primitive or memoized, otherwise memo fails on every render due to new prop references wasting computation
- React.memo checks referential equality using `Object.is()`: new object/array/function = new reference = re-render despite memo
- Never wrap component with inline object/array/function props like `<Memo onClick={() => {}} />` because new function every render breaks memo
- Don't memo everything—simple components cost more to memo than to re-render; profile first

**useMemo/useCallback Rules:**
- Use `useMemo`/`useCallback` ONLY when passing props to memoized children, otherwise they add overhead without benefit
- Wrap event handlers in `useCallback` when passing to React.memo components to prevent new function references breaking memo
- Use `useMemo` for objects/arrays in dependency arrays to prevent effects running every render due to new references
- Never use useMemo/useCallback without React.memo on receiving component—it wastes resources

**Composition Patterns for Performance:**
- Move state down to smallest possible component to limit re-render scope when state changes
- Use children as props pattern: `<Wrapper>{expensive}</Wrapper>` where expensive children are created outside Wrapper—children won't re-render when Wrapper state changes because props don't re-render if unchanged
- Pass components as props to stateful wrappers to prevent cascade re-renders

**Critical Anti-Patterns:**
- NEVER create components inside render—causes re-mount (destroys + recreates) on every render resulting in state resets, focus loss, and severe performance issues
- NEVER use random values as keys like `key={Math.random()}`—forces re-mount causing state resets and poor performance
- NEVER create inline object/array props when child is memoized—breaks all memoization: extract to constant outside component

**Infinite Loop Prevention:**
- Always provide dependency array to `useEffect` to prevent running after every render, otherwise state updates in effects cause infinite loops
- Never update state during render (setState called in function body)—causes immediate re-render triggering infinite loop with "Maximum update depth exceeded" error
- Never put objects in dependency arrays without `useMemo`—new object every render means effect always runs, if effect updates state = infinite loop
- Wrap functions in `useCallback` when used in dependency arrays, otherwise new function every render triggers effects infinitely
- Never use `onClick={handler()}` pattern—calls immediately during render potentially updating state causing infinite loop; use `onClick={() => handler()}` or `onClick={handler}`

**Dependency Array Rules:**
- Include ALL reactive values (props, state, variables from component scope) in dependency arrays, otherwise stale closures cause bugs using old values
- Don't include setState functions, useRef.current, or module-level constants—these are stable and don't trigger re-renders
- Use primitive values from objects (`[user.id]`) instead of full objects (`[user]`) in dependencies to prevent running when values haven't actually changed
- Empty array `[]` means run once on mount—won't run again even if data changes, causing stale closures if effect uses component values

**Key Prop Rules:**
- Keys must be unique among siblings (not globally) and stable across renders, otherwise React updates wrong elements
- Use database IDs or stable identifiers, never `Math.random()` or `Date.now()`—changing keys force re-mount causing state resets
- Array index as key is ONLY acceptable for static lists—for dynamic lists (add/remove/reorder), index causes React to update wrong elements and all items after change to re-render
- Place key on element returned from `.map()`, not on internal elements—key is consumed by React, not passed as prop

**State Update Batching:**
- React batches multiple setState calls in event handlers into one re-render for performance
- React 18+ batches ALL updates automatically (timeouts, promises, native events)—in React 17 only event handlers were batched
- Use updater functions `setState(prev => prev + 1)` for multiple updates to same state in one event to prevent stale closures, otherwise all updates use same initial value

## State Management Decision Rules

**useState vs useReducer:**
- Use `useState` when managing single independent values with simple updates
- Use `useReducer` when one state value depends on another for updates, you have 4+ related fields updating together, or avoiding stale closure bugs with async functions
- Use updater functions with useState `setState(prev => prev + 1)` to avoid stale closures when state accessed in callbacks

**State Location Decision Flow:**
1. Start with useState in component using it
2. Used by only this component? → Keep local
3. Used by direct child only? → Pass as props
4. Used by siblings? → Lift to parent
5. Prop drilling 3+ levels? → Use Context or composition

**Keep state local when:**
- Only used in one component
- Component-specific UI state (modal open/closed, form inputs)
- Short-lived state
- Performance matters—every level of lifting increases re-render scope exponentially

**Context vs Props:**
- Props are default—Context is escape hatch for prop drilling
- Use props for 1-2 levels, explicit data flow, and isolated testing
- Use Context when data needed 3+ levels deep, multiple unrelated components need same data, or true cross-cutting concerns (theme, auth, language)
- Never use Context for server cache/API data—use react-query/SWR instead
- Never use Context for frequently changing values—causes performance issues with all consumers re-rendering

**Context Performance Patterns:**
- Memoize Context value with `useMemo` to prevent new object every render causing all consumers to re-render
- Split Context by domain and update frequency to prevent unrelated re-renders
- Separate state and dispatch contexts so components needing only dispatch don't re-render on state changes
- Keep providers close to usage, not always at app root—limits re-render scope

**Custom Hooks Decision:**
- Create custom hook when logic (not markup) needs reusing across 2+ components
- Create when using multiple built-in hooks together repeatedly (useState + useEffect patterns)
- Don't create for single useState wrappers, no hooks called inside, or single-use logic
- Custom hooks must start with "use" prefix and have single responsibility

**Provider Pattern Best Practices:**
- Create custom hook with error checking `if (!context) throw Error` to enforce usage within provider
- Don't export Context object—export only the custom hook for single source of truth
- Memoize context value to prevent unnecessary re-renders
- Don't provide default values—makes mistakes explicit with runtime errors

## Clean Code & Control Flow Patterns

**Early Return Pattern:**
- Use early returns for error/loading/null states at top of components instead of wrapping entire JSX in conditionals to flatten code structure
- Check preconditions first: loading → error → empty → main content
- All hooks must be called BEFORE any early returns due to Rules of Hooks—hooks must be called in same order every render, otherwise extract to separate component

**Conditional Rendering Rules:**
- Never nest ternaries more than one level deep—use early returns, switch statements, or enum objects instead for 3+ conditions
- Extract chained conditions into named boolean variables (e.g., `const showError = !loading && !!error`) to make conditions self-documenting
- Extract complex inline conditionals to separate components when ternary exceeds 2-3 lines

**Boolean Logic Safety:**
- Always convert to boolean before `&&` operator to avoid rendering 0 or empty string: use `count > 0 && <Component />` not `count && <Component />`
- Use optional chaining `data?.items?.map()` for safe property access instead of manual null checks
- Use nullish coalescing `??` for defaults instead of `||` to handle falsy values correctly: `0 ?? 10` returns 0, but `0 || 10` returns 10

**Loading/Error State Pattern:**
```typescript
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data?.length) return <EmptyState />;
return <DataDisplay data={data} />;
```

**Extract Complex Logic:**
- When component has 4+ useState hooks, consider useReducer or custom hook to consolidate related state
- Extract complex conditional logic to separate helper components or functions
- Create reusable StateHandler wrapper component for consistent loading/error/empty patterns across app

**JSX Complexity Reduction:**
- Split components when JSX exceeds 100 lines or component has multiple responsibilities
- Extract conditional blocks to sub-components when ternaries become complex
- Avoid arrow functions in render for list items—extract to separate component to improve readability and enable memoization

## Common Use-Case Patterns

**Form State:**
- Keep form input state local in form component until submission
- Use controlled components with `value` and `onChange` for inputs
- For complex forms with validation, use useReducer or form library (react-hook-form)
- Don't put form input state in Context—too many updates cause performance issues

**Modal State:**
- Manage modal open/closed state in component that triggers it, not globally
- Each modal instance has own state—don't share state across modals
- Only lift modal state if parent needs to coordinate with modal content

**List with Filters:**
- Keep filter state in component containing both filters and list
- Pass filters as props to Filter and List components
- Don't lift unless filters affect other parts of app

**API Data Fetching:**
- Use react-query/SWR for server state—never store in Context or Redux
- For component-specific data, use custom hook with useState for loading/error/data
- Show loading state immediately, error if failed, empty if no results, then data

**Theme/Auth (Global State):**
- Use Context at app root for truly global concerns
- Memoize theme value and separate setters for performance
- Create custom hook for accessing: `useTheme()`, `useAuth()`

**Shopping Cart:**
- Use Context with provider near app root—cart accessed throughout app
- Consider react-query if cart is server-synced
- Split cart state (items) from cart actions (add/remove) into separate contexts for performance

## Quick Verification Checklist

**TypeScript:**
- [ ] Props use `type` (not interface) and named `ComponentNameProps`
- [ ] No `React.FC`, using explicit function syntax
- [ ] Boolean props prefixed: `is/has/should/can/will`
- [ ] Event handlers typed: `React.EventType<HTMLElement>`
- [ ] No `any` types or non-null assertions `!`
- [ ] Children use `React.ReactNode` type
- [ ] Refs typed: `useRef<HTMLDivElement>(null)` with null checks

**Organization:**
- [ ] Props ordered: required → optional → UI state → handlers → children
- [ ] File ordered: imports → types → constants → component → export
- [ ] Component ordered: hooks → handlers → effects → render → JSX

**Performance:**
- [ ] No components created inside render
- [ ] No random values as keys (`Math.random()`, `Date.now()`)
- [ ] No inline objects/arrays as props to memoized components
- [ ] State colocated—kept as close to usage as possible
- [ ] Context values memoized with `useMemo`
- [ ] React.memo only used when ALL props are memoized
- [ ] useCallback/useMemo only with memoized children

**Rendering:**
- [ ] useEffect has dependency array
- [ ] No setState during render (in function body)
- [ ] All reactive values in dependency arrays
- [ ] Objects in dependencies wrapped in useMemo
- [ ] Keys are stable identifiers, not indexes for dynamic lists

**State Management:**
- [ ] State starts local, lifted only when needed
- [ ] Context only for 3+ level prop drilling or global state
- [ ] No server data in Context—use react-query
- [ ] Custom hooks created only for reusable logic
- [ ] All hooks called before any early returns

**Clean Code:**
- [ ] Early returns for loading/error/null checks
- [ ] No nested ternaries beyond 1 level
- [ ] Complex conditions extracted to named variables
- [ ] Boolean `&&` operators use explicit comparisons
- [ ] Optional chaining `?.` for null-safe access
- [ ] Component under 250 lines or complexity justified

This checklist represents battle-tested patterns from production React applications, official documentation, and expert recommendations for building maintainable, performant TypeScript React components.
