import { expect, test } from "@playwright/test";

// Happy path for a first-time anonymous visitor: from the planner form to a
// fully generated itinerary with a rendered map. Works without Supabase
// (accounts are optional) and without external routing (the map falls back to
// straight-line waypoints when OSRM is unreachable).
//
// We navigate straight to /plan with the start coordinates in the URL so the
// test does not depend on the geocoding autocomplete (network + timing).
test("anonymous visitor generates a trip from the planner", async ({ page }) => {
  const generateResponses: number[] = [];
  page.on("response", (res) => {
    if (res.url().includes("/api/trips/generate")) {
      generateResponses.push(res.status());
    }
  });

  await page.goto("/plan?from=Beograd&lat=44.7866&lng=20.4489&duration=2");

  // The prefilled start field opens its autocomplete; let it settle and close it.
  await page.waitForLoadState("networkidle");
  await page.keyboard.press("Escape");

  const generate = page.getByRole("button", { name: "Napravi mi plan" });
  await generate.scrollIntoViewIfNeeded();
  await generate.click();

  // Generation should complete without an auth wall for the first free trip.
  await expect(page).toHaveURL(/\/trip\//, { timeout: 60_000 });

  // The itinerary map renders (Leaflet when no Google key is set).
  await expect(page.locator(".leaflet-container")).toBeVisible({ timeout: 30_000 });

  expect(generateResponses).toContain(200);
});
