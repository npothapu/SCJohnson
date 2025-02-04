/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Date: January 30, 2025
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `../../env/.env.${process.env.ENV || 'dev'}`) });

const { expect, test } = require("@playwright/test");

/**
 * Extracts all links from the page.
 * @param {Page} page - Playwright page instance.
 * @returns {Promise<{ validHrefs: Set<string>, invalidLinks: Array<{text: string, href: string}> }>}
 */
async function getAllLinksFromPage(page) {
    const links = await page.$$eval("a", anchors =>
        anchors.map(link => ({
            href: link.getAttribute("href"),
            text: link.innerText.trim() || "[No Text]",
        }))
    );

    let invalidLinks = [];
    let validHrefs = new Set();

    links.forEach(({ href, text }) => {
        if (!href) {
            invalidLinks.push({ text, href: "NULL" });
        } else if (!href.startsWith("mailto:") && !href.startsWith("#")) {
            validHrefs.add(new URL(href, page.url()).href);
        }
    });

    return { validHrefs, invalidLinks };
}

/**
 * Checks all extracted links for broken URLs.
 * @param {Page} page - Playwright page instance.
 * @param {Set<string>} linkUrls - Set of valid URLs to check.
 * @param {import('@playwright/test').TestType} test - Playwright test instance.
 * @returns {Promise<{ passedLinks: number, failedLinks: string[] }>}
 */
async function checkLinks(page, linkUrls, test) {
    let failedLinks = [];
    let passedLinks = 0;

    console.log(`🔗 Total Links Found: ${linkUrls.size}`);

    for (const url of linkUrls) {
        await test.step(`Checking link: ${url}`, async () => {
            try {
                const response = await page.request.get(url);
                expect.soft(response.ok(), `${url} returned a non-success status code`).toBeTruthy();
                if (response.ok()) {
                    passedLinks++;
                } else {
                    failedLinks.push(url);
                }
            } catch {
                failedLinks.push(url);
                expect.soft(null, `${url} failed to respond`).toBeTruthy();
            }
        });
    }

    return { passedLinks, failedLinks };
}

/**
 * Logs the test summary.
 */
function logTestSummary(totalLinks, passedLinks, failedLinks, invalidLinks) {
    console.log("\n=== ✅ Link Check Summary ✅ ===");
    console.log(`🔗 Total Links Checked: ${totalLinks}`);
    console.log(`✅ Passed Links: ${passedLinks}`);
    console.log(`❌ Failed Links: ${failedLinks.length}`);
    
    if (failedLinks.length > 0) {
        console.log("❌ Failed URLs:");
        failedLinks.forEach(link => console.log(link));
    }

    if (invalidLinks.length > 0) {
        console.log(`⚠️ Total Links with Invalid href: ${invalidLinks.length}`);
        invalidLinks.forEach(({ text, href }) =>
            console.warn(`❌ Link Text: "${text}" | Href: ${href}`)
        );
    }

    // Soft assert for failed links
    expect.soft(failedLinks.length, "Some links returned errors").toBe(0);
}

/**
 * Runs the full link check process.
 * @param {Page} page - Playwright page instance.
 * @param {import('@playwright/test').TestInfo} testInfo - Test info object for attaching results.
 */
async function runLinkCheck(page, testInfo, test) {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
        console.error(`❌ BASE_URL is not set in the environment variables`);
        throw new Error("BASE_URL is missing in the environment file!");
    }

    console.log(`🔍 Running tests for environment: ${process.env.ENV}`);
    console.log(`🌍 Testing BASE_URL: ${baseUrl}`);

    await page.goto(baseUrl);
    const { validHrefs, invalidLinks } = await getAllLinksFromPage(page);
    
    const { passedLinks, failedLinks } = await checkLinks(page, validHrefs, test);

    testInfo.attach("checked-links.txt", {
        body: Array.from(validHrefs).join("\n"),
    });

    logTestSummary(validHrefs.size, passedLinks, failedLinks, invalidLinks);
}

module.exports = { runLinkCheck };