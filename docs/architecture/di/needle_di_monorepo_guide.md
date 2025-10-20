# Needle DI (v1.1.0) in a TypeScript Monorepo  
*(with esbuild · tsup · Vite · Vitest)*

> Based on official docs and source at [needle-di.io](https://needle-di.io) and  
> [github.com/needle-di/needle-di/tree/v1.1.0](https://github.com/needle-di/needle-di/tree/v1.1.0)

Needle DI is a **tiny, reflection-free** dependency injection library for modern TypeScript using **native decorators**.  
It’s ideal for monorepos built with **Vite** or **tsup/esbuild**.

---

## 1. Install

```bash
pnpm add -w @needle-di/core
# or npm/yarn
```

---

## 2. TypeScript & Decorators Setup

Needle DI uses **stage-3 decorators** — no legacy `experimentalDecorators` or `emitDecoratorMetadata`.

**`tsconfig.base.json` (shared)**

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "types": ["vitest/globals"]
  }
}
```

---

## 3. Supported Build Tools Overview

| Tool      | Purpose                  | Config Snippet |
|------------|--------------------------|----------------|
| **esbuild** | fast library bundling     | `--target=es2022` |
| **tsup**     | opinionated wrapper around esbuild | `"target": "es2022"` |
| **Vite**     | web app bundler/dev server | `esbuild.target = 'es2022'` |
| **Vitest**   | test runner, works with Vite config | inherits target |

---

## 4. Vite Setup (for apps)

```ts
// apps/web/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: { target: 'es2022' }
});
```

---

## 5. tsup Setup (for packages)

Use `tsup` for shared libraries (`packages/core-logic`, `packages/utils`, etc.).

Install:

```bash
pnpm add -Dw tsup typescript
```

**`packages/core-logic/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'es2022',
  dts: true,
  splitting: false,
  clean: true,
  sourcemap: true,
  minify: false,
  shims: false,
});
```

Then build:

```bash
pnpm --filter @repo/core-logic build
```

**`package.json`**

```json
{
  "name": "@repo/core-logic",
  "scripts": {
    "build": "tsup"
  },
  "exports": "./dist/index.js",
  "type": "module"
}
```

---

## 6. esbuild (manual alternative)

If you prefer to call esbuild directly:

```bash
esbuild src/index.ts --bundle --format=esm --target=es2022 --outdir=dist
```

---

## 7. Getting Started with Needle DI

```ts
// packages/core-logic/src/services.ts
import { injectable, inject } from '@needle-di/core';

@injectable()
export class FooService {}

@injectable()
export class BarService {
  constructor(private foo = inject(FooService)) {}
}
```

```ts
// apps/web/src/main.ts
import { Container } from '@needle-di/core';
import { BarService } from '@repo/core-logic/services';

const container = new Container();
const bar = container.get(BarService);
```

---

## 8. Provider Patterns

```ts
import { Container, inject } from '@needle-di/core';
const container = new Container();

// useClass
class Logger {}
container.bind(Logger);

// useValue
container.bind({ provide: 'apiUrl', useValue: '/api' });

// useFactory
container.bind({
  provide: 'client',
  useFactory: () => new ApiClient(inject('apiUrl')),
});
```

---

## 9. Tokens

```ts
import { InjectionToken } from '@needle-di/core';

export interface AppConfig { api: string; }
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
```

```ts
container.bind({ provide: APP_CONFIG, useValue: { api: '/api' } });
```

---

## 10. Containers and Bootstrapping

```ts
import { Container, bootstrap } from '@needle-di/core';
const container = new Container();

container.bindAll(/* providers */);
const foo = container.get(FooService);

// or shorthand
const app = bootstrap(AppRoot);
```

### Child Containers

```ts
const parent = new Container();
parent.bind({ provide: 'logger', useValue: console });

const child = parent.createChild();
child.bind({ provide: 'logger', useValue: mockLogger });
```

---

## 11. Optional / Multi / Lazy / Async Injection

```ts
class Maybe {
  constructor(private foo = inject(FooService, { optional: true })) {}
}
```

```ts
// Multi
container.bind({ provide: 'plugin', multi: true, useValue: 'A' });
container.bind({ provide: 'plugin', multi: true, useValue: 'B' });

