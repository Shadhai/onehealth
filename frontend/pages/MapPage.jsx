// // import { useEffect, useMemo, useRef, useState } from "react";
// // import L from "leaflet";
// // import "leaflet/dist/leaflet.css";
// // import { levelClass, levelText } from "../lib.js";

// // const DEFAULT_CENTER = [59.9139, 10.7522];

// // function riskColor(level) {
// //   const value = String(level ?? "").toLowerCase();
// //   if (value === "high") return "#c7463f";
// //   if (value === "moderate") return "#b47700";
// //   return "#237d52";
// // }

// // function normalizeRisk(level) {
// //   const value = String(level ?? "").trim().toLowerCase();
// //   if (value === "high") return "High";
// //   if (value === "moderate") return "Moderate";
// //   if (value === "low") return "Low";
// //   return "";
// // }

// // function validCoordinates(site) {
// //   const lat = Number(site?.latitude);
// //   const lng = Number(site?.longitude);
// //   return (
// //     Number.isFinite(lat) &&
// //     Number.isFinite(lng) &&
// //     lat >= -90 &&
// //     lat <= 90 &&
// //     lng >= -180 &&
// //     lng <= 180
// //   );
// // }

// // function escapeHtml(value) {
// //   return String(value ?? "")
// //     .replaceAll("&", "&amp;")
// //     .replaceAll("<", "&lt;")
// //     .replaceAll(">", "&gt;")
// //     .replaceAll('"', "&quot;")
// //     .replaceAll("'", "&#039;");
// // }

// // export default function MapPage({ sites = [], onSelectSite }) {
// //   const mapNodeRef = useRef(null);
// //   const mapRef = useRef(null);
// //   const markerLayerRef = useRef(null);

// //   const [risk, setRisk] = useState("all");
// //   const [mapError, setMapError] = useState(null);

// //   // Stable list of points so the marker effect only reruns when the
// //   // filtered set actually changes.
// //   const points = useMemo(() => {
// //     return sites.filter((site) => {
// //       if (!validCoordinates(site)) return false;
// //       if (risk === "all") return true;
// //       return normalizeRisk(site.latest_risk_level) === risk;
// //     });
// //   }, [sites, risk]);

// //   // Create map once on mount.
// //   useEffect(() => {
// //     const node = mapNodeRef.current;
// //     if (!node) return undefined;
// //     if (mapRef.current) return undefined;

// //     try {
// //       const map = L.map(node, {
// //         center: DEFAULT_CENTER,
// //         zoom: 12,
// //         zoomControl: true,
// //       });

// //       L.tileLayer(
// //         "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
// //         {
// //           attribution: "&copy; OpenStreetMap contributors",
// //           maxZoom: 19,
// //         }
// //       ).addTo(map);

// //       L.control.scale({ imperial: false }).addTo(map);

// //       const markerLayer = L.layerGroup().addTo(map);

// //       mapRef.current = map;
// //       markerLayerRef.current = markerLayer;

// //       // Leaflet needs a nudge once the container has real dimensions.
// //       setTimeout(() => map.invalidateSize(), 100);
// //       setTimeout(() => map.invalidateSize(), 500);
// //     } catch (error) {
// //       setMapError(error.message);
// //     }

// //     return () => {
// //       if (mapRef.current) {
// //         mapRef.current.remove();
// //         mapRef.current = null;
// //       }
// //       markerLayerRef.current = null;
// //     };
// //   }, []);

// //   // Redraw markers when the filtered points change.
// //   useEffect(() => {
// //     const map = mapRef.current;
// //     const layer = markerLayerRef.current;
// //     if (!map || !layer) return;

// //     layer.clearLayers();

// //     if (!points.length) {
// //       map.setView(DEFAULT_CENTER, 12);
// //       return;
// //     }

// //     const maxObservations = Math.max(
// //       1,
// //       ...points.map((site) => Number(site.observation_count || 0))
// //     );

// //     const bounds = [];

// //     points.forEach((site) => {
// //       const lat = Number(site.latitude);
// //       const lng = Number(site.longitude);
// //       if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

// //       bounds.push([lat, lng]);

// //       const observations = Number(site.observation_count || 0);
// //       const radius =
// //         8 + 12 * Math.sqrt(observations / maxObservations);

// //       const marker = L.circleMarker([lat, lng], {
// //         radius,
// //         color: "#ffffff",
// //         weight: 2,
// //         fillColor: riskColor(site.latest_risk_level),
// //         fillOpacity: 0.9,
// //       });

