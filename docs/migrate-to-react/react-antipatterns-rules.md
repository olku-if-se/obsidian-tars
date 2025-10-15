# React 18 → 19 Migration Rule-Based Checklist

A concise, rule-oriented reference distilled from the **React Antipatterns Guide: React 18 to 19 Migration**. Each rule follows the actionable format:

> **Do this ... when you have ... to prevent ... otherwise you will get ...**

---

## ⚙️ Core React 18–19 Migration Rules

* **Use `flushSync()` only when you must read the DOM after a state update** — when you have code relying on synchronous DOM reads — to prevent layout measurement errors; otherwise you will get inconsistent DOM values due to automatic batching.
* **Use `startTransition` only for non-urgent updates** — when you have heavy filtering or rendering after user input — to prevent input lag; otherwise you will get janky, delayed typing.
* **Create `Suspense` boundaries at sibling level** — when you load independent async sections — to prevent data waterfall delays; otherwise you will get sequential blocking and slow renders.
* **Keep renders pure and side-effect-free** — when you handle state changes — to prevent double-invocations under concurrent rendering; otherwise you will get unpredictable side effects and memory leaks.
* **Migrate to `createRoot()` API** — when you still use `ReactDOM.render` — to prevent missing batching, transitions, and concurrent features; otherwise you will get deprecated API warnings and degraded performance.
* **Adopt streaming SSR (`renderToPipeableStream`)** — when you do server rendering — to prevent blocking entire responses; otherwise you will get slow TTFB and poor perceived performance.

---

## 🧩 React 19 New Features

* **Use `useActionState` for forms** — when handling async form submissions — to prevent duplicated pending/error logic; otherwise you will get inconsistent loading and manual resets.
* **Use the new `use()` hook only inside render, not in event handlers** — when you fetch data or consume context — to prevent runtime errors; otherwise you will get invalid hook call exceptions.
* **Stop using `forwardRef`** — when writing new components — to prevent unnecessary wrappers; otherwise you will get deprecated warnings and type issues.
* **Write rule-compliant code for the React Compiler** — when optimizing with the compiler — to prevent silent optimization failures; otherwise you will get no performance gain.
* **Replace `PropTypes` and `defaultProps` on functions** — when using function components — to prevent no-op warnings; otherwise you will get outdated, ignored definitions.
* **Use `useId` and `useSyncExternalStore` for SSR** — when rendering on server — to prevent hydration mismatches; otherwise you will get re-render loops.
* **Render `<title>` and `<meta>` directly** — when you manage page metadata — to prevent redundant dependencies; otherwise you will get duplicated head management libraries.

---

## 🧠 State Management Rules

* **Use functional updates in async logic** — when updating state inside timers, events, or promises — to prevent stale closures; otherwise you will get outdated state values.
* **Avoid derived state from props** — when you mirror props into local state — to prevent double source of truth; otherwise you will get reset inputs and synchronization bugs.
* **Combine related state in one object** — when state values depend on each other — to prevent inconsistent combinations; otherwise you will get invalid or impossible states.
* **Use `useReducer` only for dependent logic** — when updates depend on multiple variables — to prevent unnecessary boilerplate; otherwise you will get unreadable reducers.
* **Design actions as events, not setters** — when using reducers — to prevent meaningless updates; otherwise you will get spaghetti reducers.
* **Normalize data shape** — when managing complex entities — to prevent deep duplication; otherwise you will get inconsistent data updates.
* **Memoize context values** — when providing objects or functions via context — to prevent re-renders of all consumers; otherwise you will get performance drops.
* **Split large contexts** — when unrelated state lives in one provider — to prevent global rerenders; otherwise you will get coupled logic.
* **Export validated custom hooks for contexts** — when exposing context — to prevent misuse outside providers; otherwise you will get runtime `undefined` errors.
* **Cancel or ignore stale async effects** — when fetching data — to prevent race conditions; otherwise you will get outdated UI results.
* **Colocate state near usage** — when state is used in limited scope — to prevent prop drilling; otherwise you will get slow global rerenders.
* **Use dedicated libraries for server state** — when fetching backend data — to prevent manual cache issues; otherwise you will get duplicate requests and stale data.
* **Initialize controlled inputs properly** — when managing input state — to prevent uncontrolled → controlled warnings; otherwise you will get console errors and bugs.

