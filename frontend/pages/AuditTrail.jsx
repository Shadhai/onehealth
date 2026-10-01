import { useEffect, useState } from "react";
import { API, levelClass, levelText } from "../lib/api.js";

const STAGE_ICONS = {
  1: "cloud_download",
  2: "tune",
  3: "verified_user",
  4: "cloud_sync",
  5: "hub",
  6: "token",
  7: "lightbulb",
  8: "database",
  9: "share",
};

const STAGE_DESCRIPTIONS = {
  1: "Raw citizen payload received from the source",
  2: "Units normalized to SI, deduplicated, deterministic ID assigned",
  3: "10 rule-based checks + Isolation Forest anomaly detection",
  4: "Weather context enriched from Open-Meteo",
  5: "Four domains weighted into a composite Risk Index",
  6: "Serialized to FHIR R4 using OAH IG profiles",
  7: "Causal chain and confidence computed",
};

export default function AuditTrail({ sites = [] }) {
  const [activeSite, setActiveSite] = useState(null);
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!activeSite && sites.length) setActiveSite(sites[0]);
  }, [sites, activeSite]);

  useEffect(() => {
    if (!activeSite?.latest_observation_id) return;
    setLoading(true);
    setAudit(null);
    const id = activeSite.latest_observation_id;
    fetch(`/insights/${encodeURIComponent(id)}/audit`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAudit(data))
      .catch(() => setAudit(null))
      .finally(() => setLoading(false));
  }, [activeSite]);

  const toggle = (stageNum) => {
    setExpanded((prev) => ({ ...prev, [stageNum]: !prev[stageNum] }));
  };

  if (!sites.length) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-20 text-center">
        <p className="text-[var(--ink-dim)]">No sites yet. Run the pipeline from the topbar.</p>
      </main>
    );
  }

  const riskClass = levelClass(activeSite?.latest_risk_level);
  const riskBorder = riskClass === "red" ? "border-l-rose-500" : riskClass === "yellow" ? "border-l-amber-500" : "border-l-emerald-500";
  const riskText = riskClass === "red" ? "text-rose-400" : riskClass === "yellow" ? "text-amber-400" : "text-emerald-400";

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-code font-medium tracking-wide bg-teal-500/10 text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              PIPELINE AUDIT TRAIL · 9 STAGES
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--ink)] font-serif-title">
            Observation Journey
          </h1>
          <p className="text-sm text-[var(--ink-dim)] max-w-3xl mt-1">
            Every stage that touched this observation is persisted. No black boxes. Click any stage to inspect its input and output.
          </p>
        </div>

        <div className="min-w-[280px]">
          <label className="text-xs font-mono-code uppercase tracking-wider text-[var(--ink-dim)] block mb-1">
            Observation
          </label>
          <select
            value={activeSite?.site || ""}
            onChange={(e) => setActiveSite(sites.find((s) => s.site === e.target.value))}
            className="w-full bg-black/20 text-sm text-[var(--ink)] rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono-code cursor-pointer shadow-inner border border-[var(--border-line)]"
          >
            {sites.map((s) => (
              <option key={s.site} value={s.site}>
                {s.site} ({s.latest_observation_id?.slice(0, 8)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeSite && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-teal-400">
            <div className="text-[10px] font-mono-code uppercase text-[var(--ink-dim)] tracking-wider">Observation ID</div>
            <div className="font-mono-code font-bold text-[var(--ink)] mt-1">{activeSite.latest_observation_id?.slice(0, 12)}</div>
          </div>
          <div className={`glass-panel rounded-2xl p-4 border-l-4 ${riskBorder}`}>
            <div className="text-[10px] font-mono-code uppercase text-[var(--ink-dim)] tracking-wider">Risk Level</div>
            <div className={`font-bold mt-1 ${riskText}`}>
              {levelText(activeSite.latest_risk_level)} · {Number(activeSite.latest_risk_index || 0).toFixed(2)}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-teal-400">
            <div className="text-[10px] font-mono-code uppercase text-[var(--ink-dim)] tracking-wider">Observations</div>
            <div className="font-mono-code font-bold text-[var(--ink)] mt-1">{activeSite.observation_count}</div>
          </div>
          <div className="glass-panel rounded-2xl p-4 border-l-4 border-l-amber-400">
            <div className="text-[10px] font-mono-code uppercase text-[var(--ink-dim)] tracking-wider">Flags</div>
            <div className={`font-mono-code font-bold mt-1 ${activeSite.flagged_observation_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {activeSite.flagged_observation_count}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="glass-panel rounded-3xl p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-teal-400 animate-spin">refresh</span>
          <p className="text-[var(--ink-dim)] mt-3">Loading audit trail…</p>
        </div>
      )}

      {audit && !loading && (
        <div className="relative">
          <div className="absolute left-[38px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-teal-400/60 via-teal-400/30 to-teal-400/0 pointer-events-none" />
          <div className="space-y-4">
            {audit.stages.map((stage) => {
              const isExpanded = expanded[stage.stage];
              const meta = stage.meta || {};

              return (
                <div key={stage.stage} className="relative">
                  <div className="absolute left-0 top-4 w-20 flex justify-center">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center font-mono-code font-bold text-teal-300 text-sm z-10">
                      {String(stage.stage).padStart(2, "0")}
                    </div>
                  </div>

                  <div className="ml-20">
                    <button
                      onClick={() => toggle(stage.stage)}
                      className="w-full text-left glass-panel rounded-2xl p-5 hover:border-teal-400/60 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="material-symbols-outlined text-teal-400 text-2xl flex-shrink-0">
                            {STAGE_ICONS[stage.stage] || "circle"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-serif-title font-bold text-base text-[var(--ink)]">{stage.name}</h3>
                              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                                Stage {stage.stage}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--ink-dim)] mt-1">{STAGE_DESCRIPTIONS[stage.stage]}</p>
                            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono-code text-[var(--ink-dim)]">
                              <span>{new Date(stage.timestamp).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                              {meta.completeness_score != null && <span className="text-teal-400">completeness: {meta.completeness_score}</span>}
                              {meta.validation_status && <span className={meta.validation_status === "valid" ? "text-emerald-400" : meta.validation_status === "needs_review" ? "text-amber-400" : "text-rose-400"}>status: {meta.validation_status}</span>}
                              {meta.flag_count != null && <span className={meta.flag_count > 0 ? "text-amber-400" : "text-emerald-400"}>flags: {meta.flag_count}</span>}
                            </div>
                          </div>
                        </div>
                        <span className={`material-symbols-outlined text-[var(--ink-dim)] group-hover:text-teal-400 transition-all flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
                          expand_more
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 glass-panel rounded-2xl p-4 border border-teal-500/20">
                        <div className="text-[10px] font-mono-code uppercase tracking-wider text-teal-400 mb-2">Stage {stage.stage} · {stage.name} · Payload</div>
                        <pre className="text-[11px] font-mono-code text-[var(--ink)] overflow-x-auto max-h-96 custom-scrollbar whitespace-pre-wrap break-words bg-black/30 rounded-xl p-3">
                          {JSON.stringify(stage.payload, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {audit && !loading && (
        <div className="mt-8 glass-panel rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono-code">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-400 text-lg">verified_user</span>
            <div>
              <p className="text-[var(--ink)] font-semibold">{audit.stage_count} of 9 stages persisted for this observation</p>
              <p className="text-[var(--ink-dim)] text-[11px]">Every intermediate state is queryable. No stage output is discarded.</p>
            </div>
          </div>
          <a
            className="px-4 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold flex items-center gap-2 transition-all"
            href={API.fhirUrl(activeSite?.latest_observation_id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined text-base">data_object</span>
            <span>View Full FHIR Bundle</span>
          </a>
        </div>
      )}
    </main>
  );
}