// //       marker.bindPopup(`
// //         <strong>${escapeHtml(site.site)}</strong><br>
// //         ${escapeHtml(levelText(site.latest_risk_level))}
// //         · ${Number(site.latest_risk_index ?? 0).toFixed(2)}<br>
// //         ${observations} observations
// //         · ${Number(site.flagged_observation_count || 0)} flagged
// //       `);

// //       marker.on("click", () => onSelectSite?.(site));
// //       marker.addTo(layer);
// //     });

// //     if (bounds.length === 1) {
// //       map.setView(bounds[0], 15);
// //     } else if (bounds.length > 1) {
// //       map.fitBounds(L.latLngBounds(bounds), {
// //         padding: [50, 50],
// //         maxZoom: 15,
// //       });
// //     }

// //     setTimeout(() => map.invalidateSize(), 100);
// //   }, [points, onSelectSite]);

// //   return (
// //     <div className="map-page">
// //       <div className="map-head">
// //         <div>
// //           <h2 className="map-heading">Monitoring sites</h2>
// //           <p className="muted small">
// //             {points.length} of {sites.length} sites have valid coordinates.
// //           </p>
// //         </div>

// //         <div className="map-controls">
// //           <label className="map-filter">
// //             Risk level
// //             <select
// //               value={risk}
// //               onChange={(event) => setRisk(event.target.value)}
// //             >
// //               <option value="all">All</option>
// //               <option value="High">High</option>
// //               <option value="Moderate">Moderate</option>
// //               <option value="Low">Low</option>
// //             </select>
// //           </label>
// //         </div>
// //       </div>

// //       {mapError && (
// //         <div
// //           style={{
// //             padding: "12px",
// //             marginBottom: "12px",
// //             background: "#f9dfdc",
// //             color: "#b33b35",
// //             borderRadius: "8px",
// //             fontFamily: "system-ui, sans-serif",
// //           }}
// //         >
// //           <strong>Leaflet error:</strong> {mapError}
// //         </div>
// //       )}

// //       <div className="map-panel">
// //         <div
// //           ref={mapNodeRef}
// //           className="leaflet-map"
// //           style={{
// //             width: "100%",
// //             height: "600px",
// //             minHeight: "420px",
// //             background: "#d7e2df",
// //           }}
// //         />

// //         <div className="map-legend">
// //           <strong>Risk level</strong>
// //           {["High", "Moderate", "Low"].map((level) => (
// //             <span key={level}>
// //               <i className={`legend-dot ${levelClass(level)}`} />
// //               {level}
// //             </span>
// //           ))}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
// import { useEffect, useMemo, useRef, useState } from "react";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";
// import { useLang } from "../lib/LangContext.jsx";
// import { t } from "../lib/i18n.js";

// const DEFAULT_CENTER = [59.9139, 10.7522];

// function levelClass(level) {
//   if (level === "High") return "red";
//   if (level === "Moderate") return "yellow";
//   return "green";
// }

// function levelKey(level) {
//   if (level === "High") return "risk.high";
//   if (level === "Moderate") return "risk.moderate";
//   return "risk.low";
// }

// function riskColor(level) {
//   const v = String(level ?? "").toLowerCase();
//   if (v === "high") return "#c7463f";
//   if (v === "moderate") return "#b47700";
//   return "#237d52";
// }

// function normalizeRisk(level) {
//   const v = String(level ?? "").trim().toLowerCase();
//   if (v === "high") return "High";
//   if (v === "moderate") return "Moderate";
//   if (v === "low") return "Low";
//   return "";
// }

// function validCoordinates(site) {
//   const lat = Number(site?.latitude);
//   const lng = Number(site?.longitude);
//   return (
//     Number.isFinite(lat) && Number.isFinite(lng) &&
//     lat >= -90 && lat <= 90 &&
//     lng >= -180 && lng <= 180
//   );
// }

// function escapeHtml(value) {
//   return String(value ?? "")
//     .replaceAll("&", "&amp;")
//     .replaceAll("<", "&lt;")
//     .replaceAll(">", "&gt;")
//     .replaceAll('"', "&quot;")
//     .replaceAll("'", "&#039;");
// }

// export default function MapPage({ sites = [], onSelectSite }) {
//   const { lang } = useLang();
//   const tr = (k, v) => t(lang, k, v);

//   const mapNodeRef = useRef(null);
//   const mapRef = useRef(null);
//   const markerLayerRef = useRef(null);
//   const popupHandlerRef = useRef(null);

