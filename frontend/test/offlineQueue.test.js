import { describe, it, expect, beforeEach } from "vitest";
import {
  clearPendingObservations,
  listPendingObservations,
  queueObservation,
} from "../lib/offlineQueue.js";

describe("offline observation queue", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
  });

  it("stores and lists an observation when IndexedDB is unavailable", async () => {
    const observation = { submission_id: "FIELD-TEST-1", research_site: "Test Stream" };
    await queueObservation(observation);
    expect(await listPendingObservations()).toEqual([observation]);
  });

  it("removes only synchronized observation ids", async () => {
    await queueObservation({ submission_id: "FIELD-TEST-1" });
    await queueObservation({ submission_id: "FIELD-TEST-2" });
    await clearPendingObservations(["FIELD-TEST-1"]);
    expect(await listPendingObservations()).toEqual([{ submission_id: "FIELD-TEST-2" }]);
  });
});
