# tests/test_enrich.py
import pytest
from datetime import datetime, timedelta, timezone
from app.pipeline.stage4_enrich import fetch_weather


@pytest.mark.asyncio
async def test_fetch_weather_returns_context():
    """Live call to Open-Meteo using a recent date in its retention window."""
    when = datetime.now(timezone.utc) - timedelta(days=3)
    result = await fetch_weather(lat=59.9139, lon=10.7522, when=when)

    assert result.rainfall_48h_mm is not None
    assert result.rainfall_48h_mm >= 0
    assert result.hours_matched is not None
    assert result.hours_matched > 0
    if result.mean_air_temp_c is not None:
        assert -50 < result.mean_air_temp_c < 60


@pytest.mark.asyncio
async def test_fetch_weather_handles_distant_past():
    """Dates outside Open-Meteo's retention window return a valid empty context."""
    result = await fetch_weather(
        lat=59.9139,
        lon=10.7522,
        when=datetime(2020, 1, 1, 12, 0, tzinfo=timezone.utc),
    )

    assert isinstance(result.rainfall_48h_mm, (float, type(None)))
    assert isinstance(result.mean_air_temp_c, (float, type(None)))
    assert isinstance(result.hours_matched, (int, type(None)))