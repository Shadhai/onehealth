import { createContext, useContext, useEffect, useState } from "react";

const LangCtx = createContext({ lang: "en", set: () => {} });
const LANG_KEY = "ohl-lang";

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(
    () => (typeof window !== "undefined" && localStorage.getItem(LANG_KEY)) || "en"
  );

  useEffect(() => {
    const onSwitch = (e) => setLangState(e.detail);
    window.addEventListener("ohl-lang-change", onSwitch);
    return () => window.removeEventListener("ohl-lang-change", onSwitch);
  }, []);

  const set = (code) => {
    setLangState(code);
    localStorage.setItem(LANG_KEY, code);
    document.documentElement.setAttribute("lang", code);
    window.dispatchEvent(new CustomEvent("ohl-lang-change", { detail: code }));
  };

  return <LangCtx.Provider value={{ lang, set }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}