---
title: "Installation"
layout: docs
parent: "Telegen"
grand_parent: "MIRASTACK Documentation"
nav_order: 2
---
# Installation

Comprehensive guides for deploying Telegen across all supported platforms.

## Deployment Methods

| Platform | Mode | Guide |
|----------|------|-------|
| **Unified Pipeline** | All Platforms | [Deployment](deployment) |
| **Kubernetes** | Agent (DaemonSet) | [Kubernetes](kubernetes) |
| **Helm** | Agent/Collector | [Helm](helm) |
| **Docker** | Agent/Collector | [Docker](docker) |
| **Linux** | systemd service | [Linux](linux) |
| **OpenShift** | Agent (DaemonSet) | [Openshift](openshift) |
| **AWS ECS** | Agent (Daemon) | [ECS](ecs) |


<div class="callout callout-tip">

New deployments should use the **Unified Pipeline** guide which includes data quality controls, transformation, and PII redaction.

</div>


## Quick Reference

### Minimum Requirements

- **Kernel**: Linux 4.18+ (5.8+ recommended)
- **CPU**: 200m
- **Memory**: 256 MB
- **Network**: Outbound to OTLP endpoint (4317/4318)

### Choosing a Deployment Mode

```mermaid
graph TD
    A[What do you need to monitor?] --> B{Local hosts?}
    B -->|Yes| C[Agent Mode]
    B -->|No| D{Remote devices?}
    D -->|Yes| E[Collector Mode]
    D -->|Both| F[Both Modes]
    
    C --> G[DaemonSet / systemd]
    E --> H[Deployment / service]
    F --> I[DaemonSet + Deployment]
```

