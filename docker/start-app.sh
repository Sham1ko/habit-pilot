#!/bin/sh
set -eu

D1_DATABASE_NAME="${D1_DATABASE_NAME:-habit-pilot}"
PORT="${PORT:-3000}"

if [ ! -f node_modules/.modules.yaml ]; then
  pnpm install --frozen-lockfile
fi

pnpm wrangler d1 migrations apply "${D1_DATABASE_NAME}" --local

exec pnpm dev --hostname 0.0.0.0 --port "${PORT}"
