---
title: Open-Source Agents
description: The official MIRASTACK open-source observability agents — query metrics, logs, traces, discover services, and analyse TSDB health.
layout: docs
nav_order: 2
parent: Agents
grand_parent: MIRASTACK Documentation
---

# Open-Source Agents

MIRASTACK ships a set of production-ready open-source agents covering the full observability signal trio: **metrics**, **logs**, and **distributed traces**. These agents are available under the **AGPL v3 license** and are designed to work out of the box with any OpenTelemetry-compatible observability stack.

All agents are available in both **Go** (high-performance) and **Python** (extensible) implementations. Use whichever fits your infrastructure toolchain.

| Agent | Language | Permission | License |
|-------|----------|-----------|---------|
| `query_vmetrics` | Go, Python | READ | AGPL v3 |
| `query_vlogs` | Go, Python | READ | AGPL v3 |
| `query_vtraces` | Go, Python | READ | AGPL v3 |
| `metrics_discovery` | Go | READ | AGPL v3 |
| `cardinality` | Go | READ | AGPL v3 |
| `service_graph` | Go | READ | AGPL v3 |

---

## `query_vmetrics` — Metrics Query Agent

Queries VictoriaMetrics for time-series metrics data using MetricsQL (a superset of PromQL). The engine's agentic planner calls this agent's actions automatically when a user asks about metric values, trends, or thresholds.

| Action | Description |
|--------|-------------|
| `instant_query` | Execute an instant PromQL/MetricsQL expression at a single point in time |
| `range_query` | Execute a range query over a time window, returning a time-series matrix |
| `label_names` | List all label names available in the metrics store |
| `label_values` | List all values for a specific label name |

**Required configuration**

```bash
miractl agent config-set query_vmetrics endpoint http://victoriametrics:8428
```

**Example conversation trigger:**
> "What is the current error rate for the checkout service?"
> "Show me CPU usage for all nodes over the past hour."

---

## `query_vlogs` — Log Query Agent

Searches and analyses logs stored in VictoriaLogs using LogsQL. Supports full-text search, time-range filtering, field extraction, and log volume histograms.

| Action | Description |
|--------|-------------|
| `search_logs` | Search log entries using a LogsQL expression with time-range support |
| `log_volume` | Return a log hit-count time-series histogram for volume analysis |

**Required configuration**

```bash
miractl agent config-set query_vlogs endpoint http://victorialogs:9428
```

**Example conversation trigger:**
> "Find all error logs from the payment service in the last 30 minutes."
> "Show me how log volume changed during the incident yesterday."

---

## `query_vtraces` — Distributed Traces Agent

Retrieves and searches distributed traces from VictoriaTraces via the Jaeger-compatible API. Supports trace search by service, operation, tags, and duration, as well as fetching full individual traces by trace ID.

| Action | Description |
|--------|-------------|
| `search_traces` | Search traces by service, operation, tags, and duration bounds |
| `get_trace` | Retrieve the full span tree for a single trace by trace ID |

**Required configuration**

```bash
miractl agent config-set query_vtraces endpoint http://victoriatraces:10428
```

**Example conversation trigger:**
> "Find slow traces for checkout service taking more than 2 seconds."
> "Show me the trace for trace ID abc123."

---

## `metrics_discovery` — Metrics Discovery Agent

Discovers available metrics, services, and observability signal coverage across all connected backends. Used by the agentic planner to understand what signals are available before writing queries.

| Action | Description |
|--------|-------------|
| `discover_metrics` | Discover available metrics, filterable by category, name pattern, or service |
| `list_services` | List all active services seen across traces, metrics, and logs |

Supported metric categories for `discover_metrics`:
- `all` (default) — everything
- `service_graph` — service-to-service RED metrics
- `span` — span-level latency and error metrics
- `http` — HTTP request metrics
- `database` — database call metrics
- `dns` — DNS resolution metrics
- `resource` — host and container resource metrics
- `anomaly_enabled` — metrics with anomaly detection active

**Required configuration**

```bash
miractl agent config-set metrics_discovery endpoint http://victoriametrics:8428
```

---

## `cardinality` — TSDB Cardinality Agent

Analyses the time-series cardinality health of VictoriaMetrics. High cardinality is one of the most common causes of TSDB performance degradation. This agent identifies the culprits.

| Action | Description |
|--------|-------------|
| `cardinality_analysis` | Full cardinality report: total active series, top metrics by series count, top label combinations |
| `top_metrics_by_series` | Rank metrics by their time-series count |
| `top_labels_by_values` | Rank labels by their unique value count |

