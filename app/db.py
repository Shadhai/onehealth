# app/db.py
"""
SQLite persistence for the OneHealth Lens pipeline.

Every stage's output is stored so the pipeline is auditable end to end:
raw -> normalized -> validated -> enriched -> insight -> FHIR bundle.

JSON payloads are stored as TEXT. SQLite's json1 extension is available
if we later want to query fields inside payloads, but the primary access
pattern is by observation_id.
"""
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.schemas.raw_observation import RawObservation
from app.schemas.normalized_observation import NormalizedObservation
from app.schemas.validated_observation import ValidatedObservation
from app.schemas.enriched_observation import EnrichedObservation
from app.schemas.insight import OneHealthInsight


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS raw_observations (
    submission_id   TEXT PRIMARY KEY,
    payload         TEXT NOT NULL,
    ingested_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS normalized_observations (
    observation_id      TEXT PRIMARY KEY,
    submission_id       TEXT,
    payload             TEXT NOT NULL,
    completeness_score  REAL,
    normalized_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS validated_observations (
    observation_id      TEXT PRIMARY KEY,
    payload             TEXT NOT NULL,
    validation_status   TEXT,
    flag_count          INTEGER,
    validated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enriched_observations (
    observation_id  TEXT PRIMARY KEY,
    payload         TEXT NOT NULL,
    enriched_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS one_health_insights (
    observation_id  TEXT PRIMARY KEY,
    payload         TEXT NOT NULL,
    research_site   TEXT,
    risk_index      REAL,
    risk_level      TEXT,
    generated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fhir_bundles (
    observation_id  TEXT PRIMARY KEY,
    bundle          TEXT NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_insights_site
    ON one_health_insights (research_site);
CREATE INDEX IF NOT EXISTS idx_insights_risk
    ON one_health_insights (risk_index DESC);
"""


VALID_TABLES = {
    "raw_observations",
    "normalized_observations",
    "validated_observations",
    "enriched_observations",
    "one_health_insights",
    "fhir_bundles",
}


def _now() -> str:
    return datetime.utcnow().isoformat()


def _json(obj) -> str:
    """Serialize a Pydantic model (or dict) to JSON."""
    if hasattr(obj, "model_dump"):
        return json.dumps(obj.model_dump(), default=str)
    return json.dumps(obj, default=str)


class Store:
    """
    SQLite-backed store for the OneHealth Lens pipeline.

    Usage:
        store = Store(":memory:")             # in-memory, for tests
        store = Store("onehealth.db")         # persistent file
        ...
        store.close()
    """

    def __init__(self, db_path: str = ":memory:"):
        self.db_path = db_path
        # check_same_thread=False lets us use the store from async code
        # without changing thread; we use it single-threaded anyway.
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA_SQL)
        self.conn.commit()

    # ---------------------------------------------------------------
    # Writes
    # ---------------------------------------------------------------

    def save_raw(self, raw: RawObservation) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO raw_observations "
            "(submission_id, payload, ingested_at) VALUES (?, ?, ?)",
            (raw.submission_id or "unknown", _json(raw), _now()),
        )

    def save_normalized(self, obs: NormalizedObservation) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO normalized_observations "
            "(observation_id, submission_id, payload, completeness_score, normalized_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (obs.observation_id, obs.submission_id, _json(obs),
             obs.completeness_score, _now()),
        )

    def save_validated(self, obs: ValidatedObservation) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO validated_observations "
            "(observation_id, payload, validation_status, flag_count, validated_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (obs.observation_id, _json(obs), obs.validation_status,
             len(obs.flags), _now()),
        )

    def save_enriched(self, enriched: EnrichedObservation) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO enriched_observations "
            "(observation_id, payload, enriched_at) VALUES (?, ?, ?)",
            (enriched.observation.observation_id, _json(enriched), _now()),
        )

    def save_insight(self, insight: OneHealthInsight) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO one_health_insights "
            "(observation_id, payload, research_site, risk_index, risk_level, generated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (insight.observation_id, _json(insight), insight.research_site,
             insight.risk_index, insight.risk_level, insight.generated_at.isoformat()),
        )

    def save_fhir_bundle(self, observation_id: str, bundle_json: str) -> None:
        self.conn.execute(
            "INSERT OR REPLACE INTO fhir_bundles "
            "(observation_id, bundle, created_at) VALUES (?, ?, ?)",
            (observation_id, bundle_json, _now()),
        )

    def flush(self) -> None:
        """Commit pending stage writes."""
        self.conn.commit()

    # ---------------------------------------------------------------
    # Reads
    # ---------------------------------------------------------------

    def get_insight(self, observation_id: str) -> Optional[dict]:
        row = self.conn.execute(
            "SELECT payload FROM one_health_insights WHERE observation_id = ?",
            (observation_id,),
        ).fetchone()
        return json.loads(row["payload"]) if row else None

    def get_insights_by_site(self, site: str, limit: int = 50) -> list[dict]:
        rows = self.conn.execute(
            "SELECT i.payload "
            "FROM one_health_insights i "
            "JOIN normalized_observations n ON n.observation_id = i.observation_id "
            "WHERE i.research_site = ? "
            "ORDER BY n.submission_id DESC, i.observation_id ASC "
            "LIMIT ?",
            (site, limit),
        ).fetchall()
        return [json.loads(r["payload"]) for r in rows]

    def get_recent_insights(self, limit: int = 50) -> list[dict]:
        rows = self.conn.execute(
            "SELECT i.payload "
            "FROM one_health_insights i "
            "JOIN normalized_observations n ON n.observation_id = i.observation_id "
            "ORDER BY n.submission_id DESC, i.observation_id ASC "
            "LIMIT ?",
            (limit,),
        ).fetchall()
        return [json.loads(r["payload"]) for r in rows]

    def get_fhir_bundle(self, observation_id: str) -> Optional[str]:
        row = self.conn.execute(
            "SELECT bundle FROM fhir_bundles WHERE observation_id = ?",
            (observation_id,),
        ).fetchone()
        return row["bundle"] if row else None

    def get_validated(self, observation_id: str) -> Optional[dict]:
        """Fetch a validated observation's payload by id."""
        row = self.conn.execute(
            "SELECT payload FROM validated_observations WHERE observation_id = ?",
            (observation_id,),
        ).fetchone()
        return json.loads(row["payload"]) if row else None

    def get_trends_by_site(self, site: str, limit: int = 30) -> list[dict]:
        """
        Return the most recent `limit` insights for a site, in chronological
        order (oldest first) so the caller can plot left-to-right.
        """
        rows = self.conn.execute(
            "SELECT i.payload "
            "FROM one_health_insights i "
            "JOIN normalized_observations n ON n.observation_id = i.observation_id "
            "WHERE i.research_site = ? "
            "ORDER BY n.submission_id ASC, i.observation_id ASC "
            "LIMIT ?",
            (site, limit),
        ).fetchall()
        return [json.loads(row["payload"]) for row in rows]

    def get_all_sites_summary(self) -> list[dict]:
        """Return aggregate risk, validation, and coordinate data per site."""
        sites = self.conn.execute(
            "SELECT DISTINCT research_site FROM one_health_insights "
            "WHERE research_site IS NOT NULL ORDER BY research_site"
        ).fetchall()

        result = []
        for row in sites:
            site = row["research_site"]
            aggregate = self.conn.execute(
                "SELECT COUNT(*) AS n, MAX(risk_index) AS max_r, "
                "MIN(risk_index) AS min_r, AVG(risk_index) AS avg_r "
                "FROM one_health_insights WHERE research_site = ?",
                (site,),
            ).fetchone()
            latest_row = self.conn.execute(
                "SELECT i.payload "
                "FROM one_health_insights i "
                "JOIN normalized_observations n ON n.observation_id = i.observation_id "
                "WHERE i.research_site = ? "
                "ORDER BY n.submission_id DESC, i.observation_id ASC "
                "LIMIT 1",
                (site,),
            ).fetchone()
            latest = json.loads(latest_row["payload"]) if latest_row else None
            flagged = self.conn.execute(
                "SELECT COUNT(*) AS n FROM validated_observations v "
                "JOIN one_health_insights i ON i.observation_id = v.observation_id "
                "WHERE i.research_site = ? AND v.flag_count > 0",
                (site,),
            ).fetchone()
            coordinate_row = self.conn.execute(
                "SELECT payload FROM normalized_observations "
                "WHERE json_extract(payload, '$.research_site') = ? "
                "ORDER BY submission_id DESC, observation_id ASC LIMIT 1",
                (site,),
            ).fetchone()
            latitude = longitude = None
            if coordinate_row:
                payload = json.loads(coordinate_row["payload"])
                latitude = payload.get("latitude")
                longitude = payload.get("longitude")

            result.append({
                "site": site,
                "observation_count": aggregate["n"],
                "max_risk_index": round(aggregate["max_r"], 3) if aggregate["max_r"] is not None else None,
                "min_risk_index": round(aggregate["min_r"], 3) if aggregate["min_r"] is not None else None,
                "avg_risk_index": round(aggregate["avg_r"], 3) if aggregate["avg_r"] is not None else None,
                "latest_observation_id": latest["observation_id"] if latest else None,
                "latest_risk_index": latest["risk_index"] if latest else None,
                "latest_risk_level": latest["risk_level"] if latest else None,
                "latest_risk_colour": latest.get("risk_colour") if latest else None,
                "latest_confidence": latest["confidence"] if latest else None,
                "latest_generated_at": latest["generated_at"] if latest else None,
                "flagged_observation_count": flagged["n"] if flagged else 0,
                "latitude": latitude,
                "longitude": longitude,
            })
        return result

    def count(self, table: str) -> int:
        if table not in VALID_TABLES:
            raise ValueError(f"Unknown table: {table}")
        cur = self.conn.execute(f"SELECT COUNT(*) FROM {table}")
        return cur.fetchone()[0]

    def close(self) -> None:
        self.conn.close()