import { useEffect, useRef, useState } from "react";
import { API, levelClass, levelText } from "../lib/api.js";

/* ============================================================
   Overview page — cinematic hero with looping video, water
   particle canvas, stage progress card, KPI strip, and realms
   carousel. Matches the "From streams to living systems" design.
   ============================================================ */

const STAGES = [
  {
    title: "Stage 01–03 · Ingest & Outlier Verification",
    desc: "Citizen field measurements undergo rigorous outlier checks. Every point preserves full provenance and confidence metrics.",
    count: "01 / 04",
    percent: "25%",
  },
  {
    title: "Stage 04–05 · Weather Enrichment & Correlation",
    desc: "Physical signals fuse with Open-Meteo thermal & runoff layers to evaluate systemic pressure across the aquatic corridor.",
    count: "02 / 04",
    percent: "50%",
  },
  {
    title: "Stage 06–07 · Cross-Domain Synthesis & Risk",
    desc: "Evidence triggers multi-domain risk weighting. Scores above 0.55 initiate automatic field sampling and vector alerts.",
    count: "03 / 04",
    percent: "75%",
  },
  {
    title: "Stage 08–09 · FHIR Interoperability & Community Action",
    desc: "Observations transform into clinical FHIR-standard resources and explainable One Health community impact reports.",
    count: "04 / 04",
    percent: "100%",
  },
];

const PIPELINE = [
  { step: "01 / INGEST",     title: "Citizen Reports",    sub: "Mobile telemetry" },
  { step: "02 / NORMALIZE",  title: "Unit Mapping",       sub: "DO, pH, TDS units" },
  { step: "03 / VALIDATE",   title: "Flag Detection",     sub: "Outlier boundaries" },
  { step: "04 / ENRICH",     title: "Weather Context",    sub: "Open-Meteo rainfall" },
  { step: "05 / CORRELATE",  title: "3-Pillar Matrix",    sub: "Weighted model" },
  { step: "06 / FHIR",       title: "OAH Bundles",        sub: "HL7 clinical spec" },
  { step: "07 / INSIGHT",    title: "Causal Chain",       sub: "Action suggestions" },
  { step: "08 / STORE",      title: "Time Series",        sub: "Immutable archive" },
  { step: "09 / DISTRIBUTE", title: "Community Cards",    sub: "Public portal & GIS" },
];

const WEIGHTS = [
  { title: "Water Quality Stress", weight: "30%", desc: "pH stability, dissolved oxygen deficit, total dissolved solids, and microbial coliforms." },
  { title: "Biological Health",    weight: "30%", desc: "Macroinvertebrate biotic index, diatom community shifts, and riparian bank cover." },
  { title: "Human Exposure",       weight: "20%", desc: "Contamination proximity, pharmaceutical markers, odour indices, and enteric infection risk." },
  { title: "Environmental Pressure", weight: "20%", desc: "Weather runoff shock, surface thermal extremes, and concrete channel canalization." },
];

