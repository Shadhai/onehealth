# app/pipeline/stage6_fhir.py
"""
Map a NormalizedObservation + OneHealthInsight into a FHIR R4 Bundle
that conforms to the OneAquaHealth Implementation Guide (IG).

Verified profile URLs:
  - http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-indicators-oah
  - http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-with-component-oah
  - http://hl7.eu/fhir/ig/oah/StructureDefinition/observation-health-measure-oah
  - http://hl7.eu/fhir/ig/oah/StructureDefinition/location-oah

Verified CodeSystem:
  - http://hl7.eu/fhir/ig/oah/CodeSystem/temporarySystem-oah-eu
"""
from datetime import datetime, timezone
from typing import Optional
import uuid

from fhir.resources.observation import Observation
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.quantity import Quantity
from fhir.resources.reference import Reference
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.location import Location
from fhir.resources.meta import Meta

from app.schemas.enriched_observation import EnrichedObservation
from app.schemas.insight import OneHealthInsight


# ------------------------------------------------------------------
# Verified constants from the OAH IG
# ------------------------------------------------------------------

OAH_IG_BASE = "http://hl7.eu/fhir/ig/oah"
OAH_CODESYSTEM = f"{OAH_IG_BASE}/CodeSystem/temporarySystem-oah-eu"

OAH_PROFILE_OBS_INDICATORS = (
    f"{OAH_IG_BASE}/StructureDefinition/observation-indicators-oah"
)
OAH_PROFILE_OBS_WITH_COMPONENTS = (
    f"{OAH_IG_BASE}/StructureDefinition/observation-with-component-oah"
)
OAH_PROFILE_OBS_HEALTH_MEASURE = (
    f"{OAH_IG_BASE}/StructureDefinition/observation-health-measure-oah"
)
OAH_PROFILE_LOCATION = f"{OAH_IG_BASE}/StructureDefinition/location-oah"


# Verified CodeSystem codes. Only these are used in the mapper.
# Source: OAH IG CodeSystem listing as confirmed from the search.
OAH_CODES = {
    # Biological
    "macroinvertebrates": "macroinvertebreates",
    "diatoms": "diatomes",
    "fish": "fishes",
    "macrophytes": "macrophytes",
    # Riparian vegetation (from the value set)
    "riparian_vegetation": "riparianVegetation",
    # Riparian vegetation sub-codes
    "riparian_trees": "trees",
    "riparian_bushes": "bushes",
    "riparian_herbaceous": "herbaceous",
}


def serialize_bundle(bundle: Bundle) -> str:
    """
    Serialize a fhir.resources Bundle to a JSON string.

    Supports the serialization APIs used by fhir.resources across Pydantic
    v1, Pydantic v2, and older versions.
    """
    import json

    if hasattr(bundle, "model_dump_json"):
        return bundle.model_dump_json()
    if hasattr(bundle, "json"):
        return bundle.json()
    if hasattr(bundle, "dict"):
        return json.dumps(bundle.dict(), default=str)
    raise RuntimeError("Bundle cannot be serialized by any known method")


# ------------------------------------------------------------------
# Internal helpers
# ------------------------------------------------------------------

def _meta(profile_url: str) -> Meta:
    """Attach a profile declaration to a resource."""
    return Meta(profile=[profile_url])


def _oah_coding(code: str, display: Optional[str] = None) -> Coding:
    """Build a Coding in the OAH temporary CodeSystem."""
    return Coding(
        system=OAH_CODESYSTEM,
        code=code,
        display=display or code,
    )


def _reference_location(research_site: str) -> Reference:
    """Reference the Location resource by a deterministic id."""
    safe_id = (research_site or "unknown").lower().replace(" ", "-")
    return Reference(reference=f"Location/{safe_id}")


def _reference_patient(user_id: Optional[str]) -> Reference:
    return Reference(reference=f"Patient/{user_id or 'anonymous'}")


# ------------------------------------------------------------------
# Observation builders
# ------------------------------------------------------------------

