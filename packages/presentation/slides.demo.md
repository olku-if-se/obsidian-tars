---
# Technical Presentation: AI-Powered Monorepo Migration
theme: default
highlighter: shiki
lineNumbers: true
monaco: true
layout: cover
---

# AI-Powered Monorepo Migration
## From Plugin to Production

**Your Key Takeaway:** Use AI for planning and executing complex tasks with small verifiable steps

<presentation-duration minutes="5" slides="4" timing="1:15"/>

---

# Migration Nightmare?

<v-clicks>

**The Problem:**
- Complex refactoring overwhelms developers
- Where do you even start?
- Risk of breaking existing functionality

**The Reality:**
> "I know I need to migrate to monorepo, but the complexity is paralyzing"

</v-clicks>

---

# The Monorepo Solution

<v-clicks>

**Core Tools:**
- **pnpm workspaces** - Fast, disk-efficient package management
- **Turborepo** - Build orchestration and caching
- **tsup** - Zero-config TypeScript bundler

**Latest Releases:**
- pnpm: [v9.12.2](https://github.com/pnpm/pnpm/releases/latest)
- Turborepo: [v2.2.3](https://github.com/vercel/turborepo/releases/latest)
- tsup: [v8.3.0](https://github.com/egoist/tsup/releases/latest)

</v-clicks>

```bash
# Example workspace structure
packages/
  plugin/        # Your Obsidian plugin
  ui/           # React components
  shared/       # Common utilities
```

---

# AI Does the Heavy Lifting

<v-clicks>

**Step 1: Ask AI to Plan**
> "Plan my Obsidian plugin migration to pnpm workspaces + Turborepo + tsup"

**Step 2: Document Each Phase**
- Dependency analysis
- Workspace configuration
- Build pipeline setup
- Testing strategy

**Step 3: Execute with Verification**
- Each step validated before proceeding
- Developer reviews and approves all changes

</v-clicks>

```typescript
// Example: AI-planned migration step
interface MigrationStep {
  phase: 'workspace-setup' | 'dependency-migration' | 'build-config'
  command: string
  verification: string
  rollback?: string
}
```

---

# Your Migration Starts Now

<v-clicks>

**See It In Action:**
- **Git History**: [obsidian-tars](https://github.com/yourusername/obsidian-tars/commits/main)
- **Transformation**: From single plugin to multi-package monorepo
- **AI Planning**: Every step documented and validated

**Your Call to Action:**
> Go plan your first migration with AI

**Key Insight:**
> AI handles complexity, you maintain control

</v-clicks>

---

# Q&A

**Questions?**
- How has AI planning changed your development workflow?
- What migration challenges are you facing?
- Ready to try AI-powered planning on your next project?

**Thank you!** 🚀

---

## Appendix: Migration Planning Template

**For your next project migration:**

1. **Define Scope**: "Migrate X project to monorepo using pnpm + Turborepo"

2. **Request Planning**: "Break this into 5-7 verifiable steps with latest tool versions"

3. **Review Plan**: Read, understand, modify each step

4. **Execute Sequentially**: Verify each step before proceeding

5. **Document Everything**: Git commits show the transformation journey

**Tools to Install:**
```bash
npm install -g pnpm@latest turborepo@latest tsup@latest
```

---

## Further Resources

- **pnpm Docs**: [pnpm.io/workspaces](https://pnpm.io/workspaces)
- **Turborepo**: [turbo.build/repo/docs](https://turbo.build/repo/docs)
- **tsup**: [tsup.egoist.dev](https://tsup.egoist.dev)
- **Monorepo Best Practices**: [monorepo.tools](https://monorepo.tools)

---

## About This Presentation

**Created with**: Slidev Presentation Builder
**Duration**: 5 minutes (4 slides × 1:15 per slide)
**Style**: Technical deep-dive for experienced developers
**Demo**: Real project transformation via git history

**Key Message**: AI transforms overwhelming complexity into manageable, verifiable steps