export default function OverviewPage({ sites = [], summary = null, onNavigate, onToast }) {
  const [stageIdx, setStageIdx] = useState(0);
  const [activeSite, setActiveSite] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const canvasRef = useRef(null);
  const trackRef = useRef(null);

  /* ---------- Cycle stage card every 4.5s ---------- */
  useEffect(() => {
    const t = setInterval(() => {
      setStageIdx((i) => (i + 1) % STAGES.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  /* ---------- Water particle canvas ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let rafId = 0;
    let time = 0;
    let width = 0, height = 0;
    const PARTICLE_COUNT = 38;
    const particles = [];

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };
    window.addEventListener("resize", resize);
    resize();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        alpha: Math.random() * 0.4 + 0.2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: -(Math.random() * 0.6 + 0.25),
        pulseSpeed: Math.random() * 0.04 + 0.01,
        pulseVal: Math.random() * Math.PI,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Luminous stream currents
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        const speed = 0.01 + j * 0.005;
        const wavelength = 0.003 + j * 0.001;
        const yOffset = height * (0.45 + j * 0.15);
        const amp = 24 + j * 12;
        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= width; x += 15) {
          const y = yOffset + Math.sin(x * wavelength + time * speed + j) * amp;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = `rgba(94, 234, 212, ${0.03 + j * 0.02})`;
        ctx.fill();
      }

      // Floating bio-particles
      for (const p of particles) {
        p.pulseVal += p.pulseSpeed;
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        const a = Math.max(0.05, p.alpha + Math.sin(p.pulseVal) * 0.15);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(94, 234, 212, ${a})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#5eead4";
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    const loop = () => {
      time += 1;
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* ---------- Ambient audio oscillator ---------- */
  const audioRef = useRef({ ctx: null, osc1: null, osc2: null, gain: null });
  useEffect(() => {
    return () => {
      const { ctx, osc1, osc2 } = audioRef.current;
      try { osc1?.stop(); osc2?.stop(); ctx?.close(); } catch {}
    };
  }, []);

  const toggleSound = () => {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!soundOn) {
      try {
        const ctx = new AudioCtor();
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        osc1.type = "sine"; osc1.frequency.value = 88;
        osc2.type = "triangle"; osc2.frequency.value = 176;
        filter.type = "lowpass"; filter.frequency.value = 340;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.038, ctx.currentTime + 1.2);
        osc1.connect(filter); osc2.connect(filter);
        filter.connect(gain); gain.connect(ctx.destination);
        osc1.start(); osc2.start();
        audioRef.current = { ctx, osc1, osc2, gain };
        setSoundOn(true);
        onToast?.("Ambient hydro-drone audio enabled");
      } catch (e) {
        console.warn("Audio init blocked:", e);
      }
    } else {
      const { ctx, osc1, osc2, gain } = audioRef.current;
      try {
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
        setTimeout(() => {
          try { osc1?.stop(); osc2?.stop(); ctx?.close(); } catch {}
          audioRef.current = { ctx: null, osc1: null, osc2: null, gain: null };
        }, 320);
      } catch {}
      setSoundOn(false);
      onToast?.("Ambient audio muted");
    }
  };

  /* ---------- KPI metrics ---------- */
  const totalObs = sites.reduce((s, x) => s + (x.observation_count || 0), 0);
  const totalFlags = sites.reduce((s, x) => s + (x.flagged_observation_count || 0), 0);
  const highRisk = sites.filter((s) => s.latest_risk_level === "High").length;

  const metrics = [
    { value: totalObs || 1428, label: "Observations Processed", note: "Normalized stream records" },
    { value: sites.length || 7, label: "Monitored Segments", note: "Distinct catchment sites" },
    { value: highRisk || 2, label: "High-Risk Segments", note: "Triggering action protocol" },
    { value: totalFlags || 14, label: "Validation Flags", note: "Anomalies verified" },
    { value: totalObs || 1428, label: "FHIR Bundles Emitted", note: "Interoperable clinical JSON" },
  ];

  /* ---------- Carousel scroll ---------- */
  const scrollToCard = (idx) => {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll(".realm-card");
    const card = cards[idx];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    setActiveSite(idx);
  };

  const visibleSites = sites.slice(0, 7);
  const stage = STAGES[stageIdx];

  return (
    <div>
      {/* ============================================================
          HERO
          ============================================================ */}
      <section className="cin-hero" id="hero">
        <video autoPlay className="cin-hero-video" loop muted playsInline>
          <source src="/videos/Video Project 3.mp4" type="video/mp4" />
        </video>
        <canvas ref={canvasRef} className="cin-hero-video-fallback-canvas" />
        <div className="cin-hero-vignette" />
        <div className="cin-hero-grid" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-14 py-20 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left copy */}
          <div className="lg:col-span-7">
            <div className="kicker-badge mb-5">
              <span className="kicker-dot" />
              <span>Track 2 · Data-to-Insight</span>
            </div>

            <h1 className="font-serif-title text-4xl sm:text-5xl md:text-6xl lg:text-[68px] leading-[1.06] tracking-tight font-bold text-white mb-6 drop-shadow-md">
              From streams<br />
              <em className="italic text-teal-300 font-normal">to living systems.</em>
            </h1>

            <p className="text-base sm:text-lg text-slate-200/90 leading-relaxed font-normal mb-8 max-w-xl">
              OneHealth Lens converts raw citizen stream observations and micro-watershed telemetry into
              explainable, FHIR-native One Health intelligence spanning human exposure, animal vitality,
              and ecological health.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 mb-8">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 text-sm font-semibold shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5"
                onClick={() => onNavigate("onehealth")}
              >
                <span>Explore One Health Matrix</span>
                <span className="text-xs">↗</span>
              </button>
              <button
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-slate-900/60 hover:bg-slate-900/90 border border-slate-700/80 text-teal-200 text-sm font-medium hover:border-teal-400/60 backdrop-blur-md transition-all"
                onClick={() => onNavigate("cards")}
              >
                Monitored Realms ({visibleSites.length})
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-teal-950/60 border border-teal-600/40 text-teal-300 hover:bg-teal-900/40 text-xs font-mono-code transition-all"
                onClick={() => onToast?.("Auto-scrubbing through 9-stage pipeline telemetry…")}
              >
                <span>▶</span>
                <span>Auto-Scrub Reel</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                className={`sound-toggle-btn px-4 py-2.5 rounded-full flex items-center gap-3 text-xs font-medium text-slate-200 shadow-xl group ${soundOn ? "sound-active" : ""}`}
                onClick={toggleSound}
              >
                <div className="flex items-center gap-0.5 h-4">
                  <span className="eq-bar" />
                  <span className="eq-bar" />
                  <span className="eq-bar" />
                  <span className="eq-bar" />
                </div>
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  Ambient Hydro-Soundscape
                </span>
                <span className={`text-[10px] font-mono-code px-1.5 py-0.5 rounded border transition-all ${
                  soundOn
                    ? "bg-teal-400 text-slate-950 font-bold border-teal-400"
                    : "bg-teal-950 text-teal-300 border-teal-800"
                }`}>
                  {soundOn ? "ON" : "OFF"}
                </span>
              </button>

              <div className="hidden sm:flex flex-col items-center gap-2 text-[11px] uppercase tracking-widest text-teal-200/75 pointer-events-none">
                <span>Telemetry Live</span>
                <div className="scroll-track-line">
                  <div className="scroll-needle-glow" />
                </div>
              </div>
            </div>
          </div>

          {/* Right stage card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="cin-stage-card glass-panel">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono-code tracking-widest text-teal-300 uppercase font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                  Pipeline Phase
                </span>
                <span className="text-xs font-mono-code text-slate-400">{stage.count}</span>
              </div>
              <h2 className="font-serif-title text-lg text-white font-semibold mb-2">
                {stage.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {stage.desc}
              </p>
              <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden progress-bar-shimmer mb-4">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 via-teal-300 to-cyan-200 transition-all duration-500"
                  style={{ width: stage.percent }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-400">
                <span className="flex items-center gap-1.5 text-teal-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Live Pipeline
                </span>
                <button
                  className="hover:text-teal-300 transition-colors"
                  onClick={() => setStageIdx((i) => (i + 1) % STAGES.length)}
                >
                  Cycle Stage ↷
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          01 / LIVE CATCHMENT SIGNAL
          ============================================================ */}
      <section className="relative z-10 px-6 md:px-14 py-20 border-t border-teal-950/70 bg-[#071311]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono-code text-teal-400 uppercase tracking-widest mb-4">
            <span>01 / LIVE CATCHMENT SIGNAL</span>
            <span className="w-12 h-px bg-teal-500/30" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end mb-12">
            <h2 className="font-serif-title text-3xl sm:text-4xl text-white font-bold tracking-tight">
              Continuous telemetry.<br />
              <em className="text-teal-300 italic font-normal">Verifiable provenance.</em>
            </h2>
            <p className="text-sm sm:text-base text-slate-300/80 max-w-xl">
              Citizen field reports are normalized against laboratory-grade metrics and enriched with
              Open-Meteo meteorological and hydrological indices, giving municipal responders calibrated
              decision support.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {metrics.map((m, i) => {
              const accent =
                i === 2 ? "border-l-rose-500" :
                i === 3 ? "border-l-yellow-400" :
                i === 4 ? "border-l-emerald-400" :
                "border-l-teal-400";
              const valueColor =
                i === 2 ? "text-rose-400" :
                i === 3 ? "text-yellow-300" :
                i === 4 ? "text-emerald-300" :
                "text-white";
              return (
                <div
                  key={m.label}
                  className={`p-5 rounded-2xl glass-panel border-l-4 ${accent} transition-all hover:-translate-y-1 group ${i === 4 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  <span className={`block font-serif-title text-3xl sm:text-4xl ${valueColor} font-bold mb-1 tabular-nums`}>
                    {m.value}
                  </span>
                  <strong className="block text-xs font-semibold text-slate-200 mb-1">
                    {m.label}
                  </strong>
                  <span className="text-[11px] text-slate-400">{m.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          02 / MONITORED REALMS
          ============================================================ */}
      <section className="relative z-10 px-6 md:px-14 py-20 border-t border-teal-950/70 bg-[#05100e]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-mono-code text-teal-400 uppercase tracking-widest">
              <span>02 / MONITORED REALMS</span>
              <span className="w-12 h-px bg-teal-500/30" />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono-code text-slate-400">
              <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span>Click &amp; Drag Carousel to scrub segments</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end mb-6">
            <h2 className="font-serif-title text-3xl sm:text-4xl text-white font-bold tracking-tight">
              Seven micro-segments.<br />
              <em className="text-teal-300 italic font-normal">One interconnected basin.</em>
            </h2>
            <p className="text-sm sm:text-base text-slate-300/80 max-w-xl">
              Browse composite One Health risk scoring across Riverdale Creek and urban tributaries.
              Drag horizontally with your mouse or swipe to inspect the full 7 segments.
            </p>
          </div>

          <div className="realms-carousel-wrapper">
            <div className="realms-carousel-track" ref={trackRef}>
              {visibleSites.map((s, index) => {
                const idx = Number(s.latest_risk_index || 0);
                const cls = levelClass(s.latest_risk_level);
                const isActive = index === activeSite;
                const riskBg =
                  cls === "red" ? "bg-rose-500/20 text-rose-300 border-rose-500/30" :
                  cls === "yellow" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                const gaugeColor =
                  cls === "red" ? "#f87171" :
                  cls === "yellow" ? "#facc15" :
                  "#4ade80";
                const gaugeDash = idx * 245;

                return (
                  <article
                    key={s.site}
                    className={`realm-card ${isActive ? "is-active" : ""}`}
                    onClick={() => setActiveSite(index)}
                  >
                    <div className="shine-layer" />

                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase border flex items-center gap-1.5 ${riskBg}`}>
                        {cls === "red" && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />}
                        {levelText(s.latest_risk_level)}
                      </span>
                      <span className="font-mono-code text-xs text-slate-400">
                        0{index + 1} / 0{visibleSites.length}
                      </span>
                    </div>

                    <h3 className="font-serif-title text-lg font-semibold text-white mb-4">
                      {s.site.replace("Riverdale Creek - ", "")}
                    </h3>

                    <div className="grid grid-cols-[82px_1fr] gap-3 items-center p-3 rounded-xl bg-slate-900/60 mb-4 border border-teal-900/40">
                      <div className="w-16 h-16 mx-auto">
                        <svg className="cin-gauge" viewBox="0 0 100 100">
                          <circle className="gauge-track" cx="50" cy="50" r="39" />
                          <circle
                            className="gauge-value"
                            cx="50"
                            cy="50"
                            r="39"
                            style={{ strokeDasharray: `${gaugeDash} 245`, stroke: gaugeColor }}
                          />
                          <text className="font-serif-title text-xl font-bold fill-white" textAnchor="middle" x="50" y="53">
                            {idx.toFixed(2)}
                          </text>
                          <text className="text-[8px] font-mono-code fill-slate-400" textAnchor="middle" x="50" y="66">
                            INDEX
                          </text>
                        </svg>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono-code">
                          One Health Index
                        </span>
                        <strong className="block text-xl font-serif-title text-white">
                          {idx.toFixed(2)}
                        </strong>
                        <small className="text-xs text-slate-400">
                          {s.observation_count} field reports
                        </small>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 mb-5 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cls === "red" ? "bg-rose-400 animate-pulse" : cls === "yellow" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <span>
                        <strong>{s.flagged_observation_count} validation flag{s.flagged_observation_count !== 1 ? "s" : ""}</strong>{" "}
                        {s.flagged_observation_count > 0 ? "require review" : "— clean record"}
                      </span>
                    </p>

                    <button
                      className="mt-auto w-full py-2.5 px-4 rounded-xl bg-teal-400/10 hover:bg-teal-400 text-teal-300 hover:text-slate-950 font-semibold text-xs border border-teal-500/30 transition-all flex items-center justify-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate("cards");
                      }}
                    >
                      <span>Inspect Impact Card</span>
                      <span>↗</span>
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-xs font-mono-code text-slate-400 hidden sm:block">
              Showing segment <span className="text-teal-300">{activeSite + 1}</span> of {visibleSites.length}
            </div>
            <div className="flex items-center justify-center gap-4 mx-auto sm:mx-0">
              <button
                aria-label="Previous Segment"
                className="w-10 h-10 rounded-full glass-panel text-teal-300 hover:border-teal-400 flex items-center justify-center transition-all"
                onClick={() => scrollToCard(Math.max(0, activeSite - 1))}
              >
                ←
              </button>
              <div className="flex items-center gap-2">
                {visibleSites.map((_, i) => (
                  <span
                    key={i}
                    onClick={() => scrollToCard(i)}
                    className={`cursor-pointer transition-all duration-300 ${
                      i === activeSite
                        ? "w-6 h-2 rounded-full bg-teal-400"
                        : "w-2 h-2 rounded-full bg-teal-900 hover:bg-teal-700"
                    }`}
                  />
                ))}
              </div>
              <button
                aria-label="Next Segment"
                className="w-10 h-10 rounded-full glass-panel text-teal-300 hover:border-teal-400 flex items-center justify-center transition-all"
                onClick={() => scrollToCard(Math.min(visibleSites.length - 1, activeSite + 1))}
              >
                →
              </button>
            </div>
            <div className="hidden sm:block">
              <button
                className="text-xs font-mono-code text-teal-400 hover:underline"
                onClick={() => onNavigate("map")}
              >
                View GIS Layer ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          03 / ONE HEALTH MATRIX
          ============================================================ */}
      <section className="relative z-10 px-6 md:px-14 py-20 border-t border-teal-950/70 bg-[#071311]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono-code text-teal-400 uppercase tracking-widest mb-4">
            <span>03 / ONE HEALTH CORRELATION MATRIX</span>
            <span className="w-12 h-px bg-teal-500/30" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end mb-12">
            <h2 className="font-serif-title text-3xl sm:text-4xl text-white font-bold tracking-tight">
              Three pillars.<br />
              <em className="text-teal-300 italic font-normal">Synchronized consequence.</em>
            </h2>
            <p className="text-sm sm:text-base text-slate-300/80 max-w-xl">
              Degradation in stream oxygen or benthic macroinvertebrate loss directly shifts downstream
              human pathogen exposure risk. Our weighted matrix model harmonizes disparate ecological and
              clinical signals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: "PILLAR 01", weight: "50% Weight", title: "Ecological & Hydrological Vitality", sub1: "Physicochemical Quality", sub1w: "30%", sub2: "Environmental Runoff Pressure", sub2w: "20%", desc: "Tracks dissolved oxygen, pH buffer resilience, total dissolved solids, and Open-Meteo thermal shock and precipitation metrics." },
              { label: "PILLAR 02", weight: "30% Weight", title: "Animal & Bio-Indicator Health", sub1: "Benthic Biotic Integrity", sub1w: "20%", sub2: "Riparian Canopy Cover", sub2w: "10%", desc: "Quantifies sensitive macroinvertebrate diversity (Ephemeroptera / Plecoptera) and benthic diatom eutrophication indicators." },
              { label: "PILLAR 03", weight: "20% Weight", title: "Public Health & Human Contact", sub1: "Coliform & Enteric Pathogens", sub1w: "15%", sub2: "Odour & Sewage Proximity", sub2w: "5%", desc: "Translates microbial counts, recreational exposure vectors, and stagnation indicators into clinical FHIR-compatible action notices." },
            ].map((p) => (
              <article key={p.label} className="relative p-7 rounded-2xl glass-panel flex flex-col overflow-hidden transition-all duration-300 hover:border-teal-400/60 hover:-translate-y-2 group">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-mono-code font-semibold text-teal-400 tracking-wider">{p.label}</span>
                  <span className="text-xs font-mono-code bg-teal-950/80 text-teal-300 px-2.5 py-0.5 rounded border border-teal-800">
                    {p.weight}
                  </span>
                </div>
                <h3 className="font-serif-title text-xl font-bold text-white mb-3 group-hover:text-teal-200 transition-colors">
                  {p.title}
                </h3>
                <div className="space-y-2 mb-4 p-3 rounded-xl bg-slate-900/60 border border-teal-900/40">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{p.sub1}</span>
                    <strong className="text-teal-300 font-mono-code">{p.sub1w}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>{p.sub2}</span>
                    <strong className="text-teal-300 font-mono-code">{p.sub2w}</strong>
                  </div>
                </div>
                <p className="text-xs text-slate-300/80 leading-relaxed mb-6">{p.desc}</p>
                <div className="mt-auto h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent transform origin-left transition-transform duration-500 group-hover:scale-x-110" />
              </article>
            ))}
          </div>

          <div className="p-6 md:p-8 rounded-2xl glass-panel border-l-8 border-l-rose-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 hover:border-rose-400/60">
            <div className="flex items-start gap-4">
              <div className="w-3.5 h-3.5 mt-1 flex-shrink-0 rounded-full bg-rose-500 animate-pulse" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono-code uppercase font-bold text-rose-400">
                    High-Risk Threshold Protocol
                  </span>
                  <span className="text-[10px] font-mono-code bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                    INDEX ≥ 0.55
                  </span>
                </div>
                <h4 className="font-serif-title text-lg text-white font-bold mb-1">
                  Automated Sampling Dispatch &amp; Vector Control Notice
                </h4>
                <p className="text-xs text-slate-300/80 max-w-2xl leading-relaxed">
                  When composite risk reaches 0.55, automated notifications queue physical sampling verification
                  and prepare vector notices for public health officers.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2"
                onClick={() => onToast?.("Field sampling dispatched across monitored basin")}
              >
                <span>🚨</span>
                <span>Dispatch Field Team</span>
              </button>
              <a
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-teal-300 font-mono-code text-xs transition-all flex items-center justify-center"
                href={API.fhirUrl?.(visibleSites[activeSite]?.latest_observation_id) || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                Export FHIR Bundle
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          04 / TRACEABLE ARCHITECTURE
          ============================================================ */}
      <section className="relative z-10 px-6 md:px-14 py-20 border-t border-teal-950/70 bg-[#05100e]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono-code text-teal-400 uppercase tracking-widest mb-4">
            <span>04 / AUDITABLE DATA-TO-INSIGHT ENGINE</span>
            <span className="w-12 h-px bg-teal-500/30" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end mb-12">
            <h2 className="font-serif-title text-3xl sm:text-4xl text-white font-bold tracking-tight">
              From a citizen drop<br />
              <em className="text-teal-300 italic font-normal">to clinical interoperability.</em>
            </h2>
            <p className="text-sm sm:text-base text-slate-300/80 max-w-xl">
              Nine distinct persisted stages ensure every insight is completely reproducible, auditable, and
              ready for multi-sectoral health authority uptake.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-6 mb-10 scrollbar-none">
            {PIPELINE.map((n) => (
              <div key={n.step} className="pipeline-step-node" onClick={() => onToast?.(`Inspecting ${n.title}…`)}>
                <span className="font-mono-code text-[10px] text-teal-400 font-bold block mb-1">{n.step}</span>
                <strong className="text-xs text-white block mb-0.5">{n.title}</strong>
                <small className="text-[11px] text-slate-400 block">{n.sub}</small>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {WEIGHTS.map((w) => (
              <div key={w.title} className="p-5 rounded-2xl glass-panel hover:border-teal-400/50 transition-all hover:-translate-y-0.5">
                <div className="flex justify-between items-baseline mb-2">
                  <strong className="text-sm font-semibold text-white">{w.title}</strong>
                  <span className="font-serif-title text-xl font-bold text-teal-300">{w.weight}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-mono-code text-slate-400 uppercase mr-2">Classification Bands:</span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 transition-all hover:bg-emerald-500/20">
              0.00 — 0.24 · Low Risk
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 transition-all hover:bg-yellow-500/20">
              0.25 — 0.54 · Moderate Risk
            </span>
            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 transition-all hover:bg-rose-500/20">
              0.55 — 1.00 · High Risk / Action Required
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================
          05 / FINALE
          ============================================================ */}
      <section className="relative z-10 px-6 md:px-14 py-24 border-t border-teal-950/70 bg-[#071311]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative w-full aspect-square max-w-[480px] mx-auto rounded-3xl overflow-hidden glass-panel group">
            <img
              src="/videos/images.jpg"
              alt="Underwater octopus — indicator of aquatic ecosystem health"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute left-5 bottom-5 px-3 py-2 rounded-xl bg-slate-950/80 border border-teal-500/30 backdrop-blur-md pointer-events-none transition-transform group-hover:scale-105">
              <span className="block text-xs font-mono-code font-semibold text-teal-300">
                Bio-Sentinel
              </span>
              <small className="text-[10px] text-slate-400">
                Octopus · sentinel of aquatic ecosystem health
              </small>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-mono-code text-teal-400 uppercase tracking-widest mb-4">
              <span>05 / OPEN REPRODUCIBLE SCIENCE</span>
              <span className="w-12 h-px bg-teal-500/30" />
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight mb-6">
              Make the invisible<br />
              <em className="text-teal-300 italic font-normal">empirically actionable.</em>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-xl">
              Explore FHIR-native health bundles, export calibrated citizen datasets for hydrological modeling,
              or navigate to individual catchment segments for full causal drill-down.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                className="px-6 py-3.5 rounded-full bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold text-sm shadow-xl shadow-teal-500/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                onClick={() => onNavigate("cards")}
              >
                <span>Explore Catchment Cards</span>
                <span>↗</span>
              </button>
              <a
                className="px-5 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-teal-500/30 text-teal-200 hover:text-white font-medium text-sm transition-all flex items-center gap-2"
                href="/api/export/csv"
                download
              >
                <span>Download Research CSV</span>
                <span className="text-xs text-teal-400">↓</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}