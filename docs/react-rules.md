# Unified React 18→19 Migration + TypeScript + Architecture Rules Checklist

A **single source of truth** merging:

* **React Antipatterns Guide: React 18→19 Migration** (concurrency, batching, Suspense, SSR, React 19 APIs)
* **TypeScript React Component Best Practices** (props typing, structure, performance, testing)
* **Project Architecture** (`ARCHITECTURE.md`: Atoms → Components → Views, styling, prop rules)

Every rule follows:

> **Do this ... when you have ... to prevent ... otherwise you will get ...**

---

## 0) Global Conventions

* **Prefer explicitness over magic** — when choosing patterns — to prevent hidden coupling; otherwise you will get fragile code.
* **Document decisions in Storybook MDX** — when adding or changing UI — to prevent tribal knowledge; otherwise you will get divergence between code and UX.
* **Treat this file as a PR checklist** — when reviewing changes — to prevent regressions; otherwise you will get repeated incidents.

---

## 1) Architecture & Composition (Atoms → Components → Views)

### 1.1 Atomic Hierarchy

* **Follow `Atoms → Components → Views`** — when structuring UI — to prevent chaotic layering; otherwise you will get duplicated logic.
* **Atoms (in `./atoms/`) may include minimal internal state** — when encapsulating generic UI/UX interactions — to ensure consistent behavior across app; otherwise you will get divergent UX.
* **Components (in `./components/`) compose Atoms + own logic** — when building modals/panels/forms — to prevent logic leaking into Views; otherwise you will get hard-to-test screens.
* **Views (in `./views/`) orchestrate full user interfaces** — when building pages/sections — to prevent overgrown Components; otherwise you will get tangled trees.

### 1.2 Styling & Structure

* **Avoid inline styles** — when styling — to prevent specificity & override bugs; otherwise you will get maintenance pain. Use `className` + scoped CSS.
* **Use `clsx` for conditional classes** — when combining states — to prevent string concat bugs; otherwise you will get unreadable code.
* **Scope CSS per component** — when adding styles — to prevent global leakage; otherwise you will get cross-component conflicts.

### 1.3 Props & State

* **Bundle props into a named object when >5 props** — when interfaces grow — to prevent prop bloat; otherwise you will get unreadable signatures.
* **Separate data props from UI-state props** — when designing APIs — to prevent mixed concerns; otherwise you will get unclear ownership.
* **Expose `onChange(oldState, newState)` for sync** — when parent must track child — to prevent drift; otherwise you will get out-of-sync state.
* **Keep state local** — when scope is limited — to prevent global rerenders; otherwise you will get performance loss.

### 1.4 Reuse, Defaults, Strings

* **Prefer upgrading existing Atoms** — when a similar element exists — to prevent duplication; otherwise you will get two sources of truth.
* **Define sensible defaults for props** — when designing APIs — to prevent runtime undefined; otherwise you will get brittle components.
* **Externalize all user-visible strings immediately** — when adding text — to keep i18n-ready; otherwise you will get costly retrofits.

### 1.5 Documentation & Testing Alignment

* **Ship a Storybook story per component (with MDX)** — when creating/changing UI — to prevent design drift; otherwise you will get undocumented behavior.
* **Test Atoms/Components in isolation** — when verifying logic — to prevent flaky integration failures; otherwise you will get nondeterministic tests.

> **Example:** Use `<LabelValueList rows={...} />` (built from `<LabelValue>`) — when showing key/value stats — to prevent re-implementing formatting; otherwise you will get inconsistent UI.

---

## 2) TypeScript React Best Practices (from `react-best-practices.md`)

### 2.1 Prop & Component Typing

* **Use `type` for app props; reserve `interface` for library extension** — when declaring props — to prevent accidental declaration merging; otherwise you will get unexpected prop surface.
* **Name props as `ComponentNameProps`** — when defining types — to prevent collisions; otherwise you will get shadowing errors.
* **Use discriminated unions for dependent props** — when props are mutually exclusive — to prevent invalid combinations; otherwise you will get runtime errors.
* **Mark most props required (80%+)** — when designing APIs — to prevent unclear contracts; otherwise you will get misuse.
* **Extend native props with `ComponentProps(With|Without)Ref<'button'>` and `Omit<...>`** — when overlapping names — to prevent collisions; otherwise you will get confusing attributes.
* **Avoid `React.FC` by default** — when declaring components — to prevent implicit children typing; otherwise you will get type confusion.
* **Return type `JSX.Element | null` for conditional renderers** — when early returns — to prevent `undefined` returns; otherwise you will get runtime issues.

