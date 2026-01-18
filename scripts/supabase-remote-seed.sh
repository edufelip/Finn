#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  if [[ -f "$REPO_ROOT/.env" ]]; then
    RAW_SUPABASE_URL="$(
      rg "^EXPO_PUBLIC_SUPABASE_URL=" "$REPO_ROOT/.env" \
        | head -n 1 \
        | sed -E "s/^EXPO_PUBLIC_SUPABASE_URL=//" \
        | sed -E "s/^[[:space:]]+|[[:space:]]+$//g" \
        | sed -E "s/^['\\\"]|['\\\"]$//g"
    )"
    SUPABASE_PROJECT_REF="$(
      printf '%s' "$RAW_SUPABASE_URL" \
        | sed -E "s#^https?://([^\\.]+)\\.supabase\\.co.*#\\1#"
    )"
  fi
fi

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "SUPABASE_PROJECT_REF is required (e.g. abcd1234efgh5678) or set EXPO_PUBLIC_SUPABASE_URL in .env." >&2
  exit 1
fi

supabase link --project-ref "$SUPABASE_PROJECT_REF" --workdir "$REPO_ROOT"

PROD_REF="$(
  rg -n "\"db:link:prod\"" "$REPO_ROOT/package.json" \
    | head -n 1 \
    | sed -E "s/.*--project-ref[[:space:]]+([a-z0-9]+).*/\\1/"
)"

if [[ -n "${PROD_REF:-}" && "$SUPABASE_PROJECT_REF" == "$PROD_REF" && "${SUPABASE_ALLOW_PROD_SEED:-}" != "true" ]]; then
  echo "Refusing to seed production project ($SUPABASE_PROJECT_REF). Set SUPABASE_ALLOW_PROD_SEED=true to override." >&2
  exit 1
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  if [[ -f "$REPO_ROOT/.env" ]]; then
    SUPABASE_SERVICE_ROLE_KEY="$(
      rg "^SUPABASE_SERVICE_ROLE_KEY=" "$REPO_ROOT/.env" \
        | head -n 1 \
        | sed -E "s/^SUPABASE_SERVICE_ROLE_KEY=//" \
        | sed -E "s/^[[:space:]]+|[[:space:]]+$//g" \
        | sed -E "s/^['\\\"]|['\\\"]$//g"
    )"
  fi
fi

if [[ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  echo "SUPABASE_SERVICE_ROLE_KEY is required to seed via admin API." >&2
  exit 1
fi

node "$REPO_ROOT/scripts/seed-remote.js"
