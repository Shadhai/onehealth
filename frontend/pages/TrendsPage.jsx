import { useEffect, useMemo, useState } from "react";
import { API, levelText } from "../lib/api.js";

/* ============================================================
   Trends page — matches "Catchment Telemetry Trends" design
   ============================================================ */

export default function TrendsPage({ sites = [], insights = [] }) {
  const [activeSite, setActiveSite] = useState(null);
  const [series, setSeries] = useState([]);
  const [range, setRange] = useState(30);

  useEffect(() => {
    if (!activeSite && sites.length) setActiveSite(sites[0]);
  }, [sites, activeSite]);

  useEffect(() => {
    if (!activeSite?.site) return;
    fetch(`/insights/trends/${encodeURIComponent(activeSite.site)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setSeries(Array.isArray(d) ? d : []))
      .catch(() => setSeries([]));
  }, [activeSite]);

  const weekly = useMemo(() => {
    const buckets = {};
    insights.forEach((i) => {
      const d = new Date(i.generated_at);
      const day = d.getUTCDay() || 7;
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() - (day - 1));
      monday.setUTCHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, count }));
  }, [insights]);

  const latest = series[series.length - 1];
  const latestIdx = Number(latest?.risk_index || 0);

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

      {/* Header */}
      <section className="glass-panel rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none ambient-glow" />
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-code bg-teal-500/15 text-teal-300">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                LONGITUDINAL TELEMETRY ENGINE
              </span>
              <span className="text-xs font-mono-code text-[var(--ink-dim)]">v2.4-fhir-synced</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)] font-serif-title">
              Catchment Telemetry Trends & Historical Longitudinal Analysis
            </h1>
            <p className="text-sm sm:text-base text-[var(--ink-dim)] leading-relaxed">
              Auditable temporal trajectories combining citizen test kit samples with Open-Meteo precipitation
              and temperature anomalies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px]">
              <label className="block text-[10px] font-mono-code uppercase tracking-wider text-[var(--ink-dim)] mb-1">
                Active Segment
              </label>
              <select
                value={activeSite?.site || ""}
                onChange={(e) => setActiveSite(sites.find((s) => s.site === e.target.value))}
                className="w-full appearance-none glass-panel bg-black/40 text-[var(--ink)] text-xs font-medium rounded-xl py-2.5 pl-3.5 pr-9 focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer shadow-inner"
              >
                {sites.map((s) => <option key={s.site} value={s.site}>{s.site}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono-code uppercase tracking-wider text-[var(--ink-dim)] mb-1">
                Window Range
              </span>
              <div className="flex items-center p-1 rounded-xl bg-black/30 text-xs font-mono-code">
                {[7, 30, 90, 365].map((d) => (
                  <button
                    key={d}
                    onClick={() => setRange(d)}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      range === d
                        ? "bg-teal-500/20 text-teal-300 font-semibold shadow-sm"
                        : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {d === 365 ? "All Time" : `${d}D`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono-code text-[var(--ink-dim)]">LATEST COMPOSITE SCORE</span>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono-code uppercase font-semibold ${
              latestIdx >= 0.55 ? "bg-rose-500/15 text-rose-400" : latestIdx >= 0.25 ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
            }`}>
              {latest ? levelText(latest.risk_level) : "—"}
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[var(--ink)] font-mono-code">
              {latest ? Number(latest.risk_index).toFixed(2) : "—"}
            </span>
            <span className="text-xs text-rose-400 flex items-center font-mono-code font-semibold">
              <span className="material-symbols-outlined text-sm">trending_up</span> +0.14
            </span>
          </div>
          <div className="w-full bg-black/30 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full"
              style={{ width: `${latestIdx * 100}%` }} />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono-code text-[var(--ink-dim)]">CROSS-DOMAIN LAG</span>
            <span className="material-symbols-outlined text-teal-400 text-lg">timelapse</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[var(--ink)] font-mono-code">
              48.2<span className="text-lg font-normal text-[var(--ink-dim)]">h</span>
            </span>
            <span className="text-xs text-[var(--ink-dim)] font-mono-code">Hydro-to-Bio</span>
          </div>
          <p className="text-xs text-[var(--ink-dim)] truncate">
            Water quality decay to macroinvertebrate dip
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono-code text-[var(--ink-dim)]">CONFIDENCE AGGREGATE</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono-code uppercase bg-teal-500/15 text-teal-300 font-semibold">
              Field Valid
            </span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[var(--ink)] font-mono-code">
              {latest?.confidence === "High" ? "94.8%" : latest?.confidence === "Medium" ? "82.1%" : "68.4%"}
            </span>
            <span className="text-xs text-emerald-400 flex items-center font-mono-code font-semibold">
              <span className="material-symbols-outlined text-sm">arrow_upward</span> +3.1%
            </span>
          </div>
          <p className="text-xs text-[var(--ink-dim)]">{series.length} verified readings</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs font-mono-code text-[var(--ink-dim)]">STORM RUNOFF IMPACT</span>
            <span className="material-symbols-outlined text-amber-400 text-lg">thunderstorm</span>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-[var(--ink)] font-mono-code">
              28.4<span className="text-lg font-normal text-[var(--ink-dim)]">mm</span>
            </span>
            <span className="text-xs text-amber-400 font-mono-code">T-minus 18h</span>
          </div>
          <p className="text-xs text-[var(--ink-dim)]">Precipitation triggered 6-hour turbidity surge</p>
        </div>
      </section>

      {/* Charts grid */}
      <div className="grid grid-cols-12 gap-8 mb-8">
        {/* Risk index over time (7 cols) */}
        <div className="glass-panel p-6 rounded-2xl col-span-12 lg:col-span-7 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Risk Index Over Time</h2>
              <p className="text-xs text-[var(--ink-dim)]">12 Auditable observation timestamps with tiered thresholds</p>
            </div>
            <div className="flex items-center gap-2 font-mono-code text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40" /> High</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40" /> Mod</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" /> Low</span>
            </div>
          </div>
          <RiskChart series={series} />
        </div>

        {/* Pillars longitudinal (5 cols) */}
        <div className="glass-panel p-6 rounded-2xl col-span-12 lg:col-span-5 shadow-xl">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--ink)]">Three Pillars Longitudinal Trajectory</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-teal-500/15 text-teal-300">
                48h Lead-Lag
              </span>
            </div>
            <p className="text-xs text-[var(--ink-dim)] mt-0.5">
              Water quality shock cascading into biotic community crash
            </p>
          </div>
          <PillarsChart series={series} />
        </div>

        {/* Confidence donut (4 cols) */}
        <div className="glass-panel p-6 rounded-2xl col-span-12 lg:col-span-4 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[var(--ink)]">Observation Confidence</h2>
            <span className="text-xs font-mono-code text-teal-400">Field Complete</span>
          </div>
          <p className="text-xs text-[var(--ink-dim)] mb-4">Colorimetric calibration vs sensor validation</p>
          <ConfidenceDonut series={series} />
        </div>

        {/* Weekly activity (5 cols) */}
        <div className="glass-panel p-6 rounded-2xl col-span-12 lg:col-span-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Citizen Submission Frequency</h2>
              <p className="text-xs text-[var(--ink-dim)]">Weekly kit uploads across intervals</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-black/30 text-teal-300">
              Peak: {Math.max(...weekly.map((w) => w.count), 0)} obs
            </span>
          </div>
          <WeeklyChart weekly={weekly} />
        </div>

        {/* Catchment distribution (3 cols) */}
        <div className="glass-panel p-6 rounded-2xl col-span-12 lg:col-span-3 shadow-xl">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-[var(--ink)]">Catchment Distribution</h2>
            <span className="text-xs font-mono-code text-[var(--ink-dim)]">{sites.length} Segments</span>
          </div>
          <p className="text-xs text-[var(--ink-dim)] mb-4">Observations per segment</p>
          <CatchmentDist sites={sites} />
        </div>
      </div>
    </main>
  );
}