def build_numeric_observation(
    enriched: EnrichedObservation,
    code: str,
    value: float,
    unit: str,
    display: str,
    location_urn: str,
) -> Observation:
    """A single numeric observation (pH, DO, temp, etc.)."""
    obs = Observation(
        id=f"{enriched.observation.observation_id}-{code}",
        meta=_meta(OAH_PROFILE_OBS_INDICATORS),
        status="final",
        code=CodeableConcept(coding=[_oah_coding(code, display)]),
        subject=Reference(reference=location_urn),
        effectiveDateTime=enriched.observation.submitted_at_utc.isoformat()
            if enriched.observation.submitted_at_utc else datetime.utcnow().isoformat(),
        performer=[_reference_patient(enriched.observation.user_id)],
        valueQuantity=Quantity(value=value, unit=unit, system="http://unitsofmeasure.org"),
    )
    return obs


def build_categorical_observation(
    enriched: EnrichedObservation,
    code: str,
    value_code: str,
    display: str,
    location_urn: str,
) -> Observation:
    """A single categorical observation (e.g. fish: present/absent)."""
    obs = Observation(
        id=f"{enriched.observation.observation_id}-{code}",
        meta=_meta(OAH_PROFILE_OBS_INDICATORS),
        status="final",
        code=CodeableConcept(coding=[_oah_coding(code, display)]),
        subject=Reference(reference=location_urn),
        effectiveDateTime=enriched.observation.submitted_at_utc.isoformat()
            if enriched.observation.submitted_at_utc else datetime.utcnow().isoformat(),
        performer=[_reference_patient(enriched.observation.user_id)],
        valueCodeableConcept=CodeableConcept(coding=[
            _oah_coding(value_code, value_code)
        ]),
    )
    return obs


def build_macrophytes_observation(
    enriched: EnrichedObservation,
    macrophyte_codes: list[str],
    location_urn: str,
) -> Observation:
    """
    Macrophytes use the with-components profile.
    Each macrophyte species is a component.
    """
    components = [
        {
            "code": CodeableConcept(coding=[_oah_coding(code, code)]),
            "valueCodeableConcept": CodeableConcept(coding=[_oah_coding(code, code)]),
        }
        for code in macrophyte_codes
    ]
    obs = Observation(
        id=f"{enriched.observation.observation_id}-macrophytes",
        meta=_meta(OAH_PROFILE_OBS_WITH_COMPONENTS),
        status="final",
        code=CodeableConcept(coding=[_oah_coding("macrophytes", "Macrophytes")]),
        subject=Reference(reference=location_urn),
        effectiveDateTime=enriched.observation.submitted_at_utc.isoformat()
            if enriched.observation.submitted_at_utc else datetime.utcnow().isoformat(),
        performer=[_reference_patient(enriched.observation.user_id)],
        component=components,
    )
    return obs


def build_health_measure_observation(
    insight: OneHealthInsight,
    location_urn: str,
    user_id: Optional[str] = None,
) -> Observation:
    """
    The composite One Health Risk Index as an OAH Health Measure.
    Engineering choice: we use component[] for the three domains and the index.
    """
    components = [
        {
            "code": CodeableConcept(coding=[_oah_coding("humanRisk", "Human risk score")]),
            "valueQuantity": Quantity(value=insight.human.score, unit="{score}"),
        },
        {
            "code": CodeableConcept(coding=[_oah_coding("animalRisk", "Animal risk score")]),
            "valueQuantity": Quantity(value=insight.animal.score, unit="{score}"),
        },
        {
            "code": CodeableConcept(coding=[_oah_coding("ecosystemRisk", "Ecosystem risk score")]),
            "valueQuantity": Quantity(value=insight.ecosystem.score, unit="{score}"),
        },
        {
            "code": CodeableConcept(coding=[_oah_coding("overallRisk", "One Health Risk Index")]),
            "valueQuantity": Quantity(value=insight.risk_index, unit="{score}"),
        },
    ]
    obs = Observation(
        id=f"{insight.observation_id}-health-measure",
        meta=_meta(OAH_PROFILE_OBS_HEALTH_MEASURE),
        status="final",
        code=CodeableConcept(coding=[_oah_coding("oneHealthRiskIndex", "One Health Risk Index")]),
        subject=Reference(reference=location_urn),
        effectiveDateTime=insight.generated_at.replace(
        tzinfo=timezone.utc
    ).isoformat(),
        performer=[_reference_patient(user_id)],
        component=components,
    )
    return obs


