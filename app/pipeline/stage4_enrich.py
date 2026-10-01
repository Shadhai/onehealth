# app/pipeline/stage4_enrich.py
import httpx
from datetime import datetime, timedelta, timezone
from app.schemas.validated_observation import ValidatedObservation
from app.schemas.enriched_observation import EnrichedObservation, WeatherContext

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def fetch_weather(lat: float, lon: float, when: datetime) -> WeatherContext:
    """
    Fetch hourly precipitation and temperature for the 48 hours before
    the observation time, then aggregate.

    Uses explicit dates so historical observations can be resolved.
    """
    when_utc = when.astimezone(timezone.utc)
    start_date = (when_utc - timedelta(hours=48)).date().isoformat()
    end_date = when_utc.date().isoformat()

    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "precipitation,temperature_2m",
        "start_date": start_date,
        "end_date": end_date,
        "timezone": "UTC",
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(OPEN_METEO_URL, params=params, timeout=15.0)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        return WeatherContext()

    hourly = data.get("hourly", {})
    times_str = hourly.get("time", [])
    precip = hourly.get("precipitation", [])
    temps = hourly.get("temperature_2m", [])

    if not times_str:
        return WeatherContext()

    times = [datetime.fromisoformat(t).replace(tzinfo=timezone.utc) for t in times_str]

    # Find index closest to the observation time
    target = when_utc.replace(tzinfo=None)
    idx = min(range(len(times)), key=lambda i: abs(times[i].replace(tzinfo=None) - target))

    # Sum rainfall over prior 48 hours (idx - 48 to idx)
    start = max(0, idx - 48)
    precip_slice = precip[start:idx]
    rainfall_48h = round(sum(precip_slice), 1) if precip_slice else 0.0

    # Mean air temperature over prior 48 hours
    temp_slice = [t for t in temps[start:idx] if t is not None]
    mean_temp = round(sum(temp_slice) / len(temp_slice), 2) if temp_slice else None

    return WeatherContext(
        rainfall_48h_mm=rainfall_48h,
        mean_air_temp_c=mean_temp,
        hours_matched=len(temp_slice),
    )


async def enrich(obs: ValidatedObservation) -> EnrichedObservation:
    if obs.latitude is None or obs.longitude is None or obs.submitted_at_utc is None:
        weather = WeatherContext()
    else:
        try:
            weather = await fetch_weather(obs.latitude, obs.longitude, obs.submitted_at_utc)
        except httpx.HTTPError:
            weather = WeatherContext()

    return EnrichedObservation(
        observation=obs,
        weather=weather,
        enriched_at=datetime.utcnow(),
    )