# SQLite as the primary application database

## Decision

The application backend stores routes, tracks, and photo geolocations in a local
SQLite file. `data/cammini.sqlite` is the default location; `DB_FILE` can select
another file. The server uses Node.js's built-in `node:sqlite` driver.

PostgreSQL is retained only as an optional source for the one-time import
command, `npm run db:migrate-sqlite`. Runtime API requests do not connect to
PostgreSQL.

## Rationale

SQLite removes the need to run or configure a PostgreSQL service for the
application while keeping its records in a portable local file. The import
command performs idempotent upserts and verifies the imported row counts.

## Consequences

- Deployments must keep the SQLite file persistent and writable.
- PostgreSQL connection settings are needed only when importing from PostgreSQL.
- Node.js 22 or later is required for the built-in SQLite driver.
