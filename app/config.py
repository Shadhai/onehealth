import os


def ingestion_api_key() -> str | None:
    """Return the optional production ingestion key."""
    return os.getenv("INGESTION_API_KEY") or None


def cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS", "")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


def max_request_bytes() -> int:
    try:
        return max(1_048_576, int(os.getenv("MAX_REQUEST_BYTES", "15728640")))
    except ValueError:
        return 15 * 1024 * 1024