//   const [risk, setRisk] = useState("all");
//   const [mapError, setMapError] = useState(null);

//   const points = useMemo(() => {
//     return sites.filter((site) => {
//       if (!validCoordinates(site)) return false;
//       if (risk === "all") return true;
//       return normalizeRisk(site.latest_risk_level) === risk;
//     });
//   }, [sites, risk]);

//   useEffect(() => {
//     const node = mapNodeRef.current;
//     if (!node || mapRef.current) return undefined;

//     try {
//       const map = L.map(node, { center: DEFAULT_CENTER, zoom: 12, zoomControl: true });

//       L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//         attribution: "&copy; OpenStreetMap contributors",
//         maxZoom: 19,
//       }).addTo(map);

//       L.control.scale({ imperial: false }).addTo(map);

//       const markerLayer = L.layerGroup().addTo(map);
//       mapRef.current = map;
//       markerLayerRef.current = markerLayer;

//       setTimeout(() => map.invalidateSize(), 100);
//       setTimeout(() => map.invalidateSize(), 500);
//     } catch (error) {
//       setMapError(error.message);
//     }

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//         mapRef.current = null;
//       }
//       markerLayerRef.current = null;
//     };
//   }, []);

//   useEffect(() => {
//     const map = mapRef.current;
//     const layer = markerLayerRef.current;
//     if (!map || !layer) return;

//     layer.clearLayers();

//     if (!points.length) {
//       map.setView(DEFAULT_CENTER, 12);
//       return;
//     }

//     const maxObs = Math.max(1, ...points.map((s) => Number(s.observation_count || 0)));
//     const bounds = [];

//     points.forEach((site) => {
//       const lat = Number(site.latitude);
//       const lng = Number(site.longitude);
//       if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

//       bounds.push([lat, lng]);

//       const obs = Number(site.observation_count || 0);
//       const radius = 8 + 12 * Math.sqrt(obs / maxObs);

//       const marker = L.circleMarker([lat, lng], {
//         radius,
//         color: "#ffffff",
//         weight: 2,
//         fillColor: riskColor(site.latest_risk_level),
//         fillOpacity: 0.9,
//       });

//       const riskLabel = tr(levelKey(site.latest_risk_level));

//       marker.bindPopup(`
//         <strong>${escapeHtml(site.site)}</strong><br>
//         ${escapeHtml(riskLabel)}
//         · ${Number(site.latest_risk_index ?? 0).toFixed(2)}<br>
//         ${obs} ${tr("dash.colObservations").toLowerCase()}
//         · ${Number(site.flagged_observation_count || 0)} ${tr("dash.flags").toLowerCase()}
//         <br>
//         <button class="leaflet-view-card" data-site="${escapeHtml(site.site)}">
//           ${escapeHtml(tr("map.viewCard"))} →
//         </button>
//       `);

//       marker.on("popupopen", (e) => {
//         const btn = e.popup.getElement()?.querySelector(".leaflet-view-card");
//         if (!btn) return;
//         const handler = () => onSelectSite?.(site);
//         btn.addEventListener("click", handler);
//         popupHandlerRef.current = { btn, handler };
//       });

//       marker.addTo(layer);
//     });

//     if (bounds.length === 1) map.setView(bounds[0], 15);
//     else if (bounds.length > 1) {
//       map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 15 });
//     }

//     setTimeout(() => map.invalidateSize(), 100);
//   }, [points, onSelectSite, lang]);

//   return (
//     <div className="map-page">
//       <div className="map-head">
//         <div>
//           <h2 className="map-heading">{tr("map.heading")}</h2>
//           <p className="muted small">{tr("map.subtitle")}</p>
//         </div>
//         <div className="map-controls">
//           <label className="map-filter">
//             {tr("map.legend")}
//             <select value={risk} onChange={(e) => setRisk(e.target.value)}>
//               <option value="all">{tr("map.filterAll")}</option>
//               <option value="High">{tr("map.filterHigh")}</option>
//               <option value="Moderate">{tr("map.filterModerate")}</option>
//               <option value="Low">{tr("map.filterLow")}</option>
//             </select>
//           </label>
//         </div>
//       </div>

//       {mapError && (
//         <div className="map-error">
//           <strong>Leaflet error:</strong> {mapError}
//         </div>
//       )}

//       <div className="map-panel">
//         <div ref={mapNodeRef} className="leaflet-map" />
//         <div className="map-legend">
//           <strong>{tr("map.legend")}</strong>
//           {["High", "Moderate", "Low"].map((level) => (
//             <span key={level}>
//               <i className={`legend-dot ${levelClass(level)}`} />
//               {tr(levelKey(level))}
//             </span>
//           ))}
//         </div>
//       </div>

