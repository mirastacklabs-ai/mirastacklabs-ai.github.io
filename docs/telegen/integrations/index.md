---
title: "Integrations"
layout: docs
parent: "Telegen"
grand_parent: "MIRASTACK Documentation"
nav_order: 5
---
# Integrations

Guides for integrating Telegen with observability backends and tools.

## Overview

Telegen exports telemetry data using the OpenTelemetry Protocol (OTLP). This section covers integration with various backends and collectors.

## Topics


## Supported Backends

Telegen can export to any OTLP-compatible backend:

| Backend | Traces | Metrics | Logs | Profiles |
|---------|--------|---------|------|----------|
| OpenTelemetry Collector | ✅ | ✅ | ✅ | ✅ |
| Grafana Cloud | ✅ | ✅ | ✅ | ✅ |
| Jaeger | ✅ | - | - | - |
| Prometheus | - | ✅ | - | - |
| Datadog | ✅ | ✅ | ✅ | - |
| New Relic | ✅ | ✅ | ✅ | - |
| Elastic APM | ✅ | ✅ | ✅ | - |
| Splunk | ✅ | ✅ | ✅ | - |
| Honeycomb | ✅ | - | - | - |
| Lightstep | ✅ | - | - | - |

## Quick Links

| Topic | Description |
|-------|-------------|
| [OTel Collector](otel-collector) | OpenTelemetry Collector setup |
| [Backends](backends) | Configure various backends |
