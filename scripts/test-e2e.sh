#!/bin/bash
# Load secrets from encrypted file
if [[ -f .env.secrets.json ]] && [[ -f .secrets/mise-age.txt ]]; then
  echo "🔐 Loading encrypted secrets..."
  eval "$(sops --decrypt .env.secrets.json | jq -r 'to_entries | .[] | "export \(.key)=\"\(.value)\""')"
  echo "✅ Secrets loaded"
  echo ""
else
  echo "⚠️  No encrypted secrets found"
  echo "💡 Run: mise run secrets-rotate OPENAI_API_KEY sk-proj-your-key"
  echo ""
fi

if [[ -z "$OPENAI_API_KEY" ]]; then
  echo "⚠️  OPENAI_API_KEY not set"
  echo "💡 Run: mise run secrets-rotate OPENAI_API_KEY sk-proj-your-key"
  exit 1
fi

echo "🔬 Running E2E tests for all providers..."
echo ""

cd packages/providers

echo "📋 Step 1: Verifying available models..."
pnpm test -- openai-models-verification.e2e.test.ts

echo ""
echo "🧪 Step 2: Running comprehensive callback tests..."
echo "   - OpenAI"
echo "   - Grok (if GROK_API_KEY set)"
echo "   - OpenRouter (if OPENROUTER_API_KEY set)"
echo ""

# Run all E2E callback tests
pnpm test -- tests/e2e/*-comprehensive-callbacks.e2e.test.ts
