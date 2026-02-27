#!/bin/sh
set -eu

D1_DATABASE_NAME="${D1_DATABASE_NAME:-habit-pilot}"

if [ ! -f node_modules/.modules.yaml ]; then
  pnpm install --frozen-lockfile
fi

pnpm wrangler d1 migrations apply "${D1_DATABASE_NAME}" --local

exec tail -f /dev/null
