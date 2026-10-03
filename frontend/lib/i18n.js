// frontend/lib/i18n.js
// UI dictionaries with on-device Chrome Translator fallback for dynamic strings.

export const LANGUAGES = [
  { code: "en", label: "English",   flag: "🇬🇧" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "fr", label: "Français",  flag: "🇫🇷" },
  { code: "it", label: "Italiano",   flag: "🇮🇹" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "no", label: "Norsk",      flag: "🇳🇴" },
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
    "status.online": "Online",
    "status.pwaReady": "Online · cached",
    "status.offline": "Offline · cached view",
    "status.onlineHelp": "Live API connection available.",
    "status.offlineHelp": "The app shell and recent reads remain available. New observations are not queued yet.",
    "capture.button": "Field capture", "capture.kicker": "Offline-ready observation", "capture.title": "Record a stream observation", "capture.subtitle": "Save locally when offline and sync the validated observation when connectivity returns.", "capture.close": "Close", "capture.site": "Research site", "capture.ph": "pH", "capture.oxygen": "Dissolved oxygen (mg/L)", "capture.temperature": "Water temperature (°C)", "capture.rating": "Overall rating", "capture.pending": "observation(s) pending sync", "capture.save": "Save observation", "capture.saving": "Saving…", "capture.sync": "Sync pending", "capture.savedPending": "Saved locally. Syncing when possible.", "capture.savedOffline": "Saved offline. It will sync when you reconnect.", "capture.synced": "Observation synced successfully.", "capture.syncFailed": "Saved locally; sync will retry later.", "capture.queueError": "Could not access local observation storage.",
    "capture.media": "Photos or video", "capture.mediaHint": "Optional evidence, maximum 5 MB per file.", "capture.mediaError": "Each media file must be readable and no larger than 5 MB.",
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
    "dash.riskIndexBySiteSub": "Current synthesized index based on 30% Water, 30% Biology, 20% Human Exposure, and 20% Environmental Pressure.",
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
    "status.online": "Online",
    "status.pwaReady": "Online · em cache",
    "status.offline": "Offline · vista em cache",
    "status.onlineHelp": "Ligação à API disponível.",
    "status.offlineHelp": "A aplicação e leituras recentes continuam disponíveis. Novas observações ainda não são colocadas em fila.",
    "capture.button": "Registo de campo", "capture.kicker": "Observação pronta para offline", "capture.title": "Registar observação do rio", "capture.subtitle": "Guarde localmente sem ligação e sincronize quando a rede voltar.", "capture.close": "Fechar", "capture.site": "Local de investigação", "capture.ph": "pH", "capture.oxygen": "Oxigénio dissolvido (mg/L)", "capture.temperature": "Temperatura da água (°C)", "capture.rating": "Avaliação geral", "capture.pending": "observação(ões) pendente(s)", "capture.save": "Guardar observação", "capture.saving": "A guardar…", "capture.sync": "Sincronizar", "capture.savedPending": "Guardado localmente. A sincronizar.", "capture.savedOffline": "Guardado offline. Será sincronizado quando voltar a ligar.", "capture.synced": "Observação sincronizada.", "capture.syncFailed": "Guardado localmente; a sincronização será tentada mais tarde.", "capture.queueError": "Não foi possível aceder ao armazenamento local.",
    "capture.media": "Fotos ou vídeo", "capture.mediaHint": "Evidência opcional, máximo de 5 MB por ficheiro.", "capture.mediaError": "Cada ficheiro deve ser legível e ter no máximo 5 MB.",
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
    "dash.riskIndexBySiteSub": "Índice sintetizado a partir de 30% Água, 30% Biologia, 20% Exposição Humana e 20% Pressão Ambiental.",
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
  fr: {
    "nav.overview": "Vue d’ensemble", "nav.cards": "Cartes d’impact", "nav.audit": "Piste d’audit", "nav.trends": "Tendances", "nav.onehealth": "Une seule santé", "nav.dashboard": "Tableau de bord", "nav.map": "Carte",
    "brand.subtitle": "Télémétrie citoyenne des cours d’eau vers une action clinique FHIR explicable", "ctrl.rerun": "Relancer le pipeline", "ctrl.running": "Exécution…", "ctrl.csv": "CSV", "ctrl.dark": "Sombre", "ctrl.light": "Clair",
    "status.online": "En ligne", "status.pwaReady": "En ligne · cache", "status.offline": "Hors ligne · cache",
    "status.onlineHelp": "Connexion API disponible.", "status.offlineHelp": "L’application et les lectures récentes restent disponibles. Les nouvelles observations ne sont pas encore mises en file.",
    "capture.button": "Saisie terrain", "capture.kicker": "Observation prête hors ligne", "capture.title": "Enregistrer une observation", "capture.subtitle": "Enregistrez localement hors ligne et synchronisez au retour du réseau.", "capture.close": "Fermer", "capture.site": "Site de recherche", "capture.ph": "pH", "capture.oxygen": "Oxygène dissous (mg/L)", "capture.temperature": "Température de l’eau (°C)", "capture.rating": "Évaluation générale", "capture.pending": "observation(s) en attente", "capture.save": "Enregistrer", "capture.saving": "Enregistrement…", "capture.sync": "Synchroniser", "capture.savedPending": "Enregistrée localement. Synchronisation en cours.", "capture.savedOffline": "Enregistrée hors ligne. Synchronisation au retour de la connexion.", "capture.synced": "Observation synchronisée.", "capture.syncFailed": "Enregistrée localement ; nouvel essai ultérieur.", "capture.queueError": "Stockage local inaccessible.", "capture.media": "Photos ou vidéo", "capture.mediaHint": "Preuve facultative, maximum 5 Mo par fichier.", "capture.mediaError": "Chaque fichier doit être lisible et ne pas dépasser 5 Mo.",
    "card.listen": "Écouter l’évaluation", "card.pause": "Pause", "card.resume": "Reprendre", "card.stop": "Arrêter", "card.includeDetail": "Inclure les détails", "card.reading": "Lecture {cur} sur {total}",
    "pillar.why": "Pourquoi c’est important", "pillar.actions": "Actions recommandées", "notice.sync": "Télémétrie continue synchronisée : 1 428 observations et 7 segments fluviaux normalisés.",
    "dash.priorityTitle": "Sites prioritaires cette semaine", "dash.prioritySub": "Classés dynamiquement selon l’indice de risque Une seule santé, les alertes de validation non résolues et la récence des observations.", "dash.liveRanked": "Classement en direct", "dash.summaryTotal": "Sites surveillés", "dash.summaryHigh": "Risque élevé (indice ≥ 0,55)", "dash.summaryModerate": "Risque modéré (0,25 - 0,54)", "dash.summaryLow": "Risque faible (0,00 - 0,24)", "dash.summaryFlagged": "Sites avec alertes", "dash.catchments": "Bassins versants", "dash.triggerProtocols": "Déclencher les protocoles automatiques", "dash.elevatedWatch": "Surveillance renforcée", "dash.stableResilience": "Résilience biotique stable", "dash.auditableAnomalies": "Anomalies de capteur auditables",
    "dash.riskDistribution": "Répartition des risques", "dash.riskDistributionSub": "Part des zones surveillées du bassin selon les catégories de risque.", "dash.riskIndexBySite": "Indice de risque par site", "dash.riskIndexBySiteSub": "Indice synthétique fondé sur 30 % eau, 30 % biologie, 20 % exposition humaine et 20 % pression environnementale.", "dash.flagsPerSite": "Alertes de validation par site", "dash.flagsPerSiteSub": "Total des anomalies détectées lors de l’étalonnage du pH, des limites d’oxygène dissous et de la dérive des capteurs.",
    "dash.allSites": "Tous les segments surveillés", "dash.active": "Actifs", "dash.search": "Rechercher des segments…", "dash.filterRisk": "Risque :", "dash.filterAll": "Tous les niveaux", "dash.filterFlags": "Alertes :", "dash.flagAll": "Toutes", "dash.flagHas": "Avec alertes (> 0)", "dash.flagClean": "Sans alertes (0)", "dash.exportCsv": "Exporter le CSV", "dash.colSite": "Site du bassin", "dash.colRisk": "Niveau de risque", "dash.colIndex": "Indice Une seule santé", "dash.colConf": "Confiance", "dash.colObs": "Observations", "dash.colFlags": "Avec alertes", "dash.colAvg": "Risque moyen", "dash.colUpdate": "Dernière mise à jour", "dash.colAction": "Action", "dash.inspect": "Inspecter la carte", "dash.showing": "Affichage de {n} sur {total} sites surveillés", "dash.fhir": "Profil d’observation FHIR interopérable v1.2",
  },
  it: {
    "nav.overview": "Panoramica", "nav.cards": "Schede d’impatto", "nav.audit": "Traccia di audit", "nav.trends": "Tendenze", "nav.onehealth": "One Health", "nav.dashboard": "Dashboard", "nav.map": "Mappa",
    "brand.subtitle": "Telemetria dei cittadini dai corsi d’acqua all’azione clinica FHIR spiegabile", "ctrl.rerun": "Esegui di nuovo la pipeline", "ctrl.running": "In esecuzione…", "ctrl.csv": "CSV", "ctrl.dark": "Scuro", "ctrl.light": "Chiaro",
    "status.online": "Online", "status.pwaReady": "Online · cache", "status.offline": "Offline · cache",
    "status.onlineHelp": "Connessione API disponibile.", "status.offlineHelp": "L’app e le letture recenti restano disponibili. Le nuove osservazioni non sono ancora accodate.",
    "capture.button": "Rilievo sul campo", "capture.kicker": "Osservazione pronta offline", "capture.title": "Registra osservazione", "capture.subtitle": "Salva localmente offline e sincronizza quando torna la connessione.", "capture.close": "Chiudi", "capture.site": "Sito di ricerca", "capture.ph": "pH", "capture.oxygen": "Ossigeno disciolto (mg/L)", "capture.temperature": "Temperatura dell’acqua (°C)", "capture.rating": "Valutazione generale", "capture.pending": "osservazione(i) in attesa", "capture.save": "Salva osservazione", "capture.saving": "Salvataggio…", "capture.sync": "Sincronizza", "capture.savedPending": "Salvata localmente. Sincronizzazione in corso.", "capture.savedOffline": "Salvata offline. Verrà sincronizzata al ritorno della connessione.", "capture.synced": "Osservazione sincronizzata.", "capture.syncFailed": "Salvata localmente; nuovo tentativo più tardi.", "capture.queueError": "Impossibile accedere allo spazio locale.", "capture.media": "Foto o video", "capture.mediaHint": "Prova opzionale, massimo 5 MB per file.", "capture.mediaError": "Ogni file deve essere leggibile e non superare 5 MB.",
    "card.listen": "Ascolta valutazione", "card.pause": "Pausa", "card.resume": "Riprendi", "card.stop": "Ferma", "card.includeDetail": "Includi dettagli", "card.reading": "Lettura {cur} di {total}",
    "pillar.why": "Perché è importante", "pillar.actions": "Azioni consigliate", "notice.sync": "Telemetria continua sincronizzata: 1.428 osservazioni e 7 segmenti fluviali normalizzati.",
    "dash.priorityTitle": "Siti prioritari questa settimana", "dash.prioritySub": "Ordinati dinamicamente in base all’indice di rischio One Health, ai flag di validazione irrisolti e alla recenza delle osservazioni.", "dash.liveRanked": "Classifica in tempo reale", "dash.summaryTotal": "Siti monitorati", "dash.summaryHigh": "Rischio alto (indice ≥ 0,55)", "dash.summaryModerate": "Rischio moderato (0,25 - 0,54)", "dash.summaryLow": "Rischio basso (0,00 - 0,24)", "dash.summaryFlagged": "Siti con segnalazioni", "dash.catchments": "Bacini idrografici", "dash.triggerProtocols": "Attiva protocolli automatici", "dash.elevatedWatch": "Priorità di sorveglianza elevata", "dash.stableResilience": "Resilienza biotica stabile", "dash.auditableAnomalies": "Anomalie dei sensori verificabili",
    "dash.riskDistribution": "Distribuzione del rischio", "dash.riskDistributionSub": "Proporzione delle zone monitorate del bacino nelle fasce di rischio.", "dash.riskIndexBySite": "Indice di rischio per sito", "dash.riskIndexBySiteSub": "Indice sintetico basato su 30% acqua, 30% biologia, 20% esposizione umana e 20% pressione ambientale.", "dash.flagsPerSite": "Flag di validazione per sito", "dash.flagsPerSiteSub": "Anomalie totali rilevate nella calibrazione del pH, nei limiti dell’ossigeno disciolto e nella deriva dei sensori.",
    "dash.allSites": "Tutti i segmenti monitorati", "dash.active": "Attivi", "dash.search": "Cerca segmenti…", "dash.filterRisk": "Rischio:", "dash.filterAll": "Tutti i livelli", "dash.filterFlags": "Segnalazioni:", "dash.flagAll": "Tutte", "dash.flagHas": "Con segnalazioni (> 0)", "dash.flagClean": "Senza segnalazioni (0)", "dash.exportCsv": "Esporta CSV", "dash.colSite": "Sito del bacino", "dash.colRisk": "Livello di rischio", "dash.colIndex": "Indice One Health", "dash.colConf": "Affidabilità", "dash.colObs": "Osservazioni", "dash.colFlags": "Con segnalazioni", "dash.colAvg": "Rischio medio", "dash.colUpdate": "Ultimo aggiornamento", "dash.colAction": "Azione", "dash.inspect": "Ispeziona scheda", "dash.showing": "Visualizzazione di {n} siti su {total} monitorati", "dash.fhir": "Profilo di osservazione FHIR interoperabile v1.2",
  },
  nl: {
    "nav.overview": "Overzicht", "nav.cards": "Impactkaarten", "nav.audit": "Audittrail", "nav.trends": "Trends", "nav.onehealth": "One Health", "nav.dashboard": "Dashboard", "nav.map": "Kaart",
    "brand.subtitle": "Burgertelemetrie van beek tot uitlegbare klinische FHIR-actie", "ctrl.rerun": "Pipeline opnieuw uitvoeren", "ctrl.running": "Bezig…", "ctrl.csv": "CSV", "ctrl.dark": "Donker", "ctrl.light": "Licht",
    "status.online": "Online", "status.pwaReady": "Online · cache", "status.offline": "Offline · cache",
    "status.onlineHelp": "Live API-verbinding beschikbaar.", "status.offlineHelp": "De app en recente lezingen blijven beschikbaar. Nieuwe observaties worden nog niet in de wachtrij geplaatst.",
    "capture.button": "Veldmeting", "capture.kicker": "Offline-klare observatie", "capture.title": "Waterobservatie registreren", "capture.subtitle": "Sla lokaal op zonder verbinding en synchroniseer zodra het netwerk terug is.", "capture.close": "Sluiten", "capture.site": "Onderzoekslocatie", "capture.ph": "pH", "capture.oxygen": "Opgeloste zuurstof (mg/L)", "capture.temperature": "Watertemperatuur (°C)", "capture.rating": "Algemene beoordeling", "capture.pending": "observatie(s) wachten op synchronisatie", "capture.save": "Observatie opslaan", "capture.saving": "Opslaan…", "capture.sync": "Synchroniseren", "capture.savedPending": "Lokaal opgeslagen. Synchronisatie gestart.", "capture.savedOffline": "Offline opgeslagen. Synchroniseert zodra u weer verbonden bent.", "capture.synced": "Observatie gesynchroniseerd.", "capture.syncFailed": "Lokaal opgeslagen; later opnieuw proberen.", "capture.queueError": "Lokale opslag is niet beschikbaar.", "capture.media": "Foto's of video", "capture.mediaHint": "Optioneel bewijs, maximaal 5 MB per bestand.", "capture.mediaError": "Elk bestand moet leesbaar zijn en maximaal 5 MB groot zijn.",
    "card.listen": "Beoordeling beluisteren", "card.pause": "Pauzeren", "card.resume": "Hervatten", "card.stop": "Stoppen", "card.includeDetail": "Details opnemen", "card.reading": "Meting {cur} van {total}",
    "pillar.why": "Waarom dit belangrijk is", "pillar.actions": "Aanbevolen acties", "notice.sync": "Continue telemetrie gesynchroniseerd: 1.428 waarnemingen en 7 riviersegmenten genormaliseerd.",
    "dash.priorityTitle": "Prioritaire locaties deze week", "dash.prioritySub": "Dynamisch gerangschikt op basis van de One Health-risico-index, onopgeloste validatiemeldingen en de actualiteit van waarnemingen.", "dash.liveRanked": "Live rangschikking", "dash.summaryTotal": "Bewaakte locaties", "dash.summaryHigh": "Hoog risico (index ≥ 0,55)", "dash.summaryModerate": "Gemiddeld risico (0,25 - 0,54)", "dash.summaryLow": "Laag risico (0,00 - 0,24)", "dash.summaryFlagged": "Locaties met meldingen", "dash.catchments": "Stroomgebieden", "dash.triggerProtocols": "Automatische protocollen activeren", "dash.elevatedWatch": "Verhoogde bewakingsprioriteit", "dash.stableResilience": "Stabiele biotische veerkracht", "dash.auditableAnomalies": "Controleerbare sensoranomalieën",
    "dash.riskDistribution": "Risicoverdeling", "dash.riskDistributionSub": "Aandeel van bewaakte stroomgebiedzones per risicoklasse.", "dash.riskIndexBySite": "Risico-index per locatie", "dash.riskIndexBySiteSub": "Huidige samengestelde index op basis van 30% water, 30% biologie, 20% menselijke blootstelling en 20% milieudruk.", "dash.flagsPerSite": "Validatiemeldingen per locatie", "dash.flagsPerSiteSub": "Totaal aantal anomalieën in pH-kalibratie, opgeloste-zuurstoflimieten en sensordrift.",
    "dash.allSites": "Alle bewaakte segmenten", "dash.active": "Actief", "dash.search": "Segmenten zoeken…", "dash.filterRisk": "Risico:", "dash.filterAll": "Alle niveaus", "dash.filterFlags": "Meldingen:", "dash.flagAll": "Alle", "dash.flagHas": "Met meldingen (> 0)", "dash.flagClean": "Schoon (0 meldingen)", "dash.exportCsv": "CSV exporteren", "dash.colSite": "Stroomgebiedlocatie", "dash.colRisk": "Risiconiveau", "dash.colIndex": "One Health-index", "dash.colConf": "Betrouwbaarheid", "dash.colObs": "Waarnemingen", "dash.colFlags": "Met meldingen", "dash.colAvg": "Gemiddeld risico", "dash.colUpdate": "Laatste update", "dash.colAction": "Actie", "dash.inspect": "Kaart bekijken", "dash.showing": "{n} van {total} bewaakte locaties worden weergegeven", "dash.fhir": "Interoperabel FHIR-observatieprofiel v1.2",
  },
  no: {
    "nav.overview": "Oversikt", "nav.cards": "Påvirkningskort", "nav.audit": "Revisjonsspor", "nav.trends": "Trender", "nav.onehealth": "One Health", "nav.dashboard": "Dashbord", "nav.map": "Kart",
    "brand.subtitle": "Borgertelemetri fra vassdrag til forklarlig klinisk FHIR-handling", "ctrl.rerun": "Kjør pipeline på nytt", "ctrl.running": "Kjører…", "ctrl.csv": "CSV", "ctrl.dark": "Mørk", "ctrl.light": "Lys",
    "status.online": "Online", "status.pwaReady": "Online · hurtigbuffer", "status.offline": "Frakoblet · hurtigbuffer",
    "status.onlineHelp": "Direkte API-tilkobling er tilgjengelig.", "status.offlineHelp": "Appen og nylige avlesninger er fortsatt tilgjengelige. Nye observasjoner legges ikke i kø ennå.",
    "capture.button": "Feltmåling", "capture.kicker": "Offline-klar observasjon", "capture.title": "Registrer vannobservasjon", "capture.subtitle": "Lagre lokalt uten nett og synkroniser når forbindelsen kommer tilbake.", "capture.close": "Lukk", "capture.site": "Forskningssted", "capture.ph": "pH", "capture.oxygen": "Oppløst oksygen (mg/L)", "capture.temperature": "Vanntemperatur (°C)", "capture.rating": "Samlet vurdering", "capture.pending": "observasjon(er) venter på synkronisering", "capture.save": "Lagre observasjon", "capture.saving": "Lagrer…", "capture.sync": "Synkroniser", "capture.savedPending": "Lagret lokalt. Synkroniserer når mulig.", "capture.savedOffline": "Lagret uten nett. Synkroniseres når du kobler til igjen.", "capture.synced": "Observasjon synkronisert.", "capture.syncFailed": "Lagret lokalt; prøver igjen senere.", "capture.queueError": "Kunne ikke åpne lokal lagring.", "capture.media": "Foto eller video", "capture.mediaHint": "Valgfritt bevis, maks 5 MB per fil.", "capture.mediaError": "Hver fil må kunne leses og være maksimalt 5 MB.",
    "card.listen": "Lytt til vurdering", "card.pause": "Pause", "card.resume": "Fortsett", "card.stop": "Stopp", "card.includeDetail": "Ta med detaljer", "card.reading": "Avlesning {cur} av {total}",
    "pillar.why": "Hvorfor det er viktig", "pillar.actions": "Anbefalte tiltak", "notice.sync": "Kontinuerlig telemetri synkronisert: 1 428 observasjoner og 7 elvestrekninger normalisert.",
    "dash.priorityTitle": "Prioriterte steder denne uken", "dash.prioritySub": "Rangert dynamisk etter One Health-risikoindeks, uløste valideringsflagg og hvor nylige observasjonene er.", "dash.liveRanked": "Direkte rangering", "dash.summaryTotal": "Overvåkede steder", "dash.summaryHigh": "Høy risiko (indeks ≥ 0,55)", "dash.summaryModerate": "Moderat risiko (0,25 - 0,54)", "dash.summaryLow": "Lav risiko (0,00 - 0,24)", "dash.summaryFlagged": "Steder med flagg", "dash.catchments": "Nedbørfelt", "dash.triggerProtocols": "Utløs automatiske protokoller", "dash.elevatedWatch": "Forhøyet overvåkingsprioritet", "dash.stableResilience": "Stabil biologisk motstandskraft", "dash.auditableAnomalies": "Sporbare sensoranomalier",
    "dash.riskDistribution": "Risiko- fordeling", "dash.riskDistributionSub": "Andel av overvåkede nedbørfeltsområder i ulike risikoklasser.", "dash.riskIndexBySite": "Risikoindeks per sted", "dash.riskIndexBySiteSub": "Gjeldende sammensatt indeks basert på 30% vann, 30% biologi, 20% menneskelig eksponering og 20% miljøbelastning.", "dash.flagsPerSite": "Valideringsflagg per sted", "dash.flagsPerSiteSub": "Totalt antall anomalier funnet i pH-kalibrering, grenser for oppløst oksygen og sensordrift.",
    "dash.allSites": "Alle overvåkede strekninger", "dash.active": "Aktive", "dash.search": "Søk etter strekninger…", "dash.filterRisk": "Risiko:", "dash.filterAll": "Alle nivåer", "dash.filterFlags": "Flagg:", "dash.flagAll": "Alle", "dash.flagHas": "Har flagg (> 0)", "dash.flagClean": "Uten flagg (0)", "dash.exportCsv": "Eksporter CSV", "dash.colSite": "Nedbørfeltsted", "dash.colRisk": "Risikonivå", "dash.colIndex": "One Health-indeks", "dash.colConf": "Konfidens", "dash.colObs": "Observasjoner", "dash.colFlags": "Med flagg", "dash.colAvg": "Gjennomsnittlig risiko", "dash.colUpdate": "Siste oppdatering", "dash.colAction": "Handling", "dash.inspect": "Åpne kort", "dash.showing": "Viser {n} av {total} overvåkede steder", "dash.fhir": "Interoperabel FHIR-observasjonsprofil v1.2",
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