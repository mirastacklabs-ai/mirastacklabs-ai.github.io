---
title: Python Agent SDK
description: Reference documentation for the MIRASTACK Agent SDK for Python.
layout: docs
nav_order: 7
parent: MIRASTACK Documentation
---

# Python Agent SDK

**Package:** `mirastack-agents-sdk-python`
**Import:** `from mirastack_sdk ...`
**License:** AGPL v3

The Python Agent SDK is the official library for building MIRASTACK agents in Python. It handles all gRPC communication with the engine so you can focus entirely on your agent's logic.

---

## Installation

```bash
pip install mirastack-agents-sdk-python
```

**Python 3.12 or later is required.**

---

## Core Concepts

### The `MirastackPlugin` Base Class

Every agent inherits from `MirastackPlugin` and overrides five methods:

```python
from mirastack_sdk.plugin import MirastackPlugin

class MyPlugin(MirastackPlugin):
    def info(self) -> PluginInfo: ...
    def schema(self) -> PluginSchema: ...
    async def execute(self, req: ExecuteRequest) -> ExecuteResponse: ...
    async def health_check(self) -> None: ...
    async def config_updated(self, config: dict) -> None: ...
```

### `serve()`

The entry point for every agent. Call it from `main()`:

```python
from mirastack_sdk import serve

serve(plugin_instance)
```

`serve` reads `MIRASTACK_ENGINE_ADDR` from the environment, runs the agent's gRPC server, connects to the engine, registers the agent, and handles all incoming calls. It blocks until shutdown.

---

## Types Reference

### `PluginInfo`

```python
@dataclass
class PluginInfo:
    name: str                           # Unique identifier, snake_case, e.g. "query_vlogs"
    version: str                        # Semantic version, e.g. "1.0.0"
    description: str                    # Plain-English description
    permission: Permission              # Permission.READ | MODIFY | ADMIN
    devops_stages: list[str]            # DevOps Infinity Loop stage tags
    intent_patterns: list[IntentPattern] = field(default_factory=list)
    prompt_templates: list[PromptTemplate] = field(default_factory=list)
```

**DevOps stages you can declare:**

| Stage | When to use it |
|-------|---------------|
| `observe` | Reading metrics, logs, traces, alerts |
| `operate` | RCA, correlation, incident response |
| `deploy` | Kubernetes operations, deployments, rollbacks |
| `release` | Change events, version management |
| `plan` | Capacity, SLO/SLA analysis, coverage |
| `build` | Build system integrations |
| `test` | Test coverage, flaky test detection |
| `code` | Code analysis, dependency scanning |

### `Permission`

```python
from mirastack_sdk.plugin import Permission

Permission.READ    # Query only — no side effects
Permission.MODIFY  # Changes state — always requires human approval
Permission.ADMIN   # Critical ops (delete, destroy) — always requires human approval
```

### `PluginSchema` and `Action`

```python
@dataclass
class PluginSchema:
    actions: list[Action]

@dataclass
class Action:
    name: str               # snake_case action name
    description: str        # LLM-readable description — write for the LLM, not for humans
    input_params: dict[str, ParamSchema]
    output_params: dict[str, ParamSchema] = field(default_factory=dict)
    permission: Permission | None = None  # Overrides plugin-level permission if set
    intents: list[str] = field(default_factory=list)

@dataclass
class ParamSchema:
    type: str               # "string" | "integer" | "boolean" | "number" | "array" | "object"
    required: bool = True
    description: str = ""
    default: str = ""
    enum: list[str] = field(default_factory=list)
```

### `ExecuteRequest`

```python
@dataclass
class ExecuteRequest:
    params: dict[str, str]          # Action parameters
    time_range: TimeRange | None    # Parsed time range (None for non-time queries)
    engine_client: EngineClient     # Call back into the engine
```

### `TimeRange`

```python
@dataclass
class TimeRange:
    start_epoch_ms: int     # UTC epoch in milliseconds
    end_epoch_ms: int       # UTC epoch in milliseconds
    timezone: str           # IANA timezone (display only)
    original_expression: str  # What the user typed, e.g. "last 30 minutes"
```

### `ExecuteResponse`

```python
@dataclass
class ExecuteResponse:
    output: dict[str, str] = field(default_factory=dict)
    # Put your main result in output["result"] as a JSON string
    logs: list[str] = field(default_factory=list)
    # Non-fatal messages, warnings, errors
```

---

## `EngineClient` — Calling Back into the Engine

### Cache

```python
# Read from cache
value: str | None = await req.engine_client.cache_get(ctx, "my_agent:key")

# Write to cache with TTL in seconds (0 = no expiry)
await req.engine_client.cache_set(ctx, "my_agent:key", json_string, ttl=300)
```

**Key naming convention:** always prefix with your agent name — `"my_agent:service_list"`.

### Log Event

```python
await req.engine_client.log_event(ctx, {
    "event": "my_agent.query_executed",
    "message": "Query completed successfully",
    "rows": "1250",
})
```

### Publish Result

```python
await req.engine_client.publish_result(ctx, partial_json_string)
```

---

## `datetimeutils` Module

```python
from mirastack_sdk.datetimeutils import (
    format_epoch_seconds,
    format_epoch_millis,
    format_epoch_micros,
    format_rfc3339,
    format_lookback_millis,
    format_in_timezone,
    now_utc_ms,
)
```

Never parse time strings in your agent. Use these functions to convert the `TimeRange` values into what your backend expects.