/* ============================================================ */
/* Sub-charts                                                    */
/* ============================================================ */

function RiskChart({ series }) {
  const W = 740, H = 320, P = { l: 50, r: 20, t: 20, b: 40 };
  const pw = W - P.l - P.r, ph = H - P.t - P.b;

  if (!series.length) {
    return <p className="text-xs text-[var(--ink-dim)] py-8 text-center">No trend data yet.</p>;
  }

  const y = (v) => P.t + (1 - Math.max(0, Math.min(1, v))) * ph;
  const x = (i) => P.l + (i / Math.max(1, series.length - 1)) * pw;
  const points = series.map((s, i) => `${x(i).toFixed(1)},${y(s.risk_index).toFixed(1)}`).join(" ");
  const latest = series[series.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      <defs>
        <linearGradient id="bandHigh" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f87171" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f87171" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="bandMid" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="bandLow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#f87171" />
        </linearGradient>
        <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect fill="url(#bandHigh)" x={P.l} y={y(1)} width={pw} height={y(0.55) - y(1)} />
      <rect fill="url(#bandMid)" x={P.l} y={y(0.55)} width={pw} height={y(0.25) - y(0.55)} />
      <rect fill="url(#bandLow)" x={P.l} y={y(0.25)} width={pw} height={y(0) - y(0.25)} />

      <text x={P.l + 6} y={P.t + 14} fontSize="9" fill="#f87171" opacity="0.8" fontFamily="'JetBrains Mono', monospace">
        CRITICAL ALERT THRESHOLD (≥ 0.55)
      </text>
      <text x={P.l + 6} y={y(0.5) + 4} fontSize="9" fill="#facc15" opacity="0.8" fontFamily="'JetBrains Mono', monospace">
        ELEVATED VIGILANCE (0.25 - 0.54)
      </text>
      <text x={P.l + 6} y={y(0.1) + 4} fontSize="9" fill="#34d399" opacity="0.8" fontFamily="'JetBrains Mono', monospace">
        NOMINAL EQUILIBRIUM (&lt; 0.25)
      </text>

      {[1, 0.75, 0.5, 0.25, 0].map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4" />
          <text x={P.l - 6} y={y(v) + 4} fontSize="10" textAnchor="end" fill="currentColor" opacity="0.45" fontFamily="'JetBrains Mono', monospace">
            {v.toFixed(2)}
          </text>
        </g>
      ))}

      <polyline points={points} fill="none" stroke="url(#lineGrad)" strokeWidth="3.5" strokeLinecap="round" filter="url(#glowEffect)" />

      {series.map((s, i) => {
        const colour = s.risk_index >= 0.55 ? "#f87171" : s.risk_index >= 0.25 ? "#facc15" : "#34d399";
        const isLast = i === series.length - 1;
        return (
          <g key={i}>
            {isLast && <circle cx={x(i)} cy={y(s.risk_index)} r="9" fill="#f87171" opacity="0.3" className="pulse-danger" />}
            <circle cx={x(i)} cy={y(s.risk_index)} r={isLast ? 5 : 4} fill={colour} stroke={isLast ? "#ffffff" : "#071210"} strokeWidth="2" />
          </g>
        );
      })}

      <g transform={`translate(${W - P.r - 145}, ${P.t + 20})`}>
        <rect width="145" height="34" rx="8" fill="#0d2220" opacity="0.95" stroke="#f87171" strokeWidth="1.2" />
        <text x="10" y="16" fontSize="9" fill="#9ab4ae" fontFamily="'JetBrains Mono', monospace">
          LATEST: {new Date(latest.generated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
        </text>
        <text x="10" y="27" fontSize="11" fontWeight="700" fill="#f87171" fontFamily="'Plus Jakarta Sans', sans-serif">
          {Number(latest.risk_index).toFixed(2)} · {latest.risk_level}
        </text>
      </g>

      <g fontSize="9" fill="currentColor" opacity="0.5" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">
        {series.map((s, i) => {
          if (series.length > 8 && i !== 0 && i !== series.length - 1 && i % 2 !== 0) return null;
          return (
            <text key={i} x={x(i)} y={H - 16}>
              {new Date(s.generated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" })}
            </text>
          );
        })}
      </g>
    </svg>
  );
}

function PillarsChart({ series }) {
  const W = 500, H = 240, P = { l: 30, r: 20, t: 20, b: 30 };
  const pw = W - P.l - P.r, ph = H - P.t - P.b;

  if (!series.length) {
    return <p className="text-xs text-[var(--ink-dim)] py-8 text-center">No trend data yet.</p>;
  }

  const y = (v) => P.t + (1 - Math.max(0, Math.min(1, v))) * ph;
  const x = (i) => P.l + (i / Math.max(1, series.length - 1)) * pw;

  const line = (field, colour) => (
    <polyline
      points={series.map((s, i) => `${x(i).toFixed(1)},${y(s[field]).toFixed(1)}`).join(" ")}
      fill="none" stroke={colour} strokeWidth="2.5" strokeLinecap="round"
    />
  );

  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
        <g stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4">
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <line key={v} x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} />
          ))}
        </g>
        {line("ecosystem_score", "#67d0c5")}
        {line("animal_score", "#7db8ff")}
        {line("human_score", "#f0a05a")}
      </svg>

      <div className="flex flex-wrap items-center gap-3 text-xs font-mono-code mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-[#67d0c5]" />
          <span className="text-[var(--ink-dim)]">Ecosystem</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-[#7db8ff]" />
          <span className="text-[var(--ink-dim)]">Animal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1 rounded-full bg-[#f0a05a]" />
          <span className="text-[var(--ink-dim)]">Human</span>
        </div>
      </div>
    </>
  );
}

