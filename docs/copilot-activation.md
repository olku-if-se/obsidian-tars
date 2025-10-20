# 🚀 Complete Guide: GitHub Copilot CLI Activation for Organizations & Users

### 📋 Prerequisites
- GitHub account with Copilot subscription (Pro, Business, or Enterprise)
- GitHub CLI installed (`gh --version` should show 2.82.0+)
- Organization admin access (for organization setup)
- Proper network access to GitHub services

---

## 👤 Part 1: Individual User Setup

### Step 1: Install GitHub CLI
```bash
# On macOS
brew install gh

# On Ubuntu/Debian
sudo apt install gh

# On Windows
winget install GitHub.cli

# Verify installation
gh --version
```

### Step 2: Authenticate with GitHub
```bash
# Login to GitHub
gh auth login

# Follow the interactive prompts:
# 1. What account do you want to log into? → GitHub.com
# 2. What is your preferred protocol? → HTTPS
# 3. Authenticate with GitHub now? → Press Enter
# 4. Open browser → Y (to complete authentication)
# 5. Paste authentication code from browser
```

### Step 3: Verify Authentication
```bash
# Check authentication status
gh auth status

# Expected output:
# github.com
#   ✓ Logged in to github.com account your-username
#   ✓ Active account: true
#   ✓ Token: gho_************************************
#   ✓ Token scopes: 'gist', 'read:org', 'repo'
```

### Step 4: Install Copilot CLI Extension
```bash
# Install the Copilot extension
gh extension install github/gh-copilot

# Update to latest version
gh extension upgrade gh-copilot

# Verify installation
gh copilot --version
# Expected: version 1.1.1 (or newer)
```

### Step 5: Test Basic Functionality
```bash
# Test command suggestion
gh copilot suggest "list all files recursively" --target shell

# Test command explanation
gh copilot explain "find . -name '*.js' -type f"

# Test with specific target
gh copilot suggest "create new branch" --target git
```

### Step 6: Configure Copilot CLI (Optional)
```bash
# Open configuration menu
gh copilot config

# Configure settings:
# - Usage analytics (yes/no)
# - Default execution confirmation (yes/no)
# - Output preferences
```

---

## 🏢 Part 2: Organization Administrator Setup

### Step 1: Access Organization Settings
1. **Navigate to GitHub Organization**
   - Go to https://github.com/organizations/your-org-name
   - Click **Settings** tab

2. **Locate Copilot Settings**
   - In left sidebar, click **Copilot** under "Code, planning, and automation"

### Step 2: Enable Copilot for Organization
```markdown
In Organization Copilot Settings:

✅ General → Enable Copilot for your organization
✅ Policies → Allow Copilot Chat
✅ Policies → Allow preview features (for GPT-5-Codex access)
✅ Policies → Enable all available models
```

### Step 3: Configure Model Policies
1. **Model Access Policy**
   ```
   ✅ Allow users to select from all available models
   ✅ Include OpenAI models (GPT-4, GPT-4o, O1, O3 series)
   ✅ Include Anthropic models (Claude)
   ✅ Include Google models (Gemini)
   ✅ Enable preview models (GPT-5 series when available)
   ```

2. **Feature Policies**
   ```
   ✅ Enable Copilot Chat
   ✅ Enable Copilot Agents
   ✅ Allow multi-line suggestions
   ✅ Enable voice input (if available)
   ```

### Step 4: Manage User Licenses
1. **Navigate to License Management**
   - Organization Settings → Billing → Plans and usage
   - Click **Copilot** tab

2. **Assign Copilot Seats**
   ```
   For each user:
   ✅ Assign Copilot license
   ✅ Verify user has accepted invitation
   ✅ Confirm user email is verified
   ```

3. **Team-Based Assignment** (Recommended)
   - Create teams: `developers`, `leads`, `contractors`
   - Assign Copilot seats to teams
   - Set team-specific policies if needed

