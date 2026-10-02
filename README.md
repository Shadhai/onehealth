# OneHealth Lens

OneHealth Lens turns citizen water observations into explainable, auditable One
Health intelligence. It connects ecosystem health, animal biodiversity, and
human exposure in one workflow, then publishes the result as interoperable FHIR
resources and action-oriented impact cards.

## Why It Stands Out

- **Explainable risk:** every score exposes three domain pillars, diagnostic
  triggers, recommendations, validation flags, and provenance.
- **Clinical interoperability:** observations become FHIR R4 bundles using the
  OneAquaHealth/OAH profile.
- **Auditable by design:** raw, normalized, validated, enriched, insight, and
  FHIR outputs are persisted end to end.
- **Measured scale:** 500 synthetic observations complete in 25.587 seconds at
  19.5 observations/second with zero dropped records or errors.
- **Deployment-ready:** SQLite is the local default; a SQLAlchemy adapter gives
  the project a documented PostgreSQL migration path.

## Risk Model

| Domain | Weight | Evidence examples |
| --- | ---: | --- |
| Ecosystem and hydrology | **50%** | pH, dissolved oxygen, TDS, conductivity, runoff, channel condition |
| Animal and fauna health | **30%** | Macroinvertebrates, diatoms, fish, amphibians, birds, diptera, ticks |
| Human public health | **20%** | Coliforms, pharmaceuticals, odour, exposure and contamination signals |

Risk bands are consistent across the API and UI:

- **0.00-0.24:** Low risk / stable resilience
- **0.25-0.54:** Moderate risk / monitor
- **0.55-1.00:** High risk / action required

## Nine-Stage Pipeline

1. **Ingest** raw citizen observations from mock, API, or file sources.
2. **Normalize** units and field names, including Fahrenheit, saturation, g/L,
   and mS/cm conversions.
3. **Validate** numeric limits, cross-field consistency, and site-level
   Isolation Forest anomalies.
4. **Enrich** observations with optional Open-Meteo weather context.
5. **Correlate** ecosystem, animal, and human evidence into weighted risk.
6. **Map to FHIR** R4/OAH resources and bundles.
7. **Render insights** as explainable impact-card JSON.
8. **Store** every stage for provenance, trends, and audit.
9. **Distribute** cards, trends, maps, CSV exports, and FHIR previews.

The validation stage fits one anomaly model per research site and reuses it
across the batch. Database writes are committed once per stage rather than once
per row.

## Architecture

```mermaid
flowchart LR
   Sources["Citizen reports\nMock / API / CSV"] --> Ingest["1. Ingest"]
   Ingest --> Normalize["2. Normalize\nUnits + field mapping"]
   Normalize --> Validate["3. Validate\nRules + Isolation Forest"]
   Validate --> Enrich["4. Enrich\nOpen-Meteo context"]
   Enrich --> Correlate["5. Correlate\n50% Eco / 30% Fauna / 20% Human"]
   Correlate --> FHIR["6. FHIR Map\nR4 + OAH profiles"]
   Correlate --> Insight["7. Insight\nExplainable cards"]
   FHIR --> Store["8. Store\nSQLite or PostgreSQL"]
   Insight --> Store
   Store --> API["FastAPI\nSites / trends / flags / FHIR"]
   API --> UI["React + Vite\nDashboard / Cards / Map / Audit"]
   UI --> Actions["CSV / FHIR preview\nPrint / copy / listen"]
   Store --> Distribute["9. Distribute\nCommunity cards + GIS"]
```

## How It Works

1. A citizen report enters through the ingest route or a local fixture. The
  original payload is retained so every later result can be traced back to its
  source observation.
2. The normalization stage maps source fields into the typed observation
  schema and converts units such as Fahrenheit, oxygen saturation, g/L, and
  mS/cm into analysis-ready values.
3. Validation applies hard numeric bounds, cross-field consistency checks, and
  one reusable anomaly model per research site. Each flag includes a rule ID,
  severity, value, message, and explanation.
4. Optional weather enrichment adds precipitation and temperature context. The
  pipeline can disable network enrichment for deterministic tests and load
  benchmarks.
5. Correlation calculates the One Health Risk Index from ecosystem, animal, and
  human evidence. The result includes the three pillar scores, causal links,
  confidence, risk band, and recommended actions.
6. The FHIR stage maps the observation and insight into a FHIR R4 collection
  bundle with OAH profile metadata. The insight stage creates the frontend card
  representation from the same typed result.
7. Every stage is stored with its payload. SQLite is the default local adapter;
  `DATABASE_URL` switches the application to the SQLAlchemy PostgreSQL adapter.
8. FastAPI exposes the stored data to the React frontend. The UI adds search,
  filtering, trends, a seven-day regression forecast, maps, audit views, and
  FHIR/CSV actions without changing the underlying evidence.
