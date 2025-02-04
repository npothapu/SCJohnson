/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Description: Script to check all footer and header links for broken URLs.
 */

require("dotenv").config(); // Load environment variables

const path = require("path");
const fs = require("fs").promises;
const { expect } = require("@playwright/test");

// Load environment variables safely
const envPath = path.resolve(__dirname, `../../../env/.env.${process.env.ENV || "dev"}`);
require("dotenv").config({ path: envPath });

// Validate required environment variables with soft assertions
const requiredEnvVars = ["BASE_URL", "FOLDER_NAME", "FILE_NAME"];
requiredEnvVars.forEach((key) => {
  expect.soft(process.env[key], `Missing required environment variable: ${key}`).not.toBeNull();
});

// Extract environment variables
const BASE_URL = process.env.BASE_URL;
const FOLDER_NAME = process.env.FOLDER_NAME;
const FILE_NAME = process.env.FILE_NAME;
const FOLDER_PATH = path.resolve(__dirname, `../../data/url_batches/${FOLDER_NAME}`);

async function checkLinks(page, selector, sectionName) {
    await page.goto(BASE_URL);
    
    // Select all links from the specified section
    const links = await page.locator(selector);
    const count = await links.count();
    
    console.log(`Total ${sectionName} links found: ${count}`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < count; i++) {
        const link = await links.nth(i).getAttribute('href');
        if (link) {
            const response = await page.request.get(link);
            const status = response.status();
            if (status >= 400) {
                console.error(`Broken link in ${sectionName}: ${link} (Status: ${status})`);
                failedCount++;
            } else {
                console.log(`Working link in ${sectionName}: ${link} (Status: ${status})`);
                successCount++;
            }
        }
    }
    
    console.log(`\n${sectionName} Test Summary:`);
    console.log(`Total Working Links: ${successCount}`);
    console.log(`Total Broken Links: ${failedCount}`);
}

async function runFooterLinkCheck(page) {
    await checkLinks(page, 'footer a', 'Footer');
}

async function runHeaderLinkCheck(page) {
    await checkLinks(page, 'header a', 'Header');
}

module.exports = { runFooterLinkCheck, runHeaderLinkCheck };
