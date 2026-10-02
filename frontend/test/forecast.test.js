import { describe, expect, it } from "vitest";
import { forecastRisk } from "../lib/forecast.js";

const series = [
  { generated_at: "2026-09-01T00:00:00Z", risk_index: 0.2 },
  { generated_at: "2026-09-02T00:00:00Z", risk_index: 0.3 },
  { generated_at: "2026-09-03T00:00:00Z", risk_index: 0.4 },
];

describe("forecastRisk", () => {
  it("projects seven days from a linear trend", () => {
    const result = forecastRisk(series);

    expect(result.available).toBe(true);
    expect(result.predictions).toHaveLength(7);
    expect(result.slopePerDay).toBe(0.1);
    expect(result.predictions[0].risk_index).toBe(0.5);
    expect(result.predictions[6].risk_index).toBe(1);
    expect(result.rSquared).toBe(1);
  });

  it("sorts points and ignores invalid observations", () => {
    const result = forecastRisk([
      series[2],
      { generated_at: "invalid", risk_index: 0.9 },
      series[0],
      series[1],
    ], 2);

    expect(result.predictions.map((point) => point.risk_index)).toEqual([0.5, 0.6]);
  });

  it("returns unavailable when fewer than two valid points exist", () => {
    expect(forecastRisk([{ generated_at: series[0].generated_at, risk_index: 0.2 }]).available).toBe(false);
  });
});
