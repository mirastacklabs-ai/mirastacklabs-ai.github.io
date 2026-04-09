---
title: Engine Embedded UI
description: The MIRASTACK Engine ships with a built-in web UI for managing workflows, monitoring agent health, reviewing approvals, and sending chat messages to the engine.
layout: docs
nav_order: 7
parent: MIRASTACK Documentation
---

# Engine Embedded UI

The MIRASTACK Engine ships with a lightweight built-in web UI that runs from the same address as the REST API. No separate deployment is required.

The embedded UI is designed for platform engineers and operators who want a browser-based interface for day-to-day operations without deploying the full MIRASTACK UI application.

> **Full documentation for this component is being written.** Refer to the [Engine REST API reference](../engine/engine-doc) and [miractl CLI reference](../miractl/miractl-doc) in the meantime.

## What you can do in the Embedded UI

- **Chat** — Send messages to the engine and receive agentic responses in real time via WebSocket
- **Workflows** — Browse, create, and delete registered workflows
- **Executions** — View live execution status, step-by-step trace, and execution logs
- **Approvals** — Review and approve or reject pending MODIFY and ADMIN actions
- **Agents** — See all registered agents, their versions, permissions, and health status
- **Settings** — View and update engine settings at runtime
- **Audit Log** — Browse security and workflow audit events (admin role)

## Accessing the UI

Once the engine is running, open your browser to the `listen_addr` configured in `config.yaml`:

```
http://<engine-host>:8080
```

You will be prompted to log in using an API key or via OIDC SSO if configured.