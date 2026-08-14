#!/usr/bin/env bash

set -euo pipefail

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

if ! command -v graphify >/dev/null 2>&1; then
  echo "graphify is not installed or is not available on PATH" >&2
  exit 1
fi

# Graphify's update path normally emits graph.html. A zero visualization limit
# keeps the project graph machine-readable only.
export GRAPHIFY_VIZ_NODE_LIMIT=0

if [[ -s graphify-out/graph.json ]]; then
  graphify update .
else
  graphify extract . --code-only
fi

find graphify-out -maxdepth 1 -type f -name graph.html -delete

if [[ ! -s graphify-out/graph.json ]]; then
  echo "graphify update did not produce graphify-out/graph.json" >&2
  exit 1
fi

if [[ -e graphify-out/graph.html ]]; then
  echo "graphify unexpectedly produced graphify-out/graph.html" >&2
  exit 1
fi