### 2.2 Children & Events

* **Use `React.ReactNode` for `children`** — when accepting content — to prevent over-restriction; otherwise strings/numbers/fragments break.
* **Prefer `event.currentTarget`** — when handling events — to prevent unsafe `target` access; otherwise typing degrades.
* **Use specific React event types (e.g., `React.ChangeEvent<HTMLInputElement>`)** — when extracting handlers — to prevent `any` creep; otherwise refactors break silently.

### 2.3 Refs & Generics

* **Type DOM refs with null init (`useRef<HTMLInputElement>(null)`)** — when accessing `.current` — to prevent runtime null; otherwise crashes occur.
* **Extract parent ref types with `ElementRef<typeof Component>`** — when forwarding — to prevent incorrect function types.
* **For generic components preserve generics** — when building lists/tables — to prevent erasing types (`any[]`); otherwise you lose inference.

### 2.4 Common TS Pitfalls

* **Never use `any` or non-null `!` to silence errors** — when typing unknowns — to prevent runtime bugs; otherwise safety is lost. Prefer `unknown` + guards.
* **Use `as const` for hook tuple returns** — when returning arrays — to preserve tuple positions; otherwise unions widen.
* **Make impossible states unrepresentable** — when modeling variants — to prevent invalid states; otherwise runtime checks explode.

### 2.5 Organization & Naming

* **Prop order:** required → optional → UI-state → handlers → children — when defining types — to reduce cognitive load; otherwise APIs feel random.
* **File order:** external imports → internal → types → constants → component → export — when structuring files — to keep consistency; otherwise onboarding slows.
* **Inside component:** hooks → handlers → helpers → effects → render vars → `return` — when organizing logic — to prevent tangled flow.
* **Naming:** data nouns (`user`), boolean prefixes (`is/has/should`), handlers (`onX` props; `handleX` impl) — when standardizing — to prevent confusion.

### 2.6 Performance & Re-rendering

* **Know re-render causes** — when optimizing — to prevent wrong fixes: parent rerender ⇒ children rerender; context changes ⇒ all consumers rerender.
* **Use `React.memo` only with stable props** — when optimizing — to prevent wasted compares; otherwise memo hurts.
* **Use `useMemo`/`useCallback` only for memoized children** — when passing props — to prevent overhead; otherwise performance regresses.
* **Composition for performance:** move state down; pass children as props created outside; pass components as props — to limit rerender scope.
* **Infinite-loop guards:** always set deps arrays; never set state during render; memoize objects/functions used in deps; use `onClick={handler}` (not `handler()`).
* **Dependency arrays:** include all reactive values; avoid objects (prefer primitives or memoized objects); empty `[]` means one-time and risks stale closures.
* **Keys:** stable & unique among siblings; never `Math.random()`/`Date.now()`; array index only for static lists.
* **Batching:** React 18 batches everywhere; use updater form `setX(x => x+1)` for multiple updates.

### 2.7 State Location, Context & Custom Hooks

* **State location flow:** keep local → lift to nearest common ancestor → use Context for 3+ levels or cross-cutting concerns — to prevent prop drilling.
* **Context use:** not for server cache (use React Query); memoize values; split state/dispatch; keep providers near usage; export custom hook with runtime check.
* **Custom hooks:** create when logic is reused or combines multiple hooks; keep single responsibility; start name with `use`.

### 2.8 Clean Code & Control Flow

* **Early returns for loading/error/empty → content** — when structuring render — to flatten branches; otherwise JSX nesting explodes.
* **Conditional rendering:** avoid nested ternaries > 1; name boolean expressions; extract complex blocks to subcomponents.
* **Boolean safety:** guard with comparisons (e.g., `count > 0 &&`), use optional chaining `?.`, prefer `??` over `||` for numeric zero.

