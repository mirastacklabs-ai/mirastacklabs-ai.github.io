---
title: "Agents"
description: "Build, deploy, and extend MIRASTACK agents using the Go or Python SDK."
layout: docs
parent: "MIRASTACK Documentation"
nav_order: 4
---

# Agents

MIRASTACK agents are lightweight, autonomous processes that execute tasks on behalf of the engine — querying metrics, collecting logs, running workflows, and interfacing with external systems.

## What You Can Build

| Guide | Description |
|-------|-------------|
| [Building an Agent](agent-development) | Complete walkthrough for building a custom agent in Go or Python |
| [Open-Source Agents](opensource-agents/) | The official MIRASTACK open-source agent catalogue |

## How Agents Work

Agents register with the MIRASTACK Engine over a secure gRPC channel. Once registered, the engine dispatches tasks to the agent and the agent streams back results, logs, and status updates in real time.

Agents are stateless by design: all persistent state lives in the engine. This makes them trivially scalable — deploy as many instances as needed, anywhere in your infrastructure.

## SDKs

- [Go Agent SDK](../sdk/go-sdk-doc) — idiomatic Go, zero-dependency core
- [Python Agent SDK](../sdk/python-sdk-doc) — async-first, batteries-included
