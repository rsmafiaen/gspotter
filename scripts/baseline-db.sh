#!/usr/bin/env bash
#
# One-time bootstrap for databases that were created with `prisma db push`.
#
# `db push` syncs the schema but never runs migration SQL, so SQL-only
# migrations (functions, triggers, ...) are missing and there is no
# `_prisma_migrations` table. This script marks the already-pushed schema
# migrations as applied, leaving SQL-only migrations pending so that
# `prisma migrate deploy` actually runs them.
#
# It is safe to run more than once: it does nothing once migration history
# exists, and nothing on an empty database (`migrate deploy` handles that).
#
# Usage: pnpm db:baseline

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if [[ -z ${DATABASE_URL:-} ]]; then
  DATABASE_URL="$(
    sed -n 's/^DATABASE_URL=//p' packages/db/.env | tr -d '"' | head -n1
  )"
fi

if [[ -z ${DATABASE_URL:-} ]]; then
  echo "DATABASE_URL is not set and could not be read from packages/db/.env" >&2
  exit 1
fi

export DATABASE_URL

query() {
  psql "$DATABASE_URL" -tAc "$1"
}

if [[ -n "$(query "select to_regclass('public._prisma_migrations')")" ]]; then
  echo "Migration history already exists; nothing to baseline."
  exit 0
fi

if [[ -z "$(query "select to_regclass('public.venue')")" ]]; then
  echo "Empty database detected; prisma migrate deploy will create everything."
  exit 0
fi

echo "Found a db push-managed schema without migration history; baselining..."

for migration_dir in packages/db/prisma/migrations/*/; do
  migration="$(basename "$migration_dir")"

  # Migrations that only contain regular DDL are already reflected in the
  # database, because `db push` synced the whole schema. SQL-only migrations
  # are not, so those have to stay pending for `migrate deploy`.
  if grep -qiE 'create (or replace )?(function|procedure|trigger)' \
    "$migration_dir/migration.sql"; then
    case "$migration" in
      *add_haversine_distance_function)
        # Leave it pending unless it was already created by hand.
        if [[ -n "$(query "select to_regprocedure('haversine_distance(double precision,double precision,double precision,double precision)')")" ]]; then
          pnpm --filter @t09-project-2/db exec prisma migrate resolve --applied "$migration"
        else
          echo "Leaving $migration pending (SQL-only migration)."
        fi
        ;;
      *)
        echo "Leaving $migration pending (SQL-only migration)."
        ;;
    esac
    continue
  fi

  pnpm --filter @t09-project-2/db exec prisma migrate resolve --applied "$migration"
done

echo "Baseline complete. Run 'pnpm db:deploy' to apply the SQL-only migrations."
