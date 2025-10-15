# React 18 → 19 Migration and TypeScript React Best Practices Unified Checklist

A unified, rule-based guide combining **React Antipatterns Migration (18→19)** with **TypeScript React Component Best Practices**, forming one exhaustive engineering verification document.

Each rule follows this action format:

> **Do this ... when you have ... to prevent ... otherwise you will get ...**

---

## ⚙️ React 18→19 Migration Core Rules

* **Use `flushSync()` only when DOM measurement required** — when immediate layout reading after setState — to prevent stale DOM reads; otherwise you will get measurement mismatches.
* **Use `startTransition` only for slow operations** — when user input triggers heavy re-renders — to prevent input lag; otherwise you will get janky typing.
* **Create Suspense boundaries at sibling level** — when fetching multiple async data — to prevent loading waterfalls; otherwise you will get sequential waits.
* **Keep render pure** — when performing side effects — to prevent double execution; otherwise you will get memory leaks under concurrent rendering.
* **Migrate to `createRoot()`** — when still using `ReactDOM.render` — to prevent lost batching and transition features; otherwise you will get deprecated behavior.
* **Use streaming SSR** — when doing SSR — to prevent full-block rendering; otherwise you will get slow time-to-first-byte.

---

## 🧩 React 19 New APIs

* **Adopt `useActionState`** — when building async forms — to prevent duplicated state tracking; otherwise you will get race conditions.
* **Call `use()` only inside render** — when fetching data or accessing context — to prevent invalid hook call errors; otherwise you will get runtime crashes.
* **Stop using `forwardRef`** — when creating new components — to prevent unnecessary wrappers; otherwise you will get deprecation warnings.
* **Follow compiler rules** — when using React Compiler — to prevent optimization loss; otherwise you will get silent performance regressions.
* **Replace PropTypes/defaultProps** — when using function components — to prevent ignored definitions; otherwise you will get stale type validation.
* **Use `useId` and `useSyncExternalStore`** — when server rendering — to prevent hydration mismatch; otherwise you will get full tree re-renders.
* **Render metadata directly** — when using `<title>` and `<meta>` — to prevent extra dependencies; otherwise you will get redundant head managers.

---

## 🧠 State Management Rules

* **Use functional updates in async logic** — when updating in timers/promises — to prevent stale closures; otherwise you will get outdated state.
* **Avoid derived state from props** — when syncing props with useState — to prevent dual sources of truth; otherwise you will get input reset bugs.
* **Group related state** — when multiple fields depend — to prevent impossible state combinations; otherwise you will get logic inconsistencies.
* **Use `useReducer` only when necessary** — when states depend on each other — to prevent boilerplate overhead; otherwise you will get noise.
* **Normalize complex data** — when working with nested entities — to prevent update duplication; otherwise you will get inconsistent caches.
* **Memoize Context values** — when passing object/functions — to prevent mass re-renders; otherwise you will get performance issues.
* **Split contexts** — when holding unrelated data — to prevent coupling; otherwise you will get global invalidations.
* **Validate Context via hooks** — when exposing providers — to prevent misuse; otherwise you will get undefined runtime errors.
* **Abort async requests** — when using effects — to prevent race updates; otherwise you will get stale UI.
* **Colocate state near usage** — when only needed locally — to prevent global re-renders; otherwise you will get slow updates.
* **Use libraries like React Query** — when fetching server data — to prevent manual caching errors; otherwise you will get stale fetches.

---

## 🪝 Hooks Rules

* **Call hooks unconditionally at top level** — when structuring components — to prevent invalid hook order; otherwise you will get hook mismatch.
* **List all dependencies in effects** — when using props/state inside — to prevent stale values; otherwise you will get outdated logic.
* **Memoize object deps** — when passing objects/functions to effects — to prevent infinite loops; otherwise you will get runaway re-renders.
* **Always clean up effects** — when adding listeners/timers — to prevent leaks; otherwise you will get doubled subscriptions.
* **Avoid async directly in `useEffect`** — when performing async calls — to prevent cleanup breakage; otherwise you will get unhandled promises.
* **Use functional updates** — when modifying state in effects — to prevent closure bugs; otherwise you will get frozen state.
* **Cancel stale fetches** — when async requests overlap — to prevent outdated display; otherwise you will get wrong data.
* **Profile before memoizing** — when optimizing — to prevent wasted overhead; otherwise you will get slower code.
* **Pair `useCallback` with memoized children** — when stabilizing handlers — to prevent no-op optimization; otherwise you will get needless rerenders.
* **Use `useState` not `useRef` for reactive data** — when UI depends on changes — to prevent hidden updates; otherwise you will get unreflected state.
* **Access refs only after mount** — when reading DOM — to prevent null derefs; otherwise you will get runtime errors.
* **Use `useLayoutEffect` only for DOM reads** — when measuring layout — to prevent blocking paint; otherwise you will get layout jank.

---

## ⚡ Performance Rules

