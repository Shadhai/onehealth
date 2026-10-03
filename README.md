<!-- Generated for Shadhai/onehealth. Source of truth: your existing README (repo page was not fetchable: robots.txt).
     Lines marked UPDATE/VERIFY/ADD are inferred and need a quick check. -->

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f4c81,50:1a7abf,100:00d4ff&height=220&section=header&text=%F0%9F%92%A7%20OneHealth%20Lens&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Citizen%20water%20data%20%E2%86%92%20explainable%20One%20Health%20intelligence&descAlignY=60&descSize=18&animation=fadeIn" width="100%" />

<a href="https://github.com/Shadhai/onehealth/actions/workflows/ci.yml"><img src="https://github.com/Shadhai/onehealth/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
<img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge&logo=open-source-initiative&logoColor=white" alt="License" />
<img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/FHIR-R4%20%2F%20OAH-E4572E?style=for-the-badge&logo=hl7&logoColor=white" />
<img src="https://img.shields.io/badge/Tests-76%20backend%20%2B%2028%20frontend-brightgreen?style=for-the-badge&logo=pytest&logoColor=white" />
<img src="https://img.shields.io/github/stars/Shadhai/onehealth?style=for-the-badge&logo=github&color=yellow" />

<h3>🚀 An open-source alternative to closed, single-domain water-quality dashboards</h3>

<p>
<b>OneHealth Lens</b> is for catchment managers, public-health teams, researchers and citizen-science groups.<br/>
It turns raw water observations into <b>explainable, auditable risk scores</b> across ecosystem, animal and human health,<br/>
then publishes them as <b>FHIR R4 bundles</b> and action-ready <b>impact cards</b>, with every step traceable.
</p>

<a href="#-quick-start"><img src="https://img.shields.io/badge/Quick%20Start-▶%20Get%20Running-0f4c81?style=for-the-badge" /></a>
<a href="#-api-reference"><img src="https://img.shields.io/badge/API%20Docs-📖%20Explore-1a7abf?style=for-the-badge" /></a>
<a href="#-features"><img src="https://img.shields.io/badge/Features-✨%20See%20All-00d4ff?style=flat-square&labelColor=0f4c81" /></a>

</div>

---

## 📑 Table of Contents

