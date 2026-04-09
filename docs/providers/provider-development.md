---
title: Building a Provider
description: A complete guide to building your own MIRASTACK AI provider plugin using the Go or Python SDK.
layout: docs
nav_order: 1
parent: Providers
grand_parent: MIRASTACK Documentation
---

# Building a MIRASTACK Provider

A **Provider** is how the MIRASTACK Engine talks to an AI inference backend. The engine never calls any AI API directly — it always routes LLM requests through a registered Provider plugin over gRPC.

This means you can connect the engine to any LLM backend — OpenAI, Anthropic, a local Ollama instance, a vLLM server, LM Studio, or any custom inference server — by writing a Provider.

> **Who should build a Provider?**
> If you want to connect MIRASTACK to an AI backend that is not already covered by an existing provider, or if you want to customise how an existing backend is called (retry logic, custom headers, prompt formatting), you need a Provider plugin.

---

## Providers vs Agents — Key Differences

| | Agent | Provider |
|--|-------|----------|
| **Purpose** | Perform tasks on external systems | Bridge the engine to an AI inference backend |
| **Called by** | The engine's workflow/agentic executor | The engine's internal LLM Router |
| **Has actions** | Yes — every provider action is a distinct tool | No — providers do not contribute to the tool catalog |
| **Intent patterns** | Yes — can register intent patterns | No |
| **Prompt templates** | Yes | No |
| **SDK** | `mirastack-agents-sdk-go` / `mirastack-agents-sdk-python` | `mirastack-provider-sdk-go` / `mirastack-provider-sdk-python` |

---

## What a Provider Must Do

Every provider receives a completion request from the engine (containing a prompt, conversation history, tool definitions, and parameters) and returns a response. It must:

1. Accept `Complete` requests — single-turn prompt completion
2. Accept `Stream` requests — streaming token-by-token completion
3. Accept `Embed` requests — text embedding (optional but recommended)
4. Report its health status by actively checking the backing AI service
5. Accept `ConfigUpdated` calls to reload credentials and settings at runtime without restarting

---

## The Provider SDK

The Provider SDK is a **separate SDK** from the Agent SDK. Install it directly:

### Go

```bash
go get github.com/mirastacklabs-ai/mirastack-provider-sdk-go
```

### Python

```bash
pip install mirastack-provider-sdk-python
```

> The Provider SDK does not have `Action`, `IntentPattern`, or `PromptTemplate` types. Those belong to the Agent SDK. Do not mix the two SDKs in the same plugin.

---

## Building a Provider in Go

### Directory structure

```
mirastack-provider-my-llm/
├── go.mod
├── main.go       — reads env, calls mirastack.Serve()
├── provider.go   — implements mirastack.Plugin interface
├── LICENSE
└── README.md
```

### `provider.go`

```go
package main

import (
    "context"
    "fmt"
    "sync"

    mirastack "github.com/mirastacklabs-ai/mirastack-provider-sdk-go"
)

type MyLLMProvider struct {
    endpoint string
    apiKey   string
    model    string
    mu       sync.RWMutex
}

func (p *MyLLMProvider) Info() *mirastack.PluginInfo {
    return &mirastack.PluginInfo{
        Name:        "my_llm",
        Version:     "1.0.0",
        Description: "My custom LLM inference backend",
        Permissions: []mirastack.Permission{mirastack.PermissionRead},
        ConfigParams: []mirastack.ConfigParam{
            {Key: "endpoint", Type: "string", Required: true,
                Description: "Inference server base URL"},
            {Key: "api_key", Type: "string", Required: false,
                Description: "API key for authentication", IsSecret: true},
            {Key: "model", Type: "string", Required: true,
                Description: "Model name to use for completions"},
        },
    }
}

func (p *MyLLMProvider) Schema() *mirastack.PluginSchema {
    return &mirastack.PluginSchema{
        InputParams: []mirastack.ParamSchema{
            {Name: "prompt", Type: "string", Required: false,
                Description: "User prompt (single-turn mode)"},
            {Name: "messages", Type: "string", Required: false,
                Description: "JSON array of messages (multi-turn/agentic mode)"},
            {Name: "tools", Type: "string", Required: false,
                Description: "JSON array of tool definitions"},
            {Name: "tool_choice", Type: "string", Required: false,
                Description: "Tool selection strategy: auto, required, none"},
            {Name: "max_tokens", Type: "number", Required: false,
                Description: "Maximum tokens to generate"},
            {Name: "temperature", Type: "string", Required: false,
                Description: "Sampling temperature"},
        },
        OutputParams: []mirastack.ParamSchema{
            {Name: "content", Type: "string", Required: true,
                Description: "LLM response text"},
            {Name: "model", Type: "string", Required: true,
                Description: "Model that generated the response"},
            {Name: "finish_reason", Type: "string", Required: true,
                Description: "Why the model stopped: stop, tool_calls, length"},
            {Name: "tool_calls", Type: "string", Required: false,
                Description: "JSON array of tool calls requested by the model"},
        },
    }
}

func (p *MyLLMProvider) Execute(ctx context.Context, req *mirastack.ExecuteRequest) (*mirastack.ExecuteResponse, error) {
    p.mu.RLock()
    endpoint := p.endpoint
    apiKey := p.apiKey
    model := p.model
    p.mu.RUnlock()

    if endpoint == "" {
        return nil, fmt.Errorf("provider not configured: endpoint is empty")
    }

    // Build your completion request to the backing AI service here.
    // Return the response in the standard format.
    content := "..." // call your backend

    return &mirastack.ExecuteResponse{
        Output: map[string]string{
            "content":       content,
            "model":         model,
            "finish_reason": "stop",
        },
    }, nil
}

// HealthCheck must actively test the backing AI service.
// This is called by the engine on a regular interval.
// A failing health check marks the provider as unhealthy and
// prevents it from receiving new requests until it recovers.
func (p *MyLLMProvider) HealthCheck(ctx context.Context) error {
    p.mu.RLock()
    endpoint := p.endpoint
    p.mu.RUnlock()

    if endpoint == "" {
        return fmt.Errorf("provider not configured")
    }
    // Make a lightweight real call to your AI service (e.g. /models or /health endpoint)
    // Return nil if healthy, an error if not.
    return nil
}

// ConfigUpdated is called by the engine whenever a config value changes in Kine.
// Update your in-memory config without restarting the process.
func (p *MyLLMProvider) ConfigUpdated(ctx context.Context, config map[string]string) error {
    p.mu.Lock()
    defer p.mu.Unlock()
    if v, ok := config["endpoint"]; ok {
        p.endpoint = v
    }
    if v, ok := config["api_key"]; ok {
        p.apiKey = v
    }
    if v, ok := config["model"]; ok {
        p.model = v
    }
    return nil
}
```