* **Define subcomponents outside render** — when building lists — to prevent remounts; otherwise you will get state resets.
* **Extract inline objects/arrays** — when memoizing props — to prevent referential breaks; otherwise you will get useless renders.
* **Avoid inline functions in lists** — when rendering 100+ items — to prevent garbage churn; otherwise you will get scroll lag.
* **Use virtualization** — when rendering long lists — to prevent memory spikes; otherwise you will get browser freeze.
* **Memoize expensive operations** — when sorting/filtering — to prevent frame blocking; otherwise you will get UI stutter.
* **Use stable unique keys** — when mapping — to prevent reconciliation bugs; otherwise you will get wrong content.
* **Code-split routes with `React.lazy`** — when large bundles — to prevent slow TTI; otherwise you will get long initial load.
* **Tree-shake imports** — when using utility libs — to prevent bloated bundles; otherwise you will get 3s+ load delays.
* **Batch DOM reads/writes** — when manipulating DOM — to prevent layout thrashing; otherwise you will get dropped frames.
* **Lazy-load images/components** — when non-critical — to prevent FCP delay; otherwise you will get slow paint.
* **Debounce input-triggered fetches** — when typing triggers network — to prevent overload; otherwise you will get wasted requests.

---

## 🧷 TypeScript Integration Rules

* **Avoid `as any`** — when typing events/data — to prevent safety loss; otherwise you will get runtime bugs.
* **Avoid `React.FC` default** — when defining components — to prevent implicit children; otherwise you will get type confusion.
* **Type precisely** — when defining props/callbacks — to prevent ambiguous APIs; otherwise you will get unsafe usage.
* **Preserve generics** — when making reusable components — to prevent type loss; otherwise you will get untyped usage.
* **Use specific event types** — when handling DOM events — to prevent invalid properties; otherwise you will get type mismatch.
* **Initialize refs properly** — when using DOM refs — to prevent null crashes; otherwise you will get runtime failure.
* **Return tuples `as const`** — when custom hooks return arrays — to prevent widened unions; otherwise you will get broken inference.
* **Use discriminated unions** — when props mutually exclusive — to prevent invalid combinations; otherwise you will get runtime misuse.
* **Use `ComponentProps` helpers** — when extending elements — to prevent manual duplication; otherwise you will get mismatched prop contracts.

---

## 🧱 Architecture & Organization

* **Use Context or composition over prop drilling** — when passing through 3+ layers — to prevent tight coupling; otherwise you will get fragile chains.
* **Split large components (>300 lines)** — when multiple responsibilities — to prevent unreadable files; otherwise you will get maintenance issues.
* **Avoid excessive HOCs/render props** — when hooks exist — to prevent wrapper hell; otherwise you will get debugging pain.
* **Extract only after reuse** — when refactoring — to prevent premature abstraction; otherwise you will get unnecessary complexity.
* **Depend primarily on props** — when building reusable blocks — to prevent over-contextualization; otherwise you will get rigid components.
* **Organize files consistently** — imports → types → constants → component → export — to prevent confusion.

---

## 🧪 Testing Rules

* **Test user behavior, not implementation** — when writing tests — to prevent fragility; otherwise you will get false failures.
* **Use semantic queries (`getByRole`, `getByText`)** — when locating elements — to prevent accessibility regressions; otherwise you will get brittle tests.
* **Use `waitFor`/`findBy` properly** — when async rendering — to prevent flaky tests; otherwise you will get timing failures.
* **Mock external services only** — when isolating tests — to prevent fake correctness; otherwise you will get unrealistic coverage.
* **Colocate tests with components** — when organizing — to prevent disconnection; otherwise you will get orphaned tests.

---

## 🔐 Security Rules

* **Sanitize `dangerouslySetInnerHTML`** — when rendering user content — to prevent XSS; otherwise you will get script injection.
* **Validate URLs before render** — when building href/src — to prevent `javascript:` exploits; otherwise you will get code execution.
* **Never rely on client auth** — when gating routes — to prevent bypass; otherwise you will get privilege escalation.
* **Proxy all API keys through backend** — when calling third-party APIs — to prevent leaks; otherwise you will get abused keys.
* **Use httpOnly cookies instead of localStorage** — when storing tokens — to prevent XSS theft; otherwise you will get session hijacks.
* **Implement CSRF protection** — when accepting POSTs — to prevent forged requests; otherwise you will get account takeover.
* **Keep dependencies up-to-date** — when deploying — to prevent known CVEs; otherwise you will get exploitable libraries.
* **Whitelist redirect targets** — when redirecting users — to prevent phishing; otherwise you will get open redirect exploits.
* **Validate `postMessage` origins** — when cross-frame messaging — to prevent malicious injections; otherwise you will get remote code execution.
* **Never hydrate secrets in SSR** — when rendering server data — to prevent exposure; otherwise you will get leaked credentials.

---

## ✅ Final Verification Checklist

1. ESLint hooks/exhaustive-deps rule enabled
2. All forms migrated to `useActionState`
3. No `forwardRef` in new code
4. All `Context.Provider` values memoized
5. All `useEffect` have cleanup functions
6. All API keys removed from client
7. Tokens stored via httpOnly cookies
8. CSRF protection implemented
9. `React.lazy` used for code-splitting
10. DOMPurify added for HTML sanitization

---

**Following this unified checklist ensures code safety, performance, and future-proofing across React 18→19 and TypeScript best practices.**
