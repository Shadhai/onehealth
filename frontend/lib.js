export const ROUTES = {
  overview:  "/overview",
  cards:     "/cards",
  onehealth: "/onehealth",
  dashboard: "/dashboard",
  trends:    "/trends",
  map:       "/map",
};

export const TABS = [
  ["overview",  "Overview"],
  ["cards",     "Impact cards"],
   ["trends",    "Trends"],
  ["onehealth", "One Health"],
  ["dashboard", "Dashboard"],
  ["map",       "Map"],
];

export const API = {
  sites:      "/api/sites",
  summary:    "/api/summary",
  csv:        "/api/export/csv",
  ingestMock: "/ingest/mock",
  insights: (id)   => `/insights/${encodeURIComponent(id)}`,
  flags:    (id)   => `/insights/${encodeURIComponent(id)}/flags`,
  trends:   (site) => `/insights/trends/${encodeURIComponent(site)}`,
  fhir:     (id)   => `/fhir/${encodeURIComponent(id)}`,
};

export const PILLAR_WEIGHTS = [
  ["ecosystem", "Ecosystem Health",       0.5],
  ["fauna",     "Animal & Fauna Health",  0.3],
  ["human",     "Human Public Health",    0.2],
];

export function meetsAlertRule(site) {
  if (!site) return false;
  const hasFields =
    site.dissolved_oxygen != null ||
    site.land_surface_temp != null ||
    site.ecoli != null;

  if (hasFields) {
    const stagnant     = site.flow === "Stagnant" || Number(site.dissolved_oxygen) < 3;
    const hot          = Number(site.land_surface_temp) > 30;
    const contaminated = Number(site.ecoli) > 1000;
    return Boolean(stagnant && hot && contaminated);
  }
  return Number(site.latest_risk_index || 0) >= 0.55;
}

export function alertRuleHasFullFields(site) {
  return (
    site?.dissolved_oxygen != null ||
    site?.land_surface_temp != null ||
    site?.ecoli != null
  );
}

export function viewFromPath(pathname) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const match = Object.entries(ROUTES).find(
    ([, route]) => normalized === route
  );
  return match ? match[0] : "overview";
}

export function levelClass(level) {
  if (level === "High") return "red";
  if (level === "Moderate") return "yellow";
  return "green";
}

export function riskClass(level) {
  if (level === "High") return "risk-high";
  if (level === "Moderate") return "risk-mid";
  return "risk-low";
}

export function levelText(level) {
  if (level === "High") return "High risk";
  if (level === "Moderate") return "Moderate risk";
  return "Low risk";
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function formatNumber(value, digits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
}

export function hasCoordinates(site) {
  return site?.latitude != null && site?.longitude != null;
}