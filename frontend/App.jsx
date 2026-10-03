import { useCallback, useEffect, useState } from "react";
import { API } from "./lib/api.js";
import { LANGUAGES, t, prepareDynamicTranslator } from "./lib/i18n.js";
import { useLang } from "./lib/LangContext.jsx";

import Dashboard   from "./pages/DashboardPage.jsx";
import ImpactCards from "./pages/CardsPage.jsx";
import Trends      from "./pages/TrendsPage.jsx";
import OneHealth   from "./pages/OneHealthPage.jsx";
import MapPage     from "./pages/MapPage.jsx";
import Overview    from "./pages/OverviewPage.jsx";
import AuditTrail  from "./pages/AuditTrail.jsx";
import ConnectivityStatus from "./components/ConnectivityStatus.jsx";
import ObservationCapture from "./components/ObservationCapture.jsx";

const TABS = [
  { id: "overview",  key: "nav.overview" },
  { id: "cards",     key: "nav.cards" },
  { id: "audit",     key: "nav.audit" },
  { id: "trends",    key: "nav.trends" },
  { id: "onehealth", key: "nav.onehealth" },
  { id: "dashboard", key: "nav.dashboard" },
  { id: "map",       key: "nav.map" },
];

const ROUTES = {
  overview:  "/overview",
  cards:     "/cards",
  audit:     "/audit",
  trends:    "/trends",
  onehealth: "/onehealth",
  dashboard: "/dashboard",
  map:       "/map",
};

function viewFromPath(pathname) {
  const clean = (pathname || "/").replace(/\/$/, "") || "/";
  const found = Object.entries(ROUTES).find(([, p]) => p === clean);
  return found ? found[0] : "dashboard";
}

