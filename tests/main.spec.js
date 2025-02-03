/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Date: January 30, 2025
 */

require("dotenv").config(); // Load environment variables

const { test } = require("@playwright/test");
const { captureAndCompareScreenshot } = require("../utils/helpers/visualTesting");
const { runLinkCheck } = require("../utils/helpers/linkCheckerUtils");
const { runSpellCheckTests } = require("../utils/helpers/spellCheckerUtils");
const { extractAndSaveLinks } = require("../utils/helpers/extractLinksUtil"); // Import link extraction utility

test.describe.parallel("Website Testing Suite", () => {
    
    test("SC Johnson Homepage Screenshot Test", async ({ page, browserName }) => {
        test.setTimeout(60000);
        await captureAndCompareScreenshot(page, "scjohnson_homepage", browserName);
    });

    test("Check all links for broken URLs", async ({ page }, testInfo) => {
        test.setTimeout(90000);
        await runLinkCheck(page, testInfo, test);
    });

    test("Extract and save distinct links", async ({ browser }) => {
        test.setTimeout(90000);
        await extractAndSaveLinks(browser);
    });

    // ✅ Adding Spell Checker Test Suite
    runSpellCheckTests(test);
});