---

## 🪝 Hooks Rules

* **Call hooks at top level only** — when defining effects and state — to prevent inconsistent hook order; otherwise you will get hook order crashes.
* **List all dependencies in `useEffect`** — when referencing variables — to prevent stale data; otherwise you will get logic desynchronization.
* **Memoize object/function dependencies** — when using them in `useEffect` or `useMemo` — to prevent infinite loops; otherwise you will get rerenders each frame.
* **Always return cleanup in effects** — when using timers or listeners — to prevent leaks; otherwise you will get doubled handlers and memory buildup.
* **Avoid async `useEffect` directly** — when doing async work — to prevent broken cleanup; otherwise you will get unhandled re-renders.
* **Use functional updates inside effects** — when updating state from async code — to prevent stale closures; otherwise you will get frozen state values.
* **Cancel async fetches on re-render/unmount** — when fetching per-id — to prevent stale data overwrite; otherwise you will get wrong UI display.
* **Profile before memoizing** — when optimizing — to prevent wasted CPU; otherwise you will get slower app.
* **Pair `useCallback` with `React.memo`** — when stabilizing handlers — to prevent meaningless memoization; otherwise you will get no gain.
* **Use `useState`, not `useRef`, for reactive data** — when values affect UI — to prevent stale renders; otherwise you will get invisible updates.
* **Access refs only after mount** — when needing DOM nodes — to prevent null refs; otherwise you will get runtime errors.
* **Use `useLayoutEffect` only for DOM measurement** — when synchronizing layout — to prevent blocking paints; otherwise you will get laggy UI.
* **Keep custom hooks small and focused** — when designing abstractions — to prevent unmaintainable logic; otherwise you will get tangled dependencies.

---

## ⚡ Performance Rules

* **Define components outside render** — when creating subcomponents — to prevent remounting; otherwise you will get lost state and slow updates.
* **Extract inline objects and arrays** — when passing props — to prevent memo breaks; otherwise you will get redundant re-renders.
* **Avoid inline arrow functions in lists** — when rendering many items — to prevent massive GC churn; otherwise you will get janky scrolling.
* **Use virtualization** — when rendering long lists — to prevent UI freezes; otherwise you will get OOM crashes and scroll lag.
* **Wrap expensive sorting/filtering in `useMemo`** — when dealing with large datasets — to prevent blocking the main thread; otherwise you will get frozen UI.
* **Use stable keys, never indexes** — when mapping lists — to prevent reconciliation bugs; otherwise you will get wrong data rendered.
* **Tree-shake imports** — when using utility libraries — to prevent bloated bundles; otherwise you will get 2–5s longer load times.
* **Code-split routes** — when building large apps — to prevent 5MB bundles; otherwise you will get slow startup.
* **Profile in production builds** — when measuring performance — to prevent misleading metrics; otherwise you will get false positives.
* **Batch DOM reads/writes** — when manipulating multiple elements — to prevent layout thrashing; otherwise you will get long frames.
* **Lazy-load images and components** — when loading large media — to prevent blocked rendering; otherwise you will get poor FCP.
* **Debounce keystroke-driven requests** — when typing triggers APIs — to prevent server overload; otherwise you will get race conditions and lag.

---

## 🧷 TypeScript Rules

