export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "";

async function json(path, options) {
  const r = await fetch(`${API_BASE}${path}`, options);
  if (!r.ok) throw new Error(`${path} → HTTP ${r.status}`);
  return r.json();
}

export function apiFetch(path, options) {
  return json(path, options);
}

export const API = {
  summary:  () => json("/api/summary"),
  sites:    () => json("/api/sites"),
  insights: () => json("/insights?limit=500"),
  insight:  (id) => json(`/insights/${encodeURIComponent(id)}`),
  trends:   (site) => json(`/insights/trends/${encodeURIComponent(site)}`),
  flags:    (id) => json(`/insights/${encodeURIComponent(id)}/flags`),
  priority: () => json("/api/priority-sites?limit=3"),
  fhirUrl:  (id) => `${API_BASE}/fhir/${encodeURIComponent(id)}`,
  csvUrl:   (site) => `${API_BASE}/api/export/csv${site ? `?site=${encodeURIComponent(site)}` : ""}`,
  rerun:    () => fetch(`${API_BASE}/ingest/mock`, { method: "POST" }),
  submitObservations: (observations) => json("/ingest/observations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(observations),
  }),
  submitLiveObservations: (observations, apiKey) => json("/ingest/live", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify(observations),
  }),
};

export function levelClass(level) {
  if (level === "High") return "red";
  if (level === "Moderate") return "yellow";
  return "green";
}

export function levelText(level) {
  if (level === "High") return "High Risk";
  if (level === "Moderate") return "Moderate Risk";
  return "Low Risk";
}

export function urgencyInfo(idx) {
  const n = Number(idx) || 0;
  if (n >= 0.55) return { key: "ACT NOW", cls: "act" };
  if (n >= 0.25) return { key: "MONITOR", cls: "mon" };
  return { key: "STABLE", cls: "sta" };
}