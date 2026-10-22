#!/usr/bin/env bash
# Disposable local fixture environment; no production extension is installed.
set -euo pipefail

fixture_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
kind_bin="${XDG_DATA_HOME:-$HOME/.local/share}/freelens-json-logs-spike/bin/kind"
kind_sha256=aee6151561422756b764a4ae28e7f44cda5af5a9eead3cc9985112b1de8d8e0d
cluster_name=freelens-json-logs-spike
context_name=kind-freelens-json-logs-spike

if [[ "$(uname -s):$(uname -m)" != Linux:x86_64 ]]; then
  printf 'This captured setup targets Linux x86_64.\n' >&2
  exit 1
fi

if [[ ! -f "$kind_bin" ]] || ! printf '%s  %s\n' "$kind_sha256" "$kind_bin" | sha256sum --check --status; then
  mkdir -p -- "$(dirname -- "$kind_bin")"
  curl --fail --location https://github.com/kubernetes-sigs/kind/releases/download/v0.33.0/kind-linux-amd64 --output "$kind_bin"
  printf '%s  %s\n' "$kind_sha256" "$kind_bin" | sha256sum --check
fi
chmod 755 "$kind_bin"

if ! "$kind_bin" get clusters | grep --fixed-strings --line-regexp --quiet "$cluster_name"; then
  "$kind_bin" create cluster --name "$cluster_name" --kubeconfig "$HOME/.kube/config" --config "$fixture_dir/kind.yaml" --wait 180s
fi

kubectl --kubeconfig "$HOME/.kube/config" --context "$context_name" apply -f "$fixture_dir/fixtures.yaml"
kubectl --kubeconfig "$HOME/.kube/config" --context "$context_name" -n readable-logs-spike wait --for=condition=Ready pod --all --timeout=120s
printf '\nReady: open context %s in Freelens.\n' "$context_name"
