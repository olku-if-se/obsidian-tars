# Monorepo Validation Toolkit

Inspired by ADR-006, the workspace now includes a set of repeatable validation commands that keep dependency graphs, package metadata, and dead-code checks aligned as the repository grows.

## Available Commands

- `pnpm check:syncpack`  
  Verifies that dependency versions and ranges stay consistent across every workspace package using `syncpack@alpha`.

- `pnpm check:manypkg`  
  Runs the Manypkg workspace audit to surface misconfigured package relationships or missing fields.

- `pnpm check:knip`  
  Executes Knip using the monorepo-aware configuration in `knip.json` to detect unused exports, files, and dependencies.

- `pnpm check:ncu`  
  Launches an interactive dependency freshness review powered by `npm-check-updates`.

- `pnpm check:all`  
  Convenience wrapper that chains the Syncpack, Manypkg, and Knip checks.

- `pnpm fix:syncpack` / `pnpm fix:manypkg`  
  Applies automated fixes provided by each validation tool via `pnpm dlx`.

- `pnpm update:dependencies`  
  Interactive dependency upgrade flow scoped to the current workspaces.

## Configuration Notes

- `.syncpackrc.cjs` enforces shared dependency ranges (`^`) for every workspace package.
- `knip.json` is scoped to the `apps/*`, `packages/*`, and `tools/*` workspaces and ignores build output such as `dist/**`.
- Dependency Cruiser ignores `dist/` output so `pnpm graph:imports` reflects only source relationships.

## Suggested Workflow

1. Run `pnpm check:all` before opening pull requests to catch dependency drift and dead code early.
2. Use `pnpm fix:syncpack` or `pnpm fix:manypkg` to apply automated corrections, then follow up with `pnpm check:all`.
3. Schedule a periodic (e.g., weekly) pass with `pnpm check:ncu` to keep external dependencies current.