### Step 5: Configure Enterprise-Level Policies** (if applicable)
```markdown
Enterprise Admin Console:
1. Enterprise Settings → Copilot → Policies
2. Configure enterprise-wide defaults
3. Allow organization overrides (if desired)
4. Enable audit logging for compliance
```

---

## 🔑 Part 3: Advanced User Configuration

### Step 1: Set Up Shell Aliases
```bash
# Generate aliases for your shell
gh copilot alias

# For Bash (add to ~/.bashrc)
eval "$(gh copilot alias -s bash)"

# For Zsh (add to ~/.zshrc)
eval "$(gh copilot alias -s zsh)"

# For Fish (add to ~/.config/fish/config.fish)
gh copilot alias -s fish | source

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc
```

### Step 2: Configure Environment Variables
```bash
# Add to ~/.bashrc, ~/.zshrc, or shell profile
export GITHUB_TOKEN=$(gh auth token)
export GH_COPILOT_MODEL="openai/o1-mini"
export GH_COPILOT_MAX_TOKENS="500"
export GH_COPILOT_DEFAULT_TARGET="shell"

# Make sure to source the file or restart terminal
source ~/.bashrc
```

### Step 3: Create Custom Functions
```bash
# Add to ~/.bashrc or ~/.zshrc
# Function to quickly ask coding questions
ask-copilot() {
    gh copilot suggest "$1" --target shell
}

# Function to explain commands
explain() {
    gh copilot explain "$1"
}

# Function to get git help
git-help() {
    gh copilot suggest "$1" --target git
}
```

---

## 🔌 Part 4: API Access & Model Integration

### Step 1: Verify GitHub Models API Access
```bash
# Test connection to GitHub Models API
curl -X GET "https://models.github.ai/catalog/models" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "X-GitHub-Api-Version: 2022-11-28" | jq '.[0:5] | .[].name'
```

### Step 2: Test Model Inference
```bash
# Test with coding model
curl -X POST "https://models.github.ai/inference/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d '{
    "model": "openai/o1-mini",
    "messages": [{"role": "user", "content": "Write a Python function to check if a number is prime"}],
    "max_completion_tokens": 200
  }'
```

### Step 3: Create API Wrapper Script
```bash
# Create file: ~/bin/github-ai
#!/bin/bash

MODEL=${1:-"openai/gpt-4.1"}
PROMPT=${2:-"Hello, world!"}

curl -X POST "https://models.github.ai/inference/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -d "{
    \"model\": \"$MODEL\",
    \"messages\": [{\"role\": \"user\", \"content\": \"$PROMPT\"}],
    \"max_tokens\": 300
  }" | jq -r '.choices[0].message.content'

# Make it executable
chmod +x ~/bin/github-ai
```

---

## 🔍 Part 5: Verification & Troubleshooting

### Step 1: Complete System Check
```bash
#!/bin/bash
# Create file: copilot-health-check.sh

echo "🔍 GitHub Copilot CLI Health Check"
echo "================================="

# Check 1: GitHub CLI
echo "1. GitHub CLI Version:"
gh --version
echo ""

# Check 2: Authentication
echo "2. Authentication Status:"
gh auth status
echo ""

# Check 3: Copilot Extension
echo "3. Copilot Extension:"
gh copilot --version
echo ""

# Check 4: Models API Access
echo "4. Models API Access:"
MODEL_COUNT=$(curl -s "https://models.github.ai/catalog/models" \
  -H "Authorization: Bearer $(gh auth token)" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" | jq length 2>/dev/null || echo "API Error")
echo "Available models: $MODEL_COUNT"
echo ""

# Check 5: Test Copilot CLI
echo "5. Copilot CLI Test:"
echo "Testing command suggestion..."
echo "date" | gh copilot suggest --target shell 2>/dev/null && echo "✅ Copilot CLI working" || echo "❌ Copilot CLI failed"
echo ""

# Check 6: Token Scopes
echo "6. Token Scopes:"
gh auth status | grep "Token scopes"
echo ""

echo "✅ Health check complete!"
```

