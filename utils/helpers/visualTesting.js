/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Date: February 4, 2025
 */

const path = require("path");
const fs = require("fs");
const resemble = require("resemblejs");
const dotenv = require("dotenv");

// Load environment variables safely
const envPath = path.resolve(__dirname, `../../env/.env.${process.env.ENV || "dev"}`);
dotenv.config({ path: envPath });

// Validate required environment variables
const requiredEnvVars = ["BASE_URL", "FOLDER_NAME"];
requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`⚠️ Missing required environment variable: ${key}`);
    }
});

const BASE_URL = process.env.BASE_URL;
const FOLDER_NAME = process.env.FOLDER_NAME;
const FOLDER_PATH = path.resolve(__dirname, `../data/url_batches/${FOLDER_NAME}`);

/**
 * Captures and compares a screenshot of the given page.
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @param {string} testName - Unique identifier for the test case.
 * @param {string} browserName - Browser name for screenshot comparison.
 */
async function captureAndCompareScreenshot(page, testName, browserName) {
    if (!BASE_URL) {
        throw new Error("❌ BASE_URL is missing in the environment configuration!");
    }

    const outputDir = path.join(__dirname, "..", "screenshots");
    fs.mkdirSync(outputDir, { recursive: true });

    const baselineImagePath = path.join(outputDir, `${testName}_baseline.png`);
    const newImagePath = path.join(outputDir, `${testName}_${browserName}.png`);

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    // Adjust viewport for full-page capture
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
        const diff = await new Promise((resolve) => {
            resemble(fs.readFileSync(baselineImagePath))
                .compareTo(fs.readFileSync(newImagePath))
                .onComplete(resolve);
        });

        if (diff.misMatchPercentage > 0) {
            throw new Error(`❌ Visual mismatch detected! Images differ by ${diff.misMatchPercentage}%`);
        }
        console.log("✅ Screenshots match!");
    } else {
        console.warn("⚠️ Baseline image not found. Saving current screenshot as baseline.");
        fs.copyFileSync(newImagePath, baselineImagePath);
    }
}

module.exports = { captureAndCompareScreenshot };