9. CI verifies the backend, frontend, FHIR structure, 500-record load test, and
  browser workflows on every push or pull request.

## Product Features

### Analytical frontend

- Dashboard with monitored-site KPIs, risk distribution, flags, search, filters,
  and sortable segments.
- Impact Cards with risk-sorted catchments, three-pillar evidence, causal links,
  diagnostic triggers, protocol recommendations, FHIR preview, copy, print, and
  listen controls.
- First-visit Impact Cards onboarding guide with persistent dismissal and reopen
  control.
- Trends view with historical risk charts, pillar trajectories, confidence,
  weekly activity, and a **7-day linear-regression risk forecast** with slope,
  R-squared fit, and daily projections.
- One Health matrix, spatial catchment map, audit trail, and overview narrative.
- Animated Three.js low-poly octopus bio-indicator, lazy-loaded so the main
  frontend bundle stays separate from the 3D renderer.
- English, Portuguese, French, Italian, Dutch, and Norwegian UI dictionaries,
  with matching speech-synthesis locale support.
- Dark/light theme, responsive layout, keyboard-accessible controls, and
  browser-native glossary explanations.

### API and interoperability

- FastAPI endpoints for sites, summaries, insights, trends, flags, ingestion,
  CSV export, and FHIR retrieval.
- FHIR R4 collection bundles with OAH profile metadata and linked resources.
- CORS configuration for local development and Vercel deployments.
- Vercel frontend configuration and Render backend configuration via
  [`render.yaml`](render.yaml).

## Measured Load Test

The deterministic generator creates 500 observations across 25 sites over 90
days, with realistic healthy/moderate/poor distributions and intentional unit
variation. The benchmark runs the full pipeline with weather calls disabled so
the result measures local processing and persistence.

Latest result: [`docs/load-test-report.json`](docs/load-test-report.json)

| Metric | Result |
| --- | ---: |
| Input observations | 500 |
| Output insights | 500 |
| Elapsed time | 25.587 s |
| Throughput | **19.5 observations/s** |
| Average latency | 51.174 ms/observation |
| Peak traced memory | 7.81 MB |
| Errors | 0 |
| Raw / normalized / validated / enriched / insights / bundles | 500 each |

Risk distribution: 79 high, 109 moderate, and 312 low-risk results.

Run it again:

```powershell
.\.venv\Scripts\python.exe scripts\generate_synthetic.py
.\.venv\Scripts\python.exe scripts\load_test.py
```

## Local Development

Requirements: Python 3.11, Node.js 20+, and npm.

Install dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm install
```

Start the API:

```powershell
uvicorn app.main:app --reload --port 8000
```

Start the frontend in a second terminal:

```powershell
npm run dev
```

Open `http://localhost:5173`. Vite proxies API, FHIR, ingest, and health calls
to `http://localhost:8000`.

Build production assets:

```powershell
npm run build
```

The Vite root is `frontend/`; output is written to `frontend/dist/`.

## PostgreSQL Migration

SQLite is the default local store. Set `DATABASE_URL` to activate the working
SQLAlchemy adapter:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

The adapter creates the six pipeline tables automatically and preserves the
existing store contract. Verify it locally with:

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_db_sqlalchemy.py -q
```

See [`docs/postgres-migration.md`](docs/postgres-migration.md) for schema
creation, data-copy guidance, staged cutover, and rollback.

## Testing

Backend tests:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Current backend result: **70 passed**.

Frontend unit tests:

```powershell
npm test -- --run
```

Current frontend result: **26 passed**.

Playwright browser tests:

```powershell
npx playwright install chromium
npm run test:e2e
```

The suite covers the shell, dashboard, Impact Cards, and cross-page navigation.
Reports and traces are written to ignored `playwright-report/` and
`test-results/` directories.

## Continuous Integration

GitHub Actions runs five verification paths on pushes and pull requests:

1. Backend pytest suite.
2. Frontend Vitest suite.
3. FHIR bundle structure and OAH profile validation.
4. 500-observation load test with a zero-error and throughput gate.
5. Playwright Chromium E2E workflows.

The workflow is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Repository Layout

```text
app/
  api/routes/       FastAPI endpoints
  pipeline/         Nine processing stages
  schemas/          Pydantic observation and insight contracts
  db.py             SQLite store
  db_sqlalchemy.py  SQLAlchemy/PostgreSQL adapter
frontend/
  pages/            Dashboard, cards, trends, map, audit, and One Health views
  components/       Shared controls and 3D bio-indicator
  lib/              API, i18n, language context, and forecast logic
scripts/            Synthetic data generation, load test, and persistence demo
tests/              Backend and adapter tests
e2e/                Playwright browser workflows
docs/               Load-test report and migration documentation
```

## License

No license file is currently included in this repository.