**Required configuration**

```bash
miractl agent config-set cardinality endpoint http://victoriametrics:8428
```

**Example conversation trigger:**
> "Why is my VictoriaMetrics using so much memory?"
> "Which metrics have the highest cardinality?"

---

## `service_graph` — Service Graph Agent

Maps the real-time topology of your distributed system. Derives service-to-service communication graphs from OpenTelemetry `service_graph_*` metrics, builds trace-based dependency graphs, calculates blast radius for failure impact analysis, and reports OTel pipeline data quality.

| Action | Description |
|--------|-------------|
| `topology` | Get the full service topology graph from `service_graph_*` metrics. Filter by service to see direct neighbours. Includes request rates, error rates, and latency per edge. |
| `dependencies` | Build a runtime dependency graph from distributed trace data revealing actual call chains and volumes between services. |
| `blast_radius` | Calculate which upstream and downstream services are affected if a target service fails — with per-service error rates. |
| `data_quality` | Report OTel service-graph pipeline health: unpaired spans (sampling asymmetry) and dropped spans (collector overflow) per service edge. |

**Required configuration**

```bash
miractl agent config-set service_graph endpoint http://victoriametrics:8428
```

**Example conversation trigger:**
> "Show me the service topology for the platform."
> "What services would be impacted if the inventory service went down?"
> "Are there any missing edges in the service graph? Check data quality."

---

## Installing the OSS Agents

### GitHub Repositories

All OSS agents are published to the MIRASTACK GitHub organisation:

- [`mirastack-plugin-query-vmetrics-go`](https://github.com/mirastacklabs-ai/mirastack-plugin-query-vmetrics-go)
- [`mirastack-plugin-query-vmetrics-python`](https://github.com/mirastacklabs-ai/mirastack-plugin-query-vmetrics-python)
- [`mirastack-plugin-query-vlogs-go`](https://github.com/mirastacklabs-ai/mirastack-plugin-query-vlogs-go)
- [`mirastack-plugin-query-vlogs-python`](https://github.com/mirastacklabs-ai/mirastack-plugin-query-vlogs-python)
- [`mirastack-plugin-query-vtraces-go`](https://github.com/mirastacklabs-ai/mirastack-plugin-query-vtraces-go)
- [`mirastack-plugin-query-vtraces-python`](https://github.com/mirastacklabs-ai/mirastack-plugin-query-vtraces-python)
- [`mirastack-plugin-metrics-discovery`](https://github.com/mirastacklabs-ai/mirastack-plugin-metrics-discovery)
- [`mirastack-plugin-cardinality`](https://github.com/mirastacklabs-ai/mirastack-plugin-cardinality)
- [`mirastack-plugin-service-graph`](https://github.com/mirastacklabs-ai/mirastack-plugin-service-graph)

### Docker Images

Each agent is published as a Docker image at `ghcr.io/mirastacklabs-ai/<agent-name>`.

### Running an Agent

All agents follow the same startup pattern regardless of language:

```bash
# Set the engine's gRPC address so the agent can self-register and call back
export MIRASTACK_ENGINE_ADDR=your-engine-host:9090

# Set the agent's backend URL
export VICTORIAMETRICS_URL=http://victoriametrics:8428

# Start the agent (it self-registers with the engine automatically — no engine restart needed)
./mirastack-plugin-query-vmetrics
```

Or with Docker:

```bash
docker run -e MIRASTACK_ENGINE_ADDR=engine-host:9090 \
           -e VICTORIAMETRICS_URL=http://vmetrics:8428 \
           ghcr.io/mirastacklabs-ai/mirastack-plugin-query-vmetrics-go:latest
```

Verify the agent registered:

```bash
miractl agent list
# NAME                VERSION  PERMISSION  STATUS
# query_vmetrics      0.2.0    READ        healthy
```

---

## Agent-to-Agent Orchestration

The MIRASTACK Engine supports **agent-to-agent orchestration** — an agent can request the engine to invoke another registered agent on its behalf. This is how higher-level intelligence agents (such as a correlation or root-cause analysis agent) build on top of the base signal agents without duplicating query logic.

If you are building a new agent that needs metric, log, or trace data, your agent should call the base query agents via the engine rather than implementing its own backend queries. The engine handles scheduling, state, caching, and LLM plumbing. Your agent contributes only its core logic.

See the [Agent Development](../agent-development) guide for details on the `EngineClient` API for inter-agent calls.