# Deterministic UUID namespace for OAH resources.
# Uses the standard DNS namespace so urls are stable across runs.
_UUID_NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def _urn_uuid(resource_type: str, resource_id: str) -> str:
    """
    Build a deterministic urn:uuid for a FHIR resource.
    Same (type, id) always produces the same UUID, so pipeline
    re-runs produce byte-identical bundles.
    """
    return f"urn:uuid:{uuid.uuid5(_UUID_NS, f'{resource_type}:{resource_id}')}"


def build_location(enriched: EnrichedObservation) -> Location:
    """Build a Location resource for the stream segment."""
    obs = enriched.observation
    safe_id = (obs.research_site or "unknown").lower().replace(" ", "-")
    loc = Location(
        id=safe_id,
        meta=_meta(OAH_PROFILE_LOCATION),
        name=obs.research_site or "Unknown site",
    )
    if obs.latitude is not None and obs.longitude is not None:
        loc.position = {"latitude": obs.latitude, "longitude": obs.longitude}
    return loc


# ------------------------------------------------------------------
# Bundle assembly
# ------------------------------------------------------------------

# Map of NormalizedObservation field -> (OAH code, display, unit)
NUMERIC_MAPPING = [
    ("ph", "ph", "pH of water", "[pH]"),
    ("dissolved_oxygen_mg_l", "dissolvedO2", "Dissolved oxygen", "mg/L"),
    ("water_temperature_c", "waterTemperature", "Water temperature", "Cel"),
    ("tds_mg_l", "tds", "Total dissolved solids", "mg/L"),
    ("conductivity_us_cm", "conductivity", "Conductivity", "uS/cm"),
]

CATEGORICAL_MAPPING = [
    ("macroinvertebrates_code", "macroinvertebrates", "Macroinvertebrates"),
    ("diatoms_code", "diatoms", "Diatoms"),
    ("fish_code", "fish", "Fish"),
    ("riparian_vegetation_code", "riparian_vegetation", "Riparian vegetation"),
]


def to_fhir_bundle(
    enriched: EnrichedObservation,
    insight: OneHealthInsight,
) -> Bundle:
    """Assemble all resources into a FHIR collection Bundle."""
    entries: list[BundleEntry] = []

    # Location
    location = build_location(enriched)
    location_urn = _urn_uuid("Location", location.id)
    entries.append(BundleEntry(fullUrl=location_urn, resource=location))

    # Numeric observations
    for field_name, code, display, unit in NUMERIC_MAPPING:
        value = getattr(enriched.observation, field_name, None)
        if value is not None:
            obs = build_numeric_observation(
                enriched, code, float(value), unit, display, location_urn
            )
            obs_urn = _urn_uuid("Observation", obs.id)
            entries.append(BundleEntry(fullUrl=obs_urn, resource=obs))

    # Categorical observations
    for field_name, code_key, display in CATEGORICAL_MAPPING:
        value = getattr(enriched.observation, field_name, None)
        if value is not None:
            obs = build_categorical_observation(
                enriched, OAH_CODES[code_key], value, display, location_urn
            )
            obs_urn = _urn_uuid("Observation", obs.id)
            entries.append(BundleEntry(fullUrl=obs_urn, resource=obs))

    # Macrophytes (with components)
    if enriched.observation.macrophytes_codes:
        obs = build_macrophytes_observation(
            enriched, enriched.observation.macrophytes_codes, location_urn
        )
        obs_urn = _urn_uuid("Observation", obs.id)
        entries.append(BundleEntry(fullUrl=obs_urn, resource=obs))

    # One Health Risk Index
    obs = build_health_measure_observation(
        insight, location_urn, enriched.observation.user_id
    )
    obs_urn = _urn_uuid("Observation", obs.id)
    entries.append(BundleEntry(fullUrl=obs_urn, resource=obs))

    bundle = Bundle(
        type="collection",
        timestamp=datetime.utcnow().replace(tzinfo=timezone.utc).isoformat(),
        entry=entries,
    )
    return bundle