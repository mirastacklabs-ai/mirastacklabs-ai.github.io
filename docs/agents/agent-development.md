---
title: Building an Agent
description: A complete guide to building your own MIRASTACK agent using the Go or Python SDK.
layout: docs
nav_order: 1
parent: Agents
grand_parent: MIRASTACK Documentation
---

# Building a MIRASTACK Agent

This guide walks you through building your own agent from scratch — in either **Go** or **Python** — and connecting it to the MIRASTACK Engine.

By the end you will have a working agent that the engine can call, the LLM can use as a tool, and workflows can reference as a step.

---

## What is an Agent?

An agent is a standalone process that does one thing well: it knows how to talk to a specific external system and return structured results. Examples:

- A **metrics agent** knows how to query VictoriaMetrics/Prometheus
- A **Kubernetes agent** knows how to list pods, restart deployments, and scale workloads
- A **log agent** knows how to search log stores using LogQL or LogsQL

The engine calls your agent over **gRPC** when it needs work done. Your agent does the work, returns the result, and goes back to waiting. That is the entire contract.

> **What an agent must NOT do:**
> - Connect to Valkey or the engine's database directly
> - Call an LLM — the engine handles all LLM routing
> - Know about other agents or the workflow DAG structure
> - Manage its own persistent state

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Go 1.22+ | For Go agents |
| Python 3.12+ | For Python agents |
| MIRASTACK Engine | Running locally or in staging |
| Agent SDK | Go: `mirastack-agents-sdk-go` · Python: `mirastack-agents-sdk-python` |

---

## The Five Methods Every Agent Implements

Every agent — regardless of language — implements the same five methods:

| Method | Called by the engine when... |
|--------|------------------------------|
| `Info()` | It registers the agent at startup — returns name, version, permission level, DevOps stages |
| `Schema()` | It needs to know what actions the agent supports and what parameters each action takes |
| `Execute()` | It wants the agent to run a specific action with given parameters |
| `HealthCheck()` | It runs a periodic liveness probe |
| `ConfigUpdated()` | A config value for the agent has changed in real-time (no restart needed) |

---

## Building an Agent in Go

### Step 1 — Create the module

```bash
mkdir mirastack-plugin-my-agent
cd mirastack-plugin-my-agent
go mod init github.com/your-org/mirastack-plugin-my-agent
```

### Step 2 — Add the SDK

```bash
go get github.com/mirastacklabs-ai/mirastack-agents-sdk-go
```

### Step 3 — Write `plugin.go`

This is where you implement the five methods:

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"

    mirastack "github.com/mirastacklabs-ai/mirastack-agents-sdk-go"
)

type Plugin struct {
    backendURL string
}

// Info tells the engine who this agent is.
func (p *Plugin) Info() mirastack.PluginInfo {
    return mirastack.PluginInfo{
        Name:        "my_agent",
        Version:     "1.0.0",
        Description: "Fetches data from My Backend System",
        Permission:  mirastack.PermissionRead,
        DevOpsStages: []string{"observe"},
    }
}

// Schema tells the engine (and the LLM) what actions are available
// and what parameters each action requires.
func (p *Plugin) Schema() mirastack.PluginSchema {
    return mirastack.PluginSchema{
        Actions: []mirastack.Action{
            {
                Name: "get_item",
                Description: "Retrieve a specific item from My Backend by ID. " +
                    "Use this when you need to look up a resource by its identifier.",
                InputParams: map[string]mirastack.ParamSchema{
                    "id": {
                        Type:        "string",
                        Required:    true,
                        Description: "The unique identifier of the item to retrieve",
                    },
                },
            },
            {
                Name: "list_items",
                Description: "List all items in My Backend, optionally filtered by type. " +
                    "Use this when you need an overview of available resources.",
                InputParams: map[string]mirastack.ParamSchema{
                    "type": {
                        Type:        "string",
                        Required:    false,
                        Description: "Filter results to this item type",
                    },
                },
            },
        },
    }
}

