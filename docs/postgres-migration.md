# PostgreSQL Migration Path

The application uses SQLite by default and can switch to PostgreSQL through the
`DATABASE_URL` environment variable. The SQLAlchemy adapter preserves the
existing `Store` contract, so pipeline stages and API routes do not need a
second implementation.

## Prerequisites

Install the production dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

The PostgreSQL URL uses the psycopg 3 dialect:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

Do not commit the URL. Configure it as a Render secret/environment variable or
through the local shell.

## Verify the adapter locally

The adapter can be exercised without a PostgreSQL server by using SQLite through
SQLAlchemy:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_db_sqlalchemy.py -q
```

This creates all six tables, runs the pipeline, checks reads and counts, and
verifies upserts.

## Create the PostgreSQL schema

The schema is created automatically by `SQLAlchemyStore` on startup using
`MetaData.create_all`. For a first deployment:

1. Create an empty PostgreSQL database.
2. Set `DATABASE_URL` on the API service.
3. Deploy or restart the API.
4. Check `/health`, then verify `/api/sites` and `/insights`.

`app.main.create_app()` selects `SQLAlchemyStore` when `DATABASE_URL` is set.
Without it, the existing `Store("onehealth.db")` SQLite path remains active.

## Migrating existing SQLite data

The adapter creates the target schema, but it does not silently copy data from
SQLite. For a production migration, export each SQLite table as JSON/CSV or use
a one-off migration script that maps the existing columns to the six SQLAlchemy
tables. Preserve these keys during the copy:

- `submission_id` for raw observations
- `observation_id` for every downstream table
- `research_site`, `risk_index`, `risk_level`, and `generated_at` for insights
- the complete JSON payload and serialized FHIR bundle

After copying, compare row counts with `Store.count()` and
`SQLAlchemyStore.count()` before switching traffic.

## Cutover and rollback

Use a staged cutover:

1. Run the adapter contract tests against the target database.
2. Deploy the API with `DATABASE_URL` pointing to PostgreSQL.
3. Keep the old SQLite file as a read-only rollback snapshot.
4. Smoke-test `/health`, `/api/summary`, `/api/sites`, `/insights`, trends, and FHIR retrieval.
5. Roll back by removing `DATABASE_URL` and restarting the API, or by restoring
a previous deployment that uses SQLite.

The adapter currently uses one SQLAlchemy session per store instance and commits
at the same stage boundaries as the SQLite store via `flush()`. For multiple API
workers, PostgreSQL handles concurrent connections through SQLAlchemy's engine
pool; run migrations/copies before enabling writes from all workers.
