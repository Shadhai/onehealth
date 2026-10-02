import { test, expect } from "@playwright/test";

test.describe("Cross-page navigation", () => {
  const routes = [
    { tab: "Overview", path: /\/overview/, anchor: /From streams/i },
    { tab: "Impact Cards", path: /\/cards/, anchor: /Monitored Segments/i },
    { tab: "Trends", path: /\/trends/, anchor: /Catchment Telemetry Trends/i },
    { tab: "One Health", path: /\/onehealth/, anchor: /Cross-Domain One Health/i },
    { tab: "Dashboard", path: /\/dashboard/, anchor: /Watershed Risk/i },
    { tab: "Map", path: /\/map/, anchor: /Catchment Spatial Monitoring/i },
    { tab: "Audit Trail", path: /\/audit/, anchor: /Observation Journey/i },
  ];

  for (const { tab, path, anchor } of routes) {
    test(`navigates to ${tab}`, async ({ page }) => {
      await page.goto("/dashboard");
      await page
        .getByRole("button", { name: new RegExp(`^${tab}$`, "i") })
        .first()
        .click();
      await expect(page).toHaveURL(path, { timeout: 10_000 });
      await expect(page.getByText(anchor).first()).toBeVisible({ timeout: 15_000 });
    });
  }
});