// Execute is called by the engine to run an action.
func (p *Plugin) Execute(ctx context.Context, req mirastack.ExecuteRequest) (mirastack.ExecuteResponse, error) {
    action := req.Params["action"]
    switch action {
    case "get_item":
        return p.actionGetItem(ctx, req.Params)
    case "list_items":
        return p.actionListItems(ctx, req.Params)
    default:
        return mirastack.ExecuteResponse{
            Logs: []string{fmt.Sprintf("unknown action: %s", action)},
        }, nil
    }
}

func (p *Plugin) actionGetItem(ctx context.Context, params map[string]string) (mirastack.ExecuteResponse, error) {
    id := params["id"]
    if id == "" {
        return mirastack.ExecuteResponse{Logs: []string{"missing required param: id"}}, nil
    }
    // Call your backend here...
    result := map[string]any{"id": id, "name": "example item"}
    out, _ := json.Marshal(result)
    return mirastack.ExecuteResponse{
        Output: map[string]string{"result": string(out)},
    }, nil
}

func (p *Plugin) actionListItems(ctx context.Context, params map[string]string) (mirastack.ExecuteResponse, error) {
    // Call your backend here...
    {% raw %}
    result := []map[string]any{{"id": "1", "name": "item one"}}
    {% endraw %}
    out, _ := json.Marshal(result)
    return mirastack.ExecuteResponse{
        Output: map[string]string{"result": string(out)},
    }, nil
}

// HealthCheck verifies the agent and its backend are alive.
func (p *Plugin) HealthCheck(ctx context.Context) error {
    // Ping your backend here. Return nil if healthy.
    return nil
}

// ConfigUpdated is called whenever a config value changes in the engine.
// Use this to reload settings without restarting.
func (p *Plugin) ConfigUpdated(ctx context.Context, config map[string]string) error {
    if url, ok := config["backend_url"]; ok {
        p.backendURL = url
    }
    return nil
}
```

### Step 4 — Write `main.go`

```go
package main

import (
    "log"
    "os"

    mirastack "github.com/mirastacklabs-ai/mirastack-agents-sdk-go"
)

func main() {
    backendURL := os.Getenv("MY_BACKEND_URL")
    if backendURL == "" {
        log.Fatal("MY_BACKEND_URL environment variable is required")
    }

    plugin := &Plugin{backendURL: backendURL}

    // MIRASTACK_ENGINE_ADDR is read by the SDK automatically.
    // Set it in the environment before starting the agent.
    if err := mirastack.Serve(plugin); err != nil {
        log.Fatalf("agent exited: %v", err)
    }
}
```

### Step 5 — Run it

```bash
export MIRASTACK_ENGINE_ADDR=localhost:9090
export MY_BACKEND_URL=http://my-backend:8080
go run .
```

The agent will register itself with the engine. Verify it worked:

```bash
miractl agent list
# my_agent   1.0.0   READ   healthy
```

---

## Building an Agent in Python

### Step 1 — Create the project

```bash
mkdir mirastack-plugin-my-agent
cd mirastack-plugin-my-agent
python -m venv .venv
source .venv/bin/activate
pip install mirastack-agents-sdk-python
```

### Step 2 — Write `plugin.py`

```python
import json
import os
from mirastack_sdk.plugin import (
    MirastackPlugin,
    PluginInfo,
    PluginSchema,
    Action,
    ParamSchema,
    ExecuteRequest,
    ExecuteResponse,
    Permission,
)


