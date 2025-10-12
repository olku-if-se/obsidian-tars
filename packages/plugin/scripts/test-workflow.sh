#!/bin/bash
# Test workflow orchestrator
# Guarantees: build → setup vault → launch Obsidian
# Monorepo version: uses pnpm from root

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MONOREPO_ROOT="$(cd "$PLUGIN_DIR/../.." && pwd)"

echo "🚀 Starting MCP Test Workflow (Monorepo)"
echo "=============================="
echo ""

# Step 1: Build
echo "📦 Step 1/3: Building plugin..."
cd "$MONOREPO_ROOT"
pnpm --filter obsidian-tars build
echo "✅ Build complete"
echo ""

# Step 2: Setup vault
echo "🗂️  Step 2/3: Setting up test vault..."
"$SCRIPT_DIR/setup-test-vault.sh"
echo "✅ Vault ready"
echo ""

# Step 3: Launch Obsidian
echo "🚀 Step 3/3: Launching Obsidian..."
"$SCRIPT_DIR/launch-obsidian.sh"

echo ""
echo "=============================="
echo "✅ Workflow complete!"
echo ""
echo "Next: Enable Tars plugin in Obsidian settings"
