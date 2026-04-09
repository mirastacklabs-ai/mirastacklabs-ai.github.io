---
title: MIRASTACK Engine
description: How to deploy, bootstrap, configure, and operate the MIRASTACK Engine.
layout: docs
nav_order: 2
parent: MIRASTACK Documentation
---

# MIRASTACK Engine

> **License:** Proprietary — free to use for development and testing environments. A commercial license is required for production deployments. [Contact MIRASTACK LABS](https://mirastacklabs.ai/contact) to get started.

The **MIRASTACK Engine** is the core of the platform. It is the piece that understands your intent, plans workflows, calls agents, routes LLM requests, manages human approvals, and keeps track of all execution state.

You do not need to understand the engine's internals to use MIRASTACK. This guide covers everything you need to **get it running and keep it running**.

---

## What the Engine Does

At a high level, the engine is responsible for:

| Responsibility | What it means in practice |
|----------------|--------------------------|
| **Intent Recognition** | Understanding natural language queries and matching them to the right workflow or agentic plan |
| **Workflow Execution** | Running step-by-step plans (DAGs) — in parallel where possible, respecting dependencies |
| **Agent Orchestration** | Calling external agent processes over gRPC and collecting their results |
| **LLM Routing** | Forwarding AI requests to the configured provider (OpenAI, Anthropic, Ollama, etc.) |
| **Approval Gating** | Pausing before any MODIFY or ADMIN action and waiting for your go-ahead |
| **State Management** | Tracking every execution, step, log, and result so any engine instance can resume any job |
| **Auth & RBAC** | Authenticating users and enforcing role-based access (Operator, Engineer, Admin) |
| **Audit Logging** | Recording every security and workflow event in a tamper-evident log |

---

## Before You Start

### What You Need

| Component | Minimum version | Notes |
|-----------|----------------|-------|
| Docker + Docker Compose | v24+ | For local development |
| Kubernetes | v1.28+ | For production |
| Valkey | v8+ | The engine's transient state store |
| MariaDB | v10.11+ | For persistent state (production) |
| SQLite | 3+ | For persistent state (local dev — zero setup) |

> **For local development** you only need Docker. Everything else is bundled in the provided compose file.

---

## Deployment Options

The engine is a single Go binary that runs on **any infrastructure** — bare metal, VMs, Docker, Kubernetes, or any other container orchestrator. There are no platform-specific requirements.

### Option 1 — Local Development (Docker Compose)

The fastest way to get everything running on your laptop. Uses SQLite for persistence and a bundled Valkey instance — no external databases needed.

```bash
# Clone the engine repository
git clone https://github.com/mirastacklabs-ai/mirastack-engine
cd mirastack-engine

# Start everything
make localdev-up

# The engine is now running at:
#   REST API  → http://localhost:8080
#   WebSocket → ws://localhost:8080/ws
```

To stop:

```bash
make localdev-down
```

---

### Option 2 — Bare Metal or VM (Systemd)

Run the engine directly on any Linux machine alongside Valkey and MariaDB:

```bash
# 1. Install Valkey 8+ and MariaDB 10.11+
# 2. Create your config.yaml (see Configuration section)
# 3. Run the engine binary
./mirastack-engine --config /etc/mirastack/config.yaml
```

For production on VMs, manage it with `systemd`, `supervisor`, or any process manager of your choice. Full production deployment manifests are in the `deployments/production/` directory of the engine repository.

---

### Option 3 — Kubernetes

For Kubernetes, the engine runs as a standard `Deployment`. Connect it to your external Valkey and MariaDB instances via `config.yaml` mounted as a `ConfigMap` or `Secret`. No special operator or CRD is required to run the engine itself.

Full Kubernetes manifests are in the `deployments/production/` directory of the engine repository.

---

## Configuration

The engine is configured through `config.yaml`. A minimal development configuration looks like this:

```yaml
listen_addr: "0.0.0.0:8080"       # REST API + WebSocket
websocket_addr: "0.0.0.0:8080"    # WebSocket (same port as REST by default)
grpc_addr: "0.0.0.0:9090"         # gRPC — plugins and miractl connect here

kine:
  backend: sqlite                  # Use "mariadb" for production
  sqlite_path: "./mirastack.db"
  # For MariaDB:
  # backend: mariadb
  # mariadb_dsn: "user:password@tcp(host:3306)/mirastack"

valkey:
  addr: "localhost:6379"
  password: ""
  db: 0

plugins:
  dir: "./plugins"                 # Directory for co-located plugin binaries
  health_check_interval: 30s

llm:
  default_provider: "openai"       # Name of the registered provider plugin

oidc:
  allowed_providers: []            # Add OIDC issuer URLs here to enable SSO
```

> Only infrastructure-level settings live in `config.yaml`. Everything else — LLM settings, observability URLs, execution budgets, agent configs — is managed at runtime through the Settings API or `miractl settings`.

---

## First-Time Bootstrap

When the engine starts for the first time with no existing users, it automatically:

1. Creates the persistent store schema
2. Generates a PASETO authentication key
3. Creates a default **admin** user
4. Generates a bootstrap API key and logs the credentials (save these — they will not be shown again)

The bootstrap credentials appear in the engine log:

```
BOOTSTRAP CREDENTIALS
user_id=usr-<uuid>  username=admin  role=admin
Bootstrap API key — SAVE THIS, it will not be shown again.
api_key_id=key-<uuid>  api_secret=msk_<secret>
Revoke this bootstrap key after creating real admin credentials.
```

> Revoke the bootstrap key once you have created a real admin user with `miractl user create`.

---

## Connecting miractl

Once the engine is running, connect `miractl` to it:

```bash
miractl init
```

This launches an interactive wizard that asks for your engine URL and the admin key, and writes everything to `~/.miractl/config.yaml`.

Then log in:

```bash
miractl login
```

---

## Registering Agents (and Providers and Connectors)

Every plugin — agent, provider, or connector — **registers itself** with the engine automatically. There are no CRDs, no operators, and no manual registration APIs. When a plugin starts, the SDK's `Serve()` function connects to the engine, calls the `RegisterPlugin` gRPC endpoint, and the engine completes the handshake by calling back to the plugin's own gRPC server to retrieve its metadata (`Info`, `GetSchema`). No engine restart is required to add new plugins.

There are two deployment models depending on where the plugin process runs.

### Model 1 — Co-located (same host as the engine)

Place plugin binaries in the directory configured as `plugins.dir` in `config.yaml`. On startup, the engine launches each binary as a child process. The plugin starts its gRPC server, reads `MIRASTACK_ENGINE_ADDR` from the environment (set automatically by the engine), and self-registers with the engine.

```yaml
# config.yaml — tell the engine where your plugins live
plugins:
  dir: /opt/mirastack/plugins
```

```
/opt/mirastack/plugins/
  query-vmetrics/
    mirastack-plugin-query-vmetrics   ← executable
  query-vlogs/
    mirastack-plugin-query-vlogs      ← executable
```

To verify:

```bash
miractl agent list
# query_vmetrics   0.2.0   READ   healthy
# query_vlogs      0.2.0   READ   healthy
```

---

### Model 2 — Remote (different host, VM, or container)

If a plugin runs on a different host or in a separate container, start it with `MIRASTACK_ENGINE_ADDR` pointing to the engine and optionally `MIRASTACK_PLUGIN_ADVERTISE_ADDR` set to the address the engine can reach it on:

```bash
# On the plugin host
export MIRASTACK_ENGINE_ADDR=engine-host:9090
export MIRASTACK_PLUGIN_ADVERTISE_ADDR=192.168.1.42:50051
export VICTORIAMETRICS_URL=http://vmetrics:8428
./mirastack-plugin-query-vmetrics
```

On startup, the plugin connects to the engine at `MIRASTACK_ENGINE_ADDR`, announces itself via the `RegisterPlugin` RPC, and the engine calls back to verify the plugin and ingest its metadata. No entry in `config.yaml` is required.

If `MIRASTACK_PLUGIN_ADVERTISE_ADDR` is not set, the SDK resolves the advertise address from the OS hostname and the bound port.

> **Backward compatibility:** You can still list remote plugins in `plugins.external` in `config.yaml`. The engine will connect to those addresses on startup as before. Self-registration and static configuration coexist — self-registration takes precedence when a plugin registers under an already-configured name.

```yaml
# config.yaml — optional static listing (legacy)
plugins:
  external:
    - name: query_vmetrics
      addr: 192.168.1.42:50051
```

The plugin calls back to the engine at `MIRASTACK_ENGINE_ADDR` for cache, logging, and approval operations.

> **Both models work on bare metal, VMs, Docker, and Kubernetes.** The engine does not care where the plugin process runs — only that the plugin can reach the engine to register and the engine can reach the plugin to dispatch tasks.

### Graceful Shutdown

When a plugin receives a shutdown signal (SIGINT, SIGTERM), the SDK automatically deregisters it from the engine via the `DeregisterPlugin` RPC before stopping the gRPC server. The engine removes the plugin from the active registry immediately rather than waiting for a health check timeout.

---

## Execution Modes

The engine supports three execution modes per workflow. You configure these at the workflow level or override them globally:

| Mode | Description | When to use |
|------|-------------|-------------|
| **Manual** | Every step requires explicit approval | Highly sensitive workflows |
| **Guided** | READ actions run automatically; MODIFY/ADMIN always require approval | Recommended for most production use |
| **Autonomous** | READ actions run automatically; MODIFY/ADMIN still require approval | Same as Guided — MODIFY/ADMIN approval is always mandatory regardless of mode |

> There is no mode that bypasses MODIFY or ADMIN approval. This is by design and cannot be changed.

To set the default mode:

```bash
miractl settings set execution-mode guided
```

---

## Role-Based Access Control

The engine has three built-in roles:

| Role | Level | What they can do |
|------|-------|-----------------|
| **Operator** | L1 | Read-only: view executions, logs, approvals, audit events. Cannot approve MODIFY/ADMIN actions. |
| **Engineer** | L2 | Everything Operator can do, plus: approve MODIFY actions, trigger agentic loops, manage workflows and agent configs. |
| **Admin** | L3 | Everything Engineer can do, plus: manage users, tenant config, global settings, approve ADMIN actions, export audit logs. |

Create users:

```bash
miractl user create --email alice@company.com --role engineer
```

---

## Audit Logging

Every security-relevant action is logged automatically. Audit events include:

- Authentication (login, logout, token refresh)
- User management (create, role change, activate/deactivate)
- Workflow execution (start, complete, fail)
- Approvals (granted, rejected, timed out)
- Agentic sessions (start, tool calls, budget exhaustion)

Query recent audit events:

```bash
miractl audit list --last 50
miractl audit list --since "2026-01-01" --domain security
```

Security-domain events are stored persistently. Workflow and system events are written to stdout for your log aggregator to collect.

---

## Health Checking

The engine exposes a health endpoint:

```
GET /healthz
```

This returns `200 OK` when the engine is healthy, along with a JSON summary of component status.

```bash
curl http://localhost:8080/healthz
```

---

## Backup and Recovery

### What to Back Up

| Store | What it holds | Backup method |
|-------|--------------|---------------|
| **Kine / MariaDB** | Workflows, intent patterns, user accounts, plugin registry, audit events, all settings | Standard MariaDB backup (`mysqldump` or your HA solution) |
| **Kine / SQLite** | Same as above (local dev) | Copy the `.db` file |
| **Valkey** | Execution state, session cache, active approvals | Optional — data is transient; in-flight executions are lost on failure |

Valkey data does **not** need to be backed up for correctness. Any execution interrupted by a failure can be re-run. However, active WebSocket sessions and pending approval requests will be lost if Valkey is not persisted, so enabling Valkey persistence (`appendonly yes`) is recommended for production.

### Recovery

To restore from a MariaDB backup:

```bash
# Stop the engine
# Restore the MariaDB dump
mysql -u root -p mirastack < backup.sql
# Restart the engine — it will reconnect and resume from the last known state
```

---

## Scaling the Engine

The engine is fully stateless. All in-flight state lives in Valkey. This means you can run multiple engine instances behind a load balancer — any instance can handle any request and resume any execution.

For production, run at least two engine replicas for high availability.

---

## Upgrading

The engine uses database migrations managed through the store layer. On startup, it automatically applies any pending migrations.

To upgrade:

```bash
# Pull the new image
docker pull ghcr.io/mirastacklabs-ai/mirastack-engine:v1.x.y

# Restart (migrations run automatically at boot)
```

Always test upgrades in a staging environment first. Review the changelog for any breaking changes before upgrading production.

---

## Telemetry and Observability

The engine emits:

- **Structured logs** — JSON to stdout, ready for your log aggregator
- **Audit events** — OTLP export to any OpenTelemetry collector when `OTEL_EXPORTER_OTLP_ENDPOINT` is set

Example environment variable for OTLP export:

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
```