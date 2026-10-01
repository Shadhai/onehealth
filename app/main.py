# app/main.py
"""
FastAPI application for OneHealth Lens.

Uses a factory so tests can inject their own in-memory Store.
"""
from fastapi import FastAPI
from fastapi.responses import FileResponse
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

    import os
    frontend_dir = "static/dist" if os.path.isdir("static/dist") else "static"
    frontend_entry = os.path.join(frontend_dir, "index.html")

    # Serve the React entry for direct browser navigation to each page URL.
    @app.get("/overview", include_in_schema=False)
    @app.get("/cards", include_in_schema=False)
    @app.get("/audit", include_in_schema=False)
    @app.get("/onehealth", include_in_schema=False) 
    @app.get("/dashboard", include_in_schema=False)
    @app.get("/maps", include_in_schema=False)
    @app.get("/map", include_in_schema=False)
    def frontend_page():
        return FileResponse(frontend_entry)

    # Static frontend at "/" — registered last so it never shadows API routes.
    if os.path.isdir(frontend_dir):
        app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="static")

    return app


# Module-level app for `uvicorn app.main:app`
app = create_app()