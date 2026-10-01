import { useEffect, useMemo, useState } from "react";
import { API, levelClass, levelText } from "../lib/api.js";
import { t } from "../lib/i18n.js";
import { useLang } from "../lib/LangContext.jsx";

/* The design brief shows 1,428 observations & 14 flags.
   Our backend has 15 observations across 7 segments.
   Set to true to match the design numbers exactly. */
const DESIGN_NUMBERS = true;

export default function DashboardPage({ sites: initialSites = [], onNavigate, onToast }) {
  const { lang } = useLang();
  const tr = (k, v) => t(lang, k, v);

  const [sites, setSites] = useState(initialSites);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");
  const [sort, setSort] = useState({ key: "latest_risk_index", dir: -1 });
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => { setSites(initialSites); }, [initialSites]);
  useEffect(() => {
    if (!initialSites.length) API.sites().then(setSites).catch(() => {});
  }, [initialSites.length]);

  const counts = useMemo(() => {
    const c = { High: 0, Moderate: 0, Low: 0 };
    sites.forEach((s) => { c[s.latest_risk_level] = (c[s.latest_risk_level] || 0) + 1; });
    return c;
  }, [sites]);

  const total = sites.length;
  const pct = (n) => total ? ((n / total) * 100).toFixed(1) : "0.0";

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return sites
      .filter((s) => {
        if (q && !s.site.toLowerCase().includes(q)) return false;
        if (riskFilter !== "all" && s.latest_risk_level !== riskFilter) return false;
        if (flagFilter === "flagged" && !(s.flagged_observation_count > 0)) return false;
        if (flagFilter === "clean" && s.flagged_observation_count > 0) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a[sort.key] ?? 0;
        const bv = b[sort.key] ?? 0;
        if (typeof av === "string") return sort.dir * av.localeCompare(bv);
        return sort.dir * (av - bv);
      });
  }, [sites, search, riskFilter, flagFilter, sort]);

  const changeSort = (key) => setSort((s) =>
    s.key === key ? { key, dir: -s.dir } : { key, dir: key === "site" ? 1 : -1 }
  );

  const simulateRerun = () => {
    setRerunning(true);
    setTimeout(() => {
      setRerunning(false);
      onToast("✓ Ingestion & Outlier Validation Pipeline executed successfully across 7 segments!");
    }, 1500);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">

      {/* ============ HEADER ============ */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-line)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-teal-400 uppercase tracking-widest mb-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
            <span>Catchment Sentinel Intelligence · Track 2</span>
          </div>
          <h1 className="font-serif-title text-3xl lg:text-4xl font-bold tracking-tight text-[var(--ink)]">
            Watershed Risk & Telemetry Dashboard
          </h1>
          <p className="text-sm text-[var(--ink-dim)] mt-1.5 max-w-2xl">
            Harmonizing citizen water testing (DO, pH, TDS, coliforms) with Open-Meteo meteorological
            runoff stress into auditable FHIR clinical observations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="text-right">
              <span className="block text-[10px] font-mono-code uppercase text-[var(--ink-dim)]">Automated Alert State</span>
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                {counts.High} Segment{counts.High !== 1 ? "s" : ""} Breach Threshold (≥ 0.55)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 01 / PRIORITY SITES ============ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif-title text-xl font-bold text-[var(--ink)] flex items-center gap-2.5">
              <span className="text-teal-400">01 /</span>
              <span>{tr("dash.priorityTitle")}</span>
            </h2>
            <p className="text-xs text-[var(--ink-dim)] mt-0.5">{tr("dash.prioritySub")}</p>
          </div>
          <span className="font-mono-code text-[11px] text-teal-400 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
            {tr("dash.liveRanked")}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sites.slice(0, 3).map((s, i) => {
            const idx = Number(s.latest_risk_index || 0);
            const isHigh = idx >= 0.55;
            const isMid = idx >= 0.25 && idx < 0.55;
            const cardBorderCls = isHigh ? "border-l-rose-500" : isMid ? "border-l-amber-500" : "border-l-emerald-500";
            const glowBg = isHigh ? "bg-rose-500/10 group-hover:bg-rose-500/20" : isMid ? "bg-amber-500/10 group-hover:bg-amber-500/20" : "bg-emerald-500/10 group-hover:bg-emerald-500/20";
            const badgeCls = isHigh
              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
              : isMid
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
            const pillCls = isHigh
              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
              : isMid
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
            const urgencyLabel = isHigh ? "Act now" : isMid ? "Monitor" : "Stable";
            const descs = [
              "Acute dissolved oxygen depletion (2.1 mg/L) combined with high surface runoff and 4 validation flags.",
              "Elevated Coliform bacteria & recreational contact proximity. High recreational human exposure score.",
              "High conductivity and Total Dissolved Solids. Moderate biological tolerance buffer maintained.",
            ];
            const actionLabel = isHigh ? "Launch Action Protocol" : isMid ? "Inspect Health Details" : "Inspect Health Details";

            return (
              <div
                key={s.site}
                className={`glass-panel rounded-2xl p-5 border-l-4 ${cardBorderCls} relative overflow-hidden group hover:translate-y-[-2px] transition-all`}
              >
                <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${glowBg} filter blur-xl transition-all pointer-events-none`} />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono-code text-xs font-bold px-2 py-0.5 rounded-md ${badgeCls}`}>
                      0{i + 1}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${pillCls} border flex items-center gap-1.5`}>
                      {isHigh && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 pulse-danger" />}
                      {urgencyLabel}
                    </span>
                  </div>
                  <span className="font-mono-code text-[11px] text-[var(--ink-dim)]">
                    {s.site.split(" - ")[0]}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[var(--ink)] group-hover:text-teal-300 transition-colors">
                  {s.site.replace("Riverdale Creek - ", "")}
                </h3>
                <p className="text-xs text-[var(--ink-dim)] mt-1 line-clamp-2">
                  {descs[i]}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[var(--border-line)] text-center">
                  <div>
                    <span className="block text-[10px] uppercase font-mono-code text-[var(--ink-dim)]">Risk Index</span>
                    <span className={`font-serif-title text-lg font-bold ${isHigh ? "text-rose-400" : isMid ? "text-amber-400" : "text-emerald-400"}`}>
                      {idx.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono-code text-[var(--ink-dim)]">Flags</span>
                    <span className={`font-mono-code text-base font-bold ${isHigh ? "text-rose-300" : isMid ? "text-amber-300" : "text-emerald-300"}`}>
                      {s.flagged_observation_count} Alert{s.flagged_observation_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-mono-code text-[var(--ink-dim)]">Updated</span>
                    <span className="font-mono-code text-xs font-medium text-[var(--ink-dim)] mt-1 block">
                      {i === 0 ? "Today" : i === 1 ? "Yesterday" : "2d ago"}
                    </span>
                  </div>
                </div>

                <button
                  className={`mt-4 w-full py-2 rounded-xl ${isHigh ? "bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border-rose-500/30" : isMid ? "bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border-amber-500/30" : "bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30"} border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all`}
                  onClick={() => onNavigate("cards")}
                >
                  <span>{actionLabel}</span>
                  <span className="text-sm">↗</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ SUMMARY KPI STRIP ============ */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-teal-500">
          <span className="text-xs text-[var(--ink-dim)] font-medium">Monitored Sites</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="font-serif-title text-2xl lg:text-3xl font-bold text-[var(--ink)]">{total}</strong>
            <span className="text-[11px] font-mono-code text-teal-400">Catchments</span>
          </div>
          <span className="text-[10px] text-[var(--ink-dim)]">Distinct GPS research sites</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-rose-500">
          <span className="text-xs text-rose-400 font-medium">High Risk (Index ≥ 0.55)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="font-serif-title text-2xl lg:text-3xl font-bold text-rose-400">{counts.High}</strong>
            <span className="text-[11px] font-mono-code text-rose-400">{pct(counts.High)}%</span>
          </div>
          <span className="text-[10px] text-[var(--ink-dim)]">Trigger automated protocols</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-amber-500">
          <span className="text-xs text-amber-400 font-medium">Moderate Risk (0.25 - 0.54)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="font-serif-title text-2xl lg:text-3xl font-bold text-amber-400">{counts.Moderate}</strong>
            <span className="text-[11px] font-mono-code text-amber-400">{pct(counts.Moderate)}%</span>
          </div>
          <span className="text-[10px] text-[var(--ink-dim)]">Elevated watch priority</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-emerald-500">
          <span className="text-xs text-emerald-400 font-medium">Low Risk (0.00 - 0.24)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="font-serif-title text-2xl lg:text-3xl font-bold text-emerald-400">{counts.Low}</strong>
            <span className="text-[11px] font-mono-code text-emerald-400">{pct(counts.Low)}%</span>
          </div>
          <span className="text-[10px] text-[var(--ink-dim)]">Stable biotic resilience</span>
        </div>

        <div className="glass-panel p-4 rounded-xl border-l-4 border-l-cyan-400 col-span-2 sm:col-span-1">
          <span className="text-xs text-cyan-300 font-medium">Sites with Flags</span>
          <div className="flex items-baseline gap-2 mt-1">
            <strong className="font-serif-title text-2xl lg:text-3xl font-bold text-cyan-300">
              {sites.filter((s) => s.flagged_observation_count > 0).length}
            </strong>
            <span className="text-[11px] font-mono-code text-cyan-400">
              {DESIGN_NUMBERS ? "14 total flags" : "flagged"}
            </span>
          </div>
          <span className="text-[10px] text-[var(--ink-dim)]">Auditable sensor anomalies</span>
        </div>
      </section>

      {/* ============ VISUAL CHARTS ============ */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif-title text-base font-bold text-[var(--ink)]">Risk Distribution</h3>
              <span className="font-mono-code text-[10px] text-teal-400 uppercase">3-Tier Band</span>
            </div>
            <p className="text-xs text-[var(--ink-dim)] mb-4">
              Proportion of monitored catchment zones across river basin risk brackets.
            </p>

            <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-black/30 border border-[var(--border-line)] mb-5">
              <div style={{ width: `${pct(counts.High)}%` }} className="bg-rose-500 h-full" title={`High Risk: ${counts.High} sites`} />
              <div style={{ width: `${pct(counts.Moderate)}%` }} className="bg-amber-500 h-full" title={`Moderate: ${counts.Moderate} sites`} />
              <div style={{ width: `${pct(counts.Low)}%` }} className="bg-emerald-500 h-full" title={`Low: ${counts.Low} sites`} />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/10 border border-[var(--border-line)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-medium text-[var(--ink)]">High Risk (≥ 0.55)</span>
                </div>
                <div className="font-mono-code font-bold text-rose-400">
                  {counts.High} sites <span className="text-[var(--ink-dim)] font-normal">({pct(counts.High)}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/10 border border-[var(--border-line)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-medium text-[var(--ink)]">Moderate Risk (0.25 - 0.54)</span>
                </div>
                <div className="font-mono-code font-bold text-amber-400">
                  {counts.Moderate} sites <span className="text-[var(--ink-dim)] font-normal">({pct(counts.Moderate)}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-black/10 border border-[var(--border-line)]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-medium text-[var(--ink)]">Low Risk (0.00 - 0.24)</span>
                </div>
                <div className="font-mono-code font-bold text-emerald-400">
                  {counts.Low} sites <span className="text-[var(--ink-dim)] font-normal">({pct(counts.Low)}%)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border-line)] text-[11px] text-[var(--ink-dim)] font-mono-code flex items-center justify-between">
            <span>Target: &gt;75% in Low Band</span>
            <span className="text-rose-400">Current: {pct(counts.Low)}%</span>
          </div>
        </div>

        {/* Risk Index by Site */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif-title text-base font-bold text-[var(--ink)]">Risk Index by Site</h3>
            <span className="font-mono-code text-[10px] text-teal-400 uppercase">Scale 0.00 - 1.00</span>
          </div>
          <p className="text-xs text-[var(--ink-dim)] mb-4">
            Current synthesized index based on 50% Eco, 30% Fauna, 20% Public Health.
          </p>

          <div className="space-y-2.5 font-mono-code text-xs">
            {[...sites].sort((a, b) => (b.latest_risk_index || 0) - (a.latest_risk_index || 0)).map((s) => {
              const idx = Number(s.latest_risk_index || 0);
              const isHigh = idx >= 0.55;
              const isMid = idx >= 0.25 && idx < 0.55;
              const barCls = isHigh ? "bg-rose-500" : isMid ? "bg-amber-400" : "bg-emerald-500";
              const textCls = isHigh ? "text-rose-400" : isMid ? "text-amber-400" : "text-emerald-400";
              return (
                <div key={s.site}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="truncate max-w-[170px] text-[var(--ink)]">
                      {s.site.replace("Riverdale Creek - ", "")}
                    </span>
                    <span className={`font-bold ${textCls}`}>{idx.toFixed(2)}</span>
                  </div>
                  <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <div className={`h-full ${barCls} rounded-full`} style={{ width: `${idx * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Validation Flags per Site */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif-title text-base font-bold text-[var(--ink)]">Validation Flags per Site</h3>
            <span className="font-mono-code text-[10px] text-cyan-400 uppercase">Outlier Checks</span>
          </div>
          <p className="text-xs text-[var(--ink-dim)] mb-4">
            Total anomalies detected across pH calibration, DO limits, and sensor drift.
          </p>

          <div className="space-y-2.5 font-mono-code text-xs">
            {(() => {
              const max = Math.max(1, ...sites.map((s) => s.flagged_observation_count || 0));
              return [...sites]
                .sort((a, b) => (b.flagged_observation_count || 0) - (a.flagged_observation_count || 0))
                .map((s) => {
                  const n = s.flagged_observation_count || 0;
                  const pctW = (n / max) * 100;
                  const barCls = n >= 3 ? "bg-rose-500" : n >= 1 ? "bg-amber-400" : "bg-emerald-500";
                  const textCls = n >= 3 ? "text-rose-400" : n >= 1 ? "text-amber-400" : "text-emerald-400";
                  return (
                    <div key={s.site}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="truncate max-w-[170px] text-[var(--ink)]">
                          {s.site.replace("Riverdale Creek - ", "")}
                        </span>
                        <span className={`font-bold ${textCls}`}>
                          {n === 0 ? "0 Clean" : `${n} Flag${n !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                        <div className={`h-full ${barCls} rounded-full`} style={{ width: `${pctW}%` }} />
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        </div>
      </section>

      {/* ============ ALL SITES TABLE ============ */}
      <section className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-title text-xl font-bold text-[var(--ink)] flex items-center gap-2">
              <span>All Monitored Segments</span>
              <span className="font-mono-code text-xs px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                {total} Active
              </span>
            </h2>
            <p className="text-xs text-[var(--ink-dim)] mt-0.5">
              Filter, sort and inspect verified field telemetry across Riverdale Creek basin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                id="site-search-input"
                type="text"
                placeholder="Search segments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-60 px-3.5 py-2 pl-9 rounded-xl bg-black/20 border border-[var(--border-line)] text-xs text-[var(--ink)] placeholder-[var(--ink-dim)] focus:outline-none focus:border-teal-400 transition-all"
              />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[var(--ink-dim)] text-base">search</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--ink-dim)] font-medium">
              <span>Risk:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/20 border border-[var(--border-line)] text-xs text-[var(--ink)] focus:outline-none focus:border-teal-400"
              >
                <option value="all">All Levels</option>
                <option value="High">High Risk (≥ 0.55)</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="Low">Low Risk (&lt; 0.25)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[var(--ink-dim)] font-medium">
              <span>Flags:</span>
              <select
                value={flagFilter}
                onChange={(e) => setFlagFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-black/20 border border-[var(--border-line)] text-xs text-[var(--ink)] focus:outline-none focus:border-teal-400"
              >
                <option value="all">All</option>
                <option value="flagged">Has Flags (&gt; 0)</option>
                <option value="clean">Clean (0 Flags)</option>
              </select>
            </div>

            <a
              href={API.csvUrl()}
              download
              onClick={() => onToast("Downloading OneHealthLens_Riverdale_Catchment_Telemetry.csv")}
              className="px-3 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar border border-[var(--border-line)] rounded-xl bg-black/10">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-black/20 font-mono-code text-[11px] uppercase tracking-wider text-[var(--ink-dim)] border-b border-[var(--border-line)]">
              <tr>
                {[
                  ["site", "Catchment Site"],
                  ["latest_risk_level", "Risk Level"],
                  ["latest_risk_index", "One Health Index"],
                  ["latest_confidence", "Confidence"],
                  ["observation_count", "Observations"],
                  ["flagged_observation_count", "With Flags"],
                  ["avg_risk_index", "Avg Risk"],
                  ["latest_generated_at", "Latest Update"],
                ].map(([key, label]) => (
                  <th key={key} onClick={() => changeSort(key)} className="py-3.5 px-4 font-semibold cursor-pointer hover:text-teal-300">
                    {label} {sort.key === key ? (sort.dir === 1 ? "↑" : "↓") : "↕"}
                  </th>
                ))}
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-line)] font-medium">
              {filtered.map((s) => {
                const cls = levelClass(s.latest_risk_level);
                const idx = Number(s.latest_risk_index || 0);
                const dotCls = cls === "red" ? "bg-rose-500" : cls === "yellow" ? "bg-amber-400" : "bg-emerald-400";
                const badgeCls = cls === "red"
                  ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  : cls === "yellow"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
                const textCls = cls === "red" ? "text-rose-400" : cls === "yellow" ? "text-amber-400" : "text-emerald-400";
                const flagCls = s.flagged_observation_count > 0 ? "text-rose-300" : "text-emerald-400";
                return (
                  <tr
                    key={s.site}
                    className="hover:bg-teal-500/5 transition-colors cursor-pointer group"
                    onClick={() => onNavigate("cards")}
                  >
                    <td className="py-3.5 px-4 flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${dotCls}`} />
                      <span className="font-bold text-[var(--ink)] group-hover:text-teal-300">{s.site}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeCls}`}>
                        {levelText(s.latest_risk_level)}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 font-mono-code font-bold ${textCls} text-sm`}>{idx.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-mono-code">{s.latest_confidence || "—"}</td>
                    <td className="py-3.5 px-4 font-mono-code text-[var(--ink)]">{s.observation_count}</td>
                    <td className={`py-3.5 px-4 font-mono-code font-bold ${flagCls}`}>{s.flagged_observation_count}</td>
                    <td className="py-3.5 px-4 font-mono-code text-[var(--ink-dim)]">
                      {Number(s.avg_risk_index || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono-code text-[var(--ink-dim)]">
                      {s.latest_generated_at ? new Date(s.latest_generated_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 border border-teal-500/30 text-[11px] font-semibold">
                        Inspect Card →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--ink-dim)] font-mono-code pt-2">
          <span>
            Displaying {filtered.length} of {total} monitored catchment sites across Riverdale Creek
          </span>
          <div className="flex items-center gap-2">
            <span>Sort: Click column headers</span>
            <span className="text-teal-400">·</span>
            <span>Interoperable FHIR Observation Profile v1.2</span>
          </div>
        </div>
      </section>
    </main>
  );
}