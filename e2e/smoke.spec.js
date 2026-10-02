import { test, expect } from "@playwright/test";

test.describe("App shell", () => {
  test("loads the dashboard by default", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Watershed Risk/i)).toBeVisible({ timeout: 15_000 });
  });

  test("shows all navigation tabs", async ({ page }) => {
    await page.goto("/dashboard");
    const tabs = [
      "Overview",
      "Impact Cards",
      "Trends",
      "One Health",
      "Dashboard",
      "Map",
      "Audit Trail",
    ];
    for (const tab of tabs) {
      await expect(
        page.getByRole("button", { name: new RegExp(tab, "i") }).first()
      ).toBeVisible();
    }
  });

  test("theme toggle changes the document theme", async ({ page }) => {
    await page.goto("/dashboard");
    const initial = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    await page.getByTitle(/theme/i).first().click();
    await page.waitForFunction(
      (previous) =>
        document.documentElement.getAttribute("data-theme") !== previous,
      initial
    );
    const next = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(next).not.toBe(initial);
  });
});
