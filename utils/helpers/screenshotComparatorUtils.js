/**
 * Author: Nandakumar Reddy
 * Title: Associate Director of Technology
 * Description: 
 * 
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const resemble = require("resemblejs");

// Load environment variables
const envPath = path.resolve(__dirname, `../../env/.env.${process.env.ENV || "dev"}`);
dotenv.config({ path: envPath });

const requiredEnvVars = ["FOLDER_NAME"];
requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`⚠️ Missing required environment variable: ${key}`);
    }
});

const FOLDER_NAME = process.env.FOLDER_NAME;

const BASELINE_SNAPSHOTS_DIR = path.join(__dirname, "..", "visual_tests", "baseline_snapshots");
const CURRENT_SNAPSHOTS_DIR = path.join(__dirname, "..", "visual_tests", "current_snapshots");
const DIFFS_DIR = path.join(__dirname, "..", "visual_tests", "diffs");
const REPORTS_DIR = path.join(__dirname, "..", "visual_tests", "reports");

fs.mkdirSync(BASELINE_SNAPSHOTS_DIR, { recursive: true });
fs.mkdirSync(CURRENT_SNAPSHOTS_DIR, { recursive: true });
fs.mkdirSync(DIFFS_DIR, { recursive: true });
fs.mkdirSync(REPORTS_DIR, { recursive: true });

async function captureAndCompareScreenshot(page, url, browserName) {
    const testName = url.replace(/[^a-zA-Z0-9]/g, "_");
    const originalImagePath = path.join(BASELINE_SNAPSHOTS_DIR, `${testName}_baseline.png`);
    const newImagePath = path.join(CURRENT_SNAPSHOTS_DIR, `${testName}_${browserName}.png`);
    const diffImagePath = path.join(DIFFS_DIR, `${testName}_diff.png`);
    const reportPath = path.join(REPORTS_DIR, `${testName}_report.html`);

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({ path: newImagePath, fullPage: true });
    console.log(`📸 Screenshot captured for ${url}`);

    if (!fs.existsSync(originalImagePath)) {
        fs.copyFileSync(newImagePath, originalImagePath);
        console.log(`✅ Baseline saved for ${url}`);
        return;
    }

    const diff = await new Promise((resolve) => {
        resemble(fs.readFileSync(originalImagePath))
            .compareTo(fs.readFileSync(newImagePath))
            .onComplete(resolve);
    });

    fs.writeFileSync(diffImagePath, diff.getBuffer());
    console.log(`📊 Diff generated for ${url}`);

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
    </html>`;
    fs.writeFileSync(reportPath, htmlContent);
    console.log(`📄 HTML report saved at: ${reportPath}`);

    if (diff.misMatchPercentage > 0) {
        console.error(`❌ Mismatch detected for ${url}: ${diff.misMatchPercentage}%`);
    } else {
        console.log(`✅ Screenshots match for ${url}`);
    }
}

// Export the function to use it in your test file
module.exports = { captureAndCompareScreenshot };
