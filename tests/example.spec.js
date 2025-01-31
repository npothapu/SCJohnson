// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';


test("Visual Testing Verification", async ({ page, browserName }) => {
  test.setTimeout(60000); // Reduce timeout to 60 seconds for efficiency
  await page.goto("https://www.scjohnson.com/", { waitUntil: "domcontentloaded" });

  // Get current date and time for filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `scjohnson_${browserName}_${timestamp}.png`;
  
  // Define output directory outside the tests folder
  const outputDir = path.join(__dirname, "..", "screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get the full page height and adjust viewport
  const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1920, height: Math.min(bodyHeight, 5000) }); // Limit height to avoid performance issues

  // Scroll in sections to ensure content loads
  let totalScrolled = 0;
  while (totalScrolled < bodyHeight) {
    await page.evaluate((distance) => window.scrollBy(0, distance), 800);
    totalScrolled += 800;
    await page.waitForTimeout(300); // Small delay to allow loading
  }

  // Capture screenshot in sections if too long
  const filePath = path.join(outputDir, filename);
  await page.screenshot({ path: filePath, fullPage: true });

  console.log(`Screenshot saved at: ${filePath}`);
});