### `main.go`

```go
package main

import (
    mirastack "github.com/mirastacklabs-ai/mirastack-provider-sdk-go"
    "go.uber.org/zap"
)

func main() {
    logger, _ := zap.NewProduction()
    defer logger.Sync()

    // All runtime config comes from Kine via ConfigUpdated.
    // Set initial defaults here; `miractl provider config-set` will push
    // the real values after the provider registers.
    plugin := &MyLLMProvider{
        endpoint: "http://localhost:11434",
        model:    "llama3",
    }

    mirastack.Serve(plugin)
}
```

---

## Registering Your Provider with the Engine

Registration is automatic — no manual steps, no CRDs. The same two models as agents:

### Co-located (same host)

Put the provider binary in the engine's `plugins.dir` directory:

```
/opt/mirastack/plugins/
  my-llm/
    mirastack-provider-my-llm    ← your binary
```

### Remote (different host)

Add it to `plugins.external` in the engine's `config.yaml`:

```yaml
plugins:
  external:
    - name: my_llm
      addr: 10.0.1.55:50051
```

Start the provider with `MIRASTACK_ENGINE_ADDR` pointing back to the engine:

```bash
export MIRASTACK_ENGINE_ADDR=engine-host:9090
./mirastack-provider-my-llm
```

Check it registered:

```bash
miractl provider list
# my_llm   1.0.0   READ   healthy
```

---

## Configuring the Provider at Runtime

Provider configuration (API keys, endpoint URLs, model names) is managed at runtime through the engine's settings store — not through environment variables or files. Once the provider registers, initialize its config:

```bash
miractl provider config-set my_llm --key endpoint --value http://my-inference-server:8080
miractl provider config-set my_llm --key api_key --value sk-...
miractl provider config-set my_llm --key model --value my-model-name
```

The engine pushes these values to the provider over gRPC via `ConfigUpdated`. The provider applies them live. No restart is needed.

To view the current config:

```bash
miractl provider config my_llm
```

---

## Making Your Provider the Default

When multiple providers are registered, tell the engine which one to use by default:

```bash
miractl settings set llm.default_provider my_llm
```

You can also configure the engine to use specific providers for specific workflows — see the workflow YAML documentation for LLM step provider routing.

---

## Health Checking — Non-Negotiable

All providers **must** implement a real health check that calls the backing AI service. The engine uses health status to decide whether to send requests to a provider.

A health check that always returns `nil` is dangerous: it hides outages and causes the engine to send requests to a dead backend, resulting in confusing user-facing errors.

What a good health check should do:
- Make the **lightest possible real call** to the backend (e.g. list models, ping endpoint)
- Return an error with a **clear message** if something is wrong
- Complete within a few seconds (the engine calls this on a 30-second interval by default)

```go
func (p *MyLLMProvider) HealthCheck(ctx context.Context) error {
    // Example: ping the /models endpoint
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    // Make a real call to your backend
    resp, err := p.httpClient.Get(ctx, p.endpoint+"/models")
    if err != nil {
        return fmt.Errorf("AI backend unreachable: %w", err)
    }
    if resp.StatusCode != 200 {
        return fmt.Errorf("AI backend returned HTTP %d", resp.StatusCode)
    }
    return nil
}
```

---

## Checklist Before Publishing

- [ ] `Info()` has clear `ConfigParams` with `IsSecret: true` on API keys
- [ ] `HealthCheck()` makes a real network call to the AI service
- [ ] `ConfigUpdated()` applies new values live (no restart required)
- [ ] Both single-turn (`prompt`) and multi-turn (`messages`) modes are handled
- [ ] Tool calling (`tools`, `tool_choice`, `tool_calls` output) is implemented
- [ ] No hardcoded API keys, endpoints, or model names
- [ ] `LICENSE` file is present (AGPL v3 for OSS, Proprietary for enterprise)
- [ ] `README.md` explains supported models and required config keys