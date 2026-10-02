import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";
import { LangProvider } from "../lib/LangContext.jsx";

vi.mock("../lib/api.js", async () => {
  const actual = await vi.importActual("../lib/api.js");
  return {
    ...actual,
    API: {
      summary: () => Promise.resolve({ pipeline: { normalized: 15, bundles: 15 }, sites: { total: 7, high_risk: 2, flagged_observations: 5 } }),
      sites: () => Promise.resolve([
        { site: "Test Site A", latest_risk_index: 0.8, latest_risk_level: "High", observation_count: 10, flagged_observation_count: 2, latest_observation_id: "abc123", latest_confidence: "High", avg_risk_index: 0.7, latest_generated_at: new Date().toISOString(), latitude: 59.9, longitude: 10.7, latest_risk_colour: "red" },
        { site: "Test Site B", latest_risk_index: 0.3, latest_risk_level: "Moderate", observation_count: 5, flagged_observation_count: 0, latest_observation_id: "def456", latest_confidence: "Medium", avg_risk_index: 0.35, latest_generated_at: new Date().toISOString(), latitude: 59.8, longitude: 10.6, latest_risk_colour: "yellow" },
      ]),
      insights: () => Promise.resolve([]),
      insight: () => Promise.resolve(null),
      trends: () => Promise.resolve([]),
      flags: () => Promise.resolve(null),
      priority: () => Promise.resolve([]),
      fhirUrl: (id) => `/fhir/${id}`,
      csvUrl: () => "/api/export/csv",
      rerun: () => Promise.resolve(),
    },
  };
});

beforeEach(() => {
  window.history.pushState({}, "", "/dashboard");
  localStorage.clear();
});

function renderApp() {
  return render(
    <LangProvider>
      <App />
    </LangProvider>
  );
}

describe("App shell", () => {
  it("renders without crashing", () => {
    const { container } = renderApp();
    expect(container.querySelector(".sticky")).toBeTruthy();
  });

  it("shows all 7 nav tabs", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByText("Impact Cards")).toBeInTheDocument();
    });
    expect(screen.getByText("Trends")).toBeInTheDocument();
    expect(screen.getByText("One Health")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Map")).toBeInTheDocument();
    expect(screen.getByText("Audit Trail")).toBeInTheDocument();
  });

  it("loads sites from the API and renders them in the dashboard", async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getAllByText("Test Site A").length).toBeGreaterThan(0);
    }, { timeout: 3000 });
    expect(screen.getAllByText("Test Site B").length).toBeGreaterThan(0);
  });

  it("switches theme when the theme toggle is clicked", async () => {
    const user = userEvent.setup();
    renderApp();
    const before = document.documentElement.getAttribute("data-theme");
    const themeBtn = screen.getByTitle(/toggle light \/ dark mode/i);
    await user.click(themeBtn);
    await waitFor(() => {
      const after = document.documentElement.getAttribute("data-theme");
      expect(after).not.toBe(before);
    });
  });

  it("switches language when PT is clicked", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(() => screen.getByText("Dashboard"));
    const ptBtn = screen.getAllByRole("button").find((b) => b.textContent.includes("PT"));
    expect(ptBtn).toBeTruthy();
    await user.click(ptBtn);
    await waitFor(() => {
      expect(screen.getByText("Painel")).toBeInTheDocument();
    });
  });

  it("shows and remembers the Impact Cards onboarding guide", async () => {
    const user = userEvent.setup();
    renderApp();
    await waitFor(() => screen.getByText("Impact Cards"));
    await user.click(screen.getByRole("button", { name: "Impact Cards" }));

    expect(await screen.findByRole("dialog", { name: /living system/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /explore impact cards/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("ohl-impact-cards-guide-seen")).toBe("true");
  });
});
