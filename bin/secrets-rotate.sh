#!/bin/bash
set -e

KEY_NAME="$1"
KEY_VALUE="$2"

if [[ -z "$KEY_NAME" ]] || [[ -z "$KEY_VALUE" ]]; then
  echo "❌ Error: Missing arguments"
  echo ""
  echo "Usage:"
  echo "  mise run secrets-rotate KEY_NAME new-api-key-value"
  echo ""
  echo "Examples:"
  echo "  mise run secrets-rotate E2E_OPENAI_API_KEY sk-proj-new-key-here"
  echo "  mise run secrets-rotate E2E_ANTHROPIC_API_KEY sk-ant-new-key-here"
  echo "  mise run secrets-rotate E2E_GROK_API_KEY xai-new-key-here"
  echo ""
  echo "Available keys:"
  sops --decrypt .env.secrets.json 2>/dev/null | grep -o '"[^"]*_API_KEY"' | tr -d '"' || echo "  (Unable to read current keys)"
  exit 1
fi

# Check if secrets file exists, create if not
if [[ ! -f .env.secrets.json ]]; then
  echo "⚠️  .env.secrets.json not found, creating it..."
  echo ""
  
  # Create .secrets directory
  mkdir -p .secrets
  
  # Generate age key if it doesn't exist
  if [[ ! -f .secrets/mise-age.txt ]]; then
    echo "📝 Generating new age key..."
    age-keygen -o .secrets/mise-age.txt
    echo "✅ Age key generated: .secrets/mise-age.txt"
    echo ""
  fi
  
  # Extract public key
  PUBLIC_KEY=$(grep "# public key:" .secrets/mise-age.txt | cut -d: -f2 | xargs)
  
  # Create empty encrypted secrets file
  echo '{}' | sops --encrypt --age "$PUBLIC_KEY" /dev/stdin > .env.secrets.json
  
  echo "✅ Created encrypted .env.secrets.json"
  echo ""
fi

# Validate key name format (should end with _API_KEY or similar)
if [[ ! "$KEY_NAME" =~ _KEY$ ]] && [[ ! "$KEY_NAME" =~ _TOKEN$ ]] && [[ ! "$KEY_NAME" =~ _SECRET$ ]]; then
  echo "⚠️  Warning: Key name '$KEY_NAME' doesn't follow convention (*_KEY, *_TOKEN, *_SECRET)"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

echo "🔄 Rotating key: $KEY_NAME"
echo ""

# Show current value (first 20 chars only)
CURRENT_VALUE=$(sops --decrypt .env.secrets.json 2>/dev/null | grep -o "\"$KEY_NAME\": \"[^\"]*\"" | cut -d'"' -f4 || echo "(not set)")
if [[ ${#CURRENT_VALUE} -gt 20 ]]; then
  CURRENT_DISPLAY="${CURRENT_VALUE:0:20}...***"
else
  CURRENT_DISPLAY="$CURRENT_VALUE"
fi

echo "Current value: $CURRENT_DISPLAY"

# Show new value (first 20 chars only)
if [[ ${#KEY_VALUE} -gt 20 ]]; then
  NEW_DISPLAY="${KEY_VALUE:0:20}...***"
else
  NEW_DISPLAY="$KEY_VALUE"
fi
echo "New value:     $NEW_DISPLAY"
echo ""

# Update the key using sops --set
# Note: sops --set uses JSONPath-like syntax
sops --set "[\"$KEY_NAME\"] \"$KEY_VALUE\"" .env.secrets.json

echo "✅ Successfully rotated $KEY_NAME"
echo ""
echo "💡 Verify with: mise run secrets-show | grep $KEY_NAME"
