#!/bin/sh
set -e

echo "Applying database migrations…"
npx prisma migrate deploy

# A platform admin is auto-created on first boot (see src/bootstrap.ts).
# Set ADMIN_EMAIL / ADMIN_PASSWORD to control the credentials.

exec "$@"
