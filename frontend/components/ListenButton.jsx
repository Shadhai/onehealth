import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/LangContext.jsx";
import { t } from "../lib/i18n.js";

const SPEECH_SUPPORTED =
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof window.SpeechSynthesisUtterance !== "undefined";

function buildNarration(card, includeDetail, lang) {
  if (!card) return [];

  const chunks = [];
  const tr = (k, vars) => t(lang, k, vars);

  chunks.push(`${tr("oh.heading")}: ${card.site}.`);
  chunks.push(
    `${tr("risk." + card.risk.level.toLowerCase())}, ${Number(card.risk.index).toFixed(2)}, ${tr("confidence.label")}: ${tr("confidence." + card.confidence.toLowerCase())}.`
  );

  const order = ["ecosystem", "animal", "human"];
  order.forEach((domain, i) => {
    const col = card.columns?.find((c) => c.domain === domain);
    if (!col) return;

    chunks.push(`${i + 1}. ${col.title}.`);
    chunks.push(`${col.level}. ${Number(col.score).toFixed(2)}.`);
    if (col.summary) chunks.push(col.summary);

    if (includeDetail) {
      if (col.reasons?.length) {
        chunks.push(tr("pillar.why"));
        col.reasons.forEach((r) => chunks.push(r));
      }
      if (col.actions?.length) {
        chunks.push(tr("pillar.actions"));
        col.actions.forEach((a) => chunks.push(a));
      }
    }
  });

  if (card.causal_chain?.length) {
    card.causal_chain.forEach((link) => {
      chunks.push(`${link.from} → ${link.to}: ${link.description}`);
    });
  }

  return chunks;
}

export default function ListenButton({ card }) {
  const { lang } = useLang();
  const tr = (k, vars) => t(lang, k, vars);

  const [state, setState] = useState("idle");
  const [includeDetail, setIncludeDetail] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const sessionRef = useRef(0);

  useEffect(() => {
    return () => {
      if (SPEECH_SUPPORTED) {
        sessionRef.current += 1;
        window.speechSynthesis.cancel();
      }
    };
  }, [card?.observation_id]);

  if (!SPEECH_SUPPORTED) return null;

  const speakFrom = (index, session, chunks) => {
    if (session !== sessionRef.current) return;
    if (index >= chunks.length) {
      setState("idle");
      setProgress({ current: 0, total: 0 });
      return;
    }

    const utter = new window.SpeechSynthesisUtterance(chunks[index]);

    // Pick the right voice for the language.
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      const langPrefix = lang === "pt" ? "pt" : "en";
      const preferred =
        voices.find((v) => v.lang?.startsWith(langPrefix) && /google|natural|neural/i.test(v.name)) ||
        voices.find((v) => v.lang?.startsWith(langPrefix));
      if (preferred) {
        utter.voice = preferred;
        utter.lang = preferred.lang;
      } else {
        utter.lang = lang === "pt" ? "pt-PT" : "en-GB";
      }
    } catch {
      utter.lang = lang === "pt" ? "pt-PT" : "en-GB";
    }

    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    utter.onend = () => {
      if (session !== sessionRef.current) return;
      setProgress({ current: index + 1, total: chunks.length });
      speakFrom(index + 1, session, chunks);
    };

    utter.onerror = () => {
      if (session !== sessionRef.current) return;
      setState("idle");
    };

    window.speechSynthesis.speak(utter);
  };

  const handlePlayPause = () => {
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
      return;
    }
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }

    window.speechSynthesis.cancel();
    sessionRef.current += 1;
    const session = sessionRef.current;
    const chunks = buildNarration(card, includeDetail, lang);
    if (!chunks.length) return;

    setProgress({ current: 0, total: chunks.length });
    setState("playing");
    speakFrom(0, session, chunks);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    sessionRef.current += 1;
    setState("idle");
    setProgress({ current: 0, total: 0 });
  };

  const label =
    state === "playing" ? `⏸ ${tr("card.pause")}`
    : state === "paused" ? `▶ ${tr("card.resume")}`
    : `🔊 ${tr("card.listen")}`;

  return (
    <div className="listen-control">
      <button
        type="button"
        className="btn-outline listen-btn"
        onClick={handlePlayPause}
        aria-label={label}
      >
        {label}
      </button>

      {state !== "idle" && (
        <button
          type="button"
          className="btn-outline listen-stop"
          onClick={handleStop}
          aria-label={tr("card.stop")}
        >
          ⏹ {tr("card.stop")}
        </button>
      )}

      <label className="listen-detail">
        <input
          type="checkbox"
          checked={includeDetail}
          onChange={(e) => setIncludeDetail(e.target.checked)}
          disabled={state !== "idle"}
        />
        {tr("card.includeDetail")}
      </label>

      {state !== "idle" && progress.total > 0 && (
        <span className="listen-progress" role="status" aria-live="polite">
          {tr("card.reading", { cur: progress.current, total: progress.total })}
        </span>
      )}
    </div>
  );
}