# Secrets Management with SOPS

## Overview

This project uses **SOPS** (Secrets OPerationS) with **age** encryption to securely manage API keys and other sensitive configuration.

**Benefits**:
- ✅ Encrypted secrets stored in git (safe to commit)
- ✅ Easy editing with automatic encryption/decryption
- ✅ Team-friendly (share public keys, not secrets)
- ✅ Works seamlessly with mise tool
- ✅ No plaintext API keys in environment

---

## Quick Start

### 1. Initialize SOPS

```bash
mise run secrets-init
```

This will:
- Generate an age encryption key (`.secrets/mise-age.txt`)
- Create encrypted secrets template (`.env.secrets.json`)
- Display your public key

**⚠️ IMPORTANT**: Backup `.secrets/mise-age.txt` - you need it to decrypt secrets!

### 2. Edit Secrets

```bash
mise run secrets-edit
```

This opens `.env.secrets.json` in your default editor (usually `$EDITOR` or vi/vim).

**Template structure**:
```json
{
  "OPENAI_API_KEY": "sk-proj-YOUR_KEY_HERE",
  "ANTHROPIC_API_KEY": "sk-ant-YOUR_KEY_HERE",
  "GROK_API_KEY": "xai-YOUR_KEY_HERE"
}
```

Replace the placeholder values with your actual API keys.

### 3. Run E2E Tests

```bash
mise run test-e2e
```

This automatically loads secrets from `.env.secrets.json` and runs the E2E tests.

---

## How It Works

### Architecture

```
┌──────────────────────────────────────┐
│ .env.secrets.json (ENCRYPTED)        │
│ Safe to commit to git                │
└──────────────┬───────────────────────┘
               │
               │ SOPS decrypts using
               │ .secrets/mise-age.txt
               │
               ▼
┌──────────────────────────────────────┐
│ Environment Variables                 │
│ OPENAI_API_KEY=sk-proj-...           │
│ Available to tests & tasks           │
└──────────────────────────────────────┘
```

### mise.toml Configuration

```toml
[settings]
experimental = true
sops.age_key_file = ".secrets/mise-age.txt"
sops.rops = false
sops.strict = false

[env]
MISE_SOPS_AGE_KEY_FILE = ".secrets/mise-age.txt"
SOPS_AGE_KEY_FILE = "{{env.MISE_SOPS_AGE_KEY_FILE}}"
_.file = [".env.secrets.json", ".env"]
```

---

## Available Commands

### secrets-init
Initialize SOPS encryption setup.

```bash
mise run secrets-init
```

**What it does**:
1. Creates `.secrets/` directory
2. Generates age key pair
3. Creates encrypted `.env.secrets.json` template

### secrets-edit
Edit encrypted secrets securely.

```bash
mise run secrets-edit
```

**What it does**:
1. Decrypts `.env.secrets.json`
2. Opens in your editor
3. Re-encrypts on save

### secrets-show
View decrypted secrets (be careful!).

```bash
mise run secrets-show
```

**Output**:
```json
{
  "OPENAI_API_KEY": "sk-proj-actual-key-here",
  "ANTHROPIC_API_KEY": "sk-ant-actual-key-here"
}
```

**⚠️ WARNING**: Only use in secure terminal - secrets displayed in plaintext!

### secrets-rotate
Rotate a single API key quickly (no editor needed).

```bash
mise run secrets-rotate KEY_NAME new-api-key-value
```

**Examples**:
```bash
# Rotate OpenAI key
mise run secrets-rotate OPENAI_API_KEY sk-proj-new-key-here

# Rotate Anthropic key
mise run secrets-rotate ANTHROPIC_API_KEY sk-ant-new-key-here

# Rotate Grok key
mise run secrets-rotate GROK_API_KEY xai-new-key-here
```

