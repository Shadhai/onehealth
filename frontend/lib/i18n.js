// frontend/lib/i18n.js
// Bilingual EN/PT with on-device Chrome Translator for dynamic strings.

export const LANGUAGES = [
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
];

export const STRINGS = {
  en: {
    "nav.overview": "Overview",
    "nav.cards": "Impact Cards",
    "nav.audit": "Audit Trail",
    "nav.trends": "Trends",
    "nav.onehealth": "One Health",
    "nav.dashboard": "Dashboard",
    "nav.map": "Map",
    "brand.subtitle": "Citizen Stream Telemetry to Explainable Clinical FHIR Action",
    "ctrl.rerun": "Re-run Pipeline",
    "ctrl.running": "Running…",
    "ctrl.csv": "CSV",
    "ctrl.dark": "Dark",
    "ctrl.light": "Light",
    "card.listen": "Listen Assessment",
    "card.pause": "Pause",
    "card.resume": "Resume",
    "card.stop": "Stop",
    "card.includeDetail": "Include detail",
    "card.reading": "Reading {cur} of {total}",
    "pillar.why": "Why it matters",
    "pillar.actions": "Recommended actions",
    "notice.sync": "Continuous telemetry synced: 1,428 observations & 7 river segments normalized.",
    "dash.priorityTitle": "Priority Sites This Week",
    "dash.prioritySub": "Ranked dynamically by multi-pillar One Health Risk Index, unresolved validation flags, and observation recency.",
    "dash.liveRanked": "Live Ranked",
    "dash.summaryTotal": "Monitored Sites",
    "dash.summaryHigh": "High Risk (Index ≥ 0.55)",
    "dash.summaryModerate": "Moderate Risk (0.25 - 0.54)",
    "dash.summaryLow": "Low Risk (0.00 - 0.24)",
    "dash.summaryFlagged": "Sites with Flags",
    "dash.catchments": "Catchments",
    "dash.triggerProtocols": "Trigger automated protocols",
    "dash.elevatedWatch": "Elevated watch priority",
    "dash.stableResilience": "Stable biotic resilience",
    "dash.auditableAnomalies": "Auditable sensor anomalies",
    "dash.riskDistribution": "Risk Distribution",
    "dash.riskDistributionSub": "Proportion of monitored catchment zones across river basin risk brackets.",
    "dash.riskIndexBySite": "Risk Index by Site",
    "dash.riskIndexBySiteSub": "Current synthesized index based on 50% Eco, 30% Fauna, 20% Public Health.",
    "dash.flagsPerSite": "Validation Flags per Site",
    "dash.flagsPerSiteSub": "Total anomalies detected across pH calibration, DO limits, and sensor drift.",
    "dash.allSites": "All Monitored Segments",
    "dash.active": "Active",
    "dash.search": "Search segments…",
    "dash.filterRisk": "Risk:",
    "dash.filterAll": "All Levels",
    "dash.filterFlags": "Flags:",
    "dash.flagAll": "All",
    "dash.flagHas": "Has Flags (> 0)",
    "dash.flagClean": "Clean (0 Flags)",
    "dash.exportCsv": "Export CSV",
    "dash.colSite": "Catchment Site",
    "dash.colRisk": "Risk Level",
    "dash.colIndex": "One Health Index",
    "dash.colConf": "Confidence",
    "dash.colObs": "Observations",
    "dash.colFlags": "With Flags",
    "dash.colAvg": "Avg Risk",
    "dash.colUpdate": "Latest Update",
    "dash.colAction": "Action",
    "dash.inspect": "Inspect Card",
    "dash.showing": "Displaying {n} of {total} monitored catchment sites",
    "dash.fhir": "Interoperable FHIR Observation Profile v1.2",
  },
  pt: {
    "nav.overview": "Visão geral",
    "nav.cards": "Cartões de Impacto",
    "nav.audit": "Trilha de Auditoria",
    "nav.trends": "Tendências",
    "nav.onehealth": "Saúde Única",
    "nav.dashboard": "Painel",
    "nav.map": "Mapa",
    "brand.subtitle": "Telemetria Cidadã para Ação Clínica FHIR Explicável",
    "ctrl.rerun": "Reexecutar Pipeline",
    "ctrl.running": "A executar…",
    "ctrl.csv": "CSV",
    "ctrl.dark": "Escuro",
    "ctrl.light": "Claro",
    "card.listen": "Ouvir avaliação",
    "card.pause": "Pausar",
    "card.resume": "Retomar",
    "card.stop": "Parar",
    "card.includeDetail": "Incluir detalhes",
    "card.reading": "A ler {cur} de {total}",
    "pillar.why": "Por que importa",
    "pillar.actions": "Ações recomendadas",
    "notice.sync": "Telemetria contínua sincronizada: 1.428 observações e 7 segmentos normalizados.",
    "dash.priorityTitle": "Locais Prioritários Esta Semana",
    "dash.prioritySub": "Ordenados por índice de risco Saúde Única, alertas pendentes e recência de observações.",
    "dash.liveRanked": "Classificação ao Vivo",
    "dash.summaryTotal": "Locais Monitorizados",
    "dash.summaryHigh": "Risco Elevado (Índice ≥ 0.55)",
    "dash.summaryModerate": "Risco Moderado (0.25 - 0.54)",
    "dash.summaryLow": "Risco Baixo (0.00 - 0.24)",
    "dash.summaryFlagged": "Locais com Alertas",
    "dash.catchments": "Bacias",
    "dash.triggerProtocols": "Acionar protocolos automáticos",
    "dash.elevatedWatch": "Vigilância elevada",
    "dash.stableResilience": "Resiliência biótica estável",
    "dash.auditableAnomalies": "Anomalias auditáveis",
    "dash.riskDistribution": "Distribuição de Risco",
    "dash.riskDistributionSub": "Proporção de zonas de bacia por faixas de risco.",
    "dash.riskIndexBySite": "Índice de Risco por Local",
    "dash.riskIndexBySiteSub": "Índice sintetizado a partir de 50% Eco, 30% Fauna, 20% Saúde Pública.",
    "dash.flagsPerSite": "Alertas de Validação por Local",
    "dash.flagsPerSiteSub": "Total de anomalias detetadas em calibração de pH, limites de OD e deriva de sensores.",
    "dash.allSites": "Todos os Segmentos Monitorizados",
    "dash.active": "Ativos",
    "dash.search": "Pesquisar segmentos…",
    "dash.filterRisk": "Risco:",
    "dash.filterAll": "Todos",
    "dash.filterFlags": "Alertas:",
    "dash.flagAll": "Todos",
    "dash.flagHas": "Com Alertas (> 0)",
    "dash.flagClean": "Limpo (0 Alertas)",
    "dash.exportCsv": "Exportar CSV",
    "dash.colSite": "Local da Bacia",
    "dash.colRisk": "Nível de Risco",
    "dash.colIndex": "Índice Saúde Única",
    "dash.colConf": "Confiança",
    "dash.colObs": "Observações",
    "dash.colFlags": "Com Alertas",
    "dash.colAvg": "Risco Médio",
    "dash.colUpdate": "Última Atualização",
    "dash.colAction": "Ação",
    "dash.inspect": "Ver Cartão",
    "dash.showing": "A mostrar {n} de {total} locais monitorizados",
    "dash.fhir": "Perfil de Observação FHIR Interoperável v1.2",
  },
};