class MyAgentPlugin(MirastackPlugin):

    def __init__(self):
        self.backend_url = os.environ.get("MY_BACKEND_URL", "")

    def info(self) -> PluginInfo:
        return PluginInfo(
            name="my_agent",
            version="1.0.0",
            description="Fetches data from My Backend System",
            permission=Permission.READ,
            devops_stages=["observe"],
        )

    def schema(self) -> PluginSchema:
        return PluginSchema(
            actions=[
                Action(
                    name="get_item",
                    description=(
                        "Retrieve a specific item from My Backend by ID. "
                        "Use this when you need to look up a resource by its identifier."
                    ),
                    input_params={
                        "id": ParamSchema(
                            type="string",
                            required=True,
                            description="The unique identifier of the item to retrieve",
                        )
                    },
                ),
                Action(
                    name="list_items",
                    description=(
                        "List all items in My Backend, optionally filtered by type. "
                        "Use this when you need an overview of available resources."
                    ),
                    input_params={
                        "type": ParamSchema(
                            type="string",
                            required=False,
                            description="Filter results to this item type",
                        )
                    },
                ),
            ]
        )

    async def execute(self, req: ExecuteRequest) -> ExecuteResponse:
        action = req.params.get("action", "")
        match action:
            case "get_item":
                return await self._action_get_item(req.params)
            case "list_items":
                return await self._action_list_items(req.params)
            case _:
                return ExecuteResponse(logs=[f"unknown action: {action}"])

    async def _action_get_item(self, params: dict) -> ExecuteResponse:
        item_id = params.get("id")
        if not item_id:
            return ExecuteResponse(logs=["missing required param: id"])
        # Call your backend here...
        result = {"id": item_id, "name": "example item"}
        return ExecuteResponse(output={"result": json.dumps(result)})

    async def _action_list_items(self, params: dict) -> ExecuteResponse:
        # Call your backend here...
        result = [{"id": "1", "name": "item one"}]
        return ExecuteResponse(output={"result": json.dumps(result)})

    async def health_check(self) -> None:
        # Ping your backend. Raise an exception if unhealthy.
        pass

    async def config_updated(self, config: dict) -> None:
        if "backend_url" in config:
            self.backend_url = config["backend_url"]
```

### Step 3 — Write `main.py`

```python
import os
import sys
from mirastack_sdk import serve
from plugin import MyAgentPlugin


def main():
    backend_url = os.environ.get("MY_BACKEND_URL")
    if not backend_url:
        print("MY_BACKEND_URL environment variable is required", file=sys.stderr)
        sys.exit(1)

    plugin = MyAgentPlugin()
    # MIRASTACK_ENGINE_ADDR is read by the SDK automatically.
    serve(plugin)


if __name__ == "__main__":
    main()
```

### Step 4 — Run it

```bash
export MIRASTACK_ENGINE_ADDR=localhost:9090
export MY_BACKEND_URL=http://my-backend:8080
python main.py
```

---

## Handling Time Ranges

When the engine calls your agent with a query involving time (e.g. "show me errors in the last hour"), it parses the time expression itself and sends you a `TimeRange` on the `ExecuteRequest`. You must use the SDK's `datetimeutils` to convert this to whatever format your backend expects. **Never parse time strings yourself.**

### Go

```go
import "github.com/mirastacklabs-ai/mirastack-agents-sdk-go/datetimeutils"

func (p *Plugin) actionQuery(ctx context.Context, params map[string]string, tr *mirastack.TimeRange) (mirastack.ExecuteResponse, error) {
    var start, end string
    if tr != nil && tr.StartEpochMs > 0 {
        // Convert to what your backend needs:
        start = datetimeutils.FormatEpochSeconds(tr.StartEpochMs)  // VictoriaMetrics
        end   = datetimeutils.FormatEpochSeconds(tr.EndEpochMs)
        // Or: datetimeutils.FormatRFC3339(tr.StartEpochMs)         // Log stores
        // Or: datetimeutils.FormatEpochMillis(tr.StartEpochMs)     // Jaeger
    } else {
        // Fallback for direct API calls without a TimeRange
        start = params["start"]
        end   = params["end"]
    }
    // ... call backend with start, end
}
```

### Python

```python
from mirastack_sdk.datetimeutils import format_epoch_seconds, format_rfc3339
from mirastack_sdk.plugin import TimeRange

