#!/bin/bash
# Validate monorepo structure - Run from anywhere in the monorepo
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🔍 Validating monorepo structure..."
echo "Monorepo root: $MONOREPO_ROOT"
echo ""

cd "$MONOREPO_ROOT"

# Check pnpm version
echo "Checking pnpm..."
pnpm --version || (echo "❌ pnpm not installed" && exit 1)

# Check turbo version
echo "Checking turbo..."
pnpm turbo --version || (echo "❌ turbo not installed" && exit 1)

# Check workspace config
echo "Checking workspace configuration..."
[ -f "pnpm-workspace.yaml" ] || (echo "❌ pnpm-workspace.yaml missing" && exit 1)

# Check turbo config
echo "Checking turbo configuration..."
[ -f "turbo.json" ] || (echo "❌ turbo.json missing" && exit 1)

# Check packages directory
echo "Checking packages directory..."
[ -d "packages/plugin" ] || (echo "❌ packages/plugin missing" && exit 1)

# Validate package.json
echo "Checking package.json..."
[ -f "packages/plugin/package.json" ] || (echo "❌ packages/plugin/package.json missing" && exit 1)

# Run a quick test build
echo "Running test build..."
pnpm --filter obsidian-tars build > /dev/null 2>&1 || (echo "❌ Build failed" && exit 1)

echo ""
echo "✅ Monorepo structure validated successfully!"