### Step 2: Common Issues & Solutions

**Issue: "Not logged in"**
```bash
# Solution: Re-authenticate
gh auth login
```

**Issue: "Insufficient scopes"**
```bash
# Solution: Refresh token with Copilot scopes
gh auth refresh --scopes "copilot,read:org,repo,gist"
```

**Issue: "Copilot extension not found"**
```bash
# Solution: Reinstall extension
gh extension remove gh-copilot
gh extension install github/gh-copilot
```

**Issue: "Organization policy restriction"**
```bash
# Solution: Contact organization admin
# Ask to enable:
# - Copilot Chat
# - Preview features
# - Specific models (O1, O3, GPT-5 series)
```

**Issue: "Models API access denied"**
```bash
# Solution: Check subscription
# Verify: GitHub Settings > Billing > Copilot subscription active
# Organization: Ensure user has Copilot license assigned
```

---

## 📚 Part 6: Usage Examples & Best Practices

### Daily Workflow Examples
```bash
# Git operations
gh copilot suggest "create new feature branch from main" --target git
gh copilot explain "git rebase -i HEAD~3"

# File operations
gh copilot suggest "find all Python files modified in last 24 hours" --target shell
gh copilot suggest "compress all images in current directory" --target shell

# Development tasks
gh copilot suggest "run tests for modified files" --target shell
gh copilot suggest "setup virtual environment for Python project" --target shell

# System administration
gh copilot suggest "check disk space usage" --target shell
gh copilot explain "docker ps -a"
```

### Best Practices
1. **Use specific targets** (`--target git`, `--target shell`) for better results
2. **Provide context** in your prompts for more accurate suggestions
3. **Verify suggestions** before executing, especially for destructive commands
4. **Use aliases** for frequently used operations
5. **Keep authentication updated** by running `gh auth status` periodically

### Organization Management Best Practices
1. **Regular license audits** to ensure proper seat allocation
2. **Team-based policies** for different access levels
3. **Enable audit logging** for compliance and security
4. **User training** on effective Copilot usage
5. **Monitor usage metrics** in organization settings

---

## 🎯 Quick Start Checklist

### For Individual Users:
- [ ] GitHub CLI installed and updated
- [ ] Authenticated with `gh auth login`
- [ ] Copilot extension installed with `gh extension install github/gh-copilot`
- [ ] Verified with `gh copilot --version`
- [ ] Tested basic functionality
- [ ] Configured aliases and environment variables (optional)

### For Organization Admins:
- [ ] Copilot enabled for organization
- [ ] Appropriate policies configured
- [ ] User licenses assigned
- [ ] Preview features enabled
- [ ] Teams configured with proper access
- [ ] Audit logging enabled (if required)

### Verification:
- [ ] Run `gh auth status` to confirm authentication
- [ ] Run `gh copilot --version` to confirm extension
- [ ] Test API access to GitHub Models
- [ ] Verify CLI suggestions work
- [ ] Confirm organization users have access

---

## 📖 Additional Resources

### Documentation
- **GitHub CLI Documentation**: https://cli.github.com/manual/
- **Copilot CLI Documentation**: https://cli.github.com/manual/gh_copilot
- **GitHub Copilot for Organizations**: https://docs.github.com/en/copilot/managing-copilot-in-your-organization

### Community & Support
- **GitHub Discussions**: https://github.com/cli/cli/discussions
- **Copilot Extension Issues**: https://github.com/github/gh-copilot/issues
- **GitHub Support**: Available for Enterprise accounts

### Model Information
- **Available Models Catalog**: https://models.github.ai/catalog/models
- **Model Comparison**: https://docs.github.com/en/copilot/overview-of-github-copilot-models
- **Rate Limits and Usage**: https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api

You now have fully functional GitHub Copilot CLI access for both individual use and organization-wide deployment! 🎉