class UsesMany {
  constructor(private all = inject('plugin', { multi: true })) {}
}
```

```ts
// Lazy
class A {
  constructor(private getB = inject(B, { lazy: true })) {}
}
```

```ts
// Async
container.bind({
  provide: 'config',
  async: true,
  useFactory: async () => fetch('/config').then(r => r.json()),
});
const cfg = await container.getAsync('config');
```

---

## 12. Vitest Testing Patterns

```ts
// packages/core-logic/src/services.test.ts
import { describe, it, expect } from 'vitest';
import { Container } from '@needle-di/core';
import { FooService } from './services';

it('resolves Foo', () => {
  const c = new Container();
  c.bind(FooService);
  expect(c.get(FooService)).toBeInstanceOf(FooService);
});
```

### With Child Containers (for mocking)

```ts
const root = new Container();
root.bind({ provide: 'logger', useValue: console });

const testContainer = root.createChild();
testContainer.bind({ provide: 'logger', useValue: { log: vi.fn() } });
```

---

## 13. Monorepo Layout Example

```
/
├─ packages/
│  ├─ core-logic/
│  │  ├─ src/
│  │  ├─ tsup.config.ts
│  │  └─ package.json
│  └─ utils/
│     ├─ tsup.config.ts
│     └─ ...
├─ apps/
│  └─ web/
│     ├─ src/
│     └─ vite.config.ts
├─ tsconfig.base.json
└─ pnpm-workspace.yaml
```

---

## 14. Full Example End-to-End

**`packages/core-logic/src/tokens.ts`**

```ts
import { InjectionToken } from '@needle-di/core';
export interface AppConfig { api: string; }
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
```

**`packages/core-logic/src/services.ts`**

```ts
import { injectable, inject } from '@needle-di/core';
import { APP_CONFIG } from './tokens';

@injectable()
export class Api {
  constructor(private cfg = inject(APP_CONFIG)) {}
  base() { return this.cfg.api; }
}

@injectable()
export class AppRoot {
  constructor(private api = inject(Api)) {}
  start() { console.log('API:', this.api.base()); }
}
```

**`apps/web/src/main.ts`**

```ts
import { Container } from '@needle-di/core';
import { APP_CONFIG, AppRoot } from '@repo/core-logic';

const container = new Container();
container.bind({ provide: APP_CONFIG, useValue: { api: '/api' } });
container.get(AppRoot).start();
```

---

## 15. Reference API (v1.1.0)

- `@injectable()`
- `Container` — `.bind()`, `.bindAll()`, `.get()`, `.getAsync()`, `.createChild()`, `.unbind()`
- `bootstrap()`, `bootstrapAsync()`
- `inject()`, `injectAsync()`
- `InjectionToken<T>`
- Provider types: `useClass`, `useValue`, `useFactory`, `useExisting`
- Options: `multi`, `lazy`, `optional`, `async`

---

## 16. Common Gotchas

- Don’t enable `emitDecoratorMetadata`; Needle DI doesn’t use reflection.  
- Use native decorators (`"target": "ES2022"`).  
- Use `injectAsync` / `getAsync` for async providers.  
- Avoid calling `bootstrap()` multiple times (creates new containers).  
- With tsup/esbuild, ensure `"target": "es2022"` for decorator emission.

---

## 17. Quick Reference Scripts

In your **workspace root `package.json`**:

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test"
  }
}
```

Each **package** (`core-logic`, etc.):

```json
{
  "scripts": {
    "build": "tsup",
    "test": "vitest run"
  }
}
```

---

## 18. Summary

| Feature | Needle DI v1.1.0 Support |
|----------|--------------------------|
| Stage-3 Decorators | ✅ Native |
| Reflection-free | ✅ |
| Works with tsup / esbuild | ✅ |
| Works in browser (Vite) | ✅ |
| Async providers | ✅ |
| Lazy / Multi / Optional | ✅ |
| Child containers | ✅ |
| Perfect for Monorepos | ✅ |

