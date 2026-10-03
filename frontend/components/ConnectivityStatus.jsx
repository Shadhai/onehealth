import { useEffect, useState } from "react";
import { useLang } from "../lib/LangContext.jsx";
import { t } from "../lib/i18n.js";

function readOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

export default function ConnectivityStatus() {
  const { lang } = useLang();
  const [online, setOnline] = useState(readOnline);
  const [cached, setCached] = useState(false);

  useEffect(() => {
    const update = () => setOnline(readOnline());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    if ("serviceWorker" in navigator) {
      setCached(Boolean(navigator.serviceWorker.controller));
      const onControllerChange = () => setCached(true);
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      return () => {
        window.removeEventListener("online", update);
        window.removeEventListener("offline", update);
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      };
    }

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const label = online
    ? cached
      ? t(lang, "status.pwaReady")
      : t(lang, "status.online")
    : t(lang, "status.offline");

  return (
    <div
      className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-mono-code ${
        online
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
          : "border-amber-400/30 bg-amber-500/10 text-amber-200"
      }`}
      title={online ? t(lang, "status.onlineHelp") : t(lang, "status.offlineHelp")}
      role="status"
      aria-live="polite"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
      <span>{label}</span>
    </div>
  );
}
