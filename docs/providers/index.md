---
title: "Providers"
description: "Build and deploy AI provider plugins that connect the MIRASTACK Engine to LLM APIs."
layout: docs
parent: "MIRASTACK Documentation"
nav_order: 6
---

# Providers

Providers are the bridge between the MIRASTACK Engine and external AI services. Each provider plugin encapsulates the authentication, request formatting, streaming, and error handling for a specific AI API — so the engine can route requests to any backend without coupling to a vendor.

## Available Guides

| Guide | Description |
|-------|-------------|
| [Building a Provider](provider-development) | Full walkthrough for implementing a custom provider in Go or Python |
| [Open-Source Providers](opensource-providers/) | Official MIRASTACK open-source provider implementations |

## How Providers Work

The engine communicates with providers over gRPC. Providers self-register on startup via the SDK's `Serve()` function, announcing the AI models they expose. The engine selects the appropriate provider at runtime based on the workflow's model requirements. No engine restart is needed to add new providers.

Providers can be deployed as sidecars (embedded), standalone processes, or remote microservices — all using the same protocol.
