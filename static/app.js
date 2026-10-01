// static/app.js
// OneHealth Lens frontend. All data comes from the backend.
// No fabricated values. Every rendered field traces to a real API call.

// ---------- API endpoints ----------
// Every path here must match a route registered in app/main.py.
//   insights        -> /insights                  (list)
//   insight(id)     -> /insights/{id}             (single card)
//   trends(site)    -> /insights/trends/{site}    (time series)  <-- FIXED
//   flags(id)       -> /insights/{id}/flags       (validation flags)
//   fhir(id)        -> /fhir/{id}                 (FHIR bundle)
//   sites           -> /api/sites                 (aggregate per site)
//   rerunMock       -> /ingest/mock               (re-run pipeline)
const API = {
  insights:  "/insights",
  insight:   id   => `/insights/${encodeURIComponent(id)}`,
  trends:    site => `/insights/trends/${encodeURIComponent(site)}`,
  flags:     id   => `/insights/${encodeURIComponent(id)}/flags`,
  fhir:      id   => `/fhir/${encodeURIComponent(id)}`,
  sites:     "/api/sites",
  summary:   "/api/summary",
  rerunMock: "/ingest/mock",
};

// ---------- Application state ----------
const S = {
  view: "overview",               // overview | cards | dashboard | map
  mode: "simple",                 // simple | detailed
  sites: [],
  current: null,
  summary: null,
  sort: { key: "site", dir: 1 },  // dir: 1 asc, -1 desc
  filters: { risk: "all", flags: "any", search: "" },
};

// ---------- Glossary (plain-language definitions) ----------
const GLOSSARY = {
  "pH": "Acidity scale. 6.5 to 8.5 is healthy for most stream life. Below 5 or above 9.5 stresses aquatic organisms.",
  "Dissolved oxygen": "Oxygen in the water that fish and insects use to breathe. Values below 4 mg/L can kill fish.",
  "Total dissolved solids": "The sum of all dissolved substances in the water. Very high values indicate pollution or saline intrusion.",
  "Conductivity": "How well the water conducts electricity. High values suggest dissolved salts or pollutants.",
  "Coliforms": "Bacteria that indicate possible sewage contamination. When present, direct water contact is risky.",
  "Riparian vegetation": "Plants along the stream bank. They shade the water, filter runoff, and stabilise the bank.",
  "Macroinvertebrates": "Small animals without backbones visible to the naked eye. Their diversity is a classic indicator of stream health.",
  "Diatoms": "Single-celled algae with silica shells. Their community composition reflects water quality.",
  "One Health Risk Index": "A weighted combination of water quality, biological health, human exposure, and environmental pressure. Higher means more risk.",
  "Confidence": "How much we trust the score. It rises with the number of reported fields and the completeness of the submission.",
};

// ---------- Provenance tags (honest source attribution) ----------
const PROVENANCE = {
  columns:     ["Citizen", "Correlation"],
  causalChain: ["Correlation"],
  riskIndex:   ["Correlation"],
  confidence:  ["Pipeline"],
  fhirBundle:  ["FHIR", "OAH-IG"],
};

// ---------- Small helpers ----------
const $ = id => document.getElementById(id);

function el(tag, opts = {}, ...children) {
  const e = document.createElement(tag);
  Object.entries(opts).forEach(([k, v]) => {
    if (k === "class")      e.className = v;
    else if (k === "html")  e.innerHTML = v;
    else if (k === "text")  e.textContent = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (k === "dataset")    Object.assign(e.dataset, v);
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  });
  children.flat().forEach(c => { if (c != null) e.append(c); });
  return e;
}