**What it does**:
1. Validates key name format
2. Shows current value (masked for security)
3. Shows new value (masked for security)
4. Updates encrypted file with new key
5. Re-encrypts automatically

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
- ✅ One command per key rotation
- ✅ Shows before/after (safely masked)
- ✅ Automatic encryption
- ✅ Script-friendly (can be automated)

### test-e2e
Run E2E tests with secrets loaded.

```bash
mise run test-e2e
```

**What it does**:
1. Checks if `OPENAI_API_KEY` is available
2. Runs OpenAI provider E2E tests
3. Uses encrypted secrets automatically

---

## File Structure

```
obsidian-tars/
├── .secrets/
│   └── mise-age.txt          # 🔑 PRIVATE KEY (gitignored, backup!)
├── .env.secrets.json         # 🔐 ENCRYPTED secrets (safe to commit)
├── mise.toml                 # ⚙️  SOPS configuration
└── docs/
    └── SECRETS_MANAGEMENT.md # 📚 This file
```

### .secrets/mise-age.txt
**Private age key** - Keep secure, never commit!

Example:
```
# created: 2025-01-22T12:00:00Z
# public key: age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AGE-SECRET-KEY-1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### .env.secrets.json
**Encrypted secrets** - Safe to commit to git.

Example (encrypted):
```json
{
  "OPENAI_API_KEY": "ENC[AES256_GCM,data:...,iv:...,tag:...,type:str]",
  "sops": {
    "kms": null,
    "gcp_kms": null,
    "azure_kv": null,
    "hc_vault": null,
    "age": [
      {
        "recipient": "age1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "enc": "-----BEGIN AGE ENCRYPTED FILE-----\n..."
      }
    ],
    "lastmodified": "2025-01-22T12:00:00Z",
    "mac": "ENC[AES256_GCM,data:...,iv:...,tag:...,type:str]",
    "pgp": null,
    "unencrypted_suffix": "_unencrypted",
    "version": "3.7.1"
  }
}
```

---

## Security Best Practices

### ✅ DO

- **Backup `.secrets/mise-age.txt`** to a secure location
- Commit `.env.secrets.json` (it's encrypted)
- Use `mise run secrets-edit` to modify secrets
- Share your **public key** with team (age1...)
- Keep your **private key** secret

### ❌ DON'T

- Commit `.secrets/mise-age.txt` (private key)
- Commit unencrypted `.env` files with secrets
- Share your private key in chat/email
- Store private key in cloud without encryption
- Use `echo $OPENAI_API_KEY` in CI logs

---

## Team Collaboration

### For Team Lead (First Setup)

1. Initialize SOPS:
   ```bash
   mise run secrets-init
   ```

2. Add team members' public keys to `.sops.yaml`:
   ```yaml
   creation_rules:
     - age: >-
         age1lead...,
         age1dev1...,
         age1dev2...
   ```

3. Re-encrypt secrets for all recipients:
   ```bash
   sops updatekeys .env.secrets.json
   ```

4. Commit encrypted `.env.secrets.json`

### For Team Members (Joining)

1. Generate your age key:
   ```bash
   mise run secrets-init
   ```

2. Share your **public key** (age1...) with team lead

3. After lead adds your key, pull latest:
   ```bash
   git pull
   ```

4. You can now decrypt secrets:
   ```bash
   mise run secrets-show
   ```

---

## CI/CD Integration

### GitHub Actions

Add age key as secret:

1. Go to repository Settings → Secrets → Actions
2. Add secret: `SOPS_AGE_KEY`
3. Value: Contents of `.secrets/mise-age.txt`

**Workflow**:
```yaml
- name: Install mise
  uses: jdx/mise-action@v2

- name: Setup age key
  env:
    SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
  run: |
    mkdir -p .secrets
    echo "$SOPS_AGE_KEY" > .secrets/mise-age.txt
    chmod 600 .secrets/mise-age.txt

- name: Run E2E tests
  run: mise run test-e2e
```

---

## Troubleshooting

### "age: no identity matched any recipient"

**Problem**: Your age key doesn't match the encrypted file.

**Solution**:
```bash
# Check your public key
grep "# public key:" .secrets/mise-age.txt

