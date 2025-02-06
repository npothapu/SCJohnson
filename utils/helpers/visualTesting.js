/**
 * Author: Nandakumar Reddy
 * Title: Associate Director of Technology
 * Description:  Screenshot Comparison Utility
 * 
 * This script captures screenshots of web pages using Playwright and compares them
 * against baseline images stored in the `baseline_snapshots` directory. If it's the first run,
 * it saves the screenshot as a baseline. Otherwise, it compares the new screenshot
 * against the baseline using `resemblejs` and reports any visual mismatches.
 * 
 * Features:
 * - Automatically creates necessary directories (`baseline_snapshots`, `current_snapshots`, & `diffs`).
 * - Captures full-page screenshots.
 * - Saves first-time screenshots as baselines.
 * - Compares new screenshots with baselines and generates a diff image.
 * - Generates an HTML report to visually compare images.
 * - Throws an error if mismatches are detected.
 * - Logs paths of the new, original, and diff images for easy reference.
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

// Define paths for original, new snapshots, diffs, and reports
const BASELINE_SNAPSHOTS_DIR = path.join(__dirname, "..", "visual_tests", "baseline_snapshots");
const CURRENT_SNAPSHOTS_DIR = path.join(__dirname, "..", "visual_tests", "current_snapshots");
const DIFFS_DIR = path.join(__dirname, "..", "visual_tests", "diffs");
const REPORTS_DIR = path.join(__dirname, "..", "visual_tests", "reports");
fs.mkdirSync(BASELINE_SNAPSHOTS_DIR, { recursive: true });
fs.mkdirSync(CURRENT_SNAPSHOTS_DIR, { recursive: true });
fs.mkdirSync(DIFFS_DIR, { recursive: true });
fs.mkdirSync(REPORTS_DIR, { recursive: true });

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

    const originalImagePath = path.join(BASELINE_SNAPSHOTS_DIR, `${testName}_baseline.png`);
    const newImagePath = path.join(CURRENT_SNAPSHOTS_DIR, `${testName}_${browserName}.png`);
    const diffImagePath = path.join(DIFFS_DIR, `${testName}_diff.png`);
    const reportPath = path.join(REPORTS_DIR, `${testName}_report.html`);

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
    console.log(`📸 New screenshot saved at: ${newImagePath}`);

    // If first-time run, save the image to baseline_snapshots
    if (!fs.existsSync(originalImagePath)) {
        console.warn("⚠️ No baseline snapshot found. Saving current screenshot as the baseline.");
        fs.copyFileSync(newImagePath, originalImagePath);
        console.log("✅ Baseline snapshot saved.");
        return;
    }

    // Compare with baseline snapshot and generate diff image
    const diff = await new Promise((resolve) => {
        resemble(fs.readFileSync(originalImagePath))
            .compareTo(fs.readFileSync(newImagePath))
            .outputSettings({
                errorType: "movement",
                transparency: 0.3,
                largeImageThreshold: 1200,
                useCrossOrigin: false,
                outputDiff: true
            })
            .onComplete(resolve);
    });

    // Save diff image
    fs.writeFileSync(diffImagePath, diff.getBuffer());
    console.log(`📊 Diff image saved at: ${diffImagePath}`);

    // Generate HTML report for visual comparison
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visual Comparison Report - ${testName}</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; }
            .container { display: flex; justify-content: center; gap: 20px; }
            .image-box { text-align: center; }
            img { max-width: 100%; border: 1px solid #ccc; }
        </style>
    </head>
    <body>
        <h1>Visual Comparison Report - ${testName}</h1>
        <div class="container">
            <div class="image-box">
                <h2>Baseline Image</h2>
                <img src="../baseline_snapshots/${testName}_baseline.png" alt="Baseline Image">
            </div>
            <div class="image-box">
                <h2>New Image</h2>
                <img src="../current_snapshots/${testName}_${browserName}.png" alt="New Image">
            </div>
            <div class="image-box">
                <h2>Difference</h2>
                <img src="../diffs/${testName}_diff.png" alt="Diff Image">
            </div>
        </div>
    </body>
    </html>
    `;
    fs.writeFileSync(reportPath, htmlContent);
    console.log(`📄 HTML report saved at: ${reportPath}`);

    if (diff.misMatchPercentage > 0) {
        throw new Error(`❌ Visual mismatch detected! Images differ by ${diff.misMatchPercentage}%\n🔍 Review the report at: ${reportPath}`);
    }
    console.log("✅ Screenshots match!");
}

module.exports = { captureAndCompareScreenshot };