async function get(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

function levelClass(level) {
  if (level === "High")     return "red";
  if (level === "Moderate") return "yellow";
  return "green";
}

function levelText(level) {
  if (level === "High")     return "High risk";
  if (level === "Moderate") return "Moderate risk";
  return "Low risk";
}

function severityClass(level) {
  return levelClass(level);
}

function provenanceBadges(sources) {
  return sources.map(s =>
    el("span", { class: "badge neutral", title: `Source: ${s}` }, s)
  );
}

function openInfo(title, body) {
  $("info-title").textContent = title;
  $("info-body").textContent = body;
  $("info-dialog").showModal();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}

function renderGlossaryTerms(text) {
  let html = escapeHtml(text);
  Object.keys(GLOSSARY).forEach(term => {
    const re = new RegExp(`\\b(${escapeRegex(term)})\\b`, "g");
    html = html.replace(re,
      `<span class="term" data-term="${escapeAttr(term)}" tabindex="0">$1</span>`);
  });
  return html;
}

// ---------- Gauge ----------
function renderGauge(value, colour) {
  const v = Math.max(0, Math.min(1, Number(value) || 0));
  const angle = Math.PI * (1 - v);
  const cx = 100, cy = 100, r = 80;
  const x = cx + r * Math.cos(angle);
  const y = cy - r * Math.sin(angle);
  const colourVar = colour === "green"  ? "var(--green)"
                  : colour === "yellow" ? "var(--yellow)"
                  :                       "var(--red)";
  return `
    <svg viewBox="0 0 200 120" width="200" height="120"
         role="img" aria-label="Risk index ${v.toFixed(2)} out of 1">
      <path d="M20 100 A80 80 0 0 1 180 100"
            fill="none" stroke="var(--line)" stroke-width="14" stroke-linecap="round"/>
      <path d="M20 100 A80 80 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}"
            fill="none" stroke="${colourVar}" stroke-width="14" stroke-linecap="round"/>
      <text x="100" y="90" text-anchor="middle"
            font-size="34" font-family="Georgia,serif" fill="currentColor">
        ${v.toFixed(2)}
      </text>
      <text x="100" y="112" text-anchor="middle" font-size="11" fill="var(--mut)">
        risk index
      </text>
    </svg>`;
}

// ---------- Card rendering ----------
function renderHero(card) {
  const gauge = el("div", {
    class: "hero-gauge",
    html: renderGauge(card.risk.index, card.risk.colour),
  });

  const riskBadge = el("span", {
    class: `badge ${severityClass(card.risk.level)}`,
    text: levelText(card.risk.level),
  });

  const confidenceBadge = el("span", {
    class: "badge neutral",
    title: "Click for details",
    onclick: () => openInfo("Confidence",
      GLOSSARY["Confidence"] + ` Current: ${card.confidence}.`),
    text: `Confidence: ${card.confidence}`,
  });

  const summary = el("div", { class: "hero-summary" },
    el("div", { class: "hero-title", text: "One Health assessment" }),
    el("h1",  { class: "hero-site", text: card.site }),
    el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin:6px 0 10px" },
        riskBadge, confidenceBadge, ...provenanceBadges(PROVENANCE.riskIndex)),
    el("p", { class: "hero-line muted small",
              text: `Generated ${new Date(card.generated_at).toLocaleString()}` })
  );

  return el("div", { class: "hero" }, gauge, summary);
}

function renderPillar(col) {
  const lvl = levelClass(col.level);

  const head = el("div", { class: "pillar-head" },
    el("span", { class: "pillar-icon", text: col.icon }),
    el("span", { class: "pillar-title", text: col.title })
  );

  const level = el("span", {
    class: `pillar-level ${lvl}`,
    text: `${levelText(col.level)} · ${Number(col.score).toFixed(2)}`,
  });

  const summary = el("p", {
    class: "pillar-summary",
    html: renderGlossaryTerms(col.summary),
  });

  const children = [head, level, summary];

  if (S.mode === "detailed") {
    if (col.reasons && col.reasons.length) {
      children.push(el("div", { class: "pillar-section" },
        el("div", { class: "pillar-section-title", text: "Why" }),
        el("ul", { class: "pillar-list" },
          col.reasons.map(r => el("li", { html: renderGlossaryTerms(r) })))
      ));
    }
    if (col.actions && col.actions.length) {
      children.push(el("div", { class: "pillar-section" },
        el("div", { class: "pillar-section-title", text: "Recommended actions" }),
        el("ul", { class: "pillar-list" },
          col.actions.map(a => el("li", { text: a })))
      ));
    }
  }

  children.push(el("div", { class: "pillar-prov" }, ...provenanceBadges(PROVENANCE.columns)));

  return el("div", { class: "pillar" }, ...children);
}

function renderArrow() {
  return el("div", { class: "pillar-arrow", "aria-hidden": "true", text: "➜" });
}

function renderPillars(card) {
  const byDomain = Object.fromEntries(card.columns.map(c => [c.domain, c]));
  const order = ["ecosystem", "animal", "human"];
  const nodes = [];
  order.forEach((d, i) => {
    if (byDomain[d]) nodes.push(renderPillar(byDomain[d]));
    if (i < order.length - 1) nodes.push(renderArrow());
  });
  return el("div", { class: "pillars" }, ...nodes);
}