//       <p className="muted small">
//         {tr("map.count", { shown: points.length, total: sites.length })}
//       </p>
//     </div>
//   );
// }
import { useEffect, useMemo, useState } from "react";
import { API, levelClass, levelText } from "../lib/api.js";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

const ESRI_SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

function SatelliteMapControls({ center }) {
  const map = useMap();

  return (
    <div className="absolute top-5 right-5 flex flex-col gap-2.5 z-[1000]">
      <div className="flex flex-col rounded-2xl bg-neutral-900/90 backdrop-blur-md shadow-xl p-1 border border-[var(--border-line)]">
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors" title="Zoom In" onClick={() => map.zoomIn()}>
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors" title="Zoom Out" onClick={() => map.zoomOut()}>
          <span className="material-symbols-outlined text-lg">remove</span>
        </button>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-teal-300 transition-colors" title="Reset" onClick={() => map.setView(center, 12)}>
          <span className="material-symbols-outlined text-base">crop_free</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Map page — Basin GIS network with three switchable views:
  Standard (default), Satellite (Esri imagery), Heatmap (risk density)
   ============================================================ */

export default function MapPage({ sites = [], onNavigate, onToast }) {
  const [selected, setSelected] = useState(null);
  const [riskFilter, setRiskFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("standard"); // standard | satellite | heatmap

  const visible = useMemo(() => {
    return sites.filter((s) => {
      if (!Number.isFinite(Number(s.latitude))) return false;
      if (riskFilter !== "all" && s.latest_risk_level !== riskFilter) return false;
      if (search && !s.site.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sites, riskFilter, search]);

  useEffect(() => {
    if (!selected && visible.length) setSelected(visible[0]);
  }, [visible, selected]);

  const bbox = useMemo(() => {
    if (!visible.length) return { minLat: 59.9, maxLat: 59.95, minLng: 10.69, maxLng: 10.79 };
    const lats = visible.map((s) => Number(s.latitude));
    const lngs = visible.map((s) => Number(s.longitude));
    return {
      minLat: Math.min(...lats), maxLat: Math.max(...lats),
      minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
    };
  }, [visible]);

  const project = (lat, lng) => {
    const dLat = (bbox.maxLat - bbox.minLat) || 0.001;
    const dLng = (bbox.maxLng - bbox.minLng) || 0.001;
    return {
      x: 12 + ((lng - bbox.minLng) / dLng) * 76,
      y: 12 + ((bbox.maxLat - lat) / dLat) * 76,
    };
  };

  const maxObs = Math.max(1, ...visible.map((s) => s.observation_count || 0));

  const mapCenter = useMemo(() => {
    if (!visible.length) return [59.9139, 10.7522];
    const latitude = visible.map((s) => Number(s.latitude));
    const longitude = visible.map((s) => Number(s.longitude));
    return [
      latitude.reduce((sum, value) => sum + value, 0) / latitude.length,
      longitude.reduce((sum, value) => sum + value, 0) / longitude.length,
    ];
  }, [visible]);

  /* ---------- Background layers per view ---------- */

  // Standard: the base grid + green-tinted background
  const standardBg = {
    backgroundImage: `
      radial-gradient(1200px 700px at 30% 30%, rgba(15, 118, 110, 0.15), transparent 60%),
      radial-gradient(900px 500px at 80% 70%, rgba(45, 212, 191, 0.08), transparent 55%),
      linear-gradient(180deg, #071311 0%, #05100e 100%)
    `,
  };

  // Fallback background visible while the satellite tiles load.
  const satelliteBg = {
    backgroundImage: `
      radial-gradient(circle at 20% 25%, rgba(101, 67, 33, 0.35), transparent 45%),
      radial-gradient(circle at 75% 40%, rgba(34, 87, 55, 0.5), transparent 50%),
      radial-gradient(circle at 55% 75%, rgba(80, 120, 70, 0.4), transparent 45%),
      radial-gradient(circle at 15% 80%, rgba(60, 40, 20, 0.5), transparent 40%),
      linear-gradient(135deg, #1a2418 0%, #0f1a12 50%, #0a1410 100%)
    `,
  };

  // Heatmap: strong red/orange/yellow gradients to visualise risk concentration
  const heatmapBg = {
    backgroundImage: `
      radial-gradient(circle at 30% 40%, rgba(220, 38, 38, 0.55), transparent 30%),
      radial-gradient(circle at 70% 55%, rgba(250, 204, 21, 0.4), transparent 30%),
      radial-gradient(circle at 50% 25%, rgba(248, 113, 113, 0.35), transparent 28%),
      radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.3), transparent 32%),
      radial-gradient(circle at 80% 20%, rgba(248, 113, 113, 0.3), transparent 25%),
      linear-gradient(180deg, #071311 0%, #05100e 100%)
    `,
  };

  const bgStyle =
    view === "satellite" ? satelliteBg :
    view === "heatmap" ? heatmapBg :
    standardBg;

  /* ---------- Stream path colours per view ---------- */
  const streamOpacity = view === "satellite" ? 0.5 : view === "heatmap" ? 0.25 : 0.9;
  const gridOpacity = view === "satellite" ? 0.15 : view === "heatmap" ? 0.1 : 0.4;

  return (
    <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide bg-teal-500/10 text-teal-300">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
              GEOSPATIAL TELEMETRY LAYER · EPSG:4326
            </span>
            <span className="text-xs text-[var(--ink-dim)] font-mono">Synced 4m ago</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--ink)] font-serif-title">
            Catchment Spatial Monitoring & Basin GIS Network
          </h1>
          <p className="text-sm text-[var(--ink-dim)] max-w-3xl mt-1">
            Interactive geospatial distribution across monitored basin. Circle marker size denotes observation
            volume; color indicates composite One Health risk index.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto font-mono text-xs">
          <div className="px-3 py-2 rounded-xl bg-neutral-900/80 shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[var(--ink-dim)]">High:</span>
            <span className="text-[var(--ink)] font-semibold">
              {sites.filter((s) => s.latest_risk_level === "High").length}
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-neutral-900/80 shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[var(--ink-dim)]">Mod:</span>
            <span className="text-[var(--ink)] font-semibold">
              {sites.filter((s) => s.latest_risk_level === "Moderate").length}
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-neutral-900/80 shadow-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[var(--ink-dim)]">Low:</span>
            <span className="text-[var(--ink)] font-semibold">
              {sites.filter((s) => s.latest_risk_level === "Low").length}
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-teal-950/60 text-teal-300 shadow-md font-semibold">
            {sites.reduce((sum, s) => sum + (s.observation_count || 0), 0)} Obs
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 shadow-xl backdrop-blur-md flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { k: "all", label: `All (${sites.length})`, cls: "bg-teal-500/20 text-teal-300" },
            { k: "High", label: `High (${sites.filter((s) => s.latest_risk_level === "High").length})`, cls: "text-rose-300 hover:bg-rose-500/10" },
            { k: "Moderate", label: `Moderate (${sites.filter((s) => s.latest_risk_level === "Moderate").length})`, cls: "text-amber-300 hover:bg-amber-500/10" },
            { k: "Low", label: `Low (${sites.filter((s) => s.latest_risk_level === "Low").length})`, cls: "text-emerald-300 hover:bg-emerald-500/10" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setRiskFilter(f.k)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                riskFilter === f.k ? f.cls + " shadow-sm" : "text-[var(--ink-dim)] " + f.cls
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-dim)] text-lg">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coordinates, site name, or milestone ID…"
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-neutral-950/70 text-neutral-200 placeholder-neutral-500 shadow-inner focus:outline-none focus:ring-1 focus:ring-teal-400 transition-all"
          />
        </div>

        {/* View switcher — now actually changes the map */}
        <div className="flex items-center p-1 rounded-xl bg-neutral-950 text-xs font-mono">
          {["standard", "satellite", "heatmap"].map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                onToast?.(`View: ${v.charAt(0).toUpperCase() + v.slice(1)}`);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all capitalize ${
                view === v
                  ? "bg-teal-500/20 text-teal-300 font-semibold shadow-sm"
                  : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Map viewport */}
      <div
        className="relative w-full h-[680px] rounded-3xl overflow-hidden shadow-2xl select-none border border-[var(--border-line)] transition-all duration-500"
        style={bgStyle}
      >
        {view === "satellite" && (
          <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="absolute inset-0 z-0" style={{ height: "100%", width: "100%" }}>
            <TileLayer url={ESRI_SATELLITE_TILE_URL} attribution="Tiles &copy; Esri" maxZoom={19} />
            {visible.map((site) => {
              const riskClass = levelClass(site.latest_risk_level);
              const color = riskClass === "red" ? "#f87171" : riskClass === "yellow" ? "#facc15" : "#34d399";
              const observations = Number(site.observation_count || 0);
              const radius = 6 + Math.sqrt(observations / maxObs) * 14;
              return (
                <CircleMarker
                  key={site.site}
                  center={[Number(site.latitude), Number(site.longitude)]}
                  radius={radius}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.8, weight: 2 }}
                  eventHandlers={{ click: () => setSelected(site) }}
                >
                  <Popup>
                    <strong>{site.site}</strong>
                    <br />
                    {levelText(site.latest_risk_level)} · {Number(site.latest_risk_index || 0).toFixed(2)}
                    <br />
                    {observations} observations
                  </Popup>
                </CircleMarker>
              );
            })}
            <SatelliteMapControls center={mapCenter} />
          </MapContainer>
        )}

        {view !== "satellite" && (
          <>
        {/* Grid overlay — dimmed in satellite/heatmap views */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            opacity: gridOpacity,
            backgroundImage:
              "radial-gradient(rgba(45, 212, 191, 0.12) 1px, transparent 1px), linear-gradient(to right, rgba(13, 148, 136, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(13, 148, 136, 0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px, 96px 96px, 96px 96px",
          }}
        />

        {/* Satellite view: simulated aerial texture overlay */}
        {view === "satellite" && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              opacity: 0.35,
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(60,80,60,0.15) 0px, rgba(60,80,60,0.15) 2px, transparent 2px, transparent 8px), repeating-linear-gradient(-45deg, rgba(40,60,40,0.1) 0px, rgba(40,60,40,0.1) 3px, transparent 3px, transparent 12px)",
              mixBlendMode: "overlay",
            }}
          />
        )}

        {/* Heatmap view: temperature-style density overlay */}
        {view === "heatmap" && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-500"
            style={{
              opacity: 0.75,
              mixBlendMode: "screen",
              background: `
                radial-gradient(circle at 55% 35%, rgba(220, 38, 38, 0.4) 0%, transparent 25%),
                radial-gradient(circle at 30% 60%, rgba(250, 204, 21, 0.35) 0%, transparent 30%),
                radial-gradient(circle at 75% 70%, rgba(251, 146, 60, 0.3) 0%, transparent 28%),
                radial-gradient(circle at 20% 20%, rgba(52, 211, 153, 0.3) 0%, transparent 30%)
              `,
            }}
          />
        )}

        {/* Stream network */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          style={{ opacity: streamOpacity }}
        >
          <defs>
            <linearGradient id="streamGrad" x1="0%" x2="100%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#2dd4bf" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f766e" stopOpacity="0.9" />
            </linearGradient>
            <filter id="streamGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="bufferGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Topo contours — only in standard view */}
          {view === "standard" && (
            <g fill="none" opacity="0.35" stroke="#0f3d36" strokeWidth="1">
              <path d="M -50 120 Q 200 80, 450 160 T 950 120 T 1100 240" />
              <path d="M -50 220 Q 240 180, 520 280 T 1020 230" />
              <path d="M -50 340 Q 300 320, 600 420 T 1100 360" />
              <path d="M -50 490 Q 260 460, 540 560 T 1050 510" />
              <path d="M -50 620 Q 320 590, 700 640 T 1100 620" />
            </g>
          )}

          {/* Riparian buffer glow */}
          <g opacity={view === "heatmap" ? 0.1 : 0.35}>
            <path d="M 80 40 Q 230 180, 340 260 T 560 380 T 780 510 T 910 680"
              fill="none" filter="url(#bufferGlow)" stroke="#064e3b" strokeLinecap="round" strokeWidth="52" />
            <path d="M 680 70 Q 610 210, 560 380"
              fill="none" filter="url(#bufferGlow)" stroke="#064e3b" strokeLinecap="round" strokeWidth="36" />
            <path d="M 160 520 Q 330 460, 560 380"
              fill="none" filter="url(#bufferGlow)" stroke="#064e3b" strokeLinecap="round" strokeWidth="34" />
          </g>

          {/* Stream paths */}
          <path d="M 80 40 Q 230 180, 340 260 T 560 380 T 780 510 T 910 680"
            fill="none" filter="url(#streamGlow)" stroke="url(#streamGrad)" strokeLinecap="round" strokeWidth="10" />
          <path d="M 680 70 Q 610 210, 560 380"
            fill="none" filter="url(#streamGlow)" stroke="url(#streamGrad)" strokeLinecap="round" strokeWidth="6" />
          <path d="M 160 520 Q 330 460, 560 380"
            fill="none" filter="url(#streamGlow)" stroke="url(#streamGrad)" strokeLinecap="round" strokeWidth="5" />

          {/* Flow arrows */}
          <g fill="#2dd4bf" opacity={view === "heatmap" ? 0.3 : 0.8}>
            <polygon points="250,195 258,205 242,205" transform="rotate(35 250 200)" />
            <polygon points="620,240 628,250 612,250" transform="rotate(130 620 245)" />
            <polygon points="660,430 668,440 652,440" transform="rotate(50 660 435)" />
            <polygon points="840,580 848,590 832,590" transform="rotate(40 840 585)" />
          </g>

          {/* Runoff dashes */}
          <g fill="none" stroke="#f59e0b" strokeDasharray="4 4" strokeWidth="2" opacity={view === "standard" ? 0.6 : 0.2}>
            <path d="M 400 130 L 460 210" />
            <path d="M 760 300 L 690 350" />
            <path d="M 320 370 L 410 350" />
          </g>
        </svg>

        {/* Pins — dimmed slightly in satellite, kept full in heatmap */}
        {visible.map((s) => {
          const { x, y } = project(Number(s.latitude), Number(s.longitude));
          const cls = levelClass(s.latest_risk_level);
          const idx = Number(s.latest_risk_index || 0);
          const obs = s.observation_count || 0;
          const size = cls === "red" ? 52 : cls === "yellow" ? 44 : obs > maxObs * 0.6 ? 52 : 36;
          const bg = cls === "red"
            ? "linear-gradient(135deg, #dc2626, #f87171)"
            : cls === "yellow"
              ? "linear-gradient(135deg, #b45309, #facc15)"
              : "linear-gradient(135deg, #047857, #34d399)";
          const textColor = cls === "yellow" || cls === "green" ? "#0f172a" : "#fff";
          const isSelected = selected?.site === s.site;

          return (
            <button
              key={s.site}
              onClick={() => setSelected(s)}
              className="absolute cursor-pointer transition-transform hover:scale-110 z-10"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                opacity: view === "satellite" ? 0.85 : 1,
              }}
              aria-label={s.site}
            >
              {cls === "red" && (
                <span className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: -14,
                    background: "rgba(248, 113, 113, 0.25)",
                    animation: "mapPing 2s ease-out infinite",
                  }} />
              )}
              <span
                className="relative rounded-full flex items-center justify-center font-bold"
                style={{
                  width: size,
                  height: size,
                  background: bg,
                  color: textColor,
                  fontSize: size > 44 ? 13 : 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.5), 0 0 0 3px rgba(255,255,255,0.15) inset",
                  border: isSelected ? "2px solid #5eead4" : "none",
                }}
              >
                {obs}
              </span>
              {isSelected && (
                <span
                  className="absolute top-full left-1/2 -translate-x-1/2 whitespace-nowrap mt-2 px-2 py-0.5 rounded-md bg-black/85 text-[10px] font-mono text-[var(--ink)]"
                >
                  {s.site.replace("Riverdale Creek - ", "")}
                </span>
              )}
            </button>
          );
        })}
          </>
        )}

        {/* View badge — top-left */}
        <div className="absolute top-5 left-5 z-30 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-[var(--border-line)] flex items-center gap-2">
          <span className="material-symbols-outlined text-teal-400 text-base">
            {view === "satellite" ? "satellite_alt" : view === "heatmap" ? "local_fire_department" : "map"}
          </span>
          <span className="font-mono text-xs text-[var(--ink)] capitalize">{view} view</span>
        </div>

        {/* Zoom controls — top right */}
        <div className="absolute top-5 right-5 flex flex-col gap-2.5 z-30">
          <div className="flex flex-col rounded-2xl bg-neutral-900/90 backdrop-blur-md shadow-xl p-1 border border-[var(--border-line)]">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors" title="Zoom In">
              <span className="material-symbols-outlined text-lg">add</span>
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors" title="Zoom Out">
              <span className="material-symbols-outlined text-lg">remove</span>
            </button>
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-neutral-300 hover:bg-neutral-800 hover:text-teal-300 transition-colors" title="Reset">
              <span className="material-symbols-outlined text-base">crop_free</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-5 left-5 z-30 p-3.5 rounded-2xl bg-neutral-900/90 backdrop-blur-md shadow-xl max-w-xs text-xs border border-[var(--border-line)]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[var(--ink)] tracking-wide uppercase text-[10px] font-mono">
              One Health Index Legend
            </span>
            <span className="text-[10px] text-teal-400 font-mono">ISO 14044</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[var(--ink-dim)]">High Risk Priority</span>
              </div>
              <span className="text-rose-400 font-semibold">≥ 0.55</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[var(--ink-dim)]">Moderate Stress</span>
              </div>
              <span className="text-amber-400 font-semibold">0.25 - 0.54</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-[var(--ink-dim)]">Low Risk</span>
              </div>
              <span className="text-emerald-400 font-semibold">&lt; 0.25</span>
            </div>
          </div>
          <div className="pt-2.5 mt-2 border-t border-neutral-800 text-[10px] text-[var(--ink-dim)] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-teal-400">bubble_chart</span>
            <span>Pin Diameter ∝ Field Report Density</span>
          </div>
        </div>

        {/* Inspector */}
        {selected && (
          <div className="absolute bottom-5 right-5 z-30 w-80 sm:w-96 rounded-2xl bg-neutral-900/95 shadow-2xl backdrop-blur-xl p-4 border border-[var(--border-line)]">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  levelClass(selected.latest_risk_level) === "red"
                    ? "bg-rose-500"
                    : levelClass(selected.latest_risk_level) === "yellow"
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                }`} />
                <h3 className="font-bold text-sm text-[var(--ink)] truncate">
                  {selected.site.replace("Riverdale Creek - ", "")}
                </h3>
              </div>
              <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 ${
                levelClass(selected.latest_risk_level) === "red"
                  ? "bg-rose-500/20 text-rose-300"
                  : levelClass(selected.latest_risk_level) === "yellow"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-emerald-500/20 text-emerald-300"
              }`}>
                {Number(selected.latest_risk_index || 0).toFixed(2)} RISK
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 my-2.5 font-mono text-center">
              <div className="p-2 rounded-xl bg-neutral-950/80">
                <span className="text-[9px] text-[var(--ink-dim)] block">OBS</span>
                <span className="text-xs font-bold text-[var(--ink)]">{selected.observation_count}</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950/80">
                <span className="text-[9px] text-[var(--ink-dim)] block">FLAGS</span>
                <span className={`text-xs font-bold ${selected.flagged_observation_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {selected.flagged_observation_count}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950/80">
                <span className="text-[9px] text-[var(--ink-dim)] block">CONF</span>
                <span className="text-xs font-bold text-[var(--ink)]">{selected.latest_confidence}</span>
              </div>
              <div className="p-2 rounded-xl bg-neutral-950/80">
                <span className="text-[9px] text-[var(--ink-dim)] block">LEVEL</span>
                <span className={`text-xs font-bold ${
                  levelClass(selected.latest_risk_level) === "red"
                    ? "text-rose-400"
                    : levelClass(selected.latest_risk_level) === "yellow"
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}>
                  {selected.latest_risk_level}
                </span>
              </div>
            </div>

            <div className="text-xs text-[var(--ink)]/90 mb-3 bg-neutral-950/50 p-2.5 rounded-xl flex items-start gap-2">
              <span className="material-symbols-outlined text-teal-400 text-sm mt-0.5">neurology</span>
              <div className="leading-tight">
                <span className="text-[10px] text-[var(--ink-dim)] font-mono block">
                  ONE HEALTH INTERVENTION VECTOR
                </span>
                <span className="text-[var(--ink)]/90 font-medium text-xs">
                  {Number(selected.latest_risk_index) >= 0.55
                    ? "Acute contamination risk requiring immediate field dispatch and public advisory."
                    : Number(selected.latest_risk_index) >= 0.25
                      ? "Elevated vigilance. Continue monitoring and schedule next field check."
                      : "Stable biofiltration habitat. Continue routine monitoring."}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="flex-1 py-1.5 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
                onClick={() => onNavigate("cards")}
              >
                <span>View Impact Card</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
              <a
                className="py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono transition-colors flex items-center gap-1"
                href={API.fhirUrl(selected.latest_observation_id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined text-xs text-teal-400">data_object</span>
                <span>FHIR</span>
              </a>
            </div>
          </div>
        )}

        {/* Coordinate watermark */}
        <div className="absolute bottom-4 left-6 pointer-events-none font-mono text-[10px] text-teal-400/40 uppercase tracking-widest hidden sm:block z-0">
          59°54'51.1"N 10°44'56.4"E · BASIN DATUM WGS84 · 1:24,000 SCALE
        </div>
      </div>

      <style>{`
        @keyframes mapPing {
          0%   { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </main>
  );
}