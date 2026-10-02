# app/main.py
"""
FastAPI application for OneHealth Lens.

Uses a factory so tests can inject their own in-memory Store.
"""
import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.db import Store
from app.api.routes import insights, fhir, ingest, data


def create_app(store: Store = None) -> FastAPI:
    app = FastAPI(
        title="OneHealth Lens",
        description=(
            "Turns citizen stream observations from the OneAquaHealth "
            "Citizen Science App into One Health insight cards and "
            "FHIR-native bundles."
        ),
        version="0.1.0",
    )

    from fastapi.middleware.cors import CORSMiddleware

    # CORS — allow the deployed frontend to call this API.
    # Update origins if you deploy under a different domain.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://onehealth-frontend-efkn5at87-md18.vercel.app",
            "https://*.vercel.app",
            "http://localhost:5173",
            "http://localhost:4173",
        ],
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # Attach the store to app.state so routes can access it. PostgreSQL is
    # opt-in through DATABASE_URL; local development keeps SQLite by default.
    if store is not None:
        app.state.store = store
    elif os.getenv("DATABASE_URL"):
        from app.db_sqlalchemy import SQLAlchemyStore
        app.state.store = SQLAlchemyStore(os.environ["DATABASE_URL"])
    else:
        app.state.store = Store("onehealth.db")

    # API routers — must be registered BEFORE the static mount.
    app.include_router(ingest.router,   prefix="/ingest",   tags=["ingest"])
    app.include_router(insights.router, prefix="/insights", tags=["insights"])
    app.include_router(fhir.router,     prefix="/fhir",     tags=["fhir"])
    app.include_router(data.router,     prefix="/api",      tags=["data"])

    @app.get("/health", tags=["meta"])
    def health():
        return {"status": "ok"}

    # Static frontend — only mount if a production build exists.
    # In development, React runs on Vite (port 5173) and proxies to us.
    frontend_dir = None
    for candidate in ("frontend/dist", "static/dist"):
        if os.path.isdir(candidate):
            frontend_dir = candidate
            break

    if frontend_dir:
        app.mount(
            "/",
            StaticFiles(directory=frontend_dir, html=True),
            name="static",
        )

    @app.on_event("startup")
    async def ensure_data():
        import os
        if not os.path.exists("onehealth.db"):
            try:
                from app.schemas.raw_observation import RawObservation
                from app.pipeline.orchestrator import run_pipeline
                import json
                with open("data/mock_observations.json") as f:
                    raw = [RawObservation(**item) for item in json.load(f)]
                await run_pipeline(raw, app.state.store, enrich_weather=False)
                print(f"[startup] populated {len(raw)} observations")
            except Exception as e:
                print(f"[startup] population failed: {e}")

    return app


# Module-level app for `uvicorn app.main:app`
app = create_app()