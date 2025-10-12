#!/bin/bash
set -e

echo "🔍 Validating monorepo structure..."

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

echo "✅ Monorepo structure validated successfully!"
