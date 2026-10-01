# app/main.py
"""
FastAPI application for OneHealth Lens.

Uses a factory so tests can inject their own in-memory Store.
"""
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

    # Attach the store to app.state so routes can access it.
    app.state.store = store if store is not None else Store("onehealth.db")

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
    import os

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

    # On startup, ensure the database is ready
    @app.on_event("startup")
    async def startup_event():
        db_path = "onehealth.db"
        if not os.path.exists(db_path):
            print("Database not found, running initial pipeline to populate data...")
            try:
                # This script should load your mock data and run the pipeline
                import subprocess
                subprocess.run(["python", "scripts/demo_persist.py"], check=True)
                print("Database populated successfully.")
            except Exception as e:
                print(f"Error running initial data pipeline: {e}")

    return app


# Module-level app for `uvicorn app.main:app`
app = create_app()