- [📸 Visual Demo](#-visual-demo)
- [🎯 Purpose & Philosophy](#-purpose--philosophy)
- [🧠 Risk Model](#-risk-model)
- [🏗️ Architecture](#️-architecture)
- [🔄 Nine-Stage Pipeline](#-nine-stage-pipeline)
- [✨ Features](#-features)
- [🧰 Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Config](#️-environment-config)
- [📖 API Reference](#-api-reference)
- [⚡ Measured Load Test](#-measured-load-test)
- [🌍 Use Cases](#-use-cases)
- [🗂️ Project Structure](#️-project-structure)
- [🐳 Docker & Deployment](#-docker--deployment)
- [🐘 PostgreSQL Migration](#-postgresql-migration)
- [🧪 Testing & CI](#-testing--ci)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [👥 Contributors](#-contributors)
- [🤖 AI-Ready Files](#-ai-ready-files)
- [📝 Changelog](#-changelog)
- [📄 License](#-license)

---

## 📸 Visual Demo

<!-- ADD (optional): a short GIF walkthrough, e.g. ![Demo](docs/demo.gif) -->

<div align="center">

<img src="docs/screenshots/hero_a.png" alt="OneHealth Lens overview" width="100%" />

</div>

### 📊 Dashboard

| Portfolio view | Filtered segments |
|:---:|:---:|
| <img src="docs/screenshots/dashboard_a.png" alt="Dashboard A" /> | <img src="docs/screenshots/dashboard_b.png" alt="Dashboard B" /> |

### 🪪 Impact Cards

| Card segment 1 | Card segment 2 |
|:---:|:---:|
| <img src="docs/screenshots/impact-card-segment-4a.png" alt="Impact card 4a" /> | <img src="docs/screenshots/impact-card-segment-4b.png" alt="Impact card 4b" /> |

### 🧬 One Health Matrix & Spatial Map

| Matrix | Matrix (detail) | Catchment map | Map (detail) |
|:---:|:---:|:---:|:---:|
| <img src="docs/screenshots/one_health_matrix_a.png" alt="Matrix A" /> | <img src="docs/screenshots/one_health_matrix_b.png" alt="Matrix B" /> | <img src="docs/screenshots/map_a.png" alt="Map A" /> | <img src="docs/screenshots/map_b.png" alt="Map B" /> |

### 📈 Trends & Forecast

<div align="center">
<img src="docs/screenshots/trends.png" alt="Trends and 7-day forecast" width="90%" />
</div>

### 🏥 FHIR Output & Validation

| FHIR R4 bundle (JSON) | FHIR validator: 0 errors |
|:---:|:---:|
| <img src="docs/screenshots/fhir-bundle-json.png" alt="FHIR bundle JSON" /> | <img src="docs/screenshots/fhir-validator-0-errors.png" alt="FHIR validator 0 errors" /> |

<details>
<summary>More hero shots</summary>

| | |
|:---:|:---:|
| <img src="docs/screenshots/hero_b.png" alt="Hero B" /> | <img src="docs/screenshots/hero_c.png" alt="Hero C" /> |
| <img src="docs/screenshots/hero_d.png" alt="Hero D" /> | |

</details>

---

## 🎯 Purpose & Philosophy

> Citizen water reports are plentiful, but they arrive in mixed units, with inconsistent fields, split across ecology and health silos, and rarely in a form clinicians or regulators can trust.

**OneHealth Lens** closes that gap by connecting **ecosystem health, animal biodiversity and human exposure** in one pipeline whose output you can audit line by line.

- 🔍 **Explainable by default:** every score exposes its three pillars, diagnostic triggers, recommendations, validation flags and provenance.
- 🧩 **Interoperable by design:** observations become FHIR R4 bundles with OneAquaHealth (OAH) profile metadata.
- 📊 **Auditable end to end:** raw, normalized, validated, enriched, insight and FHIR outputs are all persisted.
- ⚡ **Measured, not claimed:** 500 observations processed in 25.587 s with zero errors, reproducible with one script.

---

## 🧠 Risk Model

| Domain | Weight | Evidence examples |
| --- | ---: | --- |
| Water quality stress | **30%** | pH, dissolved oxygen, TDS, conductivity, nutrients, and coliforms |
| Biological health | **30%** | Macroinvertebrates, diatoms, fish, amphibians, and invasive organisms |
| Human exposure | **20%** | Coliforms, pharmaceuticals, odour, appearance, and contamination signals |
| Environmental pressure | **20%** | Rainfall runoff, channel modification, connectivity, erosion, and vegetation |

The four-domain weights are configurable engineering defaults informed by the
indicator fields and thresholds documented in the OneAquaHealth/FHIR mappings.
They must be calibrated against field and laboratory reference data before the
index is used for regulatory or clinical decisions. The frontend presents the
results as three citizen-facing pillars: ecosystem (water quality plus
environmental pressure), animal, and human health.

Risk bands are identical across the API and UI:

| Score | Band | Meaning |
|:---:|:---|:---|
| 🟢 `0.00 – 0.24` | **Low** | Stable resilience |
| 🟡 `0.25 – 0.54` | **Moderate** | Monitor |
| 🔴 `0.55 – 1.00` | **High** | Action required |

---

## 🏗️ Architecture

```mermaid
flowchart LR
   Sources["Citizen reports\nMock / API / CSV"] --> Ingest["1. Ingest"]
   Ingest --> Normalize["2. Normalize\nUnits + field mapping"]
   Normalize --> Validate["3. Validate\nRules + Isolation Forest"]
   Validate --> Enrich["4. Enrich\nOpen-Meteo context"]
   Enrich --> Correlate["5. Correlate\n30% Water / 30% Bio / 20% Human / 20% Environment"]
   Correlate --> FHIR["6. FHIR Map\nR4 + OAH profiles"]
   Correlate --> Insight["7. Insight\nExplainable cards"]
   FHIR --> Store["8. Store\nSQLite or PostgreSQL"]
   Insight --> Store
   Store --> API["FastAPI\nSites / trends / flags / FHIR"]
   API --> UI["React + Vite\nDashboard / Cards / Map / Audit"]
   UI --> Actions["CSV / FHIR preview\nPrint / copy / listen"]
   Store --> Distribute["9. Distribute\nCommunity cards + GIS"]
```

---

## 🔄 Nine-Stage Pipeline

| # | Stage | What happens |
|:---:|:---|:---|
| 1 | 📥 **Ingest** | Raw observations from mock, API or file sources; the original payload is always retained |
| 2 | 🔧 **Normalize** | Field mapping plus conversions for °F, oxygen saturation, g/L and mS/cm |
| 3 | ✅ **Validate** | Numeric bounds, cross-field checks, and one Isolation Forest per research site. Each flag carries rule ID, severity, value, message and explanation |
| 4 | 🌦️ **Enrich** | Optional Open-Meteo precipitation and temperature context (can be disabled for deterministic tests) |
| 5 | 🔗 **Correlate** | Weighted One Health Risk Index with pillar scores, causal links, confidence, band and actions |
| 6 | 🏥 **Map to FHIR** | FHIR R4 collection bundle with OAH profile metadata and linked resources |
| 7 | 🪪 **Render insights** | Impact-card JSON built from the same typed result |
| 8 | 💾 **Store** | Every stage persisted with its payload; one commit per stage, not per row |
| 9 | 📡 **Distribute** | Cards, trends, maps, CSV exports and FHIR previews |

> 💡 **Performance note:** the anomaly model is fitted once per site and reused across the batch.

---

## ✨ Features

- FastAPI endpoints for sites, summaries, insights, trends, flags, ingestion,
  CSV export, and FHIR retrieval.
- Offline-capable field capture with queued pH, dissolved oxygen, temperature,
  site, and overall-rating observations.
- Workbox Background Sync retries failed observation submissions when the
  service worker is available, while the open app retries on reconnect.
- Optional media evidence captured as bounded data URLs (5 MB per file) and
  preserved with the auditable raw observation payload.
- FHIR R4 collection bundles with OAH profile metadata and linked resources.
- Frontend Web Speech API narration for impact cards, with language-specific
  voice selection when the browser provides a matching voice.
- CORS configuration for local development and Vercel deployments.
- Configurable request-size protection, coordinate/pH range validation,
  database readiness probing, and authenticated live ingestion with rate
  limiting.
- Vercel frontend configuration and Render backend configuration via
  [`render.yaml`](render.yaml). Current CI checks bundle structure and OAH
  profile declarations. A local HL7 validator run found no fatal/error
  findings, but could not resolve the external OAH profiles and CodeSystem;
  authoritative OAH package validation remains a release-readiness task.

### Production controls and validation

- Set `INGESTION_API_KEY` to enable the authenticated `POST /ingest/live`
  endpoint. It rejects missing/invalid keys and applies a per-key request
  limit; the local offline queue uses the unauthenticated demo endpoint until
  a deployed client-secret strategy is configured.
- Set `CORS_ORIGINS` to a comma-separated allowlist in production. Set
  `MAX_REQUEST_BYTES` to bound incoming JSON/media payloads; the default is
  15 MiB. `/ready` verifies database access for deployment probes.
- Duplicate submission IDs in one request are returned as `conflicts` rather
  than being silently hidden. Existing IDs remain idempotent through the
  pipeline's upsert behavior.
- Run `python scripts/validate_fhir.py` with the local HL7 validator and the
  official OAH package installed to check profile and terminology conformance.
  Without that package, unresolved-profile warnings are not a conformance
  result.
- Run `python scripts/calibrate_model.py path/to/expert_labels.csv` only with
  real expert/laboratory labels. Synthetic observations alone are not evidence
  of scientific calibration.
- Run `python scripts/postgres_load_test.py https://your-api.example` for a
  concurrent health-check smoke test against a deployed PostgreSQL service.

---

## 🧰 Tech Stack

| Layer | Technology |
|:---|:---|
| **Runtime** | Python 3.11 / Node.js 20+ |
| **API** | FastAPI + Uvicorn |
| **Frontend** | React + Vite, Three.js (lazy-loaded) |
| **Database** | SQLite (default) / PostgreSQL via SQLAlchemy |
| **Validation** | Pydantic schemas + scikit-learn Isolation Forest |
| **Interoperability** | FHIR R4, OneAquaHealth (OAH) profile |
| **External data** | Open-Meteo (optional) |
| **Testing** | pytest, Vitest, Playwright |
| **CI/CD** | GitHub Actions (5 verification paths) |
| **Hosting** | Vercel (frontend), Render (backend) |
| **Containerization** | Docker (see [stub below](#-docker--deployment)) |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version |
|:---|:---|
| Python | 3.11 |
| Node.js | 20+ |
| npm | bundled with Node |

### Step 1 — Clone

```bash
git clone https://github.com/Shadhai/onehealth.git
cd onehealth
```

### Step 2 — Configure

```bash
# macOS / Linux
python3.11 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && npm install
cp .env.example .env   # then edit values (optional: SQLite works with no config)
```

```powershell
# Windows PowerShell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm install
Copy-Item .env.example .env   # then edit values
```

### Step 3 — Run

```bash
# Terminal 1: API
uvicorn app.main:app --reload --port 8000

# Terminal 2: frontend
npm run dev
```

✅ **Success looks like:**

```text
API       →  http://localhost:8000          (FastAPI)
Frontend  →  http://localhost:5173          (Vite, proxies API / FHIR / ingest / health)
```

Build production assets with `npm run build` (root is `frontend/`, output in `frontend/dist/`).

---

## ⚙️ Environment Config

```env
# ── Database ────────────────────────────────────────────
# Leave unset to use local SQLite. Set to switch to PostgreSQL.
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE

# ── Server ──────────────────────────────────────────────
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
MAX_REQUEST_BYTES=15728640
INGESTION_API_KEY=replace-with-a-long-random-secret
```

| Variable | Required | Purpose |
|:---|:---:|:---|
| `DATABASE_URL` | ❌ | Activates the SQLAlchemy PostgreSQL adapter; SQLite is used when unset |
| `INGESTION_API_KEY` | ❌ | Enables authenticated `POST /ingest/live`; use a long secret in production |
| `CORS_ORIGINS` | ❌ | Comma-separated production frontend origin allowlist |
| `MAX_REQUEST_BYTES` | ❌ | Maximum request body size; defaults to 15 MiB |

---

## 📖 API Reference

### 🌐 Sites & Summaries

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/sites` | List monitored sites |
| `GET` | `/api/summary` | Portfolio KPIs and risk distribution |

### 🪪 Insights & Trends

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/insights` | Explainable impact cards |
| `GET` | `/api/trends` | Historical risk and pillar trajectories |
| `GET` | `/api/flags` | Validation flags with rule ID and severity |

### 📥 Ingestion & Export

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/ingest/observations` | Submit online/offline field observations |
| `POST` | `/ingest/live` | Submit authenticated live observations with `X-API-Key` |
| `POST` | `/ingest/mock` | Run bundled demo data through the pipeline |
| `GET` | `/api/export.csv` | CSV export |

### 🏥 FHIR & Health

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/fhir/...` | Retrieve FHIR R4 collection bundles (OAH profile) |
| `GET` | `/health` | Liveness check |
| `GET` | `/ready` | Database readiness probe |

> 📘 FastAPI serves interactive docs at `http://localhost:8000/docs` while the API is running.

---

## ⚡ Measured Load Test

A deterministic generator creates **500 observations across 25 sites over 90 days** with healthy, moderate and poor distributions and intentional unit variation. Weather calls are disabled so the benchmark measures local processing and persistence.

| Metric | Result |
|:---|---:|
| Input observations | 500 |
| Output insights | 500 |
| Elapsed time | 25.587 s |
| Throughput | **19.5 obs/s** |
| Average latency | 51.174 ms/observation |
| Peak traced memory | 7.81 MB |
| Errors | **0** |
| Raw / normalized / validated / enriched / insights / bundles | 500 each |
| Risk distribution | 🔴 79 high · 🟡 109 moderate · 🟢 312 low |

Full report: [`docs/load-test-report.json`](docs/load-test-report.json)

```powershell
.\.venv\Scripts\python.exe scripts\generate_synthetic.py
.\.venv\Scripts\python.exe scripts\load_test.py
```

---

## 🌍 Use Cases

### 🏞️ Community Catchment Monitoring
A watershed group collects pH, oxygen and macroinvertebrate counts through volunteers. OneHealth Lens normalizes the mixed units, flags suspect readings, and gives each catchment a printable impact card so the group knows where to act first.

### 🏥 Public-Health Surveillance
A regional health team watches coliform and pharmaceutical signals alongside fauna indicators. FHIR R4 bundles slot into clinical tooling, and the audit trail shows exactly which observation drove each alert.

### 🔬 Research & Citizen Science
Researchers need provenance. Every stage is stored, so any score can be traced back to its original payload and reproduced, with a 500-record benchmark to validate throughput.

### 🎓 Academic / Portfolio
A compact, fully tested reference for pairing explainable ML-assisted validation with healthcare interoperability standards (FastAPI, React, FHIR, CI-gated load testing).

### 🔌 Frontend-Agnostic Integration
Because the API exposes stored data, cards and FHIR bundles independently, GIS portals, dashboards or mobile apps can consume results without touching the React UI.

---

## 🗂️ Project Structure

```text
onehealth/
├── 📁 app/
│   ├── 📁 api/routes/        # Data, insights, ingestion and FHIR endpoints
│   ├── 📁 pipeline/          # Nine processing stages and orchestrator
│   ├── 📁 schemas/           # Pydantic observation and insight contracts
│   ├── 📄 config.py          # Environment-based runtime configuration
│   ├── 📄 db.py              # SQLite store (default)
│   ├── 📄 db_sqlalchemy.py   # SQLAlchemy / PostgreSQL adapter
│   └── 📄 main.py            # FastAPI app, middleware and readiness probes
├── 📁 frontend/
│   ├── 📁 pages/             # Dashboard, cards, trends, map, audit, One Health
│   ├── 📁 components/        # Bio-indicator, field capture, connectivity, speech
│   ├── 📁 lib/               # API, i18n, forecast and offline queue
│   ├── 📁 test/              # Vitest and React component tests
│   ├── 📄 App.jsx            # Application shell and navigation
│   └── 📄 main.jsx           # React entry point and PWA registration
├── 📁 scripts/               # Demo, synthetic data, validation and load tools
│   ├── 📄 calibrate_model.py # Expert/laboratory reference calibration
│   ├── 📄 validate_fhir.py   # Local HL7/OAH validator wrapper
│   └── 📄 postgres_load_test.py # Concurrent deployed-service smoke test
├── 📁 tests/                 # Backend, API, pipeline and adapter tests
├── 📁 e2e/                   # Playwright browser workflows
├── 📁 docs/                  # Load report and PostgreSQL migration guide
├── 📁 data/                  # Bundled mock observations and fixtures
├── 📁 .github/workflows/     # CI gates for backend, frontend, FHIR, load and E2E
├── 📄 vite.config.js         # Vite, proxy and PWA/Background Sync configuration
├── 📄 render.yaml            # Render backend deployment configuration
├── 📄 vercel.json            # Vercel frontend deployment configuration
├── 📄 .env.example           # Database, CORS, payload and ingestion settings
└── 📄 PROJECT_RATING_AND_IMPROVEMENTS.txt # Evidence-based submission assessment
```

---

## 🐳 Docker & Deployment

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Shadhai/onehealth)

Backend deploys to Render via [`render.yaml`](render.yaml); the frontend ships to Vercel.

```dockerfile
# Dockerfile (API) — proposed
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t onehealth-lens .
docker run -p 8000:8000 onehealth-lens
```

---

## 🐘 PostgreSQL Migration

SQLite is the local default. Set `DATABASE_URL` to switch to the working SQLAlchemy adapter, which creates the six pipeline tables automatically and preserves the store contract:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

```powershell
.\.venv\Scripts\python.exe -m pytest tests/test_db_sqlalchemy.py -q
```

Schema creation, data-copy guidance, staged cutover and rollback: [`docs/postgres-migration.md`](docs/postgres-migration.md)

---

## 🧪 Testing & CI

| Suite | Command | Current result |
|:---|:---|:---:|
| Backend (pytest) | `python -m pytest -q` | ✅ **76 passed** |
| Frontend (Vitest) | `npm test -- --run` | ✅ **28 passed** |
| Browser E2E (Playwright) | `npx playwright install chromium && npm run test:e2e` | ✅ shell, dashboard, cards, navigation |
| Adapter | `python -m pytest tests/test_db_sqlalchemy.py -q` | ✅ |
| Load test | `python scripts/load_test.py` | ✅ 0 errors |

GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) runs on every push and pull request:

| # | Gate |
|:---:|:---|
| 1 | Backend pytest suite |
| 2 | Frontend Vitest suite |
| 3 | FHIR bundle structure + OAH profile validation |
| 4 | 500-observation load test with zero-error and throughput gate |
| 5 | Playwright Chromium E2E workflows |

Playwright reports and traces go to the git-ignored `playwright-report/` and `test-results/` directories.

## 🛠️ Troubleshooting

| Symptom | Likely Cause | Fix |
|:---|:---|:---|
| `ModuleNotFoundError` on startup | Virtualenv not active or deps missing | Activate `.venv`, then `pip install -r requirements.txt` |
| `Address already in use` (port 8000 / 5173) | Another process holds the port | Stop it, or run `uvicorn ... --port 8001` and update the Vite proxy |
| Frontend shows network / 404 errors | API not running, so the Vite proxy has no target | Start Uvicorn on port 8000 before `npm run dev` |
| CORS error in browser | Origin not allowed by the API | Add your origin to the CORS configuration (local dev and Vercel are preconfigured) |
| PostgreSQL connection failure | Wrong `DATABASE_URL` or missing driver | Use the `postgresql+psycopg://` form and confirm host, credentials and `psycopg` install |
| Weather context missing | Open-Meteo unreachable or enrichment disabled | Check network access; enrichment is intentionally off in tests and benchmarks |
| Playwright fails to launch | Browser binaries not installed | Run `npx playwright install chromium` |
| `npm run build` output not found | Vite root is `frontend/` | Look in `frontend/dist/` |

---

## 🗺️ Roadmap

- [x] Nine-stage pipeline with per-stage persistence
- [x] FHIR R4 / OAH bundle mapping
- [x] Explainable impact cards and 7-day regression forecast
- [x] PostgreSQL adapter with migration guide
- [x] CI with load-test gate and Playwright E2E
- [x] Offline PWA capture, media evidence, and Background Sync
- [x] Authenticated live ingestion, rate limiting, request limits, and readiness probe
- [x] Configurable CORS and measurement-range validation
- [ ] 🚧 Add an open-source `LICENSE`
- [ ] 🚧 Publish a live hosted demo
- [ ] 🚧 Dockerfile and docker-compose for one-command setup
- [ ] 🚧 Production role/site authorization and distributed rate limiting
- [ ] 🚧 Coverage reporting badge

---

## 🤝 Contributing

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/onehealth.git && cd onehealth

# 2. Create a feature branch
git checkout -b feat/my-improvement

# 3. Make changes and run the checks
python -m pytest -q && npm test -- --run

# 4. Commit with a clear message
git commit -am "feat: describe your change"

# 5. Push your branch
git push origin feat/my-improvement

# 6. Open a Pull Request against main
```

---

## 👥 Contributors

<div align="center">

<a href="https://github.com/Shadhai/onehealth/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Shadhai/onehealth" />
</a>

### ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Shadhai/onehealth&type=Date)](https://star-history.com/#Shadhai/onehealth&Date)

</div>

---

## 🤖 AI-Ready Files

Add these to the repo root so AI agents and LLM crawlers understand the project.

**`llms.txt`**

```text
# OneHealth Lens
> Turns citizen water observations into explainable One Health risk scores across water quality (30%), biological health (30%), human exposure (20%), and environmental pressure (20%), then publishes FHIR R4/OAH bundles and impact cards.

## Docs
- README.md: overview, quick start, API, testing
- docs/postgres-migration.md: SQLite to PostgreSQL guide
- docs/load-test-report.json: 500-observation benchmark

## Code
- app/pipeline/: nine processing stages
- app/api/routes/: FastAPI endpoints
- frontend/: React + Vite UI
```

**`AGENTS.md`**

```markdown
# AGENTS.md
## Setup
- Python 3.11, Node 20+. `pip install -r requirements.txt && npm install`
## Run
- API: `uvicorn app.main:app --reload --port 8000`; UI: `npm run dev`
## Test (run before every PR)
- `python -m pytest -q` and `npm test -- --run`; E2E: `npm run test:e2e`
## Conventions
- Keep the 30/30/20/20 domain weights and risk bands consistent across API and UI.
- Pydantic schemas in app/schemas/ are the contract; never bypass them.
- DB writes commit once per stage, not per row.
- Disable weather enrichment in tests for determinism.
```

---

## 📝 Changelog

<!-- Keep a Changelog format: https://keepachangelog.com -->

See the repository history for the complete change history.

## [Unreleased]
### Added
- Nine-stage One Health pipeline, FHIR R4/OAH mapping, impact cards, forecast, PostgreSQL adapter.
- Offline PWA field capture with IndexedDB fallback, bounded media evidence,
  reconnect retry, and Workbox Background Sync.
- Authenticated live ingestion, API-key throttling, conflict reporting,
  payload-size limits, strict measurement ranges, configurable CORS, and
  `/ready` database readiness checks.
- Reproducible FHIR validation, scientific calibration, and PostgreSQL smoke
  test scripts.
- Current verified test baseline: 76 backend tests and 28 frontend tests.

---

## 📄 License

Distributed under the MIT License once a `LICENSE` file is added. See [`LICENSE`](LICENSE).

---

<div align="center">

<sub>Built to make community water data trustworthy, explainable and actionable. 💧</sub>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00d4ff,50:1a7abf,100:0f4c81&height=120&section=footer" width="100%" />

</div>