function renderCausal(card) {
  if (!card.causal_chain || !card.causal_chain.length) return null;
  const links = card.causal_chain.map(link =>
    el("div", { class: "causal-link" },
      el("span", { class: "causal-pill", text: link.from }),
      el("span", { class: "causal-arrow", text: "→" }),
      el("span", { class: "causal-pill", text: link.to }),
      el("span", { class: "muted small", text: link.description })
    )
  );
  return el("div", { class: "causal" },
    el("div", { class: "causal-title", text: "Causal chain" }),
    el("div", { class: "causal-links" }, ...links),
    el("div", { style: "margin-top:10px;display:flex;gap:6px" },
        ...provenanceBadges(PROVENANCE.causalChain))
  );
}

function renderActions(card) {
  const fhirBtn = el("button", {
    class: "btn-outline",
    text: "Preview FHIR bundle",
    onclick: () => showFhir(card.observation_id),
  });
  const printBtn = el("button", {
    class: "btn-outline",
    text: "Print report",
    onclick: () => window.print(),
  });
  const provenance = el("span", { class: "muted small" },
    "Bundle uses OAH Implementation Guide profiles");
  return el("div", { class: "card-actions" }, fhirBtn, printBtn, provenance);
}

// ---------- Trend chart (Detailed mode only) ----------
async function renderTrend(card) {
  const cardEl = el("div", { class: "trend-card" },
    el("div", { class: "trend-title", text: "Risk index over time" }),
    el("p", { class: "trend-empty", text: "Loading…" })
  );

  try {
    const series = await get(API.trends(card.site));
    if (!series.length) {
      cardEl.querySelector(".trend-empty").textContent = "No trend data yet.";
      return cardEl;
    }
    cardEl.querySelector(".trend-empty").remove();

    const W = 720, H = 200, P = 40;
    const xs = series.map((_, i) => P + i * (W - P - 10) / Math.max(1, series.length - 1));
    const ys = series.map(s => H - 24 - s.risk_index * (H - 44));
    const points = series.map((_, i) => `${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ");

    const svg = `
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Risk index trend">
        <line x1="${P}" y1="${H - 24}" x2="${W - 10}" y2="${H - 24}"
              stroke="var(--line)" stroke-width="1"/>
        <line x1="${P}" y1="${H - 24 - 0.25 * (H - 44)}" x2="${W - 10}"
              y2="${H - 24 - 0.25 * (H - 44)}"
              stroke="var(--green)" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>
        <line x1="${P}" y1="${H - 24 - 0.55 * (H - 44)}" x2="${W - 10}"
              y2="${H - 24 - 0.55 * (H - 44)}"
              stroke="var(--yellow)" stroke-width="1" stroke-dasharray="3 3" opacity="0.4"/>
        <polyline fill="none" stroke="var(--accent)" stroke-width="2.5" points="${points}"/>
        ${series.map((s, i) =>
          `<circle cx="${xs[i].toFixed(1)}" cy="${ys[i].toFixed(1)}" r="4"
                   fill="var(--card)" stroke="var(--accent)" stroke-width="2"/>`).join("")}
        <text x="4" y="${H - 24 + 4}" font-size="10" fill="var(--mut)">0.0</text>
        <text x="4" y="${H - 24 - 0.25 * (H - 44) + 4}" font-size="10" fill="var(--mut)">0.25</text>
        <text x="4" y="${H - 24 - 0.55 * (H - 44) + 4}" font-size="10" fill="var(--mut)">0.55</text>
        <text x="4" y="${H - 24 - (H - 44) + 4}" font-size="10" fill="var(--mut)">1.0</text>
      </svg>`;

    cardEl.append(el("div", { html: svg }));
    cardEl.append(el("p", { class: "muted small",
      text: `${series.length} data point${series.length === 1 ? "" : "s"} · ` +
            `dashed lines mark Low / Moderate / High thresholds` }));
  } catch (e) {
    cardEl.querySelector(".trend-empty").textContent =
      `Could not load trend: ${e.message}`;
  }
  return cardEl;
}

// ---------- Validation flags (Detailed mode only) ----------
async function renderFlags(card) {
  try {
    const data = await get(API.flags(card.observation_id));
    if (!data.flags.length) return null;
    const title = el("div", { class: "flags-title",
      text: `Validation flags · ${data.flag_count}` });
    const list = data.flags.map(f =>
      el("div", { class: `flag ${f.severity}` },
        el("div", { class: "flag-head" },
          el("span", { class: "flag-rule", text: `${f.rule_id} · ${f.field}` }),
          el("span", { class: "flag-sev", text: f.severity })
        ),
        el("div", { class: "flag-msg",
          html: renderGlossaryTerms(f.explanation || f.message) })
      )
    );
    return el("div", { class: "flags-card" }, title, ...list);
  } catch {
    return null;
  }
}

function attachGlossaryListeners(root) {
  root.querySelectorAll(".term").forEach(node => {
    node.addEventListener("click", () => {
      const term = node.dataset.term;
      openInfo(term, GLOSSARY[term] || term);
    });
    node.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        node.click();
      }
    });
  });
}

async function renderCard(card) {
  S.current = card;
  const container = $("card");
  container.innerHTML = "";

  container.append(renderHero(card));
  container.append(renderPillars(card));

  const causal = renderCausal(card);
  if (causal) container.append(causal);

  if (S.mode === "detailed") {
    const flags = await renderFlags(card);
    if (flags) container.append(flags);
    container.append(await renderTrend(card));
  }

  container.append(renderActions(card));
  attachGlossaryListeners(container);

  $("empty-state").hidden = true;
  container.hidden = false;
}

// ---------- Sidebar / site selector ----------
async function loadSites() {
  const list = $("site-list");
  list.innerHTML = "";
  list.append(el("p", { class: "muted small", text: "Loading…" }));

  let sites;
  try {
    sites = await get(API.sites);
  } catch (e) {
    list.innerHTML = "";
    list.append(el("p", { class: "muted small", text: `Error: ${e.message}` }));
    return;
  }
  S.sites = sites;
  // Refresh an already-open Leaflet map after the asynchronous site request completes.
  if (leafletMap) {
    rebuildMarkers();
    fitMapToSites();
  }

  const sel = $("site-select");
  sel.innerHTML = "";
  sites.forEach(s => sel.append(el("option", { value: s.site }, s.site)));

  list.innerHTML = "";
  sites.forEach(s => {
    const item = el("div", {
      class: "site-item",
      dataset: { site: s.site },
      tabindex: "0",
      role: "button",
      "aria-label": `${s.site}, ${s.latest_risk_level} risk`,
      onclick: () => selectSite(s),
      onkeydown: e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectSite(s);
        }
      },
    },
      el("div", { class: "site-item-name", text: s.site }),
      el("div", { class: "site-item-meta" },
        el("span", { class: `badge ${severityClass(s.latest_risk_level)}`,
                     text: s.latest_risk_level || "—" }),
        el("span", { text: `index ${Number(s.latest_risk_index ?? 0).toFixed(2)}` })
      )
    );
    list.append(item);
  });

  if (sites.length) selectSite(sites[0]);
}

async function selectSite(s) {
  setView("cards");

  document.querySelectorAll(".site-item").forEach(n =>
    n.classList.toggle("active", n.dataset.site === s.site));

  const sel = $("site-select");
  if (sel.value !== s.site) sel.value = s.site;

  try {
    const full = await get(API.insight(s.latest_observation_id));
    await renderCard(full);
  } catch (e) {
    alert("Could not load card: " + e.message);
  }
}

// ---------- Dashboard ----------
const DASH_COLUMNS = [
  { key: "site",                      label: "Site",           sortable: true,  numeric: false },
  { key: "latest_risk_level",         label: "Risk level",     sortable: true,  numeric: false },
  { key: "latest_risk_index",         label: "Risk index",     sortable: true,  numeric: true  },
  { key: "latest_confidence",         label: "Confidence",     sortable: true,  numeric: false },
  { key: "observation_count",         label: "Observations",   sortable: true,  numeric: true  },
  { key: "flagged_observation_count", label: "With flags",     sortable: true,  numeric: true  },
  { key: "avg_risk_index",            label: "Average risk",   sortable: true,  numeric: true  },
  { key: "latest_generated_at",       label: "Latest update",  sortable: true,  numeric: false },
];

function filterSites(sites) {
  const f = S.filters;
  const search = (f.search || "").trim().toLowerCase();
  return sites.filter(s => {
    if (search && !s.site.toLowerCase().includes(search)) return false;
    if (f.risk !== "all" && s.latest_risk_level !== f.risk) return false;
    if (f.flags === "flagged" && s.flagged_observation_count === 0) return false;
    if (f.flags === "clean"   && s.flagged_observation_count > 0)  return false;
    return true;
  });
}

function sortSites(sites) {
  const { key, dir } = S.sort;
  return [...sites].sort((a, b) => {
    let av = a[key];
    let bv = b[key];
    if (av == null) av = -Infinity;
    if (bv == null) bv = -Infinity;
    if (typeof av === "string" && typeof bv === "string") {
      return dir * av.localeCompare(bv);
    }
    return dir * (av - bv);
  });
}

// ---------- Dashboard charts ----------
function chartColour(level) {
  if (level === "High") return "#b3261e";
  if (level === "Moderate") return "#c68b00";
  return "#1e7a44";
}

function renderSummaryChips(sites) {
  const counts = {
    total: sites.length,
    High: sites.filter(site => site.latest_risk_level === "High").length,
    Moderate: sites.filter(site => site.latest_risk_level === "Moderate").length,
    Low: sites.filter(site => site.latest_risk_level === "Low").length,
    flagged: sites.filter(site => site.flagged_observation_count > 0).length,
  };
  const chip = (number, label, colour = "") =>
    `<div class="dash-chip ${colour}"><div class="dash-chip-num">${number}</div><div class="dash-chip-label">${label}</div></div>`;
  return [chip(counts.total, "Monitored sites"), chip(counts.High, "High risk", "red"),
    chip(counts.Moderate, "Moderate risk", "yellow"), chip(counts.Low, "Low risk", "green"),
    chip(counts.flagged, "Sites with flags")].join("");
}

function renderDonut(sites) {
  if (!sites.length) return `<p class="chart-empty">No data</p>`;
  const counts = { High: 0, Moderate: 0, Low: 0 };
  sites.forEach(site => { if (counts[site.latest_risk_level] !== undefined) counts[site.latest_risk_level]++; });
  const total = sites.length;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const arcs = ["High", "Moderate", "Low"].filter(level => counts[level] > 0).map(level => {
    const dash = counts[level] / total * circumference;
    const arc = `<circle cx="90" cy="90" r="${radius}" fill="none" stroke="${chartColour(level)}" stroke-width="22" stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}" stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 90 90)"/>`;
    offset += dash;
    return arc;
  }).join("");
  const legend = ["High", "Moderate", "Low"].filter(level => counts[level] > 0).map(level =>
    `<div class="donut-legend-row"><span class="donut-legend-dot" style="background:${chartColour(level)}"></span><span>${level}</span><span class="donut-legend-count">${counts[level]}</span></div>`
  ).join("");
  return `<div class="donut-wrap"><svg viewBox="0 0 180 180" class="donut-svg" role="img" aria-label="Risk distribution"><circle cx="90" cy="90" r="${radius}" fill="none" stroke="var(--line)" stroke-width="22"/>${arcs}<text x="90" y="88" text-anchor="middle" font-size="30" font-family="Georgia,serif" fill="var(--ink)">${total}</text><text x="90" y="106" text-anchor="middle" font-size="10" fill="var(--mut)">sites</text></svg><div class="donut-legend">${legend}</div></div>`;
}

function renderRiskBars(sites) {
  if (!sites.length) return `<p class="chart-empty">No data</p>`;
  return [...sites].sort((a, b) => (b.latest_risk_index ?? 0) - (a.latest_risk_index ?? 0)).map(site => {
    const value = Number(site.latest_risk_index ?? 0);
    const label = escapeHtml(site.site.replace("Riverdale Creek - ", ""));
    return `<div class="bar-row"><div class="bar-label" title="${escapeHtml(site.site)}">${label}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, Math.round(value * 100))}%;background:${chartColour(site.latest_risk_level)}"></div></div><div class="bar-value">${value.toFixed(2)}</div></div>`;
  }).join("");
}

