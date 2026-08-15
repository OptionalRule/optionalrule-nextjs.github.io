#!/usr/bin/env bash

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

if ! command -v graphify >/dev/null 2>&1; then
  echo "graphify is not installed or is not available on PATH" >&2
  exit 1
fi

graphify hook install

for hook in .git/hooks/post-commit .git/hooks/post-checkout; do
  if [[ ! -f "$hook" ]]; then
    echo "graphify did not install $hook" >&2
    exit 1
  fi

  if ! grep -q '^export GRAPHIFY_VIZ_NODE_LIMIT=0$' "$hook"; then
    sed -i '/^export PYTHONHASHSEED=0$/a export GRAPHIFY_VIZ_NODE_LIMIT=0' "$hook"
  fi
done

graphify hook status
