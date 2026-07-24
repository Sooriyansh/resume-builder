import { expect, test } from "@playwright/test";

test("landing page links to registration", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /strongest application/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /analyze my resume/i })).toHaveAttribute("href", "/register");
});
