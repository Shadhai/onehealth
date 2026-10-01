import { describe, it, expect } from "vitest";
import { levelClass, levelText, urgencyInfo } from "../lib/api.js";

describe("levelClass", () => {
  it("returns red for High", () => {
    expect(levelClass("High")).toBe("red");
  });
  it("returns yellow for Moderate", () => {
    expect(levelClass("Moderate")).toBe("yellow");
  });
  it("returns green for anything else", () => {
    expect(levelClass("Low")).toBe("green");
    expect(levelClass(undefined)).toBe("green");
    expect(levelClass(null)).toBe("green");
  });
});

describe("levelText", () => {
  it("maps each level to a display string", () => {
    expect(levelText("High")).toBe("High Risk");
    expect(levelText("Moderate")).toBe("Moderate Risk");
    expect(levelText("Low")).toBe("Low Risk");
  });
});

describe("urgencyInfo", () => {
  it("returns ACT NOW for risk >= 0.55", () => {
    expect(urgencyInfo(0.55).key).toBe("ACT NOW");
    expect(urgencyInfo(0.99).key).toBe("ACT NOW");
  });
  it("returns MONITOR for risk 0.25 to 0.54", () => {
    expect(urgencyInfo(0.25).key).toBe("MONITOR");
    expect(urgencyInfo(0.54).key).toBe("MONITOR");
  });
  it("returns STABLE for risk below 0.25", () => {
    expect(urgencyInfo(0.0).key).toBe("STABLE");
    expect(urgencyInfo(0.1).key).toBe("STABLE");
  });
});