# Re-encrypt with your key
mise run secrets-init
```

### "OPENAI_API_KEY not set"

**Problem**: Secrets not loaded into environment.

**Solution**:
```bash
# Verify secrets file exists
ls -la .env.secrets.json

# Check if it decrypts
mise run secrets-show

# Ensure mise loads it
mise run test-e2e
```

### "sops: command not found"

**Problem**: SOPS not installed.

**Solution**:
```bash
# mise will auto-install when you run mise commands
mise install

# Or manually
mise use sops@latest
```

### "age-keygen: command not found"

**Problem**: age not installed.

**Solution**:
```bash
# mise will auto-install
mise install

# Or manually
mise use age@latest
```

---

## Advanced Usage

### Multiple Secret Files

Add to `mise.toml`:
```toml
[env]
_.file = [
  ".env.secrets.json",
  ".env.secrets.production.json",
  ".env.secrets.staging.json",
  ".env"
]
```

### Rotating API Keys (Automated)

Use `secrets-rotate` for scripted key rotation:

```bash
#!/bin/bash
# rotate-all-keys.sh - Rotate all API keys from secure vault

OPENAI_KEY=$(vault read -field=api_key secret/openai)
ANTHROPIC_KEY=$(vault read -field=api_key secret/anthropic)
GROK_KEY=$(vault read -field=api_key secret/grok)

mise run secrets-rotate OPENAI_API_KEY "$OPENAI_KEY"
mise run secrets-rotate ANTHROPIC_API_KEY "$ANTHROPIC_KEY"
mise run secrets-rotate GROK_API_KEY "$GROK_KEY"

echo "✅ All keys rotated successfully"
```

**CI/CD Example** (GitHub Actions):
```yaml
- name: Rotate OpenAI Key
  env:
    SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
    NEW_OPENAI_KEY: ${{ secrets.NEW_OPENAI_KEY }}
  run: |
    echo "$SOPS_AGE_KEY" > .secrets/mise-age.txt
    mise run secrets-rotate OPENAI_API_KEY "$NEW_OPENAI_KEY"
    git commit -am "chore: rotate OpenAI API key"
    git push
```

### Rotating Encryption Keys

1. Generate new age key:
   ```bash
   age-keygen -o .secrets/mise-age-new.txt
   ```

2. Update SOPS config:
   ```bash
   sops --rotate --add-age "$(grep 'public key:' .secrets/mise-age-new.txt | cut -d: -f2)" .env.secrets.json
   ```

3. Remove old key after verification

### Different Encryption Formats

SOPS supports:
- JSON (default, recommended)
- YAML
- ENV
- INI
- Binary

Example YAML:
```yaml
# .env.secrets.yaml
OPENAI_API_KEY: sk-proj-...
ANTHROPIC_API_KEY: sk-ant-...
```

Update `mise.toml`:
```toml
[env]
_.file = [".env.secrets.yaml"]
```

---

## References

- **SOPS Documentation**: https://github.com/getsops/sops
- **age Encryption**: https://age-encryption.org/
- **mise SOPS Integration**: https://mise.jdx.dev/environments/secrets/sops.html
- **mise Documentation**: https://mise.jdx.dev/

---

## Summary

**Setup** (one-time):
```bash
mise run secrets-init
mise run secrets-edit  # Add your API keys
```

**Daily use**:
```bash
mise run test-e2e      # Secrets auto-loaded
```

**Team sharing**:
- Share public key (age1...)
- Never share `.secrets/mise-age.txt`
- Commit `.env.secrets.json` (encrypted)

**Backup**:
- Keep `.secrets/mise-age.txt` backed up securely
- Without it, you can't decrypt secrets!

---

**Status**: ✅ Production Ready  
**Security**: 🔐 age-encrypted  
**Team-Friendly**: ✅ Public key sharing  
**CI/CD**: ✅ GitHub Actions compatible