function renderFlagBars(sites) {
  if (!sites.length) return `<p class="chart-empty">No data</p>`;
  const sorted = [...sites].sort((a, b) => (b.flagged_observation_count || 0) - (a.flagged_observation_count || 0));
  const maxCount = Math.max(1, ...sorted.map(site => site.flagged_observation_count || 0));
  return sorted.map(site => {
    const count = site.flagged_observation_count || 0;
    const label = escapeHtml(site.site.replace("Riverdale Creek - ", ""));
    const width = count ? Math.max(6, Math.round(count / maxCount * 100)) : 0;
    return `<div class="bar-row"><div class="bar-label" title="${escapeHtml(site.site)}">${label}</div><div class="bar-track"><div class="bar-fill" style="width:${width}%;background:${count ? "#c68b00" : "#cbd5cb"}"></div></div><div class="bar-value">${count}</div></div>`;
  }).join("");
}

function renderDashboard() {
  const summary = $("dash-summary");
  const donut = $("chart-donut");
  const riskBars = $("chart-risk-bars");
  const flagBars = $("chart-flag-bars");
  if (summary) summary.innerHTML = renderSummaryChips(S.sites);
  if (donut) donut.innerHTML = renderDonut(S.sites);
  if (riskBars) riskBars.innerHTML = renderRiskBars(S.sites);
  if (flagBars) flagBars.innerHTML = renderFlagBars(S.sites);

  const table = $("dash-table");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  thead.innerHTML = "";
  const headRow = document.createElement("tr");
  DASH_COLUMNS.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c.label;
    if (c.numeric) th.classList.add("dash-num");
    if (c.sortable) {
      th.classList.add("sortable");
      th.tabIndex = 0;
      const mark = document.createElement("span");
      mark.className = "sort-mark";
      mark.textContent = S.sort.key === c.key
        ? (S.sort.dir === 1 ? "▲" : "▼")
        : "▲▼";
      th.append(mark);
      th.setAttribute("aria-sort",
        S.sort.key === c.key
          ? (S.sort.dir === 1 ? "ascending" : "descending")
          : "none");
      const activate = () => {
        if (S.sort.key === c.key) {
          S.sort.dir = -S.sort.dir;
        } else {
          S.sort.key = c.key;
          S.sort.dir = c.numeric ? -1 : 1;
        }
        renderDashboard();
      };
      th.addEventListener("click", activate);
      th.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
      });
    }
    headRow.append(th);
  });
  thead.append(headRow);

  const rows = sortSites(filterSites(S.sites));

  tbody.innerHTML = "";
  rows.forEach(s => {
    const tr = document.createElement("tr");
    tr.className = "clickable";
    tr.tabIndex = 0;
    tr.setAttribute("aria-label", `Open impact card for ${s.site}`);
    tr.addEventListener("click", () => selectSite(s));
    tr.addEventListener("keydown", e => {
      if (e.key === "Enter") { e.preventDefault(); selectSite(s); }
    });

    const cells = [
      { text: s.site, class: "dash-cell-site" },
      { html: `<span class="badge ${severityClass(s.latest_risk_level)}">${levelText(s.latest_risk_level)}</span>` },
      { text: Number(s.latest_risk_index ?? 0).toFixed(2), class: "dash-num" },
      { text: s.latest_confidence || "—" },
      { text: s.observation_count, class: "dash-num" },
      { text: s.flagged_observation_count, class: "dash-num" },
      { text: Number(s.avg_risk_index ?? 0).toFixed(2), class: "dash-num" },
      { text: s.latest_generated_at
          ? new Date(s.latest_generated_at).toLocaleDateString()
          : "—",
        class: "dash-cell-muted" },
    ];
    cells.forEach(c => {
      const td = document.createElement("td");
      if (c.class) td.className = c.class;
      if (c.html) td.innerHTML = c.html;
      else td.textContent = c.text;
      tr.append(td);
    });
    tbody.append(tr);
  });

  $("dash-count").textContent = `${rows.length} of ${S.sites.length} sites`;
}