| Function | Output | Use with |
|----------|--------|----------|
| `format_epoch_seconds(ms)` | `"1774973400"` | VictoriaMetrics, Prometheus |
| `format_epoch_millis(ms)` | `"1774973400000"` | Jaeger |
| `format_epoch_micros(ms)` | `"1774973400000000"` | VictoriaTraces |
| `format_rfc3339(ms)` | `"2026-04-08T00:00:00Z"` | VictoriaLogs, REST APIs |
| `format_lookback_millis(start, end)` | Duration in ms | Window calculations |
| `format_in_timezone(ms, tz)` | Human-readable | Display purposes |
| `now_utc_ms()` | Current time as int64 ms | Default range fallbacks |

### Pattern: time range with fallback

```python
from mirastack_sdk.datetimeutils import format_epoch_seconds
from mirastack_sdk.plugin import TimeRange

async def _action_range_query(self, params: dict, tr: TimeRange | None) -> ExecuteResponse:
    if tr and tr.start_epoch_ms > 0:
        start = format_epoch_seconds(tr.start_epoch_ms)
        end   = format_epoch_seconds(tr.end_epoch_ms)
    else:
        # Fallback for direct API calls without a TimeRange
        start = params.get("start")
        end   = params.get("end")
    # use start, end to call your backend
```

---

## `IntentPattern` and `PromptTemplate`

### `IntentPattern`

Map natural-language phrases to specific actions so the engine can route user queries to your agent:

```python
from mirastack_sdk.plugin import IntentPattern

IntentPattern(pattern="query metrics for *", action="range_query"),
IntentPattern(pattern="what are the error rates for *", action="range_query"),
```

### `PromptTemplate`

Contribute prompt templates for LLM steps that involve your agent's output:

```python
from mirastack_sdk.plugin import PromptTemplate

PromptTemplate(
    name="metrics_analysis",
    content=(
        "You are analyzing metrics data for {{.service}}. "
        "The data shows: {{.metrics_output}}. "
        "Identify anomalies, trends, and potential root causes."
    ),
)
```

---

## Error Handling Rules

- Put non-fatal errors in `ExecuteResponse(logs=[...])` — do not raise exceptions
- Raise exceptions only for fatal infrastructure failures (e.g., the backend is completely unreachable)
- Never expose backend URLs, credentials, stack traces, or internal details in error messages

```python
# Correct: non-fatal backend error
except BackendError as e:
    return ExecuteResponse(logs=[f"backend query failed: {e}"])

# Correct: fatal infrastructure error
if not self.client:
    raise RuntimeError("backend client not initialised — check MY_BACKEND_URL")
```

---

## `health_check()` — Keep It Real

`health_check` is called regularly by the engine. Make it actually test your backend connection — do not just return `None` without checking:

```python
async def health_check(self) -> None:
    # Raises an exception if the backend is unhealthy.
    # Exception message is shown in `miractl agent health`.
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{self.backend_url}/health", timeout=aiohttp.ClientTimeout(total=5)) as resp:
            if resp.status != 200:
                raise RuntimeError(f"backend returned HTTP {resp.status}")
```

---

## Complete Minimal Example

```python
import asyncio
import json
import os
from mirastack_sdk import serve
from mirastack_sdk.plugin import (
    MirastackPlugin, PluginInfo, PluginSchema, Action, ParamSchema,
    ExecuteRequest, ExecuteResponse, Permission
)
from mirastack_sdk.datetimeutils import format_rfc3339


class MyPlugin(MirastackPlugin):

    def __init__(self):
        self.backend_url = os.environ.get("MY_BACKEND_URL", "")

    def info(self) -> PluginInfo:
        return PluginInfo(
            name="my_agent",
            version="1.0.0",
            description="A minimal example agent",
            permission=Permission.READ,
            devops_stages=["observe"],
        )

    def schema(self) -> PluginSchema:
        return PluginSchema(actions=[
            Action(
                name="get_status",
                description=(
                    "Get the current operational status of a named service. "
                    "Use this when you need to know if a service is healthy."
                ),
                input_params={
                    "service": ParamSchema(type="string", required=True,
                                          description="Service name to check"),
                },
            )
        ])

    async def execute(self, req: ExecuteRequest) -> ExecuteResponse:
        action = req.params.get("action", "")
        if action != "get_status":
            return ExecuteResponse(logs=[f"unknown action: {action}"])

        service = req.params.get("service", "")
        result = {"service": service, "status": "ok"}
        if req.time_range:
            result["queried_at"] = format_rfc3339(req.time_range.end_epoch_ms)

        return ExecuteResponse(output={"result": json.dumps(result)})

    async def health_check(self) -> None:
        pass  # Add real backend ping here

    async def config_updated(self, config: dict) -> None:
        if "backend_url" in config:
            self.backend_url = config["backend_url"]


def main():
    # MIRASTACK_ENGINE_ADDR is read by the SDK automatically.
    serve(MyPlugin())


if __name__ == "__main__":
    main()
```

---

## Testing Your Agent

The SDK ships with test utilities you can use to unit-test your agent without a running engine:

```python
from mirastack_sdk.testing import MockEngineClient, make_execute_request

async def test_get_status():
    plugin = MyPlugin()
    req = make_execute_request(
        params={"action": "get_status", "service": "checkout"},
        engine_client=MockEngineClient(),
    )
    resp = await plugin.execute(req)
    assert "result" in resp.output
    assert "checkout" in resp.output["result"]
    assert not resp.logs  # no errors
```

Run with `pytest` (async tests require `pytest-asyncio`):

```bash
pip install pytest pytest-asyncio
pytest
```