// ---------- Tier 2: Chrome Translator ----------
let translator = null;
let translatorTarget = null;
const cache = new Map();

export function isDynamicTranslationSupported() {
  return (
    typeof window !== "undefined" &&
    "translation" in window &&
    typeof window.translation?.createTranslator === "function"
  );
}

export async function prepareDynamicTranslator(targetLang) {
  if (!isDynamicTranslationSupported()) return false;
  if (targetLang === "en") return false;
  if (translator && translatorTarget === targetLang) return true;
  try {
    const availability =
      (await window.translation?.canTranslate?.({
        sourceLanguage: "en",
        targetLanguage: targetLang,
      })) || "downloadable";
    if (availability === "unavailable") return false;
    translator = await window.translation.createTranslator({
      sourceLanguage: "en",
      targetLanguage: targetLang,
    });
    translatorTarget = targetLang;
    cache.clear();
    return true;
  } catch {
    translator = null;
    translatorTarget = null;
    return false;
  }
}

export async function translateString(text, targetLang) {
  if (!text || targetLang === "en") return text;
  if (cache.has(text)) return cache.get(text);
  if (!translator || translatorTarget !== targetLang) {
    const ok = await prepareDynamicTranslator(targetLang);
    if (!ok) return text;
  }
  try {
    const out = await translator.translate(text);
    cache.set(text, out);
    return out;
  } catch {
    return text;
  }
}

// ---------- Tier 1 / 3: dictionary ----------
export function t(lang, key, vars) {
  const dict = STRINGS[lang] || {};
  const en = STRINGS.en;
  let out = dict[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v));
    }
  }
  return out;
}