// ---------- Map (Leaflet) ----------
let leafletMap = null;
let leafletMarkers = [];
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function currentTileUrl() {
  return OSM_TILES;
}

function tileAttribution() {
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
}

function markerColour(level) {
  if (level === "High") return "#b3261e";
  if (level === "Moderate") return "#c68b00";
  return "#1e7a44";
}

function markerRadius(count, maxCount) {
  return 8 + 16 * Math.sqrt((count || 0) / Math.max(1, maxCount));
}

function buildPopupHtml(site) {
  const colour = markerColour(site.latest_risk_level);
  const score = Number(site.latest_risk_index ?? 0).toFixed(2);
  return `<div style="min-width:200px"><div style="font-weight:600;font-size:14px;margin-bottom:4px">${escapeHtml(site.site)}</div><div style="display:inline-block;padding:2px 8px;border-radius:999px;background:${colour}22;color:${colour};font-size:11px;font-weight:600;margin-bottom:8px">${escapeHtml(site.latest_risk_level || "Unknown")} risk · ${score}</div><div style="font-size:12.5px;color:var(--mut);line-height:1.55">${site.observation_count} observation${site.observation_count === 1 ? "" : "s"}<br>${site.flagged_observation_count > 0 ? `${site.flagged_observation_count} flagged for review<br>` : ""}Confidence: ${escapeHtml(site.latest_confidence || "-")}</div><button class="popup-btn" data-popup-site="${encodeURIComponent(site.site)}">View impact card</button></div>`;
}