### 2.9 Common Use-Case Patterns

* **Forms:** keep input state local; controlled inputs; use `useReducer` or library for complex validation; avoid Context for input state.
* **Modals:** manage open/closed near trigger; lift only when coordination needed; each modal instance owns its state.
* **Lists + Filters:** keep filters with list owner; lift only if other areas depend on filters.
* **Theme/Auth:** Context at app root, memoize values, expose via `useTheme()`/`useAuth()` hooks.
* **Shopping Cart:** Context or React Query if server-synced; split state/actions contexts.

---

## 3) React 18→19 Migration & Hooks Rules (from Antipatterns Guide)

### 3.1 Concurrency, Batching, Transitions

* **Rely on automatic batching** — when updating state in async contexts — to prevent multiple renders; otherwise you will get performance loss.
* **Use `flushSync()` sparingly** — when you must measure DOM after an update — to prevent stale reads; otherwise you will get incorrect layout metrics.
* **Use `startTransition` for non-urgent updates** — when heavy derivations follow input — to prevent input lag; otherwise typing becomes janky.

### 3.2 Suspense & Data Fetching

* **Sibling Suspense boundaries for independent areas** — when loading multiple resources — to prevent waterfalls; otherwise you will get sequential delays.
* **Hoist route-level data fetching** — when possible — to parallelize fetches; otherwise you will get serialized loads.

### 3.3 SSR & Hydration

* **Use streaming SSR (`renderToPipeableStream`)** — when server rendering — to reduce TTFB; otherwise you will block responses.
* **Stabilize IDs & values (`useId`, `useSyncExternalStore`)** — when SSR — to prevent hydration mismatches; otherwise the tree re-renders.
* **Avoid browser-only code on server** — when SSR — to prevent mismatch & crashes; otherwise hydration errors occur.

### 3.4 React 19 APIs & Deprecations

* **Use `useActionState` + `useFormStatus`** — when handling async forms — to prevent duplicated pending/error management; otherwise you will get race conditions.
* **`use()` only in render (not handlers)** — when consuming context/promises — to prevent invalid hook calls.
* **Avoid new `forwardRef` patterns** — when creating new components — to prevent deprecation churn; otherwise types break; pass `ref` as a prop (React 19).
* **Drop PropTypes/defaultProps on functions** — when using TS — to prevent no-op validation; otherwise noise remains.
* **Metadata hoisting (title/meta/link)** — when setting head tags — to remove third-party head managers; otherwise redundancy persists.

### 3.5 Hooks Discipline

* **Call hooks unconditionally at top** — when structuring components — to prevent order mismatches.
* **Complete deps arrays** — when using values from scope — to prevent stale closures; otherwise bugs hide.
* **Cleanup effects** — when adding timers/listeners/subscriptions — to prevent leaks (note StrictMode double-invoke).
* **Don’t make `useEffect` async** — wrap an inner async function — to keep cleanup contract intact.
* **Use functional updates in effects** — when updating state — to prevent stale captures.
* **Cancel in-flight requests** — when switching IDs or unmounting — to prevent stale data overwrite (AbortController or ignore flag).
* **Pair `useCallback` with `React.memo`** — when stabilizing handlers — to realize benefits.
* **Use `useLayoutEffect` only for DOM measurement** — when synchronous read/write is needed — to avoid blocking paint for data fetching.

---

## 4) Performance Rules (merged)

* **Define components at module scope (never inside render)** — when composing lists — to prevent remounts & state loss.
* **Extract inline objects/arrays/functions passed to memoized children** — when optimizing — to preserve referential equality.
* **Virtualize long lists (`react-window`/`react-virtual`)** — when >~100 items — to prevent jank & memory spikes.
* **Memoize expensive computations** — when sorting/filtering big arrays — to avoid main-thread stalls.
* **Use stable keys (not index/random)** — when mapping dynamic lists — to prevent reconciliation bugs and state drift.
* **Tree-shake imports** — when using utility libs — to reduce bundle (use subpath or ESM).
* **Code-split with `React.lazy`** — when bundles grow — to reduce TTI; wrap in Suspense.
* **Batch DOM reads then writes** — when touching layout — to prevent layout thrashing.
* **Lazy-load images/components** — when content is offscreen — to improve FCP.
* **Debounce keystroke-driven fetches** — when searching — to prevent server overload and races.
* **Profile production builds** — when tuning performance — to prevent false signals from dev mode.

