require("dotenv").config(); // Load environment variables

const { test } = require("@playwright/test");
const { captureAndCompareScreenshot } = require("../utils/helpers/visualTesting");
const { runLinkCheck } = require("../utils/helpers/linkCheckerUtils");
const { extractAndSaveLinks } = require("../utils/helpers/extractLinksUtil");
const { runFooterLinkCheck, runHeaderLinkCheck } = require("../utils/helpers/navigation_links_checker"); // Import navigation link checkers

test.describe.parallel("Website Testing Suite", () => {
    
    test("Extract and save distinct links", async ({ browser }) => {
        test.setTimeout(90000);
        await extractAndSaveLinks(browser);
    });

    test("Check all links for broken URLs", async ({ page }, testInfo) => {
        test.setTimeout(90000);
        await runLinkCheck(page, testInfo, test);
    });

    test("Check all footer links for broken URLs", async ({ page }) => {
        test.setTimeout(90000);
        await runFooterLinkCheck(page);
    });

    test("Check all header links for broken URLs", async ({ page }) => {
        test.setTimeout(90000);
        await runHeaderLinkCheck(page);
    });

    test("SC Johnson Homepage Screenshot Test", async ({ page, browserName }) => {
        test.setTimeout(60000);
        await captureAndCompareScreenshot(page, "scjohnson_homepage", browserName);
    });

});