async def _action_query(self, params: dict, tr: TimeRange | None) -> ExecuteResponse:
    if tr and tr.start_epoch_ms > 0:
        start = format_epoch_seconds(tr.start_epoch_ms)   # for Prometheus-style backends
        end   = format_epoch_seconds(tr.end_epoch_ms)
        # Or: format_rfc3339(tr.start_epoch_ms)            # for log stores
    else:
        start = params.get("start")
        end   = params.get("end")
    # ... call backend with start, end
```

| Backend type | Converter to use |
|-------------|-----------------|
| VictoriaMetrics / Prometheus | `FormatEpochSeconds` / `format_epoch_seconds` |
| VictoriaLogs / log stores (RFC 3339) | `FormatRFC3339` / `format_rfc3339` |
| Jaeger / Zipkin | `FormatEpochMillis` / `format_epoch_millis` |
| VictoriaTraces | `FormatEpochMicros` / `format_epoch_micros` |

---

## Using the Engine Cache

If your action fetches data that does not change often (e.g., a list of service names), cache the result so repeated calls do not hit your backend every time:

### Go

```go
func (p *Plugin) actionListServices(ctx context.Context, req mirastack.ExecuteRequest) (mirastack.ExecuteResponse, error) {
    const cacheKey = "my_agent:service_list"

    // Try cache first
    if cached, err := req.EngineClient.CacheGet(ctx, cacheKey); err == nil && cached != "" {
        return mirastack.ExecuteResponse{Output: map[string]string{"result": cached}}, nil
    }

    // Call backend
    services := fetchServicesFromBackend()
    out, _ := json.Marshal(services)
    result := string(out)

    // Store in cache for 5 minutes (300 seconds)
    _ = req.EngineClient.CacheSet(ctx, cacheKey, result, 300)

    return mirastack.ExecuteResponse{Output: map[string]string{"result": result}}, nil
}
```

---

## Requesting Human Approval (MODIFY / ADMIN actions)

If your agent performs write operations, declare it as `PermissionModify` or `PermissionAdmin` in `Info()`. The engine automatically pauses execution and asks for approval before your `Execute()` is called. You do not need to do anything special in your code — the approval gate is entirely engine-side.

However, you should provide a clear, human-readable description of what the action does in `Schema()` so the approval request is meaningful:

```go
Action{
    Name: "restart_service",
    Description: "Restart a named service. WARNING: This causes a brief service interruption. " +
        "Use only when the service is unresponsive or in a crash loop.",
    // ...
}
```

---

## Contributing Prompt Templates to the Engine

Every prompt in MIRASTACK lives in the Kine-backed **Prompt Template Store** — never hardcoded in Go or Python source files. When your agent registers with the engine, the SDK sends the `PromptTemplates` declared in `Info()` and the engine auto-ingests them into Kine. Templates are idempotent: if a template with the same name already exists, the engine skips it.

Agent-contributed templates are tracked with source `agent:{plugin-name}` so operators can tell which agent contributed which template when browsing via the Console or `miractl prompt list`.

### Go

```go
func (p *MyPlugin) Info() *mirastack.PluginInfo {
    return &mirastack.PluginInfo{
        Name:    "mirastack-plugin-my-agent",
        Version: "1.0.0",
        // ... other fields ...
        PromptTemplates: []mirastack.PromptTemplate{
            {
                Name:        "my_agent_analysis",
                Description: "Context and guidelines for the LLM when analysing my-agent results",
                Content: `You have access to my-agent observation tools.
Follow these guidelines:
1. Always include the service name and time window in results.
2. Prefer structured output over prose.
3. When errors are found, include the raw error message.`,
            },
        },
    }
}
```

### Python

```python
def info(self) -> PluginInfo:
    return PluginInfo(
        name="mirastack-plugin-my-agent",
        version="1.0.0",
        # ... other fields ...
        prompt_templates=[
            PromptTemplate(
                name="my_agent_analysis",
                description="Context and guidelines for the LLM when analysing my-agent results",
                content=(
                    "You have access to my-agent observation tools.\n"
                    "Follow these guidelines:\n"
                    "1. Always include the service name and time window in results.\n"
                    "2. Prefer structured output over prose.\n"
                    "3. When errors are found, include the raw error message."
                ),
            ),
        ],
    )
