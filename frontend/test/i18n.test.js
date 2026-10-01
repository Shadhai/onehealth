import { describe, it, expect } from "vitest";
import { STRINGS, t, LANGUAGES } from "../lib/i18n.js";

describe("i18n dictionary", () => {
  it("ships at least two languages", () => {
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(2);
    expect(LANGUAGES.map((l) => l.code)).toContain("en");
    expect(LANGUAGES.map((l) => l.code)).toContain("pt");
  });

  it("has matching keys in EN and PT", () => {
    const enKeys = Object.keys(STRINGS.en).sort();
    const ptKeys = Object.keys(STRINGS.pt).sort();
    for (const key of enKeys) {
      expect(ptKeys).toContain(key);
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
