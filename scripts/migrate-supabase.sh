#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env.supabase"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Create $ENV_FILE from .env.supabase.example and paste the Supabase DATABASE_URL."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is missing in .env.supabase"
  exit 1
fi

cd "$ROOT/backend"
npx prisma migrate deploy
echo "Supabase schema is up to date."