---

## 5) i18n & Localization Rules (explicit)

* **Wrap all user-facing text with `t('...')`** — even before enabling i18n — to accelerate future rollout.
* **Use namespaced keys per feature** — when organizing — to avoid collisions (e.g., `settings.profile.title`).
* **Prefer ICU/pluralization helpers** — when handling plurals/gender — to prevent ungrammatical output.
* **Use placeholders (`{{name}}`, `{{count}}`)** — when injecting variables — to allow reordering in languages.
* **Avoid string concat/interpolation in JSX** — when composing sentences — to keep messages translatable.
* **Async-load locale bundles** — when bundling — to keep initial payload small.
* **Add i18n switcher in Storybook** — when reviewing — to ensure coverage.

---

## 6) Testing Stack Rules (Vitest + Testing Library + Storybook + Playwright)

* **Use `vitest`** — when running unit tests — to keep CI fast.
* **Use `@testing-library/react`** — when asserting DOM — to test behavior via roles/labels/text (a11y-first).
* **Use `storybook`** — when documenting/visual testing — to catch visual regressions and serve as living docs.
* **Use `playwright`** — when performing E2E and a11y audits — to validate real-browser flows.
* **Mock only network/backends** — when isolating tests — to avoid fake reality.
* **Colocate `*.test.tsx` with components** — when organizing — to ensure discoverability.

---

## 7) Security Rules (client-aware)

* **Sanitize `dangerouslySetInnerHTML` (DOMPurify)** — when rendering HTML — to prevent XSS.
* **Validate URL protocols** — when using `href`/`src` — to block `javascript:`.
* **Never expose secrets in client or env-prefixed bundles** — when configuring — to prevent key theft; proxy via server.
* **Use httpOnly cookies for tokens** — when auth — to reduce XSS risk; avoid `localStorage`.
* **Apply CSRF/SameSite** — when POSTing — to prevent cross-site attacks.
* **Avoid hydrating sensitive data** — when SSR — to prevent leaks.
* **Lock third-party scripts (CSP + SRI)** — when loading — to prevent supply-chain attacks.

---

## 8) Final PR Verification (checkboxes)

**Architecture**

* [ ] Atoms→Components→Views respected; atoms minimal state only
* [ ] No inline styles; `clsx` used; CSS scoped per component
* [ ] Existing Atoms extended before adding new

**TypeScript**

* [ ] Props typed (`type`, not default `interface`); `ComponentNameProps` naming
* [ ] Discriminated unions for dependent props
* [ ] No `any`/non-null `!`; correct event types; refs `null`-init
* [ ] Generics preserved; tuple returns `as const`

**React 18→19**

* [ ] `createRoot` used; React 19 APIs adopted where applicable
* [ ] Suspense boundaries are sibling/independent; SSR uses streaming
* [ ] Effects have cleanup; deps arrays complete; functional updates used

**Performance**

* [ ] No inline objects/functions to memoized children
* [ ] Keys stable (no index for dynamic lists)
* [ ] Virtualization for long lists; heavy work memoized

**i18n**

* [ ] All strings wrapped in `t('...')`; namespaced keys
* [ ] ICU/plurals used; no string concatenation

**Testing**

* [ ] Vitest unit tests; Testing Library semantic queries
* [ ] Storybook stories with MDX; Playwright E2E for flows

**Security**

* [ ] DOMPurify for HTML; URL protocol checks
* [ ] Secrets server-side; httpOnly cookies; CSRF/SameSite

---

**Result:** A rigorously merged, actionable checklist aligning project **architecture**, **TypeScript quality**, **React 18→19 migration**, **performance**, **i18n**, **testing**, and **security**. Use it as the baseline for code reviews and release gates.