function fitMapToSites() {
  if (!leafletMap) return;
  const points = S.sites.filter(site => site.latitude != null && site.longitude != null);
  if (points.length) leafletMap.fitBounds(L.latLngBounds(points.map(site => [site.latitude, site.longitude])), { padding: [60, 60], maxZoom: 15 });
}

function rebuildMarkers() {
  if (!leafletMap) return;
  leafletMarkers.forEach(marker => leafletMap.removeLayer(marker));
  leafletMarkers = [];
  const filter = $("map-filter-risk")?.value || "all";
  const sites = S.sites.filter(site => site.latitude != null && site.longitude != null && (filter === "all" || site.latest_risk_level === filter));
  const maxCount = Math.max(...sites.map(site => site.observation_count || 0), 1);

  sites.forEach(site => {
    const marker = L.circleMarker([site.latitude, site.longitude], {
      radius: markerRadius(site.observation_count, maxCount), fillColor: markerColour(site.latest_risk_level),
      color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.9,
    }).bindPopup(buildPopupHtml(site), { closeButton: true, maxWidth: 260, minWidth: 220 });
    marker.on("popupopen", event => {
      const button = event.popup.getElement()?.querySelector("[data-popup-site]");
      if (button) button.addEventListener("click", () => {
        const target = S.sites.find(item => item.site === decodeURIComponent(button.dataset.popupSite));
        if (target) selectSite(target);
        leafletMap.closePopup();
      });
    });
    marker.addTo(leafletMap);
    leafletMarkers.push(marker);
  });
}

