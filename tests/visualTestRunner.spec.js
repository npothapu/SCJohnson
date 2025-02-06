/**
 * Author: Nandakumar Reddy
 * Title: Associate Director of Technology
 * Playwright Test Script for Visual Regression Testing
 * 
 * This script dynamically reads URLs from JSON files in a specified directory,
 * then executes Playwright tests to capture and compare screenshots of these URLs.
 * The tests are executed in parallel to enhance performance.
 */

const { test } = require("@playwright/test");
const { captureAndCompareScreenshot } = require("../utils/helpers/screenshotComparatorUtils");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

// Directory containing JSON files with URLs, defined in the .env file
const urlDirectory = path.join(__dirname, `../utils/data/url_batches/${process.env.FOLDER_NAME}`);
console.log("Reading JSON files from:", urlDirectory);

/**
 * Reads all JSON files in the specified directory and extracts URLs.
 * 
 * @returns {string[]} Array of URLs extracted from JSON files.
 */
const getURLsFromFiles = () => {
    if (!fs.existsSync(urlDirectory)) {
        console.error("Error: Directory does not exist:", urlDirectory);
        return [];
    }

    const files = fs.readdirSync(urlDirectory).filter(file => file.endsWith(".json"));
    console.log("Found JSON files:", files);

    const urls = files.flatMap(file => {
        try {
            const filePath = path.join(urlDirectory, file);
            const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
            
            // Ensure JSON file contains an array of URLs
            if (Array.isArray(data)) {
                return data;
            } else {
                console.error(`Invalid JSON format in ${file}: Expected an array.`);
                return [];
            }
        } catch (error) {
            console.error(`Error reading ${file}:`, error);
            return [];
        }
    });

    console.log("Extracted URLs:", urls);
    return urls;
};

// Retrieve URLs from JSON files
const URLS = getURLsFromFiles();

// Exit process if no URLs are found to prevent Playwright "No tests found" error
if (URLS.length === 0) {
    console.error("No URLs found. Ensure JSON files contain valid URLs.");
    process.exit(1);
}

// Run screenshot comparison tests concurrently for better performance
test.describe.parallel("Screenshot Tests", () => {
    for (const url of URLS) {
        test(`Screenshot Test for ${url}`, async ({ page, browserName }) => {
            test.setTimeout(60000);
            await captureAndCompareScreenshot(page, url, browserName);
        });
    }
});
