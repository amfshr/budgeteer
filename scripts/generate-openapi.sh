#!/usr/bin/env bash
# Regenerates the committed OpenAPI snapshot from a RUNNING dev app.
#
#   1. Start the backend (IDE debug run or ./scripts/dev.sh) — dev profile enables springdoc
#   2. ./scripts/generate-openapi.sh
#   3. Review the docs/api/openapi.json diff and commit it with your API change
#
# The snapshot is the reviewable contract: PR diffs show endpoint/DTO changes, and
# budgeteer-web generates TypeScript types from it (openapi-typescript, joining by #16).

set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/docs/api/openapi.json"

if ! curl -sf "$BASE_URL/api/health" > /dev/null; then
    echo "❌ Backend not reachable at $BASE_URL — start it first (IDE run or ./scripts/dev.sh)"
    exit 1
fi

mkdir -p "$(dirname "$OUT")"

# jq: pretty-print with stable key order so diffs are minimal and reviewable
curl -sf "$BASE_URL/v3/api-docs" | jq -S . > "$OUT"

echo "✅ OpenAPI snapshot written to docs/api/openapi.json"
echo "   $(jq -r '.paths | length' "$OUT") paths, $(jq -r '.components.schemas | length' "$OUT") schemas"
