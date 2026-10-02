import { test, expect } from "@playwright/test";

test.describe("Impact Cards", () => {
  test("loads the segment list and first card", async ({ page }) => {
    await page.goto("/cards");
    await expect(page.getByText(/Monitored Segments/i)).toBeVisible({ timeout: 15_000 });
    const segments = page.locator("nav button");
    expect(await segments.count()).toBeGreaterThan(0);
  });

  test("clicking a segment loads its impact card", async ({ page }) => {
    await page.goto("/cards");
    await expect(page.getByText(/Monitored Segments/i)).toBeVisible({ timeout: 15_000 });
    await page.locator("nav button").first().click();
    await expect(page.getByText(/Multi-Pillar Evidence Triad/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Ecological/i).first()).toBeVisible();
    await expect(page.getByText(/Animal/i).first()).toBeVisible();
    await expect(page.getByText(/Human/i).first()).toBeVisible();
  });

  test("detail toggle shows reasons and actions", async ({ page }) => {
    await page.goto("/cards");
    await expect(page.getByText(/Monitored Segments/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Detailed/i }).first().click();
    const hasDetail = await page
      .getByText(/Diagnostic Triggers|Protocol Recommendations|Why this score/i)
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasDetail).toBe(true);
  });
});
