---
title: "Telegen"
layout: docs
parent: "MIRASTACK Documentation"
nav_order: 10
---
# Telegen Documentation


**Telegen** is a zero-configuration observability agent that automatically discovers and instruments your entire infrastructure using eBPF. Deploy with a single command and get complete visibility across metrics, traces, logs, and profiles.

> *"Instrument everything. Configure nothing."*

---

## Key Features


<div class="docs-feature-grid">
<div class="docs-feature-card"><div class="docs-feature-card__title">🔍 Auto-Discovery</div><div class="docs-feature-card__body">Automatically detects cloud providers, Kubernetes, databases, and runtimes without configuration.</div></div>
<div class="docs-feature-card"><div class="docs-feature-card__title">📊 Distributed Tracing</div><div class="docs-feature-card__body">eBPF-powered tracing for HTTP, gRPC, and database protocols without code changes.</div></div>
<div class="docs-feature-card"><div class="docs-feature-card__title">🔥 Continuous Profiling</div><div class="docs-feature-card__body">CPU, off-CPU, memory, and mutex profiling with flame graph generation.</div></div>
<div class="docs-feature-card"><div class="docs-feature-card__title">🛡️ Security Observability</div><div class="docs-feature-card__body">Syscall auditing, file integrity monitoring, and container escape detection.</div></div>
<div class="docs-feature-card"><div class="docs-feature-card__title">🌐 Network Observability</div><div class="docs-feature-card__body">DNS tracing, TCP metrics, XDP packet analysis, and service mesh integration.</div></div>
<div class="docs-feature-card"><div class="docs-feature-card__title">📡 OpenTelemetry Native</div><div class="docs-feature-card__body">100% OTel-compliant output via OTLP to any compatible backend.</div></div>
</div>


---

## Quick Start

```bash
# Kubernetes (Helm)
helm install telegen oci://ghcr.io/mirastacklabs-ai/charts/telegen \
  --namespace telegen --create-namespace \
  --set otlp.endpoint="otel-collector:4317"
```

For Linux, see the [Linux](installation/linux) guide.

That's it! Telegen auto-discovers everything and starts collecting telemetry.

---

## Documentation


---

## Support

- **Documentation**: [telegen.mirastacklabs.ai](https://telegen.mirastacklabs.ai)
- **GitHub Issues**: [github.com/mirastacklabs-ai/telegen/issues](https://github.com/mirastacklabs-ai/telegen/issues)
- **Discussions**: [github.com/mirastacklabs-ai/telegen/discussions](https://github.com/mirastacklabs-ai/telegen/discussions)

## License

Telegen is released under the Apache 2.0 License.