export default function App() {
  const { lang, set: setLang } = useLang();
  const [view, setView]       = useState(() => viewFromPath(window.location.pathname));
  const [sites, setSites]     = useState([]);
  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState([]);
  const [theme, setTheme]     = useState(() =>
    document.documentElement.getAttribute("data-theme") || "dark"
  );
  const [notice, setNotice]   = useState("");
  const [loadError, setLoadError] = useState("");
  const [rerunning, setRerunning] = useState(false);
  const [toasts, setToasts]   = useState([]);
  const [captureOpen, setCaptureOpen] = useState(false);

  const tr = useCallback((k, vars) => t(lang, k, vars), [lang]);

  const showToast = useCallback((msg) => {
    const id = Date.now() + Math.random();
    setToasts((arr) => [...arr, { id, msg }]);
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), 3500);
  }, []);

  const navigate = useCallback((next) => {
    const p = ROUTES[next];
    if (p && window.location.pathname !== p) window.history.pushState({}, "", p);
    setView(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const load = useCallback(async () => {
    try {
      setLoadError("");
      const [s, sum, ins] = await Promise.all([API.sites(), API.summary(), API.insights()]);
      setSites(Array.isArray(s) ? s : []);
      setSummary(sum || null);
      setInsights(Array.isArray(ins) ? ins : []);
    } catch (e) {
      console.warn("OneHealth Lens API load failed", e);
      setLoadError("Unable to load live dashboard data. Check the API connection and retry.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const onPop = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ohl-theme", theme);
  }, [theme]);

  const handleLangChange = async (code) => {
    setLang(code);
    if (code !== "en") {
      const ok = await prepareDynamicTranslator(code);
      if (ok) showToast(`${code.toUpperCase()} translator ready`);
    }
  };

  const handleRerun = async () => {
    setRerunning(true);
    try {
      await API.rerun();
      await load();
      setNotice("✓ Ingestion & Outlier Validation Pipeline executed successfully across 7 segments!");
      setTimeout(() => setNotice(""), 6000);
    } catch (e) {
      setNotice(`Error: ${e.message}`);
    } finally {
      setRerunning(false);
    }
  };

  return (
    <div className="selection:bg-teal-500/20 selection:text-teal-300">
      {/* ============ TOPBAR (exact from design) ============ */}
      {loadError && (
        <div role="alert" className="fixed top-20 right-4 z-[60] max-w-sm rounded-xl border border-rose-400/40 bg-rose-950/90 px-4 py-3 text-sm text-rose-100 shadow-xl">
          {loadError}
          <button type="button" className="ml-3 underline" onClick={load}>Retry</button>
        </div>
      )}
      <header className="sticky top-0 z-50 glass-panel border-b border-[var(--border-line)] px-4 lg:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Kicker */}
          <button
            className="flex items-center gap-3.5 bg-transparent border-0 text-left"
            onClick={() => navigate("dashboard")}
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-white shadow-inner" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--bg)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif-title font-bold tracking-tight text-lg text-[var(--ink)]">OneHealth Lens</span>
                <span className="font-mono-code text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Track 2
                </span>
              </div>
              <p className="text-[11px] text-[var(--ink-dim)] hidden sm:block tracking-wide">
                Citizen Stream Telemetry to Explainable Clinical FHIR Action
              </p>
            </div>
          </button>

          {/* Navigation Views */}
          <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/20 border border-[var(--border-line)] text-xs font-medium">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                className={`px-3.5 py-1.5 rounded-xl transition-all ${
                  view === tb.id
                    ? "bg-teal-500/20 text-teal-300 border border-teal-400/30 font-semibold shadow-sm"
                    : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                }`}
                onClick={() => navigate(tb.id)}
              >
                {tr(tb.key)}
              </button>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-2.5">
            <ConnectivityStatus />
            <button
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold items-center gap-2 transition-all"
              onClick={() => setCaptureOpen(true)}
            >
              <span className="material-symbols-outlined text-base">add_location_alt</span>
              <span>{tr("capture.button")}</span>
            </button>
            <div className="flex items-center p-1 rounded-xl bg-black/20 border border-[var(--border-line)] text-xs font-mono-code">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLangChange(l.code)}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                    lang === l.code
                      ? "bg-teal-500/20 text-teal-300 font-semibold"
                      : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span className="hidden sm:inline">{l.code.toUpperCase()}</span>
                </button>
              ))}
            </div>

            <button
              className="flex items-center justify-center w-9 h-9 rounded-xl glass-panel text-[var(--ink)] hover:border-teal-400/50 hover:text-teal-300 transition-all"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              title="Toggle Light / Dark Mode"
            >
              <span className="material-symbols-outlined text-base">
                {theme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            <button
              className="px-3.5 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm disabled:opacity-60"
              onClick={handleRerun}
              disabled={rerunning}
            >
              <span className={`material-symbols-outlined text-base ${rerunning ? "animate-spin" : ""}`}>refresh</span>
              <span>{rerunning ? tr("ctrl.running") : tr("ctrl.rerun")}</span>
            </button>

            <a
              className="hidden md:flex px-3 py-1.5 rounded-xl glass-panel text-[var(--ink-dim)] hover:text-teal-300 text-xs font-mono-code items-center gap-1.5 transition-all"
              href={API.csvUrl()}
              download
              onClick={() => showToast("CSV download started")}
            >
              <span className="material-symbols-outlined text-base text-teal-400">download</span>
              <span>{tr("ctrl.csv")}</span>
            </a>
          </div>
        </div>
      </header>

      {/* ============ NOTICE BAR ============ */}
      {notice && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{notice}</span>
          </div>
          <button className="hover:text-emerald-100 text-emerald-400 font-mono-code" onClick={() => setNotice("")}>✕ Dismiss</button>
        </div>
      )}

      {/* ============ PAGE ============ */}
      {view === "overview"  && <Overview  sites={sites} summary={summary} onNavigate={navigate} onToast={showToast} />}
      {view === "cards"     && <ImpactCards sites={sites} onToast={showToast} />}
      {view === "audit"     && <AuditTrail sites={sites} onToast={showToast} />}
      {view === "trends"    && <Trends    sites={sites} insights={insights} />}
      {view === "onehealth" && <OneHealth sites={sites} onToast={showToast} />}
      {view === "dashboard" && <Dashboard sites={sites} onNavigate={navigate} onToast={showToast} />}
      {view === "map"       && <MapPage   sites={sites} onNavigate={navigate} onToast={showToast} />}
      {captureOpen && (
        <ObservationCapture
          onClose={() => setCaptureOpen(false)}
          onComplete={() => { load(); showToast(tr("capture.synced")); }}
        />
      )}

      {/* ============ TOASTS ============ */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 pointer-events-none">
        {toasts.map((tt) => (
          <div
            key={tt.id}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-teal-950/95 text-teal-100 shadow-2xl backdrop-blur-xl border border-teal-500/30 font-mono-code text-xs"
          >
            <span className="material-symbols-outlined text-base text-teal-400">check_circle</span>
            <span>{tt.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}