# Monorepo Migration - Quick Reference

**Epic**: Epic-1100: Monorepo Migration
**Priority**: P1 - Critical
**Story Points**: 21 SP
**Duration**: 3-4 days (2025-10-12 to 2025-10-15)
**Status**: 📋 Planned (awaiting approval)

---

## 🎯 Why Migrate?

**Problem**: Single package structure limits scalability and code reuse.

**Solution**: pnpm + Turborepo monorepo with plugin in `packages/plugin/`.

**Benefits**:
- ✅ Prepare for MCP client extraction
- ✅ Better dependency management
- ✅ Faster builds with caching
- ✅ Clear package boundaries

---

## 📦 Structure Change

### Before
```
obsidian-tars/
├── src/
├── tests/
├── package.json
└── ...
```

### After
```
obsidian-tars/                    # Monorepo root
├── packages/
│   └── plugin/                   # Plugin code (was root)
│       ├── src/
│       ├── tests/
│       ├── package.json
│       └── ...
├── turbo.json                    # Turborepo config
├── pnpm-workspace.yaml          # Workspace definition
├── package.json                 # Root package
└── ...
```

---

## 📋 Task Breakdown

### Feature-1100-10: Monorepo Setup (5 SP)

**UserStory-1100-10-5**: Initialize Monorepo Structure (5 SP)

| Task | SP | Description |
|------|----|-----------|
| Task-1100-10-5-1 | 1 | Create workspace configuration (pnpm-workspace.yaml) |
| Task-1100-10-5-2 | 1 | Configure Turborepo (turbo.json) |
| Task-1100-10-5-3 | 1 | Create packages directory structure |
| Task-1100-10-5-4 | 1 | Install pnpm and Turborepo |
| Task-1100-10-5-5 | 1 | Validate workspace setup |

**Files Created**:
- `pnpm-workspace.yaml`
- `turbo.json`
- `packages/` directory
- `scripts/validate-monorepo.sh`

---

### Feature-1100-20: Plugin Migration (8 SP)

**UserStory-1100-20-5**: Move Plugin Code to Workspace (8 SP)

| Task | SP | Description |
|------|----|-----------|
| Task-1100-20-5-1 | 2 | Move source files with `git mv` |
| Task-1100-20-5-2 | 2 | Update package.json for plugin |
| Task-1100-20-5-3 | 1 | Update TypeScript configs |
| Task-1100-20-5-4 | 2 | Update build scripts |
| Task-1100-20-5-5 | 1 | Validate plugin build |

**Files Moved**:
- `src/` → `packages/plugin/src/`
- `tests/` → `packages/plugin/tests/`
- `manifest.json`, `styles.css`, configs → `packages/plugin/`

---

### Feature-1100-30: Build & Tooling (5 SP)

**UserStory-1100-30-5**: Update Development Workflow (5 SP)

| Task | SP | Description |
|------|----|-----------|
| Task-1100-30-5-1 | 1 | Update root scripts |
| Task-1100-30-5-2 | 1 | Update Biome configuration |
| Task-1100-30-5-3 | 1 | Update Git workflows (CI/CD) |
| Task-1100-30-5-4 | 1 | Update documentation scripts |
| Task-1100-30-5-5 | 1 | Create root README |

**Files Updated**:
- Root `package.json` (scripts)
- `biome.json` (ignore patterns)
- `.github/workflows/*.yml` (pnpm)
- Root `README.md` (monorepo overview)

---

### Feature-1100-40: Documentation & Validation (3 SP)

**UserStory-1100-40-5**: Update Documentation (3 SP)

| Task | SP | Description |
|------|----|-----------|
| Task-1100-40-5-1 | 1 | Update CLAUDE.md |
| Task-1100-40-5-2 | 1 | Update architecture docs |
| Task-1100-40-5-3 | 1 | Run full validation |

**Files Updated**:
- `CLAUDE.md`
- `docs/MCP_ARCHITECTURE.md`
- `docs/QUICK-START.md`
- `scripts/validate-migration.sh` (new)

---

## 🚀 Quick Start After Migration

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests (all 429 must pass!)
pnpm test

# Build plugin
pnpm build
```

**Plugin-specific commands**:
```bash
# From root
pnpm plugin:dev
pnpm plugin:build
pnpm plugin:test

# Or from plugin directory
cd packages/plugin
pnpm dev
```

---

## ✅ Validation Checklist

Must pass before merge:

- [ ] All 429 tests passing
- [ ] Build output identical to pre-migration
- [ ] `pnpm install` works
- [ ] `pnpm dev` starts dev server
- [ ] `pnpm build` produces correct output
- [ ] `pnpm test` runs successfully
- [ ] Git history preserved
- [ ] Plugin loads in Obsidian
- [ ] Basic AI conversation works
- [ ] MCP tools work
- [ ] Documentation updated

---

## 🔄 Workflow

### Development Workflow
```bash
# Clone repo
git clone <repo>

# Install (uses pnpm now!)
pnpm install

# Dev (Turborepo runs plugin dev)
pnpm dev

# Test (all packages)
pnpm test

# Build (all packages)
pnpm build
```

### CI/CD Workflow
```yaml
# Uses pnpm now
- uses: pnpm/action-setup@v2
  with:
    version: 9.15.0

- run: pnpm install
- run: pnpm test
- run: pnpm build
```

---

## 📅 Timeline

| Day | Phase | Duration | Tasks |
|-----|-------|----------|-------|
| **Day 1** | Preparation | 1 day | Planning, approval, branch creation |
| **Day 2** | Setup + Migration | 6 hours | Setup workspace, move files |
| **Day 2-3** | Validation | 2 hours | Test, lint, build validation |
| **Day 3** | Documentation | 2 hours | Update docs |
| **Day 3-4** | Merge | 1 hour | PR, review, merge |

**Total**: 3-4 days

---

## 🎯 Success Criteria

### Must Have ✅
- All tests pass (429/429)
- Build output identical
- Dev workflow unchanged
- Git history preserved

### Nice to Have 🎁
- Faster CI builds (Turborepo caching)
- Faster installs (pnpm efficiency)
- Clearer structure

---

## 🔙 Rollback Plan

If something goes wrong:

```bash
# Quick rollback (feature branch)
git checkout main
git branch -D feature/monorepo-migration

# Manual rollback (if merged)
git revert <merge-commit-sha> -m 1
```

**Prevention**: Work on feature branch, validate thoroughly before merge.

---

## 📚 Related Documents

- **Full Plan**: [`2025-10-12-monorepo-migration-plan.md`](./2025-10-12-monorepo-migration-plan.md)
- **Trello Board**: [MCP Servers Integration Release](https://trello.com/b/NDXU4w4k)
- **Epic**: Epic-1100

---

## 🎭 Architecture Decisions

**ADR-001**: Use **pnpm** over npm/yarn
- Reason: Fast, efficient, strict peer deps

**ADR-002**: Use **Turborepo** over Nx/Lerna
- Reason: Simple, focused, excellent caching

**ADR-003**: Keep single plugin package initially
- Reason: Lower risk, faster delivery, sets up for future extraction

---

## 🚦 Next Steps

1. **Review this plan** and get approval
2. **Create Trello cards** for Epic-1100
3. **Create feature branch** `feature/monorepo-migration`
4. **Execute migration** following detailed plan
5. **Validate thoroughly** (all 429 tests must pass!)
6. **Update documentation**
7. **Merge to main**

---

**Status**: 📋 Awaiting Approval
**Owner**: Development Team
**Created**: 2025-10-12
