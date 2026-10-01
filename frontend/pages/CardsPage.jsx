import { useEffect, useMemo, useState } from "react";
import { API, levelClass, levelText, urgencyInfo } from "../lib/api.js";
import ListenButton from "../components/ListenButton.jsx";

/* ============================================================
   Glossary — plain-language definitions for every jargon term.
   Rendered as native browser tooltips (title attribute) so they
   work offline and don't need a JS dependency.
   ============================================================ */
const GLOSSARY = {
  "pH": "Acidity scale from 0 to 14. Most stream life thrives between 6.5 and 8.5. Below 5 or above 9.5 stresses aquatic organisms.",
  "Dissolved oxygen": "Oxygen in the water that fish and insects breathe. Healthy streams show 6–12 mg/L. Below 4 mg/L stresses most aquatic life.",
  "TDS": "Total dissolved solids — sum of all dissolved substances. Above 1000 mg/L indicates pollution or saline intrusion.",
  "Total dissolved solids": "Sum of all dissolved substances. Above 1000 mg/L indicates pollution or saline intrusion.",
  "Conductivity": "How well water conducts electricity. High values suggest dissolved salts or pollutants. Typical freshwater is 200–800 µS/cm.",
  "Coliforms": "Bacteria that indicate possible sewage contamination. When present, direct water contact carries health risk.",
  "Macroinvertebrate": "Small animals without backbones visible to the naked eye. Their diversity is one of the most reliable indicators of stream health.",
  "Macroinvertebrates": "Small animals without backbones visible to the naked eye. Their diversity is one of the most reliable indicators of stream health.",
  "Diatoms": "Single-celled algae with silica shells. Different species tolerate different pollution levels, so their community reflects water quality.",
  "Riparian vegetation": "Plants growing along the stream bank. They shade the water, filter runoff, and stabilise the bank.",
  "Eutrophication": "Excess nutrients (nitrogen, phosphorus) causing algal blooms that consume oxygen and kill aquatic life.",
  "Hypoxia": "Very low oxygen in the water (below 3 mg/L). Most fish and invertebrates cannot survive extended hypoxia.",
  "One Health Risk Index": "A weighted score from 0.00 (healthy) to 1.00 (severe) combining water quality, biological health, human exposure, and environmental pressure.",
  "Confidence": "How complete the citizen submission was. High confidence means most key fields were reported. It does not mean the reading is correct.",
  "Causal chain": "A short sequence showing how one problem leads to the next — for example, water quality degradation stressing biodiversity, which then raises human exposure risk.",
};

/* Wrap glossary terms in <abbr> with a title attribute.
   Uses word boundaries so "pH" doesn't match inside "graph". */
