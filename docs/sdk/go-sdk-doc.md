---
title: Go Agent SDK
description: Reference documentation for the MIRASTACK Agent SDK for Go.
layout: docs
nav_order: 6
parent: MIRASTACK Documentation
---

# Go Agent SDK

**Module:** `github.com/mirastacklabs-ai/mirastack-agents-sdk-go`
**License:** AGPL v3

The Go Agent SDK is the official library for building MIRASTACK agents in Go. It handles all the gRPC plumbing between your agent and the engine, so you focus entirely on your agent's logic.

---

## Installation

```bash
go get github.com/mirastacklabs-ai/mirastack-agents-sdk-go
```

**Go 1.22 or later is required.**

---

## Core Concepts

### The `Plugin` Interface

Every agent implements this interface:

```go
type Plugin interface {
    Info()          PluginInfo
    Schema()        PluginSchema
    Execute(ctx context.Context, req ExecuteRequest) (ExecuteResponse, error)
    HealthCheck(ctx context.Context) error
    ConfigUpdated(ctx context.Context, config map[string]string) error
}
```

### `mirastack.Serve()`

The entry point for every agent. Call it from `main()` with your plugin:

```go
err := mirastack.Serve(plugin)
```

`Serve` blocks indefinitely. It reads `MIRASTACK_ENGINE_ADDR` from the environment, connects to the engine, registers the agent, and handles all incoming gRPC calls.

---

## Types Reference

### `PluginInfo`

Returned by `Info()`. Tells the engine and the tool catalog who this agent is.

```go
type PluginInfo struct {
    Name             string          // Unique identifier, snake_case, e.g. "query_vmetrics"
    Version          string          // Semantic version, e.g. "1.0.0"
    Description      string          // Plain-English description (shown in miractl agent list)
    Permission       Permission      // PermissionRead | PermissionModify | PermissionAdmin
    DevOpsStages     []string        // Which DevOps Infinity Loop stages this agent covers
    IntentPatterns   []IntentPattern // Optional: natural language patterns for intent routing
    PromptTemplates  []PromptTemplate // Optional: prompt templates contributed to the engine
}
```

**DevOps stages you can declare:**

| Stage | When to use it |
|-------|---------------|
| `observe` | Reading metrics, logs, traces, alerts |
| `operate` | RCA, correlation, incident response |
| `deploy` | Kubernetes operations, deployments, rollbacks |
| `release` | Change events, version management |
| `plan` | Capacity planning, SLO/SLA analysis, coverage |
| `build` | Build system integrations |
| `test` | Test coverage, flaky test detection |
| `code` | Code analysis, dependency scanning |

### `Permission`

```go
const (
    PermissionRead   Permission = "READ"   // Query only — no side effects
    PermissionModify Permission = "MODIFY" // Changes state — always requires approval
    PermissionAdmin  Permission = "ADMIN"  // Critical ops (delete, destroy) — always requires approval
)
```

### `PluginSchema`

Returned by `Schema()`. Defines every action the agent exposes.

```go
type PluginSchema struct {
    Actions []Action
}

type Action struct {
    Name        string                 // snake_case action name
    Description string                 // LLM-readable description (write for the LLM, not for humans)
    InputParams map[string]ParamSchema // Parameters this action accepts
    OutputParams map[string]ParamSchema // Optional: describe the output shape
    Permission  Permission             // Can override the plugin-level permission per action
    Intents     []string               // Optional: intent pattern hints for this specific action
}

type ParamSchema struct {
    Type        string   // "string" | "integer" | "boolean" | "number" | "array" | "object"
    Required    bool
    Description string
    Default     string   // Optional default value
    Enum        []string // Optional allowed values
}
```

### `ExecuteRequest`

Received in `Execute()`. Contains everything your agent needs to do its work.

```go
type ExecuteRequest struct {
    Params       map[string]string // Action parameters from the engine or workflow
    TimeRange    *TimeRange        // Parsed time range (nil for non-time queries)
    EngineClient EngineClient      // Lets you call back into the engine (cache, approval, log)
}
```

### `TimeRange`

Always prefer `TimeRange` over raw time params. The engine has already parsed and normalised the user's time expression for you.

```go
type TimeRange struct {
    StartEpochMs       int64  // UTC epoch in milliseconds
    EndEpochMs         int64  // UTC epoch in milliseconds
    Timezone           string // IANA timezone name (display only)
    OriginalExpression string // What the user typed (e.g. "last 30 minutes")
}
```

### `ExecuteResponse`

Returned from `Execute()`.

```go
type ExecuteResponse struct {
    Output map[string]string // Key-value results. Use "result" as the primary key with JSON value.
    Logs   []string          // Non-fatal messages, warnings, or error descriptions
}
```

> **Tip:** Always marshal your result to JSON and put it in `Output["result"]`. This is the convention the engine and workflows expect.

---

## `EngineClient` — Calling Back into the Engine

The `EngineClient` on `ExecuteRequest` lets your agent communicate with the engine during execution.

### Cache

Store and retrieve transient data. Useful for caching slow backend responses.

```go
// Read from cache
value, err := req.EngineClient.CacheGet(ctx, "my_agent:key")

// Write to cache with a TTL (seconds). 0 = no expiry.
err = req.EngineClient.CacheSet(ctx, "my_agent:key", jsonValue, 300)
```

**Key naming convention:** always prefix with your agent name to avoid collisions — `"my_agent:service_list"`, `"my_agent:metric_names"`.

### Log Event

Write an audit or diagnostic event to the engine's audit log:

```go
err = req.EngineClient.LogEvent(ctx, mirastack.LogEntry{
    Event:   "my_agent.query_executed",
    Message: "Range query completed",
    Data: map[string]string{
        "action": "range_query",
        "rows":   "1250",
    },
})
```

