---
title: "Features"
layout: docs
parent: "Telegen"
grand_parent: "MIRASTACK Documentation"
nav_order: 3
---
# Features

Detailed guides for Telegen's observability features.

## Overview

Telegen provides comprehensive observability through:

- **eBPF-based instrumentation** - Zero-code, kernel-level collection
- **Automatic discovery** - Cloud, Kubernetes, runtime detection
- **Full-stack correlation** - Traces, metrics, logs, profiles linked automatically

## Feature Categories

### Core Observability


### Security & Network


### Infrastructure


### Specialized


## Feature Matrix

| Feature | Agent Mode | Collector Mode | Requires |
|---------|------------|----------------|----------|
| **Auto-Discovery** | ✅ | ❌ | eBPF |
| **Distributed Tracing** | ✅ | ❌ | eBPF |
| **Log Collection** | ✅ | ✅ | Filesystem |
| **Log Trace Enrichment** | ✅ | ❌ | eBPF |
| **Continuous Profiling** | ✅ | ❌ | eBPF |
| **Security Monitoring** | ✅ | ❌ | eBPF |
| **Network Observability** | ✅ | ❌ | eBPF |
| **Database Tracing** | ✅ | ❌ | eBPF |
| **Cassandra/CQL Tracing** | ✅ | ❌ | eBPF |
| **AMQP Tracing** | ✅ | ❌ | eBPF |
| **NATS Tracing** | ✅ | ❌ | eBPF |
| **Kafka Consumer Groups** | ✅ | ❌ | eBPF |
| **Connection Statistics** | ✅ | ❌ | eBPF |
| **Go TLS Plaintext Capture** | ✅ | ❌ | eBPF uprobes |
| **gRPC-C Tracing** | ✅ | ❌ | eBPF uprobes |
| **SNMP Collection** | ❌ | ✅ | Network access |
| **Storage Monitoring** | ❌ | ✅ | API credentials |
| **AI/ML Observability** | ✅ | ❌ | eBPF + GPU |
| **Node Exporter Fusion** | ✅ | ❌ | eBPF |
