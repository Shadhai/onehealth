import numpy as np
from datetime import datetime
from typing import List
from app.schemas.normalized_observation import NormalizedObservation
from app.schemas.validated_observation import ValidatedObservation, ValidationFlag


NUMERIC_RULES = [
	{"id": "R001", "field": "ph", "min": 0, "max": 14, "severity": "ERROR",
	 "msg": "pH must be between 0 and 14.",
	 "explanation": "The pH scale runs from 0 to 14. Please re-check your reading."},
	{"id": "R002", "field": "ph", "min": 5.0, "max": 9.5, "severity": "WARNING",
	 "msg": "pH {value} is outside the typical freshwater range (5.0-9.5).",
	 "explanation": "Most urban streams fall between 6.5 and 8.5. A value this far outside could be a real event or a measurement error."},
	{"id": "R003", "field": "dissolved_oxygen_mg_l", "min": 0, "max": 20, "severity": "ERROR",
	 "msg": "Dissolved oxygen must be between 0 and 20 mg/L.",
	 "explanation": "Water at typical stream temperatures cannot hold more than about 14 mg/L of oxygen. Please re-check your reading."},
	{"id": "R004", "field": "dissolved_oxygen_mg_l", "min": 4, "max": 14, "severity": "WARNING",
	 "msg": "Dissolved oxygen {value} mg/L is unusual for urban streams.",
	 "explanation": "Healthy streams usually show 6-12 mg/L. Below 4 mg/L can stress fish."},
	{"id": "R005", "field": "water_temperature_c", "min": -5, "max": 45, "severity": "ERROR",
	 "msg": "Water temperature must be between -5 and 45 C.",
	 "explanation": "This is outside the physical range for a flowing stream."},
	{"id": "R006", "field": "tds_mg_l", "min": 0, "max": 5000, "severity": "ERROR",
	 "msg": "TDS must be between 0 and 5000 mg/L.",
	 "explanation": "Values above 5000 mg/L suggest seawater or a unit error."},
	{"id": "R007", "field": "conductivity_us_cm", "min": 0, "max": 50000, "severity": "ERROR",
	 "msg": "Conductivity must be between 0 and 50000 uS/cm.",
	 "explanation": "Values above 50000 uS/cm suggest seawater or a unit error."},
]


def run_numeric_rules(obs: NormalizedObservation) -> List[ValidationFlag]:
	flags = []
	for rule in NUMERIC_RULES:
		value = getattr(obs, rule["field"], None)
		if value is None:
			continue
		if value < rule["min"] or value > rule["max"]:
			flags.append(ValidationFlag(
				rule_id=rule["id"],
				field=rule["field"],
				severity=rule["severity"],
				value=float(value),
				message=rule["msg"].format(value=value),
				explanation=rule["explanation"],
			))
	return flags


def run_consistency_rules(obs: NormalizedObservation) -> List[ValidationFlag]:
	flags = []
	rating = obs.overall_rating
	score = obs.degradation_score

	if rating and score:
		rating_to_score = {"Good": 1, "Moderate": 2, "Poor": 3}
		expected = rating_to_score.get(rating)
		if expected and expected != score:
			flags.append(ValidationFlag(
				rule_id="R008",
				field="overall_rating",
				severity="WARNING",
				message=f"Rating '{rating}' does not match degradation score {score}.",
				explanation=f"You rated this site '{rating}', which normally corresponds to score {expected}, but the degradation score is {score}. Please confirm which is correct.",
			))

	if obs.coliforms_code in ("present", "high") and rating == "Good":
		flags.append(ValidationFlag(
			rule_id="R009",
			field="coliforms_code",
			severity="WARNING",
			message=f"Coliforms '{obs.coliforms_code}' with 'Good' rating.",
			explanation="Coliforms indicate bacterial contamination. A 'Good' rating is unusual when coliforms are present.",
		))

	if obs.water_smell_code in ("sewage", "chemical", "faint chemical") and rating == "Good":
		flags.append(ValidationFlag(
			rule_id="R010",
			field="water_smell_code",
			severity="WARNING",
			message=f"Water smell '{obs.water_smell_code}' with 'Good' rating.",
			explanation="Sewage or chemical smells usually indicate pollution. Please confirm the rating.",
		))

	return flags


NUMERIC_FIELDS_FOR_AI = [
	"ph", "dissolved_oxygen_mg_l", "water_temperature_c",
	"tds_mg_l", "conductivity_us_cm",
]


def run_ai_anomaly(
	obs: NormalizedObservation,
	historical: List[NormalizedObservation],
) -> List[ValidationFlag]:
	if len(historical) < 10:
		return []

	X_hist = np.array([
		[getattr(h, f) for f in NUMERIC_FIELDS_FOR_AI]
		for h in historical
		if all(getattr(h, f) is not None for f in NUMERIC_FIELDS_FOR_AI)
	])
	if len(X_hist) < 10:
		return []

	row = [getattr(obs, f) for f in NUMERIC_FIELDS_FOR_AI]
	if any(v is None for v in row):
		return []
	X_current = np.array([row])

	from sklearn.ensemble import IsolationForest

	model = IsolationForest(contamination=0.1, random_state=42)
	model.fit(X_hist)
	pred = model.predict(X_current)[0]

	if pred == -1:
		means = X_hist.mean(axis=0)
		stds = X_hist.std(axis=0) + 1e-9
		z_scores = np.abs((X_current[0] - means) / stds)
		worst = int(np.argmax(z_scores))
		field = NUMERIC_FIELDS_FOR_AI[worst]
		z = float(z_scores[worst])
		return [ValidationFlag(
			rule_id="AI001",
			field=field,
			severity="WARNING",
			value=float(row[worst]),
			message=f"Anomaly detected in '{field}' (z-score {z:.1f}).",
			explanation=f"This value is {z:.1f} standard deviations from the site average. It could be a real event or a measurement error.",
			z_score=z,
		)]
	return []


def validate(
	obs: NormalizedObservation,
	historical: List[NormalizedObservation],
) -> ValidatedObservation:
	flags = []
	flags += run_numeric_rules(obs)
	flags += run_consistency_rules(obs)
	flags += run_ai_anomaly(obs, historical)

	has_error = any(f.severity == "ERROR" for f in flags)
	has_warning = any(f.severity == "WARNING" for f in flags)

	status = "rejected" if has_error else ("needs_review" if has_warning else "valid")

	data = obs.model_dump()
	data["flags"] = flags
	data["validation_status"] = status
	data["validated_at"] = datetime.utcnow()
	return ValidatedObservation(**data)


def validate_batch(observations: List[NormalizedObservation]) -> List[ValidatedObservation]:
	results = []
	for obs in observations:
		historical = [
			h for h in observations
			if h.research_site == obs.research_site
			and h.observation_id != obs.observation_id
		]
		results.append(validate(obs, historical))
	return results
