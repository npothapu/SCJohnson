/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Date: January 30, 2025
 */

const path = require("path");
const fs = require("fs");
const resemble = require("resemblejs");
require("dotenv").config({ path: path.resolve(__dirname, `../../env/.env.${process.env.ENV || 'dev'}`) });

/**
 * Captures and compares a screenshot of the given page.
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @param {string} testName - Unique identifier for the test case.
 * @param {string} browserName - Browser name for screenshot comparison.
 */
async function captureAndCompareScreenshot(page, testName, browserName) {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
        console.error(`❌ BASE_URL is not set in the environment file (.env.${process.env.ENV || 'dev'})`);
        throw new Error("BASE_URL is missing in the environment configuration!");
    }

    const outputDir = path.join(__dirname, "..", "screenshots"); // Updated path
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const baselineImagePath = path.join(outputDir, `${testName}_baseline.png`);
    const newImagePath = path.join(outputDir, `${testName}_${browserName}.png`);

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    // Adjust viewport to capture full page height
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewportSize({ width: 1920, height: Math.min(bodyHeight, 5000) });

    // Scroll to load all content
    let totalScrolled = 0;
    while (totalScrolled < bodyHeight) {
        await page.evaluate((distance) => window.scrollBy(0, distance), 800);
        totalScrolled += 800;
        await page.waitForTimeout(300);
    }

    // Capture Screenshot
    await page.screenshot({ path: newImagePath, fullPage: true });
    console.log(`📸 Screenshot saved at: ${newImagePath}`);

    // Compare with baseline
    if (fs.existsSync(baselineImagePath)) {
        resemble(fs.readFileSync(baselineImagePath))
            .compareTo(fs.readFileSync(newImagePath))
            .onComplete((data) => {
                if (data.misMatchPercentage > 0) {
                    console.error(`❌ Images differ by ${data.misMatchPercentage}%`);
                    throw new Error("Visual mismatch detected!");
                } else {
                    console.log("✅ Screenshots match!");
                }
            });
    } else {
        console.warn("⚠️ Baseline image not found. Saving current screenshot as baseline.");
        fs.copyFileSync(newImagePath, baselineImagePath);
    }
}

module.exports = { captureAndCompareScreenshot };
