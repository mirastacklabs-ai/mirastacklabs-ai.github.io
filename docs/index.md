---
title: MIRASTACK Documentation
description: The complete documentation hub for the MIRASTACK agentic workflow automation platform.
layout: docs
nav_order: 1
---

# MIRASTACK Documentation

**The AI-native DevOps Infinity Loop — built for Platform Engineers.**

---

## What is MIRASTACK?

MIRASTACK is an **agentic workflow automation platform for platform engineering**. It covers all 8 steps of the DevOps Infinity Loop — Plan, Code, Build, Test, Release, Deploy, Operate, and Observe — using AI agents that work under human governance.

Think of it this way: you describe what needs to happen in plain English, and MIRASTACK figures out which tools to use, chains them together, asks for your approval when something risky is about to happen, and delivers you a clear, explainable answer or action.

It is built specifically for **data centers, private clouds, and sovereign environments** — places where you cannot send your infrastructure data to an external cloud AI API. MIRASTACK runs entirely on your own infrastructure, with your own AI models, on your own terms.

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOU                                      │
│  Platform Engineer · SRE · DevOps · CI/CD Pipeline             │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
    ┌──────▼──────┐                ┌──────▼──────┐
    │   miractl   │                │  Web UI     │
    │   (CLI)     │                │  (Console)  │
    └──────┬──────┘                └──────┬──────┘
           └──────────────┬───────────────┘
                          │
          ┌───────────────▼───────────────┐
          │       MIRASTACK ENGINE        │
          │  Intent · Workflow · Approval │
          │  LLM Router · State Machine   │
          └─────┬────────────────┬────────┘
                │                │
         ┌──────▼──────┐  ┌──────▼──────┐
         │   Agents    │  │  Providers  │
         │  (your      │  │  (AI model  │
         │  tools)     │  │  backends)  │
         └─────────────┘  └─────────────┘
```

---

## The Seven Building Blocks

### 1. MIRASTACK Engine

The **brain** of the platform. It understands what you want, plans how to achieve it, calls the right agents, routes LLM requests, manages approvals, and keeps track of everything that happens. You never interact with the engine's internals — you use it through the CLI, the web console, or the REST API.

[Read the Engine documentation →](engine/engine-doc.md)

---

### 2. miractl — The Command-Line Interface

`miractl` is to MIRASTACK what `kubectl` is to Kubernetes. It is the primary tool you use on a day-to-day basis to chat with the engine, run workflows, manage agents and providers, approve actions, and configure the system.

```bash
miractl chat                                  # Talk to the engine
miractl workflow run investigate-latency      # Run a workflow
miractl approval list                         # See pending approvals
miractl agent list                            # See all registered agents
```

[Read the miractl documentation →](miractl/miractl-doc.md)

---

### 3. Agents — The Workers

Agents are the **workers** that know how to talk to specific systems — your metrics store, your log store, your Kubernetes cluster, your alert manager. When the engine decides a task needs to happen, it calls an agent to do the actual work.

Agents come in three permission levels:
- **READ** — query and observe (no side effects)
- **MODIFY** — make changes (always requires your approval)
- **ADMIN** — critical operations like deletions (always requires your approval)

MIRASTACK ships with open-source agents for metrics, logs, and traces. You can also build your own.

[See the open-source agents →](agents/opensource-agents/index.md)

[Build your own agent →](agents/agent-development.md)

---

### 4. Providers — The AI Brains

Providers connect the engine to AI inference backends. The engine never calls an AI API directly — it always goes through a provider. This is what makes MIRASTACK portable: swap out OpenAI for Ollama for vLLM for LM Studio — the rest of the platform does not change.

Open-source providers are available for OpenAI and Anthropic. Enterprise providers cover self-hosted options like Ollama, vLLM, and LM Studio.

[See the open-source providers →](providers/opensource-providers/index.md)

[Build your own provider →](providers/provider-development.md)

---

### 5. Connectors — The Integration Layer

Connectors extend the engine's own capabilities. The primary use today is for authentication — connecting MIRASTACK to your organisation's identity provider, whether that is Keycloak, OpenLDAP, Active Directory, OKTA, or JumpCloud. More connector categories are coming (secrets management, ticket systems, artifact registries).

---

### 6. The SDKs

Two official SDKs let you build agents and providers in the language you prefer:

- **Go SDK** (AGPL v3, open source) — for building agents and providers in Go
- **Python SDK** (AGPL v3, open source) — for building agents and providers in Python

[Go SDK →](sdk/go-sdk-doc.md) | [Python SDK →](sdk/python-sdk-doc.md)

---

### 7. MIRASTACK UI

A full web console for interacting with the engine, viewing execution history, managing agents and providers, and handling approvals — all through a browser.

[Read the UI documentation →](mirastack-ui/mirastack-ui-doc.md)

---

## How It All Works Together

Here is a real example. You type:

> "Why is the checkout service slow right now?"

MIRASTACK does this:

1. **Intent recognition** — understands you want a latency investigation
2. **Workflow match** — finds (or builds) a plan: fetch metrics → fetch traces → analyze → synthesize
3. **Agent calls** — calls `query_metrics`, `query_traces` in parallel
4. **LLM analysis** — passes the data to the AI for root cause reasoning
5. **Response** — delivers a clear markdown explanation with evidence and next steps
6. **Promotion** — if no workflow existed before, offers to save this as a reusable runbook

Everything is logged. Every action that could change your system requires your explicit approval. You are always in control.

---

## Three Ways to Execute

| Mode | What it means |
|------|---------------|
| **Lane 1 — Pre-defined Workflow** | You have a YAML runbook. The engine runs it exactly as written. Deterministic, fast, auditable. |
| **Lane 2 — Agentic Loop** | No pre-defined workflow. The AI plans on the fly, proposes tool calls, the engine validates and executes. Think of it as a governed autopilot. |
| **Lane 3 — Hybrid** | A pre-defined workflow runs, but one of its analysis steps can independently gather more context if needed. The best of both. |

---

## Licensing

| What | License |
|------|---------|
| MIRASTACK Engine | **Proprietary** — free for development and testing; commercial license required for production |
| Agent SDK — Go | AGPL v3 (open source) |
| Agent SDK — Python | AGPL v3 (open source) |
| Open-source agents | AGPL v3 (open source) |
| Open-source providers (OpenAI, Anthropic) | AGPL v3 (open source) |
| Open-source auth connectors (Keycloak, OpenLDAP) | AGPL v3 (open source) |
| Provider SDK — Go | Proprietary |
| Provider SDK — Python | Proprietary |
| Connector SDK — Go | Proprietary |
| Enterprise agents | Proprietary |
| Enterprise providers (Ollama, vLLM, LM Studio) | Proprietary |
| Enterprise connectors (AD, OKTA, JumpCloud) | Proprietary |

---

## Quick Links

| Topic | Link |
|-------|------|
| Install and bootstrap the engine | [Engine doc](engine/engine-doc.md) |
| Install miractl | [miractl doc](miractl/miractl-doc.md) |
| Build an agent in Go | [Go SDK](sdk/go-sdk-doc.md) |
| Build an agent in Python | [Python SDK](sdk/python-sdk-doc.md) |
| Full agent development guide | [Agent dev guide](agents/agent-development.md) |
| All open-source agents | [OSS agents](agents/opensource-agents/index.md) |
| All open-source providers | [OSS providers](providers/opensource-providers/index.md) |
| Provider development guide | [Provider dev guide](providers/provider-development.md) |
| MIRASTACK Web UI | [UI doc](mirastack-ui/mirastack-ui-doc.md) |