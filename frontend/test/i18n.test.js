import { describe, it, expect } from "vitest";
import { STRINGS, t, LANGUAGES } from "../lib/i18n.js";

describe("i18n dictionary", () => {
  it("ships all supported languages", () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(["en", "pt", "fr", "it", "nl", "no"]);
  });

  it("has matching keys in every dictionary", () => {
    const enKeys = Object.keys(STRINGS.en).sort();
    for (const language of LANGUAGES) {
      expect(Object.keys(STRINGS[language.code]).sort()).toEqual(enKeys);
    }
  });

  it("t() returns the correct string for a known key", () => {
    expect(t("en", "nav.dashboard")).toBe("Dashboard");
    expect(t("pt", "nav.dashboard")).toBe("Painel");
  });

  it("t() falls back to English when a key is missing", () => {
    const original = STRINGS.pt["nav.map"];
    delete STRINGS.pt["nav.map"];
    expect(t("pt", "nav.map")).toBe("Map");
    STRINGS.pt["nav.map"] = original;
  });

  it("t() returns the key itself when unknown", () => {
    expect(t("en", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("t() interpolates variables", () => {
    expect(t("en", "dash.showing", { n: 5, total: 7 })).toContain("5");
    expect(t("en", "dash.showing", { n: 5, total: 7 })).toContain("7");
  });
});