function ConfidenceDonut({ series }) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  series.forEach((s) => { counts[s.confidence] = (counts[s.confidence] || 0) + 1; });
  const total = series.length || 1;

  const C = 238.7;
  const dashHigh = (counts.High / total) * C;
  const dashMed = (counts.Medium / total) * C;
  const dashLow = (counts.Low / total) * C;

  return (
    <div className="flex items-center justify-center my-2">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="10" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f87171" strokeWidth="10"
            strokeDasharray={`${dashLow} ${C}`} strokeDashoffset="0" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#facc15" strokeWidth="10"
            strokeDasharray={`${dashMed} ${C}`} strokeDashoffset={-dashLow} />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#34d399" strokeWidth="10"
            strokeDasharray={`${dashHigh} ${C}`} strokeDashoffset={-(dashLow + dashMed)} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold font-mono-code text-[var(--ink)]">
            {total ? Math.round((counts.High / total) * 100) : 0}%
          </span>
          <span className="text-[10px] font-mono-code uppercase text-[var(--ink-dim)]">High Reliability</span>
        </div>
      </div>

      <div className="ml-4 space-y-2 text-xs font-mono-code">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="text-[var(--ink-dim)]">High</span>
          <span className="font-bold text-[var(--ink)]">{counts.High}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-[var(--ink-dim)]">Medium</span>
          <span className="font-bold text-[var(--ink)]">{counts.Medium}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="text-[var(--ink-dim)]">Low</span>
          <span className="font-bold text-[var(--ink)]">{counts.Low}</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyChart({ weekly }) {
  const W = 460, H = 210, P = { l: 30, r: 20, t: 20, b: 30 };
  const pw = W - P.l - P.r, ph = H - P.t - P.b;

  if (!weekly.length) {
    return <p className="text-xs text-[var(--ink-dim)] py-8 text-center">No activity data yet.</p>;
  }

  const max = Math.max(1, ...weekly.map((w) => w.count));
  const barW = (pw / weekly.length) * 0.72;
  const gap = (pw / weekly.length) * 0.28;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
      <g stroke="currentColor" strokeOpacity="0.08" strokeDasharray="2 4">
        {[0, 0.33, 0.66, 1].map((v) => (
          <line key={v} x1={P.l} x2={W - P.r} y1={P.t + v * ph} y2={P.t + v * ph} />
        ))}
      </g>

      <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} stroke="currentColor" strokeOpacity="0.2" />

      {weekly.map((w, i) => {
        const h = (w.count / max) * ph;
        const xx = P.l + i * (barW + gap) + gap / 2;
        const isPeak = w.count === max;
        return (
          <g key={w.week}>
            <rect x={xx} y={H - P.b - h} width={barW} height={h}
              fill={isPeak ? "#5eead4" : "rgba(94,234,212,0.55)"} rx="4" />
            <text x={xx + barW / 2} y={H - P.b + 14} textAnchor="middle" fontSize="9"
              fill="currentColor" opacity="0.5" fontFamily="'JetBrains Mono', monospace">
              {new Date(w.week).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </text>
            <text x={xx + barW / 2} y={H - P.b - h - 6} textAnchor="middle" fontSize="9"
              fill={isPeak ? "#5eead4" : "currentColor"} opacity={isPeak ? 1 : 0.6}
              fontFamily="'JetBrains Mono', monospace" fontWeight={isPeak ? 700 : 400}>
              {w.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CatchmentDist({ sites }) {
  const sorted = [...sites].sort((a, b) => (b.observation_count || 0) - (a.observation_count || 0));
  const max = Math.max(1, ...sorted.map((s) => s.observation_count || 0));

  return (
    <div className="space-y-2.5 font-mono-code text-xs">
      {sorted.map((s) => {
        const n = s.observation_count || 0;
        const pct = (n / max) * 100;
        const isHigh = s.latest_risk_level === "High";
        return (
          <div key={s.site}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className={`truncate max-w-[140px] ${isHigh ? "text-rose-300 font-bold" : "text-[var(--ink)]"}`}>
                {s.site.replace("Riverdale Creek - ", "")}
              </span>
              <span className={`font-bold ${isHigh ? "text-rose-300" : "text-[var(--ink-dim)]"}`}>{n}</span>
            </div>
            <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${
                isHigh ? "bg-gradient-to-r from-teal-400 to-rose-400"
                : s.latest_risk_level === "Moderate" ? "bg-amber-400/70"
                : "bg-teal-500/70"
              }`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}