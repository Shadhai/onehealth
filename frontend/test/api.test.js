import { describe, it, expect } from "vitest";
import { API } from "../lib/api.js";

describe("API module", () => {
  it("exposes all required endpoints", () => {
    expect(typeof API.sites).toBe("function");
    expect(typeof API.summary).toBe("function");
    expect(typeof API.insights).toBe("function");
    expect(typeof API.insight).toBe("function");
    expect(typeof API.trends).toBe("function");
    expect(typeof API.flags).toBe("function");
    expect(typeof API.priority).toBe("function");
    expect(typeof API.rerun).toBe("function");
  });

  it("builds the correct FHIR URL", () => {
    expect(API.fhirUrl("abc123")).toBe("/fhir/abc123");
  });

  it("builds the correct CSV URL with no site", () => {
    expect(API.csvUrl()).toBe("/api/export/csv");
  });

  it("builds the correct CSV URL with a site", () => {
    expect(API.csvUrl("Riverdale Creek")).toBe(
      "/api/export/csv?site=Riverdale%20Creek"
    );
  });
});