```

### Template Content Guidelines

| Rule | Rationale |
|------|-----------|
| Use Go `text/template` syntax (`{{ .Variable }}`) | The engine validates and renders templates with the Go template engine |
| Keep templates under 2 KB | Large templates waste LLM context window tokens |
| Focus on **what the agent does** and **how to interpret results** | The engine handles persona, identity, and capabilities separately |
| Do not include MIRA identity statements | Persona is handled by the engine's `chat_system` template |
| Use action-specific template names (e.g., `query_metrics_guide`) | Avoids namespace collisions with other agents |

### How It Works Under the Hood

1. Agent starts → calls `mirastack.Serve()` / `serve()`
2. SDK connects to the engine and calls `RegisterPlugin` RPC
3. Engine calls back to the agent's `Info()` RPC
4. Engine extracts `prompt_templates` from the `InfoResponse`
5. Engine calls `IngestPluginTemplates()` → validates template syntax → stores in Kine as v1 under `/mirastack/prompts/default/{name}/v1`
6. Templates are available immediately via the Prompt Template Store (Valkey cache → Kine)

Templates contributed by agents can be viewed and potentially customised by operators at runtime (via the Console or `miractl`), but agents cannot override engine-owned templates that were seeded on startup.

---

## Directory Structure

Keep your agent's files organised like this:

```
mirastack-plugin-my-agent/
├── go.mod          (or pyproject.toml)
├── main.go         (or main.py)    — reads env vars, starts the agent
├── plugin.go       (or plugin.py)  — implements the Plugin interface
├── client.go       (or client.py)  — HTTP/gRPC client for your backend
├── actions.go      (or actions.py) — one function per action
├── LICENSE                         — AGPL v3 for OSS, Proprietary for enterprise
└── README.md
```

---

## Writing Good Action Descriptions

The description you write in `Schema()` is **exactly what the LLM reads** when deciding which tool to call. Write it as if explaining to a smart colleague who does not know your backend:

| Bad description | Why it fails | Better description |
|----------------|-------------|-------------------|
| `"Execute PromQL range query"` | Too technical — LLM may not select it for the right intent | `"Query time-series metrics for any service or infrastructure component over a time window. Use this to get CPU usage, error rates, latency, or request throughput."` |
| `"Get logs"` | Too vague | `"Search application and infrastructure logs by service name, log level, or keyword. Use this to find error messages, stack traces, or audit events."` |
| `"K8s scale"` | Cryptic | `"Scale a Kubernetes Deployment up or down by changing its replica count. Use this to handle traffic spikes or reduce resource usage."` |

---

## Packaging as a Container

Agents are distributed as OCI container images:

```dockerfile
# Go agent example
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o agent .

FROM alpine:3.19
COPY --from=builder /app/agent /usr/local/bin/agent
ENTRYPOINT ["agent"]
```

```bash
docker build -t ghcr.io/your-org/mirastack-plugin-my-agent:v1.0.0 .
docker push ghcr.io/your-org/mirastack-plugin-my-agent:v1.0.0
```

---

## Registering Your Agent with the Engine

Registration is automatic — there are no manual registration steps, no CRDs, and no operators. When you call `mirastack.Serve()` (Go) or `serve()` (Python), the SDK starts the agent's gRPC server, connects to the engine at `MIRASTACK_ENGINE_ADDR`, and calls the `RegisterPlugin` RPC. The engine calls back to the agent to retrieve its metadata (`Info`, `GetSchema`), validates it, ingests intents and templates, and adds the agent to the active registry. **No engine restart is required.**

There are two deployment models.

### Model 1 — Co-located (same host as the engine)

Place your agent binary inside the directory configured as `plugins.dir` in the engine's `config.yaml`. On startup, the engine launches it as a child process and sets `MIRASTACK_ENGINE_ADDR` automatically. The agent starts, self-registers, and is ready to receive tasks.

```yaml
# engine config.yaml
plugins:
  dir: /opt/mirastack/plugins
