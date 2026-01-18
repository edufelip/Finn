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

echo "Using project ref: ${SUPABASE_PROJECT_REF}"

supabase link --project-ref "$SUPABASE_PROJECT_REF" --workdir "$REPO_ROOT"
supabase db push --linked --include-all --workdir "$REPO_ROOT"