function addMapLegend() {
  const legend = L.control({ position: "topright" });
  legend.onAdd = () => {
    const div = L.DomUtil.create("div", "map-legend-ctrl");
    div.innerHTML = "<h4>Risk level</h4><div class='map-legend-row'><span class='map-legend-dot red'></span>High</div><div class='map-legend-row'><span class='map-legend-dot yellow'></span>Moderate</div><div class='map-legend-row'><span class='map-legend-dot green'></span>Low</div><div class='map-legend-sep'>Pin size = observation count</div>";
    return div;
  };
  return legend;
}

function renderMap() {
  const container = $("map-container");
  if (!container) return;
  if (!window.L) {
    container.textContent = "Interactive map library could not be loaded.";
    return;
  }
  if (!leafletMap) {
    leafletMap = L.map(container, { center: [59.9139, 10.7522], zoom: 12, zoomControl: false, worldCopyJump: true });
    L.tileLayer(currentTileUrl(), { maxZoom: 19, attribution: tileAttribution() }).addTo(leafletMap);
    L.control.zoom({ position: "bottomright" }).addTo(leafletMap);
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(leafletMap);
    addMapLegend().addTo(leafletMap);
  } else {
    leafletMap.invalidateSize();
  }
  rebuildMarkers();
  setTimeout(fitMapToSites, 60);
}

function attachMapHandlers() {
  const filter = $("map-filter-risk");
  if (filter && !filter.dataset.wired) {
    filter.addEventListener("change", () => { rebuildMarkers(); fitMapToSites(); });
    filter.dataset.wired = "1";
  }
  const home = $("map-home");
  if (home && !home.dataset.wired) {
    home.addEventListener("click", fitMapToSites);
    home.dataset.wired = "1";
  }
  const fullscreen = $("map-fullscreen");
  if (fullscreen && !fullscreen.dataset.wired) {
    fullscreen.addEventListener("click", enterFullscreen);
    fullscreen.dataset.wired = "1";
  }
}

function enterFullscreen() {
  document.body.classList.add("map-fullscreen");
  if (!$("map-exit-btn")) {
    const exit = el("button", { id: "map-exit-btn", class: "btn-outline", text: "Exit fullscreen", onclick: exitFullscreen });
    document.body.append(exit);
  }
  document.documentElement.requestFullscreen?.().catch(() => {});
  setTimeout(() => { leafletMap?.invalidateSize(); fitMapToSites(); }, 200);
}

function exitFullscreen() {
  document.body.classList.remove("map-fullscreen");
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  setTimeout(() => leafletMap?.invalidateSize(), 200);
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && document.body.classList.contains("map-fullscreen")) exitFullscreen();
});