```

```
/opt/mirastack/plugins/
  my-agent/
    mirastack-plugin-my-agent    ← your binary
```

### Model 2 — Remote (different host, VM, or container)

Start your agent anywhere with `MIRASTACK_ENGINE_ADDR` pointing to the engine. Optionally set `MIRASTACK_PLUGIN_ADVERTISE_ADDR` to the address the engine can reach the agent on (defaults to OS hostname + bound port):

```bash
export MIRASTACK_ENGINE_ADDR=engine-host:9090
export MIRASTACK_PLUGIN_ADVERTISE_ADDR=192.168.1.50:50051
export MY_BACKEND_URL=http://my-backend:8080
./mirastack-plugin-my-agent
```

The agent self-registers on startup. No changes to the engine's `config.yaml` are needed.

> **Backward compatibility:** You can still list remote agents in `plugins.external` in `config.yaml`. Self-registration takes precedence when both are configured for the same agent name.

Both models work identically on bare metal, VMs, Docker Compose, and Kubernetes — the engine does not care where the process runs, only that the agent can reach the engine and the engine can call back to the agent.

### Graceful Shutdown

When the agent process receives SIGINT or SIGTERM, the SDK automatically deregisters it from the engine via the `DeregisterPlugin` RPC before stopping the gRPC server. The engine removes the agent from the active registry immediately.

---

## Quality Gates — What the SDK and Engine Enforce

When your agent starts, the SDK validates your `Info()` return value **before** the gRPC server even starts. If any rule fails, the agent exits immediately with a clear error listing every violation. This gives you instant feedback during local development.

If the agent passes the SDK check, the engine performs a second validation at registration time (defense-in-depth for older SDKs or direct gRPC clients). Both layers enforce the same rules:

### Plugin-level rules (all required)

| Field | Rule |
|-------|------|
| `Name` | Must not be empty |
| `Version` | Must not be empty |
| `Description` | Must not be empty or whitespace-only |
| `Permission` | Must be explicitly set (READ, MODIFY, or ADMIN) — engine rejects UNSPECIFIED |
| `DevOpsStages` | At least one stage must be declared |
| `Actions` | At least one action must be declared |

### Per-action rules

| Field | Rule |
|-------|------|
| `Id` / `Name` | Must not be empty |
| `Id` / `Name` | Must be unique across all actions in the agent |
| `Description` | Must not be empty |
| `Permission` | Engine requires non-UNSPECIFIED (READ, MODIFY, or ADMIN) |
| `Stages` | At least one DevOps stage must be declared |

### Per-config-param rules

| Field | Rule |
|-------|------|
| `Key` | Must not be empty |
| `Description` | Must not be empty |

### What a validation failure looks like

```
FATAL: plugin quality gate failed:
  - description must not be empty (whitespace-only is not allowed)
  - at least one action must be declared
  - at least one DevOps stage must be declared
```

All violations are reported at once so you can fix everything in a single pass.

---

## Checklist Before Publishing

Before sharing your agent with the community, go through this checklist:

- [ ] `Info()` has a clear, accurate description (not empty, not whitespace-only)
- [ ] `Permission` is explicitly set to READ, MODIFY, or ADMIN
- [ ] `DevOpsStages` are correctly declared (at least one — do not leave this empty)
- [ ] At least one action is declared with a unique ID, description, permission, and stages
- [ ] All action descriptions are written for an LLM audience — plain English, intent-focused
- [ ] Required vs optional parameters are correctly marked in `Schema()`
- [ ] `TimeRange` is used for all time-related queries (no manual time parsing)
- [ ] `HealthCheck()` actually tests the backend connection
- [ ] `ConfigUpdated()` handles config changes without requiring a restart
- [ ] No hardcoded URLs, credentials, or environment-specific values
- [ ] `LICENSE` file is present (`AGPLv3-LICENSE` for OSS contributions)
- [ ] `README.md` explains what the agent does, what environment variable it needs, and what actions it offers