function withGlossary(text) {
  if (!text || typeof text !== "string") return text;

  let out = text;
  const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

  for (const term of terms) {
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b(${safe})\\b`, "g");
    const def = GLOSSARY[term].replace(/"/g, "&quot;");
    out = out.replace(re, `<abbr class="glossary-term" title="${def}">$1</abbr>`);
  }
  return out;
}

/* ============================================================
   Impact Cards page — matches "Cross-Domain One Health Synthesis"
   design from your reference HTML, verbatim Tailwind classes.
   ============================================================ */

const PLACEHOLDER_DESC = {
  High: "Acute dissolved oxygen depletion combined with high surface runoff and unresolved validation flags.",
  Moderate: "High conductivity and Total Dissolved Solids. Moderate biological tolerance buffer maintained.",
  Low: "Stable biofiltration habitat with healthy macroinvertebrate diversity.",
};

function Pillar({ column, mode }) {
  const cls = levelClass(column.level);
  const isHigh = cls === "red";
  const isMid = cls === "yellow";
  const borderCls = isHigh ? "border-l-rose-500" : isMid ? "border-l-amber-500" : "border-l-emerald-500";
  const scoreColor = isHigh ? "text-rose-400" : isMid ? "text-amber-400" : "text-emerald-400";
  const barCls = isHigh ? "bg-rose-500" : isMid ? "bg-amber-400" : "bg-emerald-500";
  const iconName = column.domain === "ecosystem" ? "water_drop"
    : column.domain === "animal" ? "cruelty_free"
    : "medical_services";
  const pillarName = {
    ecosystem: "Ecosystem & Hydrology",
    animal: "Animal & Fauna",
    human: "Human Public Health",
  }[column.domain];
  const weight = { ecosystem: "50% System Weight", animal: "30% System Weight", human: "20% System Weight" }[column.domain];
  const roman = { ecosystem: "Pillar I", animal: "Pillar II", human: "Pillar III" }[column.domain];

  return (
    <div className={`glass-panel rounded-3xl p-5 shadow-xl flex flex-col justify-between relative group hover:border-teal-400/40 transition-all border-l-4 ${borderCls}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`material-symbols-outlined text-lg ${scoreColor}`}>{iconName}</span>
              <span className={`text-xs font-bold uppercase tracking-wider font-mono-code ${scoreColor}`}>
                {roman}
              </span>
            </div>
            <h3 className="font-serif-title font-bold text-base text-[var(--ink)] mt-1">
              {pillarName}
            </h3>
            <span className="text-[10px] font-mono-code text-[var(--ink-dim)]">{weight}</span>
          </div>
          <div className="text-right">
            <span className={`text-xl font-mono-code font-bold ${scoreColor}`}>
              {Math.round((column.score || 0) * 100)}
            </span>
            <span className="text-[10px] text-[var(--ink-dim)]">/100</span>
            <div className={`text-[10px] font-semibold uppercase ${scoreColor}`}>
              {levelText(column.level)}
            </div>
          </div>
        </div>

        <div className="h-2 rounded-full bg-black/30 overflow-hidden">
          <div className={`h-full ${barCls} rounded-full transition-all duration-700`}
            style={{ width: `${(column.score || 0) * 100}%` }} />
        </div>

        {column.summary && (
          <p
            className="text-xs text-[var(--ink)]/90 leading-relaxed bg-black/15 p-3 rounded-2xl"
            dangerouslySetInnerHTML={{ __html: withGlossary(column.summary) }}
          />
        )}

        {column.reasons?.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider font-mono-code text-[var(--ink-dim)]">
              Diagnostic Triggers:
            </p>
            <ul className="text-xs space-y-1.5">
              {column.reasons.slice(0, 3).map((r, i) => (
                <li key={i} className={`flex items-start gap-2 p-2 rounded-xl ${
                  isHigh ? "bg-rose-500/10 text-rose-200"
                  : isMid ? "bg-amber-500/10 text-amber-200"
                  : "bg-emerald-500/10 text-emerald-200"
                }`}>
                  <span className={`material-symbols-outlined text-sm mt-0.5 ${scoreColor}`}>
                    {isHigh ? "crisis_alert" : isMid ? "warning" : "check_circle"}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: withGlossary(r) }} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {column.actions?.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] uppercase tracking-wider font-mono-code text-[var(--ink-dim)]">
              Protocol Recommendations:
            </p>
            <div className="space-y-1">
              {column.actions.slice(0, 3).map((a, i) => (
                <div key={i} className="text-xs flex items-center gap-2 p-2 rounded-xl bg-teal-500/10 text-teal-300">
                  <span className="material-symbols-outlined text-teal-400 text-sm">bolt</span>
                  <span dangerouslySetInnerHTML={{ __html: withGlossary(a) }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-[var(--border-line)] flex items-center justify-between text-[10px] font-mono-code text-[var(--ink-dim)]">
        <span>Source: OAH pipeline</span>
        <span className="text-teal-400">Live</span>
      </div>
    </div>
  );
}

export default function CardsPage({ sites = [], onToast }) {
  const [activeSite, setActiveSite] = useState(null);
  const [card, setCard] = useState(null);
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeSite && sites.length) setActiveSite(sites[0]);
  }, [sites, activeSite]);

  useEffect(() => {
    if (!activeSite?.latest_observation_id) return;
    setLoading(true);
    const id = activeSite.latest_observation_id;
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || ""}/insights/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${import.meta.env.VITE_API_URL || ""}/insights/${encodeURIComponent(id)}/flags`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ])
      .then(([c, f]) => { setCard(c); setFlags(f); })
      .catch(() => { setCard(null); setFlags(null); })
      .finally(() => setLoading(false));
  }, [activeSite]);

  const sorted = useMemo(() =>
    [...sites].sort((a, b) => (b.latest_risk_index || 0) - (a.latest_risk_index || 0)),
    [sites]
  );

  const urgency = card ? urgencyInfo(card.risk.index) : null;
  const gaugeArc = 204.2;
  const dashOffset = card ? gaugeArc * (1 - Math.max(0, Math.min(1, card.risk.index))) : gaugeArc;
  const riskColor = card
    ? card.risk.index >= 0.55 ? "text-rose-400" : card.risk.index >= 0.25 ? "text-amber-400" : "text-emerald-400"
    : "text-rose-400";

  if (!sites.length) {
    return (
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-20 text-center">
        <p className="text-[var(--ink-dim)]">No sites yet. Run the pipeline from the topbar.</p>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Header + filters */}
          <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />
                <span className="text-xs font-semibold tracking-wider uppercase text-[var(--ink-dim)] font-mono-code">
                  Catchment Basin
                </span>
              </div>
              <span className="text-[11px] font-mono-code px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300">
                {sites.length} Sites Live
              </span>
            </div>

            <select
              value={activeSite?.site || ""}
              onChange={(e) => setActiveSite(sites.find((s) => s.site === e.target.value))}
              className="w-full bg-black/20 text-xs text-[var(--ink)] rounded-2xl px-4 py-3 appearance-none focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono-code cursor-pointer transition-all shadow-inner"
            >
              {sites.map((s) => (
                <option key={s.site} value={s.site}>{s.site}</option>
              ))}
            </select>

            <div className="flex items-center p-1 rounded-2xl bg-black/20 text-xs font-mono-code">
              <button className="flex-1 py-1.5 rounded-xl text-center text-[var(--ink-dim)] hover:text-[var(--ink)] transition-all flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm">view_stream</span>
                <span>Simple</span>
              </button>
              <button className="flex-1 py-1.5 rounded-xl text-center bg-teal-500/20 text-teal-300 font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-sm">clinical_notes</span>
                <span>Detailed</span>
              </button>
            </div>
          </div>

          {/* Segment list */}
          <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xs uppercase tracking-widest font-mono-code text-[var(--ink-dim)]">
                Monitored Segments
              </h2>
              <span className="text-[10px] text-teal-400 font-mono-code">Sorted: Risk ↓</span>
            </div>

            <nav className="space-y-2 max-h-[520px] overflow-y-auto custom-scrollbar">
              {sorted.map((s) => {
                const cls = levelClass(s.latest_risk_level);
                const isActive = activeSite?.site === s.site;
                const segBorder = cls === "red" ? "border-l-rose-500" : cls === "yellow" ? "border-l-amber-500" : "border-l-emerald-500";
                const segBg = isActive
                  ? cls === "red" ? "bg-rose-500/10 hover:bg-rose-500/15"
                    : cls === "yellow" ? "bg-amber-500/10 hover:bg-amber-500/15"
                    : "bg-emerald-500/10 hover:bg-emerald-500/15"
                  : "bg-black/10 hover:bg-black/25";
                const scoreCls = cls === "red" ? "bg-rose-500/20 text-rose-300"
                  : cls === "yellow" ? "bg-amber-500/20 text-amber-300"
                  : "bg-emerald-500/20 text-emerald-300";
                const statusCls = cls === "red" ? "text-rose-400" : cls === "yellow" ? "text-amber-400" : "text-emerald-400";

                return (
                  <button
                    key={s.site}
                    onClick={() => setActiveSite(s)}
                    className={`w-full text-left cursor-pointer group rounded-2xl p-3.5 border-l-4 ${segBorder} ${segBg} transition-all`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--ink)] group-hover:text-teal-300 transition-colors truncate">
                          {s.site.replace("Riverdale Creek - ", "")}
                        </p>
                        <p className="text-[10px] font-mono-code text-[var(--ink-dim)] mt-0.5">
                          obs-{s.latest_observation_id?.slice(0, 8) || "—"}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold ${scoreCls} flex-shrink-0`}>
                        {Number(s.latest_risk_index || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[10px]">
                      <span className={`${statusCls} font-medium flex items-center gap-1`}>
                        {cls === "red" && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
                        {levelText(s.latest_risk_level)}
                      </span>
                      <span className="text-[var(--ink-dim)] font-mono-code">
                        {s.flagged_observation_count} Flag{s.flagged_observation_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Hydrology snapshot */}
          <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs uppercase tracking-widest font-mono-code text-[var(--ink-dim)]">
              Catchment Hydrology
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-black/20">
                <p className="text-[10px] text-[var(--ink-dim)]">Basin Inflow</p>
                <p className="text-sm font-bold font-mono-code text-teal-300 mt-0.5">48.2 m³/s</p>
              </div>
              <div className="p-3 rounded-2xl bg-black/20">
                <p className="text-[10px] text-[var(--ink-dim)]">24h Precip</p>
                <p className="text-sm font-bold font-mono-code text-teal-300 mt-0.5">38.4 mm</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ============ MAIN AREA ============ */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-7">

          {loading && !card && (
            <p className="text-[var(--ink-dim)]">Loading impact card…</p>
          )}

          {card && (
            <>
              {/* Hero */}
              <div className="glass-panel rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-3.5 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-mono-code border ${
                        card.risk.index >= 0.55
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : card.risk.index >= 0.25
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}>
                        {card.risk.index >= 0.55 && <span className="w-2 h-2 rounded-full bg-rose-400 pulse-danger" />}
                        <span>{levelText(card.risk.level)} · {Number(card.risk.index).toFixed(2)} / 1.00</span>
                      </span>
                      {card.risk.index >= 0.55 && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-mono-code border border-amber-500/25">
                          Automated Threshold Triggered (≥ 0.55)
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono-code flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        Track 2 Live Feed
                      </span>
                    </div>

                    <div>
                      <h1 className="font-serif-title text-2xl lg:text-3xl font-bold tracking-tight text-[var(--ink)]">
                        {card.site}
                      </h1>
                      <p className="text-xs lg:text-sm font-mono-code text-[var(--ink-dim)] mt-1.5">
                        ID: {card.observation_id.slice(0, 12)} · Confidence: {card.confidence} · Updated{" "}
                        {new Date(card.generated_at).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC",
                        })} UTC
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-black/20 text-[var(--ink-dim)] font-mono-code">
                        Substrate: {activeSite?.site?.includes("Concrete") ? "Impervious Concrete" : "Natural Substrate"}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-black/20 text-[var(--ink-dim)] font-mono-code">
                        Reach Length: 1.4 km
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-black/20 text-[var(--ink-dim)] font-mono-code">
                        Canal Slope: 2.8%
                      </span>
                    </div>
                  </div>

                  {/* Gauge */}
                  <div className="flex flex-col items-center justify-center bg-black/20 p-4 rounded-3xl shrink-0 shadow-inner">
                    <div className="relative w-44 h-28 flex items-end justify-center">
                      <svg className="w-40 h-24 overflow-visible" viewBox="0 0 160 90">
                        <defs>
                          <linearGradient id="gaugeGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="45%" stopColor="#facc15" />
                            <stop offset="80%" stopColor="#f87171" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                        </defs>
                        <path d="M 15 80 A 65 65 0 0 1 145 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeLinecap="round" strokeWidth="12" />
                        <path
                          d="M 15 80 A 65 65 0 0 1 145 80"
                          fill="none"
                          stroke="url(#gaugeGrad)"
                          strokeDasharray={gaugeArc}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          strokeWidth="12"
                          className="transition-all duration-1000 ease-out"
                        />
                        <circle cx="80" cy="80" fill="#f87171" r="4" />
                      </svg>
                      <div className="absolute bottom-1 text-center">
                        <span className={`text-3xl font-extrabold font-mono-code ${riskColor} tracking-tight leading-none`}>
                          {Number(card.risk.index).toFixed(2)}
                        </span>
                        <p className="text-[9px] uppercase tracking-wider font-mono-code text-[var(--ink-dim)]">
                          Risk Index
                        </p>
                      </div>
                    </div>
                    {urgency && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                          urgency.cls === "act"
                            ? "bg-rose-600/30 text-rose-300 border-rose-500/40 pulse-danger"
                            : urgency.cls === "mon"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}>
                          {urgency.cls === "act" && <span className="w-2 h-2 rounded-full bg-rose-400" />}
                          <span>{urgency.key}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Three pillars */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xs uppercase tracking-widest font-mono-code text-teal-400">
                      Multi-Pillar Evidence Triad
                    </h2>
                    <p className="text-sm font-serif-title font-semibold text-[var(--ink)] mt-0.5">
                      Ecological, Animal & Human Exposure Harmonization
                    </p>
                  </div>
                  <span className="text-xs font-mono-code text-[var(--ink-dim)] hidden sm:inline">
                    Weighted Harmonic Synthesis
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {["ecosystem", "animal", "human"].map((domain) => {
                    const col = card.columns.find((c) => c.domain === domain);
                    if (!col) return null;
                    const cls = levelClass(col.level);
                    const isHigh = cls === "red";
                    const isMid = cls === "yellow";
                    const borderCls = isHigh ? "border-l-rose-500" : isMid ? "border-l-amber-500" : "border-l-emerald-500";
                    const iconName = domain === "ecosystem" ? "water_drop" : domain === "animal" ? "cruelty_free" : "medical_services";
                    const iconBg = isHigh
                      ? "bg-rose-500/20 text-rose-400"
                      : isMid ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400";
                    const scoreColor = isHigh ? "text-rose-400" : isMid ? "text-amber-400" : "text-emerald-400";
                    const barCls = isHigh ? "bg-rose-500" : isMid ? "bg-amber-400" : "bg-emerald-500";
                    const pillarName = {
                      ecosystem: "Ecosystem & Hydrology",
                      animal: "Animal & Fauna",
                      human: "Human Public Health",
                    }[domain];
                    const weight = { ecosystem: "50% System Weight", animal: "30% System Weight", human: "20% System Weight" }[domain];
                    const roman = { ecosystem: "Pillar I", animal: "Pillar II", human: "Pillar III" }[domain];

                    return <Pillar key={domain} column={col} mode="detailed" />;

                    return (
                      <div key={domain} className={`glass-panel rounded-3xl p-5 shadow-xl flex flex-col justify-between relative group hover:border-teal-400/40 transition-all border-l-4 ${borderCls}`}>
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className={`material-symbols-outlined text-lg ${scoreColor}`}>{iconName}</span>
                                <span className={`text-xs font-bold uppercase tracking-wider font-mono-code ${scoreColor}`}>
                                  {roman}
                                </span>
                              </div>
                              <h3 className="font-serif-title font-bold text-base text-[var(--ink)] mt-1">
                                {pillarName}
                              </h3>
                              <span className="text-[10px] font-mono-code text-[var(--ink-dim)]">{weight}</span>
                            </div>
                            <div className="text-right">
                              <span className={`text-xl font-mono-code font-bold ${scoreColor}`}>
                                {Math.round((col.score || 0) * 100)}
                              </span>
                              <span className="text-[10px] text-[var(--ink-dim)]">/100</span>
                              <div className={`text-[10px] font-semibold uppercase ${scoreColor}`}>
                                {levelText(col.level)}
                              </div>
                            </div>
                          </div>

                          <div className="h-2 rounded-full bg-black/30 overflow-hidden">
                            <div className={`h-full ${barCls} rounded-full transition-all duration-700`}
                              style={{ width: `${(col.score || 0) * 100}%` }} />
                          </div>

                          {col.summary && (
                            <p className="text-xs text-[var(--ink)]/90 leading-relaxed bg-black/15 p-3 rounded-2xl">
                              {col.summary}
                            </p>
                          )}

                          {col.reasons?.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] uppercase tracking-wider font-mono-code text-[var(--ink-dim)]">
                                Diagnostic Triggers:
                              </p>
                              <ul className="text-xs space-y-1.5">
                                {col.reasons.slice(0, 3).map((r, i) => (
                                  <li key={i} className={`flex items-start gap-2 p-2 rounded-xl ${
                                    isHigh ? "bg-rose-500/10 text-rose-200" : isMid ? "bg-amber-500/10 text-amber-200" : "bg-emerald-500/10 text-emerald-200"
                                  }`}>
                                    <span className={`material-symbols-outlined text-sm mt-0.5 ${scoreColor}`}>
                                      {isHigh ? "crisis_alert" : isMid ? "warning" : "check_circle"}
                                    </span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {col.actions?.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] uppercase tracking-wider font-mono-code text-[var(--ink-dim)]">
                                Protocol Recommendations:
                              </p>
                              <div className="space-y-1">
                                {col.actions.slice(0, 3).map((a, i) => (
                                  <div key={i} className="text-xs flex items-center gap-2 p-2 rounded-xl bg-teal-500/10 text-teal-300">
                                    <span className="material-symbols-outlined text-teal-400 text-sm">bolt</span>
                                    <span>{a}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-[var(--border-line)] flex items-center justify-between text-[10px] font-mono-code text-[var(--ink-dim)]">
                          <span>Source: OAH pipeline</span>
                          <span className="text-teal-400">Live</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Causal chain */}
              {card.causal_chain?.length > 0 && (
                <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono-code uppercase text-teal-400 tracking-wider">
                        Explainable Evidence Trace
                      </span>
                      <h3 className="font-serif-title font-bold text-base text-[var(--ink)]">
                        Deterministic Causal Chain
                      </h3>
                    </div>
                    <span className="text-xs font-mono-code px-2.5 py-1 rounded-full bg-black/30 text-[var(--ink-dim)]">
                      {card.causal_chain.length} Step Mechanistic Linkage
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                    {card.causal_chain.map((link, i) => {
                      const isAlert = i === 2;
                      const isWarn = i === 1 || i === 3;
                      return (
                        <div
                          key={i}
                          className={`relative p-3.5 rounded-2xl flex flex-col justify-between space-y-2 group transition-all ${
                            isAlert ? "bg-rose-500/10 border-l-2 border-rose-500 hover:bg-rose-500/20"
                              : isWarn ? "bg-amber-500/10 hover:bg-amber-500/20"
                              : "bg-black/20 hover:bg-teal-500/10"
                          }`}
                        >
                          <div className={`flex items-center justify-between text-[10px] font-mono-code ${
                            isAlert ? "text-rose-400" : isWarn ? "text-amber-400" : "text-teal-400"
                          }`}>
                            <span>0{i + 1} · {link.from.toUpperCase()}</span>
                            <span className="material-symbols-outlined text-sm">
                              {isAlert ? "scuba_diving" : isWarn ? "pest_control" : "cloud"}
                            </span>
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${
                              isAlert ? "text-rose-300" : isWarn ? "text-amber-300" : "text-[var(--ink)]"
                            }`}>
                              {link.to.charAt(0).toUpperCase() + link.to.slice(1)}
                            </p>
                            <p className={`text-[10px] font-mono-code mt-1 ${
                              isAlert ? "text-rose-300/70" : isWarn ? "text-amber-300/70" : "text-[var(--ink-dim)]"
                            }`}>
                              {link.description}
                            </p>
                          </div>
                          {i < card.causal_chain.length - 1 && (
                            <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-teal-400/50">›</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Flags */}
              {flags && (
                <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono-code uppercase text-teal-400 tracking-wider">
                        Automated QC Layer
                      </span>
                      <h3 className="font-serif-title font-bold text-base text-[var(--ink)]">
                        {flags.flag_count} Active Outlier{flags.flag_count !== 1 ? "s" : ""} & Flags
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono-code font-semibold ${
                      flags.flag_count > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"
                    }`}>
                      {flags.flag_count > 0 ? "Action Required" : "Clean"}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {flags.flags.length === 0 && (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                          <div>
                            <p className="font-mono-code font-bold text-emerald-200">NO_ACTIVE_FLAGS</p>
                            <p className="text-[11px] text-[var(--ink-dim)]">All quality parameters within thresholds.</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md font-mono-code text-[10px] bg-emerald-500/30 text-emerald-200">OK</span>
                      </div>
                    )}

                    {flags.flags.map((f, i) => {
                      const warn = f.severity === "WARNING";
                      return (
                        <div
                          key={i}
                          className={`p-3 rounded-2xl flex items-center justify-between gap-3 text-xs ${
                            warn ? "bg-amber-500/10" : "bg-rose-500/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-lg ${warn ? "text-amber-400" : "text-rose-400"}`}>
                              {warn ? "device_thermostat" : "error"}
                            </span>
                            <div>
                              <p className={`font-mono-code font-bold ${warn ? "text-amber-200" : "text-rose-200"}`}>
                                {f.rule_id} · {f.field}
                              </p>
                              <p className="text-[11px] text-[var(--ink-dim)]">
                                {f.explanation || f.message}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md font-mono-code text-[10px] ${
                            warn ? "bg-amber-500/30 text-amber-200" : "bg-rose-500/30 text-rose-200"
                          }`}>
                            {f.severity === "ERROR" ? "Critical" : f.severity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="glass-panel rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-teal-400">
                      <span className="material-symbols-outlined text-lg">token</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--ink)]">FHIR Observation / OAH IG Compliant</p>
                      <p className="text-[10px] font-mono-code text-[var(--ink-dim)]">
                        HL7 v4.0.1 Resource Bundle · Code: 98112-9
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <ListenButton card={card} />

                    <button
                      className="px-3.5 py-2 rounded-xl bg-black/20 hover:bg-teal-500/20 text-[var(--ink)] hover:text-teal-300 text-xs font-semibold flex items-center gap-2 transition-all"
                      onClick={() => {
                        const text = `${card.site} — ${levelText(card.risk.level)} (${Number(card.risk.index).toFixed(2)})\n\n` +
                          card.columns.map((c) => `${c.title}: ${c.level} (${Number(c.score).toFixed(2)})`).join("\n");
                        navigator.clipboard?.writeText(text);
                        onToast("Impact summary copied to clipboard");
                      }}
                    >
                      <span className="material-symbols-outlined text-sm text-teal-400">content_copy</span>
                      <span>Copy Insight</span>
                    </button>

                    <button
                      className="px-3.5 py-2 rounded-xl bg-black/20 hover:bg-teal-500/20 text-[var(--ink)] hover:text-teal-300 text-xs font-semibold flex items-center gap-2 transition-all"
                      onClick={() => window.print()}
                    >
                      <span className="material-symbols-outlined text-sm text-teal-400">print</span>
                      <span>Print Report</span>
                    </button>

                    <a
                      className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20"
                      href={API.fhirUrl(card.observation_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-sm">integration_instructions</span>
                      <span>Preview FHIR Bundle (R4)</span>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}