// ---------- Overview ----------
async function renderOverview() {
  const setNum = (id, value) => {
    const node = $(id);
    if (node) node.querySelector(".ov-stat-num").textContent = value;
  };

  ["stat-obs", "stat-sites", "stat-high", "stat-flags", "stat-fhir"]
    .forEach(id => setNum(id, "-"));

  try {
    const summary = await get(API.summary);
    setNum("stat-obs", summary.pipeline.normalized);
    setNum("stat-sites", summary.sites.total);
    setNum("stat-high", summary.sites.high_risk);
    setNum("stat-flags", summary.sites.flagged_observations);
    setNum("stat-fhir", summary.pipeline.bundles);
    S.summary = summary;
  } catch (e) {
    console.error("Could not load summary:", e);
  }
}

// ---------- View router ----------
function setView(view) {
  S.view = view;
  document.body.setAttribute("data-view", view);

  ["overview", "cards", "dashboard", "map"].forEach(v => {
    const el = $(`view-${v}`);
    if (el) el.hidden = v !== view;
    const tab = $(`tab-${v}`);
    if (tab) tab.setAttribute("aria-selected", v === view ? "true" : "false");
  });

  if (view === "overview") renderOverview();
  if (view === "dashboard") renderDashboard();
  if (view === "map") { attachMapHandlers(); renderMap(); }
}

// ---------- FHIR dialog ----------
async function showFhir(observationId) {
  const pre = $("fhir-json");
  pre.textContent = "Loading…";
  $("fhir-dialog").showModal();
  try {
    const r = await fetch(API.fhir(observationId));
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    const text = await r.text();
    try { pre.textContent = JSON.stringify(JSON.parse(text), null, 2); }
    catch { pre.textContent = text; }
  } catch (e) {
    pre.textContent = `Error: ${e.message}`;
  }
}

// ---------- Event wiring ----------
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => setView(tab.dataset.view));
  tab.addEventListener("keydown", e => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const tabs = Array.from(document.querySelectorAll(".tab"));
      const i = tabs.indexOf(tab);
      const next = e.key === "ArrowRight"
        ? tabs[(i + 1) % tabs.length]
        : tabs[(i - 1 + tabs.length) % tabs.length];
      next.focus();
      next.click();
    }
  });
});
// ---------- Overview CTA buttons ----------
document.querySelectorAll("[data-goto]").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.goto));
});

$("filter-risk").addEventListener("change", e => {
  S.filters.risk = e.target.value;
  renderDashboard();
});
$("filter-flags").addEventListener("change", e => {
  S.filters.flags = e.target.value;
  renderDashboard();
});

const searchEl = $("dash-search");
if (searchEl) {
  let searchDebounce;
  searchEl.addEventListener("input", e => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      S.filters.search = e.target.value;
      renderDashboard();
    }, 120);
  });
}

$("mode-simple").addEventListener("click", () => {
  S.mode = "simple";
  $("mode-simple").setAttribute("aria-pressed", "true");
  $("mode-detail").setAttribute("aria-pressed", "false");
  if (S.current) renderCard(S.current);
});
$("mode-detail").addEventListener("click", () => {
  S.mode = "detailed";
  $("mode-simple").setAttribute("aria-pressed", "false");
  $("mode-detail").setAttribute("aria-pressed", "true");
  if (S.current) renderCard(S.current);
});

const THEME_KEY = "ohl-theme";
function applyStoredTheme() {
  document.documentElement.setAttribute("data-theme",
    localStorage.getItem(THEME_KEY) || "auto");
}
$("theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme") || "auto";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
});
applyStoredTheme();

$("copy-fhir").addEventListener("click", async () => {
  const text = $("fhir-json").textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = $("copy-fhir");
    const original = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => btn.textContent = original, 1500);
  } catch {
    alert("Clipboard blocked. Select the text and press Ctrl+C.");
  }
});

$("rerun-btn").addEventListener("click", async () => {
  const btn = $("rerun-btn");
  btn.disabled = true;
  btn.textContent = "Running…";
  try {
    await fetch(API.rerunMock, { method: "POST" });
    await loadSites();
    if (S.view === "overview") renderOverview();
    if (S.view === "dashboard") renderDashboard();
    if (S.view === "map") renderMap();
  } catch (e) {
    alert("Error: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Re-run pipeline";
  }
});

$("site-select").addEventListener("change", e => {
  const s = S.sites.find(x => x.site === e.target.value);
  if (s) selectSite(s);
});

// ---------- Boot ----------
setView("overview");
loadSites();