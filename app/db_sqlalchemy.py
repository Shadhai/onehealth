"""SQLAlchemy persistence adapter for PostgreSQL migration.

The adapter intentionally mirrors ``app.db.Store`` so the pipeline can switch
stores without changing route or pipeline code. SQLAlchemy Core is used instead
of ORM models because the existing store persists auditable JSON payloads.
"""
import json
from datetime import datetime
from typing import Optional

from sqlalchemy import Column, Float, Integer, MetaData, String, Table, Text, create_engine, func, select, update
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.db import VALID_TABLES, _json, _now
from app.schemas.enriched_observation import EnrichedObservation
from app.schemas.insight import OneHealthInsight
from app.schemas.normalized_observation import NormalizedObservation
from app.schemas.raw_observation import RawObservation
from app.schemas.validated_observation import ValidatedObservation


class SQLAlchemyStore:
    """SQLAlchemy-backed store compatible with the existing SQLite ``Store`` API.

    ``database_url`` may point to SQLite for local verification or PostgreSQL,
    for example ``postgresql+psycopg://user:password@host/dbname``.
    """

    def __init__(self, database_url: str = "sqlite:///:memory:", engine: Optional[Engine] = None):
        self.database_url = database_url
        self.engine = engine or create_engine(database_url, future=True)
        self.session_factory = sessionmaker(bind=self.engine, autoflush=False, expire_on_commit=False)
        self.session: Session = self.session_factory()
        self.metadata = MetaData()
        self.tables = self._define_tables()
        self.metadata.create_all(self.engine)

    def _define_tables(self) -> dict[str, Table]:
        def table(name: str, *columns: Column) -> Table:
            return Table(name, self.metadata, *columns)

        return {
            "raw_observations": table(
                "raw_observations",
                Column("submission_id", String, primary_key=True),
                Column("payload", Text, nullable=False),
                Column("ingested_at", String, nullable=False),
            ),
            "normalized_observations": table(
                "normalized_observations",
                Column("observation_id", String, primary_key=True),
                Column("submission_id", String),
                Column("payload", Text, nullable=False),
                Column("completeness_score", Float),
                Column("normalized_at", String, nullable=False),
            ),
            "validated_observations": table(
                "validated_observations",
                Column("observation_id", String, primary_key=True),
                Column("payload", Text, nullable=False),
                Column("validation_status", String),
                Column("flag_count", Integer),
                Column("validated_at", String, nullable=False),
            ),
            "enriched_observations": table(
                "enriched_observations",
                Column("observation_id", String, primary_key=True),
                Column("payload", Text, nullable=False),
                Column("enriched_at", String, nullable=False),
            ),
            "one_health_insights": table(
                "one_health_insights",
                Column("observation_id", String, primary_key=True),
                Column("payload", Text, nullable=False),
                Column("research_site", String),
                Column("risk_index", Float),
                Column("risk_level", String),
                Column("generated_at", String, nullable=False),
            ),
            "fhir_bundles": table(
                "fhir_bundles",
                Column("observation_id", String, primary_key=True),
                Column("bundle", Text, nullable=False),
                Column("created_at", String, nullable=False),
            ),
        }

    def _upsert(self, table_name: str, key_name: str, values: dict) -> None:
        table = self.tables[table_name]
        key = values[key_name]
        exists = self.session.execute(
            select(table.c[key_name]).where(table.c[key_name] == key)
        ).first()
        if exists:
            self.session.execute(
                update(table).where(table.c[key_name] == key).values(**values)
            )
        else:
            self.session.execute(table.insert().values(**values))

    def save_raw(self, raw: RawObservation) -> None:
        self._upsert("raw_observations", "submission_id", {
            "submission_id": raw.submission_id or "unknown",
            "payload": _json(raw),
            "ingested_at": _now(),
        })

    def save_normalized(self, obs: NormalizedObservation) -> None:
        self._upsert("normalized_observations", "observation_id", {
            "observation_id": obs.observation_id,
            "submission_id": obs.submission_id,
            "payload": _json(obs),
            "completeness_score": obs.completeness_score,
            "normalized_at": _now(),
        })

    def save_validated(self, obs: ValidatedObservation) -> None:
        self._upsert("validated_observations", "observation_id", {
            "observation_id": obs.observation_id,
            "payload": _json(obs),
            "validation_status": obs.validation_status,
            "flag_count": len(obs.flags),
            "validated_at": _now(),
        })

    def save_enriched(self, enriched: EnrichedObservation) -> None:
        self._upsert("enriched_observations", "observation_id", {
            "observation_id": enriched.observation.observation_id,
            "payload": _json(enriched),
            "enriched_at": _now(),
        })

    def save_insight(self, insight: OneHealthInsight) -> None:
        self._upsert("one_health_insights", "observation_id", {
            "observation_id": insight.observation_id,
            "payload": _json(insight),
            "research_site": insight.research_site,
            "risk_index": insight.risk_index,
            "risk_level": insight.risk_level,
            "generated_at": insight.generated_at.isoformat(),
        })

    def save_fhir_bundle(self, observation_id: str, bundle_json: str) -> None:
        self._upsert("fhir_bundles", "observation_id", {
            "observation_id": observation_id,
            "bundle": bundle_json,
            "created_at": _now(),
        })

    def flush(self) -> None:
        self.session.commit()

    def _payloads(self, query) -> list[dict]:
        return [json.loads(row[0]) for row in self.session.execute(query).all()]

    def get_insight(self, observation_id: str) -> Optional[dict]:
        table = self.tables["one_health_insights"]
        row = self.session.execute(
            select(table.c.payload).where(table.c.observation_id == observation_id)
        ).first()
        return json.loads(row[0]) if row else None

    def _ordered_insights(self, site: Optional[str] = None, limit: int = 50, chronological: bool = False):
        insights = self.tables["one_health_insights"]
        normalized = self.tables["normalized_observations"]
        query = (
            select(insights.c.payload)
            .join(normalized, normalized.c.observation_id == insights.c.observation_id)
        )
        if site is not None:
            query = query.where(insights.c.research_site == site)
        order = normalized.c.submission_id.asc() if chronological else normalized.c.submission_id.desc()
        return query.order_by(order, insights.c.observation_id.asc()).limit(limit)

    def get_insights_by_site(self, site: str, limit: int = 50) -> list[dict]:
        return self._payloads(self._ordered_insights(site, limit))

    def get_recent_insights(self, limit: int = 50) -> list[dict]:
        return self._payloads(self._ordered_insights(limit=limit))

    def get_fhir_bundle(self, observation_id: str) -> Optional[str]:
        table = self.tables["fhir_bundles"]
        row = self.session.execute(
            select(table.c.bundle).where(table.c.observation_id == observation_id)
        ).first()
        return row[0] if row else None

    def get_validated(self, observation_id: str) -> Optional[dict]:
        table = self.tables["validated_observations"]
        row = self.session.execute(
            select(table.c.payload).where(table.c.observation_id == observation_id)
        ).first()
        return json.loads(row[0]) if row else None

    def get_trends_by_site(self, site: str, limit: int = 30) -> list[dict]:
        return self._payloads(self._ordered_insights(site, limit, chronological=True))

    def get_all_sites_summary(self) -> list[dict]:
        insights = self.tables["one_health_insights"]
        normalized = self.tables["normalized_observations"]
        validated = self.tables["validated_observations"]
        sites = self.session.execute(
            select(insights.c.research_site)
            .where(insights.c.research_site.is_not(None))
            .distinct()
            .order_by(insights.c.research_site)
        ).scalars().all()
        result = []
        for site in sites:
            aggregate = self.session.execute(
                select(
                    func.count(insights.c.observation_id),
                    func.max(insights.c.risk_index),
                    func.min(insights.c.risk_index),
                    func.avg(insights.c.risk_index),
                ).where(insights.c.research_site == site)
            ).one()
            latest_row = self.session.execute(
                select(insights.c.payload)
                .join(normalized, normalized.c.observation_id == insights.c.observation_id)
                .where(insights.c.research_site == site)
                .order_by(normalized.c.submission_id.desc(), insights.c.observation_id.asc())
                .limit(1)
            ).first()
            latest = json.loads(latest_row[0]) if latest_row else None
            flagged = self.session.execute(
                select(func.count(validated.c.observation_id))
                .join(insights, insights.c.observation_id == validated.c.observation_id)
                .where(insights.c.research_site == site, validated.c.flag_count > 0)
            ).scalar_one()
            coordinate_row = self.session.execute(
                select(normalized.c.payload)
                .where(normalized.c.payload.contains(f'"research_site": "{site}"'))
                .order_by(normalized.c.submission_id.desc(), normalized.c.observation_id.asc())
                .limit(1)
            ).first()
            coordinates = json.loads(coordinate_row[0]) if coordinate_row else {}
            result.append({
                "site": site,
                "observation_count": aggregate[0],
                "max_risk_index": round(aggregate[1], 3) if aggregate[1] is not None else None,
                "min_risk_index": round(aggregate[2], 3) if aggregate[2] is not None else None,
                "avg_risk_index": round(aggregate[3], 3) if aggregate[3] is not None else None,
                "latest_observation_id": latest["observation_id"] if latest else None,
                "latest_risk_index": latest["risk_index"] if latest else None,
                "latest_risk_level": latest["risk_level"] if latest else None,
                "latest_risk_colour": latest.get("risk_colour") if latest else None,
                "latest_confidence": latest["confidence"] if latest else None,
                "latest_generated_at": latest["generated_at"] if latest else None,
                "flagged_observation_count": flagged,
                "latitude": coordinates.get("latitude"),
                "longitude": coordinates.get("longitude"),
            })
        return result

    def count(self, table: str) -> int:
        if table not in VALID_TABLES:
            raise ValueError(f"Unknown table: {table}")
        return self.session.execute(select(func.count()).select_from(self.tables[table])).scalar_one()

    def close(self) -> None:
        self.session.close()
        self.engine.dispose()
