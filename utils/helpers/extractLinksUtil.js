/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Date: February 4, 2025
 */

const { expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs").promises;
const dotenv = require("dotenv");

// Load environment variables safely
const envPath = path.resolve(__dirname, `../../env/.env.${process.env.ENV || "dev"}`);
dotenv.config({ path: envPath });

// Validate required environment variables with soft assertions
const requiredEnvVars = ["BASE_URL", "FOLDER_NAME", "FILE_NAME"];
requiredEnvVars.forEach((key) => {
  expect.soft(process.env[key], `Missing required environment variable: ${key}`).not.toBeNull();
});

// Extract environment variables
const BASE_URL = process.env.BASE_URL;
const FOLDER_NAME = process.env.FOLDER_NAME;
const FILE_NAME = process.env.FILE_NAME;
const FOLDER_PATH = path.resolve(__dirname, `../data/url_batches/${FOLDER_NAME}`);

if (!BASE_URL) {
  throw new Error("BASE_URL is not defined. Please check your .env file.");
}

async function extractAndSaveLinks(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Navigating to URL: ${BASE_URL}`);
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    // Extract all unique links that start with BASE_URL
    const links = await page.$$eval(
      "a",
      (anchors, baseURL) =>
        [...new Set(anchors.map((anchor) => anchor.href).filter((href) => href.startsWith(baseURL)))],
      BASE_URL
    );

    console.log(`Extracted ${links.length} unique links.`);

    // Soft assertion for minimum extracted links
    expect.soft(links.length, "No links extracted!").toBeGreaterThan(0);

    // Split links into batches of 25
    const batches = Array.from({ length: Math.ceil(links.length / 25) }, (_, i) =>
      links.slice(i * 25, (i + 1) * 25)
    );

    // Ensure the folder exists
    await fs.mkdir(FOLDER_PATH, { recursive: true });

    // Save batches as JSON files with FILE_NAME prefix
    await Promise.all(
      batches.map((batch, index) =>
        fs.writeFile(path.join(FOLDER_PATH, `${FILE_NAME}_${index + 1}.json`), JSON.stringify(batch, null, 2), "utf8")
      )
    );
path.join(FOLDER_PATH, `batch_${i}.json`);
    console.log(`Successfully saved ${batches.length} batches in ${FOLDER_PATH}`);
  } catch (error) {
    console.error(`Error during extraction: ${error.message}`);
  } finally {
    await context.close();
  }
}

module.exports = { extractAndSaveLinks };