* **Avoid `as any`** — when typing events — to prevent silent type loss; otherwise you will get runtime bugs.
* **Don’t use `React.FC` by default** — when typing components — to prevent generic inference loss; otherwise you will get overly strict or incorrect props.
* **Type precisely, not broadly** — when defining callbacks/objects — to prevent unclear contracts; otherwise you will get unsafe casts.
* **Preserve generics in components** — when building reusable tables/forms — to prevent lost type inference; otherwise you will get untyped usage.
* **Use correct event types** — when handling DOM events — to prevent misuse; otherwise you will get type mismatches.
* **Type refs correctly** — when using `useRef` — to prevent null errors; otherwise you will get invalid access.
* **Use `as const` in hook tuple returns** — when returning arrays — to prevent union widening; otherwise you will get broken inference.
* **Use discriminated unions** — when variant props are mutually exclusive — to prevent invalid prop combinations; otherwise you will get impossible states.
* **Leverage `ComponentProps`** — when extending native props — to prevent duplication; otherwise you will get inconsistent prop typing.

---

## 🧱 Architecture Rules

* **Use context or composition instead of prop drilling** — when data passes through many layers — to prevent coupling; otherwise you will get brittle components.
* **Split large components** — when a file exceeds hundreds of lines — to prevent untestable code; otherwise you will get unreadable blobs.
* **Avoid overusing HOCs and render props** — when hooks can replace them — to prevent deep trees; otherwise you will get wrapper hell.
* **Extract components only after reuse** — when refactoring — to prevent premature abstraction; otherwise you will get overhead without gain.
* **Depend on props, not many contexts** — when designing reusable components — to prevent tight coupling; otherwise you will get non-reusable blocks.

---

## 🧪 Testing Rules

* **Test behavior, not implementation** — when writing tests — to prevent brittle tests; otherwise you will get false failures after refactors.
* **Use semantic queries (`getByRole`)** — when selecting elements — to prevent inaccessible tests; otherwise you will get weak coverage.
* **Handle async updates properly** — when waiting for UI changes — to prevent flaky tests; otherwise you will get timing errors.
* **Mock external services only** — when isolating tests — to prevent fake reality; otherwise you will get misleading results.
* **Colocate tests with components** — when organizing files — to prevent disconnection; otherwise you will get orphaned test suites.

---

## 🔐 Security Rules

* **Sanitize `dangerouslySetInnerHTML`** — when rendering user input — to prevent XSS; otherwise you will get script injection.
* **Validate URLs before rendering** — when using `href` or `src` — to prevent `javascript:` attacks; otherwise you will get code execution.
* **Never trust client-side auth** — when hiding protected views — to prevent bypass; otherwise you will get unauthorized access.
* **Move secrets server-side** — when using API keys — to prevent leakage; otherwise you will get compromised credentials.
* **Use httpOnly cookies, not localStorage** — when storing tokens — to prevent XSS theft; otherwise you will get stolen sessions.
* **Use CSRF tokens or SameSite cookies** — when handling POST requests — to prevent cross-site attacks; otherwise you will get account hijacks.
* **Keep dependencies updated** — when shipping builds — to prevent known CVEs; otherwise you will get vulnerable packages.
* **Whitelist redirects** — when redirecting after login — to prevent phishing; otherwise you will get open redirect exploits.
* **Validate `postMessage` origins** — when listening to messages — to prevent malicious injection; otherwise you will get remote control exploits.
* **Don’t hydrate secrets in SSR** — when sending HTML — to prevent data leaks; otherwise you will get exposed sensitive data.

---

✅ **Immediate Wins**

1. Run `eslint-plugin-react-hooks` to catch dependency errors.
2. Use `React.lazy` for code-splitting at route level.
3. Remove all `forwardRef` and replace with normal ref props.
4. Replace localStorage tokens with `httpOnly` cookies.
5. Migrate forms to React 19 Actions API.
6. Add CSRF protection and DOMPurify sanitization.
7. Run `npm audit fix` and enable Dependabot.

---

**Result:** Following these rules ensures your React 18 → 19 migration is predictable, secure, and performance-optimized while avoiding 120+ documented antipatterns.
