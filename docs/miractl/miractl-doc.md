---
title: miractl — CLI Reference
description: Install, configure, and use miractl to interact with the MIRASTACK Engine.
layout: docs
nav_order: 3
parent: MIRASTACK Documentation
---

# miractl — The MIRASTACK CLI

`miractl` is the command-line interface for MIRASTACK. Think of it as the `kubectl` for MIRASTACK — the primary day-to-day tool for engineers and operators who interact with the engine from a terminal.

You can chat with the AI, run workflows, manage agents and providers, approve or reject pending actions, manage users, and configure the system — all from a single CLI.

---

## Installation

### macOS / Linux (Homebrew)

```bash
brew install mirastacklabs-ai/tap/miractl
```

### macOS / Linux (Direct Download)

```bash
# Replace v1.x.y with the latest release
curl -L https://github.com/mirastacklabs-ai/miractl/releases/latest/download/miractl_linux_amd64 \
  -o /usr/local/bin/miractl
chmod +x /usr/local/bin/miractl
```

### Windows

Download the `.exe` from the [releases page](https://github.com/mirastacklabs-ai/miractl/releases) and add it to your `PATH`.

### Verify

```bash
miractl version
```

---

## First-Time Setup

The very first command to run is `init`. It walks you through connecting miractl to your engine instance:

```bash
miractl init
```

You will be prompted for:
1. A name for this context (e.g., `production`, `local`)
2. The engine URL (e.g., `http://localhost:8080`)
3. Whether to skip TLS verification (only for local dev with self-signed certs)

When it finishes, run `miractl login` to authenticate:

```bash
miractl login
```

You will be prompted for your API key and API secret (obtained during engine bootstrap). Alternatively, if your organisation uses SSO:

```bash
miractl login --oidc
```

This opens a browser window to your identity provider and exchanges the resulting token for a session automatically.

---

## Working with Multiple Contexts

If you manage multiple MIRASTACK deployments (e.g., dev, staging, production), you can set up a context for each:

```bash
miractl init                           # Sets up a new named context
miractl config get-contexts            # See all configured contexts
miractl config use-context production  # Switch to the production context
```

You can also override the context for a single command without switching:

```bash
miractl --context staging agent list
```

---

## Output Formats

Every command supports three output formats:

```bash
miractl agent list               # Default: human-readable table
miractl agent list -o json       # JSON (for scripting)
miractl agent list -o yaml       # YAML
```

---

## Command Reference

### `miractl chat` — Talk to the Engine

Start an interactive chat session. This opens a WebSocket connection to the engine and lets you type natural language queries.

```bash
miractl chat                       # Resume previous session
miractl chat --new                 # Start a fresh session
miractl chat --session <id>        # Resume a specific session by ID
```

**In-chat commands (while in a chat session):**

| Command | What it does |
|---------|-------------|
| `/cancel` | Cancel the currently running execution |
| `/cancel <exec-id>` | Cancel a specific execution |
| `/temperature 0.7` | Set LLM temperature for this session |

Press `Ctrl+C` to exit the chat.

---

### `miractl workflow` — Manage Workflows

Workflows are YAML runbooks that define step-by-step plans.

```bash
miractl workflow list                          # List all registered workflows
miractl workflow get investigate-latency       # See workflow details
miractl workflow create my-runbook.yaml        # Register a new workflow from a YAML file
miractl workflow run investigate-latency       # Run a workflow
miractl workflow run investigate-latency \
  --input service=checkout-svc \
  --input timerange=30m                        # Run with input parameters
miractl workflow delete my-old-runbook         # Delete a workflow
```

---

### `miractl approval` — Handle Approval Requests

Any MODIFY or ADMIN action generates an approval request before it can proceed. Use these commands to review and act on them.

```bash
miractl approval list              # List all pending approvals
miractl approval approve <id>      # Approve a request
miractl approval reject <id>       # Reject a request
```

When you approve, the workflow continues. When you reject, the step is skipped and the workflow completes with that step marked as rejected.

---

### `miractl agent` — Manage Agents

```bash
miractl agent list                 # List all registered agents (name, version, status, health)
miractl agent get query-vmetrics   # See full details for one agent
miractl agent health query-vmetrics  # Run a live health check
miractl agent config query-vmetrics  # View the agent's current configuration
miractl agent config-set query-vmetrics \
  --key backend_url \
  --value http://victoriametrics:8428   # Update a config value
```

---

### `miractl provider` — Manage AI Providers

```bash
miractl provider list              # List all registered providers
miractl provider get openai        # See provider details
miractl provider health openai     # Run a live health check
miractl provider config openai     # View provider config
miractl provider config-set openai \
  --key model \
  --value gpt-4o                   # Update provider config
```

---

### `miractl connector` — Manage Connectors

```bash
miractl connector list             # List all registered connectors
miractl connector get keycloak     # See connector details
miractl connector health keycloak  # Run a live health check
miractl connector config keycloak  # View connector config
```

---

### `miractl action` — Invoke Agent Actions Directly

Call a specific agent action directly, without going through a full workflow:

```bash
miractl action invoke query-vmetrics range_query \
  --param query='rate(http_requests_total[5m])' \
  --param start='-1h'
```

---

### `miractl settings` — Engine Configuration

View and change runtime configuration of the engine:

```bash
miractl settings list                         # View all settings
miractl settings get execution-mode           # Get a specific setting
miractl settings set execution-mode guided    # Set a setting
```

Key settings you will commonly change:

| Setting key | What it controls |
|-------------|-----------------|
| `execution-mode` | Default execution mode: `manual`, `guided`, `autonomous` |
| `agentic_max_iterations` | Max reasoning steps in Lane 2 agentic loop (default: 10) |
| `agentic_max_tool_calls` | Max tool calls per agentic session (default: 15) |
| `agentic_max_tokens` | Max LLM tokens per agentic session (default: 50,000) |

---

### `miractl user` — User Management (Admin only)

```bash
miractl user list                                              # List all users
miractl user create --email alice@company.com --role engineer  # Create a user
miractl user set-role alice@company.com --role admin           # Change a role
miractl user deactivate alice@company.com                      # Disable access
```

Roles available: `operator`, `engineer`, `admin`.

---

### `miractl audit` — View Audit Logs (Admin only)

```bash
miractl audit list                         # Recent security events
miractl audit list --last 100              # Last 100 events
miractl audit list --domain security       # Filter by domain
miractl audit list --since "2026-01-01"   # Events since a date
```

---

### `miractl insight` — View Insights

```bash
miractl insight list                       # List generated insights
miractl insight get <id>                   # View a specific insight
```

---

### `miractl incident` — Incident Management

```bash
miractl incident list                      # List active incidents
miractl incident get <id>                  # View incident details
```

---

### `miractl intent` — Intent Management

View and manage the intent patterns that the engine uses to route natural language queries to workflows:

```bash
miractl intent list                        # All registered intent patterns
miractl intent get <id>                    # See a specific pattern
```

---

### `miractl schedule` — Scheduled Workflows

```bash
miractl schedule list                      # List all scheduled workflow runs
miractl schedule create \
  --workflow daily-report \
  --cron "0 8 * * 1-5"                    # Schedule a workflow on a cron
miractl schedule delete <id>               # Remove a schedule
```

---

### `miractl prompt` — Prompt Templates

The engine uses prompt templates for all its LLM interactions. You can view and customise them:

```bash
miractl prompt list                        # List all prompt templates
miractl prompt get investigation_analysis  # View a template's content
miractl prompt set investigation_analysis \
  --file custom-analysis.tmpl              # Override a template (Admin only)
```

---

### `miractl feedback` — Submit Feedback on Responses

```bash
miractl feedback submit --execution <id> --rating good
miractl feedback submit --execution <id> --rating bad --reason "Wrong service targeted"
```

Feedback is used to improve intent routing and prompt quality over time.

---

### `miractl annotation` — Add Annotations

Attach contextual notes to executions for team reference:

```bash
miractl annotation add --execution <id> --note "Confirmed: caused by the midnight deploy"
miractl annotation list --execution <id>
```

---

### `miractl xai` — Explainability (XAI)

Inspect the reasoning behind an execution — which intent was matched, which workflow was chosen, and why specific tool calls were made:

```bash
miractl xai explain <execution-id>
```

---

### `miractl completion` — Shell Autocomplete

Generate shell completion scripts for `bash`, `zsh`, `fish`, or `PowerShell`:

```bash
miractl completion bash >> ~/.bashrc        # Bash
miractl completion zsh >> ~/.zshrc          # Zsh
miractl completion fish > ~/.config/fish/completions/miractl.fish
```

---

## Global Flags

These flags work on every command:

| Flag | Default | Description |
|------|---------|-------------|
| `--context <name>` | (current context) | Override which engine context to use |
| `-o, --output <format>` | `table` | Output format: `table`, `json`, `yaml` |
| `--no-color` | false | Disable colored terminal output |
| `--insecure` | false | Skip TLS certificate verification (dev only) |

---

## Configuration File

miractl stores its configuration at `~/.miractl/config.yaml`. You can view it:

```bash
miractl config view
```

Tokens are stored separately at `~/.miractl/tokens.yaml` and are refreshed automatically when they are close to expiry.