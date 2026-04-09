---
title: VictoriaMetrics
description: MIRASTACK's observability signal agents are built on the VictoriaMetrics ecosystem — VictoriaMetrics, VictoriaLogs, and VictoriaTraces.
layout: docs
nav_order: 9
parent: MIRASTACK Documentation
---

# VictoriaMetrics

MIRASTACK's open-source observability agents target the VictoriaMetrics ecosystem as their primary signal backends:

| Signal | Backend | Agent |
|--------|---------|-------|
| Metrics | [VictoriaMetrics](https://victoriametrics.com) — Prometheus-compatible TSDB | [`query_vmetrics`](../agents/opensource-agents/index.md#query_vmetrics--metrics-query-agent) |
| Logs | [VictoriaLogs](https://docs.victoriametrics.com/victorialogs/) — JSON-native log store with LogsQL | [`query_vlogs`](../agents/opensource-agents/index.md#query_vlogs--log-query-agent) |
| Traces | [VictoriaTraces](https://docs.victoriametrics.com/victoriatrace/) — OpenTelemetry-native trace store | [`query_vtraces`](../agents/opensource-agents/index.md#query_vtraces--distributed-traces-agent) |

VictoriaMetrics is also the data source for the [`cardinality`](../agents/opensource-agents/index.md#cardinality--tsdb-cardinality-agent) agent (TSDB health analysis) and the [`service_graph`](../agents/opensource-agents/index.md#service_graph--service-graph-agent) agent (service topology).

> **Full documentation for this section is being written.** See the [Open-Source Agents](../agents/opensource-agents/) page for configuration details on each agent.