### Publish Result

Publish an intermediate result to the execution stream (useful for long-running, multi-step actions):

```go
err = req.EngineClient.PublishResult(ctx, partialResultJSON)
```

---

## `datetimeutils` Package

Import: `github.com/mirastacklabs-ai/mirastack-agents-sdk-go/datetimeutils`

Converts the `TimeRange` epoch millisecond values into what your backend actually expects. Never parse or format time yourself.

| Function | Output format | Use with |
|----------|--------------|----------|
| `FormatEpochSeconds(ms int64) string` | `"1774973400"` | VictoriaMetrics, Prometheus |
| `FormatEpochMillis(ms int64) string` | `"1774973400000"` | Jaeger |
| `FormatEpochMicros(ms int64) string` | `"1774973400000000"` | VictoriaTraces |
| `FormatRFC3339(ms int64) string` | `"2026-04-08T00:00:00Z"` | VictoriaLogs, most REST APIs |
| `FormatLookbackMillis(start, end int64) string` | Duration as ms string | Window calculations |
| `FormatInTimezone(ms int64, tz string) string` | Human-readable in given timezone | Display purposes |
| `NowUTCMs() int64` | Current UTC epoch ms | Default time range fallbacks |

### Pattern: time range with fallback

```go
import dt "github.com/mirastacklabs-ai/mirastack-agents-sdk-go/datetimeutils"

func (p *Plugin) actionRangeQuery(ctx context.Context, params map[string]string, tr *mirastack.TimeRange) (mirastack.ExecuteResponse, error) {
    var start, end string
    if tr != nil && tr.StartEpochMs > 0 {
        start = dt.FormatEpochSeconds(tr.StartEpochMs)
        end   = dt.FormatEpochSeconds(tr.EndEpochMs)
    } else {
        // Fallback for direct API calls (e.g. miractl action invoke)
        start = params["start"]
        end   = params["end"]
    }
    // use start, end to call your backend
}
```

---

## `IntentPattern` and `PromptTemplate`

These are optional but powerful. They let your agent contribute intelligence back into the engine.

### `IntentPattern`

Register natural-language patterns that map to your agent's actions. When a user types something that matches a pattern, the engine can route to your agent without needing an explicit workflow:

```go
IntentPatterns: []mirastack.IntentPattern{
    {
        Pattern: "query metrics for *",
        Action:  "range_query",
    },
    {
        Pattern: "what are the error rates for *",
        Action:  "range_query",
    },
},
```

### `PromptTemplate`

Contribute prompt templates to the engine's template store. The engine uses these when it constructs LLM prompts for workflows that involve your agent:

```go
PromptTemplates: []mirastack.PromptTemplate{
    {
        Name:    "metrics_analysis",
        {% raw %}
        Content: "You are analyzing metrics data for {{.service}}. The data shows: {{.metrics_output}}. Identify anomalies, trends, and potential root causes.",
        {% endraw %}
    },
},
```

---

## Error Handling Rules

- Return processing errors via `ExecuteResponse.Logs`, not as a Go `error` return
- Return a Go `error` only for fatal infrastructure failures (e.g., gRPC connection lost)
- Never panic — recover gracefully
- Never expose backend URLs, credentials, stack traces, or internal details in error messages

```go
// Correct: non-fatal backend error
if err != nil {
    return mirastack.ExecuteResponse{
        Logs: []string{fmt.Sprintf("backend query failed: %v", err)},
    }, nil
}

// Correct: fatal infrastructure error (will cause engine to mark agent unhealthy)
if conn == nil {
    return mirastack.ExecuteResponse{}, fmt.Errorf("no backend connection available")
}
```

---

## Complete Minimal Example

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "os"

    mirastack "github.com/mirastacklabs-ai/mirastack-agents-sdk-go"
    dt "github.com/mirastacklabs-ai/mirastack-agents-sdk-go/datetimeutils"
)

type Plugin struct{ backendURL string }

func (p *Plugin) Info() mirastack.PluginInfo {
    return mirastack.PluginInfo{
        Name: "my_agent", Version: "1.0.0",
        Description:  "A minimal example agent",
        Permission:   mirastack.PermissionRead,
        DevOpsStages: []string{"observe"},
    }
}

func (p *Plugin) Schema() mirastack.PluginSchema {
    {% raw %}
    return mirastack.PluginSchema{Actions: []mirastack.Action{{
        Name:        "get_status",
        Description: "Get the current status of a named service from My Backend.",
        InputParams: map[string]mirastack.ParamSchema{
            "service": {Type: "string", Required: true, Description: "Service name"},
        },
    }}}
    {% endraw %}
}

func (p *Plugin) Execute(ctx context.Context, req mirastack.ExecuteRequest) (mirastack.ExecuteResponse, error) {
    if req.Params["action"] != "get_status" {
        return mirastack.ExecuteResponse{Logs: []string{fmt.Sprintf("unknown action: %s", req.Params["action"])}}, nil
    }
    result := map[string]string{"service": req.Params["service"], "status": "ok"}
    if req.TimeRange != nil {
        result["queried_at"] = dt.FormatRFC3339(req.TimeRange.EndEpochMs)
    }
    out, _ := json.Marshal(result)
    return mirastack.ExecuteResponse{Output: map[string]string{"result": string(out)}}, nil
}

func (p *Plugin) HealthCheck(ctx context.Context) error              { return nil }
func (p *Plugin) ConfigUpdated(_ context.Context, _ map[string]string) error { return nil }

func main() {
    // MIRASTACK_ENGINE_ADDR is read by the SDK automatically.
    if err := mirastack.Serve(&Plugin{backendURL: os.Getenv("MY_BACKEND_URL")}); err != nil {
        log.Fatal(err)
    }
}
```