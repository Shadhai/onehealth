import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByText(/Watershed Risk/i)).toBeVisible({ timeout: 15_000 });
  });

  test("shows KPI cards with site count", async ({ page }) => {
    await expect(page.getByText(/Monitored Sites/i).first()).toBeVisible();
    const value = await page
      .locator("text=/Monitored Sites/i")
      .first()
      .locator("xpath=..")
      .locator("strong, span")
      .first()
      .textContent();
    expect(Number(value)).toBeGreaterThan(0);
  });

  test("shows all monitored segments in the table", async ({ page }) => {
    const rows = page.locator("table.data tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test("search filters the table", async ({ page }) => {
    const initial = await page.locator("table.data tbody tr").count();
    await page.getByPlaceholder(/Search/i).first().fill("Segment 4");
    await page.waitForTimeout(300);
    const filtered = await page.locator("table.data tbody tr").count();
    expect(filtered).toBeLessThan(initial);
    expect(filtered).toBeGreaterThan(0);
  });

  test("clicking a row navigates to the impact card", async ({ page }) => {
    await page.locator("table.data tbody tr").first().click();
    await expect(page).toHaveURL(/\/cards/);
  });
});
