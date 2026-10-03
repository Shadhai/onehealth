import os


def ingestion_api_key() -> str | None:
    """Return the optional production ingestion key."""
    return os.getenv("INGESTION_API_KEY") or None