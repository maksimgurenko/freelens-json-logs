# Disposable Kubernetes environment for the Freelens host spike

This environment unblocks [Provide a Kubernetes test context for the host integration spike](https://github.com/maksimgurenko/freelens-json-logs/issues/9). It is a local test cluster with synthetic logs, not the readable-log extension. The later [Freelens host integration spike](https://github.com/maksimgurenko/freelens-json-logs/issues/7) still has to demonstrate the extension contracts in the real host.

## Captured setup

- kind **v0.33.0**, Linux amd64, binary SHA-256 `aee6151561422756b764a4ae28e7f44cda5af5a9eead3cc9985112b1de8d8e0d`.
- Kubernetes **v1.37.0**, one Docker control-plane container, node image pinned in `kind.yaml`.
- BusyBox **1.37.0**, image digest pinned in `fixtures.yaml`.
- Existing Docker **29.8.2**, kubectl **v1.37.1**, installed Freelens package **1.10.3-1**.
- Cluster name `freelens-json-logs-spike`; context `kind-freelens-json-logs-spike`; namespace `readable-logs-spike`.
- API bound to **127.0.0.1**, with a dynamically allocated host port. No application service, ingress or external port is created.
- Kubeconfig generated at `~/.kube/config`. Credentials stay there and are not part of this branch. The setup originally started with no kubeconfig or contexts.
- Tool kept at `~/.local/share/freelens-json-logs-spike/bin/kind`, without changing PATH or installing a system package.

See the official [kind quick start](https://kind.sigs.k8s.io/docs/user/quick-start/) and [v0.33.0 release, published 2026-08-26](https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0) for installation, pinned node images, kubeconfig and cluster deletion. Both were checked during setup on 2026-10-21 in America/Cancun.

## Reproduce

Docker must be running and accessible to the current user, and kubectl must be installed. From this disposable branch:

```bash
bash prototypes/host-test-cluster/setup.sh
```

The setup downloads and verifies the pinned kind binary when needed, creates the named cluster if absent, applies the fixtures, and waits for both Pods. It uses `~/.kube/config` explicitly. Existing kubeconfig entries are preserved by kind. Reapplying fixtures leaves already-running containers intact; delete a fixture Pod and reapply its manifest to reset its output.

Open the existing Freelens installation. Its default kubeconfig synchronization discovers `kind-freelens-json-logs-spike` in Catalog → Clusters. Open that cluster and select the `readable-logs-spike` namespace, then Workloads → Pods. No extension installation is part of this environment setup.

## Fixtures and checks

| Pod | Container | Expected application output |
| --- | --- | --- |
| `single-json` | `json` (default) | Exactly one JSON-object line, then silence |
| `single-json` | `empty` | No output |
| `changing-logs` | `json` (default) | JSON object every three seconds, increasing `sequence` |
| `changing-logs` | `plain` | Plain text every three seconds, increasing `sequence` |

The exact single-record payload is:

```json
{"level":"info","message":"freelens-json-logs-spike","sequence":1,"fixture":true}
```

Read metadata and bounded timestamp-prefixed logs:

```bash
kubectl --context kind-freelens-json-logs-spike -n readable-logs-spike get pods
kubectl --context kind-freelens-json-logs-spike -n readable-logs-spike logs single-json -c json --timestamps --tail=10
kubectl --context kind-freelens-json-logs-spike -n readable-logs-spike logs single-json -c empty --timestamps --tail=10
kubectl --context kind-freelens-json-logs-spike -n readable-logs-spike logs changing-logs -c json --timestamps --tail=10
kubectl --context kind-freelens-json-logs-spike -n readable-logs-spike logs changing-logs -c plain --timestamps --tail=10
```

These fixtures do not provide an RBAC-denied context, previous-instance logs or an oversized record. The changing output makes pause/refresh and container switching observable, but this setup does not itself validate extension behavior. The single-record fixture can later probe the source-researched whole-body JSON decoding edge case through Freelens; kubectl alone does not exercise that host API.

## Observed result

Checked on **2026-10-21 America/Cancun** (**2026-10-22 UTC**):

- The kind node reported Ready, Kubernetes v1.37.0; both fixture Pods reported 2/2 Running with zero restarts.
- A bounded `kubectl logs` request returned exactly one timestamp-prefixed line from `single-json/json`. Removing only the transport prefix yielded the exact payload above, including all JSON fields.
- `single-json/empty` returned an empty string. Both containers of `changing-logs` returned their distinct timestamp-prefixed output.
- The context allowed Pod metadata and `pods/log` reads.
- The installed Freelens 1.10.3 discovered the context from `~/.kube/config` automatically. Opening it reached the cluster overview, which reported no cluster issues. Workloads → Pods, filtered to `readable-logs-spike`, showed `changing-logs` and `single-json` as Running.
- Running `setup.sh` again left the namespace and both Pods unchanged and reconfirmed readiness. Shell syntax validation passed.

This resolves environment access only. No new extension was built or installed, and the required Pod-action navigation, SDK log-reading behavior, saved-setting restart proof and human prototype verdict remain with the host integration spike.

## Remove when the host experiment is finished

Keep the cluster running until the integration spike is done. Then:

```bash
~/.local/share/freelens-json-logs-spike/bin/kind delete cluster --name freelens-json-logs-spike --kubeconfig ~/.kube/config
```

This removes the named cluster and its kubeconfig entries. Downloaded images and the task-specific tool/state directories are left available for reuse; do not run a broad Docker cleanup. Freelens should drop the discovered cluster when kubeconfig synchronization observes the removal.
