---
title: Open-Source Providers
description: The official MIRASTACK open-source AI providers — connect the engine to OpenAI and Anthropic.
layout: docs
nav_order: 2
parent: Providers
grand_parent: MIRASTACK Documentation
---

# Open-Source Providers

MIRASTACK ships two production-ready open-source AI providers covering the two leading frontier model APIs. Both are available under the **AGPL v3 license** and are built on the official vendor Go SDKs.

| Provider | Models | License |
|----------|--------|---------|
| `openai` | GPT-4o, GPT-4, o1, o3, and all OpenAI-compatible endpoints | AGPL v3 |
| `anthropic` | Claude Opus, Sonnet, Haiku (all generations) | AGPL v3 |

Providers connect the engine to an AI inference backend. The engine's internal LLM Router dispatches every LLM request to a registered provider over gRPC. **Providers are the only components that make actual HTTP calls to external AI APIs** — the engine itself never calls OpenAI or Anthropic directly.

---

## `openai` — OpenAI Provider

Wraps the OpenAI Chat Completions API using the official OpenAI Go SDK. Supports both single-turn prompt completion and multi-turn agentic mode with full tool calling support.

**Compatible backends:** Any OpenAI-compatible API endpoint, including:
- OpenAI API (`api.openai.com`)
- Azure OpenAI Service (with appropriate endpoint URL)
- LM Studio (local, OpenAI-compatible)
- vLLM (OpenAI-compatible serving mode)
- Ollama (OpenAI-compatible serving mode)

### Configuration

```bash
miractl provider config-set openai --key endpoint --value https://api.openai.com/v1
miractl provider config-set openai --key api_key --value sk-...
miractl provider config-set openai --key model --value gpt-4o
```

| Key | Required | Description |
|-----|----------|-------------|
| `endpoint` | Yes | API base URL. Change this to point at any OpenAI-compatible server. |
| `api_key` | Yes | API key. Stored encrypted in Kine. |
| `model` | Yes | Model name (e.g. `gpt-4o`, `gpt-4-turbo`, `o1`, `o3-mini`). |

### Supported models

Any model available through the configured endpoint. Tested with:
- `gpt-4o` — recommended for agentic workflows
- `gpt-4o-mini` — cost-optimised for high-volume tasks
- `o1`, `o3` — reasoning models for complex multi-step decisions
- `gpt-4-turbo` — longer context window

### Using as default provider

```bash
miractl settings set llm.default_provider openai
```

### Source

[`mirastack-provider-openai` on GitHub](https://github.com/mirastacklabs-ai/mirastack-provider-openai)

---

## `anthropic` — Anthropic Provider

Wraps the Anthropic Messages API using the official Anthropic Go SDK. Supports all Claude models with full tool calling support for agentic Lane 2 and Lane 3 workflows.

### Configuration

```bash
miractl provider config-set anthropic --key endpoint --value https://api.anthropic.com
miractl provider config-set anthropic --key api_key --value sk-ant-...
miractl provider config-set anthropic --key model --value claude-sonnet-4-20250514
```

| Key | Required | Description |
|-----|----------|-------------|
| `endpoint` | Yes | Anthropic API base URL. |
| `api_key` | Yes | Anthropic API key. Stored encrypted in Kine. |
| `model` | Yes | Model name. |

### Supported models

Any model available through the Anthropic API. Tested with:
- `claude-opus-4-*` — most capable, best for complex agentic reasoning
- `claude-sonnet-4-*` — recommended balance of capability and speed
- `claude-haiku-4-*` — fastest and most cost-efficient for high-frequency calls

### Using as default provider

```bash
miractl settings set llm.default_provider anthropic
```

### Source

[`mirastack-provider-anthropic` on GitHub](https://github.com/mirastacklabs-ai/mirastack-provider-anthropic)

---

## Running Multiple Providers

You can register both providers simultaneously and route different workflows to different providers:

```bash
# Register both
miractl provider list
# NAME        VERSION  STATUS
# openai      2.0.0    healthy
# anthropic   2.0.0    healthy

# Set the default for agentic loops
miractl settings set llm.default_provider anthropic

# A specific workflow step can override the provider in the YAML:
#   steps:
#     - name: analyze
#       type: llm
#       provider: openai
```

---

## Installing the OSS Providers

All providers are published as Docker images at `ghcr.io/mirastacklabs-ai/<provider-name>`.

### Running a Provider

```bash
# Set the engine gRPC address
export MIRASTACK_ENGINE_ADDR=engine-host:9090

# Start the provider
./mirastack-provider-openai
# or
docker run -e MIRASTACK_ENGINE_ADDR=engine-host:9090 \
           ghcr.io/mirastacklabs-ai/mirastack-provider-openai:latest
```

The provider registers automatically. Configure its API credentials at runtime — no restart needed:

```bash
miractl provider config-set openai --key api_key --value sk-...
miractl provider config-set openai --key model --value gpt-4o
```

Verify the provider is healthy:

```bash
miractl provider list
# NAME    VERSION  STATUS
# openai  2.0.0    healthy
```

---

## Self-Hosted and Local LLM Backends

Both providers can be pointed at self-hosted or local inference servers. The `openai` provider works with any OpenAI-compatible API, making it the right choice for:

- **LM Studio** — set `endpoint` to `http://localhost:1234/v1`, leave `api_key` empty
- **Ollama** — set `endpoint` to `http://localhost:11434/v1`, leave `api_key` empty
- **vLLM** — set `endpoint` to your vLLM server URL, set `model` to the loaded model name

This means MIRASTACK can run fully air-gapped with no external AI API calls — purely on your own hardware.

---

## Building Your Own Provider

If you want to connect MIRASTACK to an inference backend not covered here, see the [Provider Development Guide](../provider-development).
