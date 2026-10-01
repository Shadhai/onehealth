# app/api/routes/fhir.py
"""
Returns stored FHIR R4 Bundles as application/fhir+json.
"""
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

router = APIRouter()


@router.get("/{observation_id}")
def get_fhir_bundle(request: Request, observation_id: str):
    store = request.app.state.store
    bundle = store.get_fhir_bundle(observation_id)
    if not bundle:
        raise HTTPException(status_code=404, detail="FHIR bundle not found")
    return Response(content=bundle, media_type="application/fhir+json")