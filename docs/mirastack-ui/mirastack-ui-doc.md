---
title: MIRASTACK UI
description: The full MIRASTACK web application — a purpose-built platform engineering console with multi-tenant support, advanced visualisations, SLO management, and collaborative agentic workflows.
layout: docs
nav_order: 11
parent: MIRASTACK Documentation
---

# MIRASTACK UI

MIRASTACK UI is the full-featured web application for platform engineering teams. It connects to your MIRASTACK Engine and provides a rich browser experience for all capabilities the engine exposes.

Unlike the [Engine Embedded UI](../embedded-ui/engine-embeded-ui-doc) — a lightweight operational tool bundled with the engine — MIRASTACK UI is a full product designed for continuous daily use by entire platform engineering organisations.

> **Full documentation for this component is being written.** Check back soon.

## Key Capabilities

- **Multi-tenant workspace management** — Separate environments for different teams or business units, with RBAC enforced per workspace
- **Agentic chat interface** — Real-time streaming AI conversation with full tool call visibility and Lane 1/2/3 routing transparency
- **Workflow builder** — Visual DAG editor for creating and modifying Lane 1 YAML workflows without editing files
- **Execution timeline** — Step-by-step execution replay with timing, inputs, outputs, and LLM call traces
- **Approval queue** — Centralised MODIFY and ADMIN approval interface with context, risk level, and one-click approve/reject
- **Agent health dashboard** — Live health status across all registered agents, providers, and connectors
- **SLO management** — Define, track, and alert on Service Level Objectives with error budget views
- **Audit explorer** — Full audit log browser with filtering, export, and timeline visualisation
- **Plugin marketplace** — Browse and install MIRASTACK-verified agent and provider plugins

## Deployment

MIRASTACK UI is distributed as a Docker image and can be deployed alongside the engine or separately. It connects to the engine's REST API and WebSocket endpoint.

```bash
docker run -e MIRASTACK_ENGINE_URL=http://your-engine:8080 \
           -p 3000:3000 \
           ghcr.io/mirastacklabs-ai/mirastack-ui:latest
```

MIRASTACK UI is available as part of enterprise licensing. Contact [hello@mirastacklabs.ai](mailto:hello@mirastacklabs.ai) for access.