# Secrets Management - Quick Start 🔐

## TL;DR

```bash
# 1. Setup (one-time)
mise run secrets-init

# 2. Add your API keys
mise run secrets-edit

# 3. Run E2E tests
mise run test-e2e
```

---

## Commands

| Command | Description |
|---------|-------------|
| `mise run secrets-init` | 🔐 Initialize SOPS + generate age key |
| `mise run secrets-edit` | ✏️  Edit encrypted secrets |
| `mise run secrets-rotate KEY VALUE` | 🔄 Rotate single API key |
| `mise run secrets-show` | 👁️  View decrypted secrets (careful!) |
| `mise run test-e2e` | 🔬 Run E2E tests with secrets loaded |

---

## First Time Setup

### 1. Initialize

```bash
mise run secrets-init
```

**Output**:
```
🔐 Setting up SOPS encrypted secrets...
📝 Generating new age key...
✅ Age key generated: .secrets/mise-age.txt
⚠️  IMPORTANT: Backup this key file!
📋 Your public key: age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
✅ Created encrypted .env.secrets.json

📝 Next steps:
   1. Edit secrets: mise run secrets-edit
   2. Add your API keys
   3. Save and exit
```

### 2. Add Your API Keys

```bash
mise run secrets-edit
```

**Edit this JSON**:
```json
{
  "OPENAI_API_KEY": "sk-proj-YOUR_ACTUAL_KEY_HERE",
  "ANTHROPIC_API_KEY": "sk-ant-YOUR_ACTUAL_KEY_HERE",
  "GROK_API_KEY": "xai-YOUR_ACTUAL_KEY_HERE"
}
```

Save and exit. File is automatically encrypted!

### 3. Run Tests

```bash
mise run test-e2e
```

**Output**:
```
🔬 Running E2E tests...
✅ OPENAI_API_KEY loaded from .env.secrets.json
🧪 Running OpenAI provider tests...
```

---

## Rotating API Keys

### Quick Rotation (Single Key)

```bash
# Rotate OpenAI key
mise run secrets-rotate OPENAI_API_KEY sk-proj-new-key-here

# Rotate Anthropic key
mise run secrets-rotate ANTHROPIC_API_KEY sk-ant-new-key-here

# Rotate Grok key
mise run secrets-rotate GROK_API_KEY xai-new-key-here
```

**Output**:
```
🔄 Rotating key: OPENAI_API_KEY

Current value: sk-proj-old-key-he...***
New value:     sk-proj-new-key-he...***

✅ Successfully rotated OPENAI_API_KEY

💡 Verify with: mise run secrets-show | grep OPENAI_API_KEY
```

**Benefits**:
- ✅ No need to open editor
- ✅ One command per key
- ✅ Shows before/after (masked)
- ✅ Automatic re-encryption

---

## What's Safe to Commit?

| File | Commit? | Description |
|------|---------|-------------|
| `.env.secrets.json` | ✅ YES | Encrypted secrets (safe) |
| `.secrets/mise-age.txt` | ❌ NO | Private key (gitignored) |
| `.env` | ❌ NO | Plaintext (gitignored) |
| `mise.toml` | ✅ YES | Config (no secrets) |

---

## Verify Setup

```bash
# Check if secrets are encrypted
cat .env.secrets.json
# Should show: "ENC[AES256_GCM,data:..." (encrypted ✅)

# Check if they decrypt
mise run secrets-show
# Should show: "sk-proj-..." (plaintext ✅)

# Check if environment loads them
mise run test-e2e
# Should run tests (loaded ✅)
```

---

## Backup Your Key! ⚠️

```bash
# Copy to secure location
cp .secrets/mise-age.txt ~/secure-backup/obsidian-tars-age-key.txt

# Or use a password manager
cat .secrets/mise-age.txt
# Copy and save in 1Password/Bitwarden/etc.
```

**Without this key, you cannot decrypt secrets!**

---

## Full Documentation

See [`docs/SECRETS_MANAGEMENT.md`](docs/SECRETS_MANAGEMENT.md) for:
- Team collaboration
- CI/CD integration  
- Advanced usage
- Troubleshooting

---

## Architecture

```
┌─────────────────────────────────────────┐
│ mise run test-e2e                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ mise.toml                               │
│ Loads: .env.secrets.json                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ SOPS decrypts using                     │
│ .secrets/mise-age.txt                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Environment Variables                   │
│ export OPENAI_API_KEY=sk-proj-...       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ E2E Tests Run                           │
│ Using real API keys                     │
└─────────────────────────────────────────┘
```

---

**Status**: ✅ Ready to use  
**Security**: 🔐 age-encrypted  
**Setup time**: < 2 minutes
