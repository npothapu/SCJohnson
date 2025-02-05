/**
 * Author: Nandakumar Reddy
 * Title: Associate Director of Technology
 * Description: This script contains Playwright tests for website link validation, 
 * screenshot comparison, and navigation link checking. Each test case is linked 
 * to a JIRA ticket for tracking.
 */

require("dotenv").config(); // Load environment variables

const { test } = require("@playwright/test");
const { captureAndCompareScreenshot } = require("../utils/helpers/visualTesting");
const { runLinkCheck } = require("../utils/helpers/linkCheckerUtils");
const { extractAndSaveLinks } = require("../utils/helpers/extractLinksUtil");
const { runFooterLinkCheck, runHeaderLinkCheck } = require("../utils/helpers/navigation_links_checker"); // Import navigation link checkers

// JIRA Tickets
const JIRA_TICKETS = {
    extractLinks: 'https://jira.uhub.biz/browse/VYRNASCJBP-14',
    checkLinks: 'https://jira.uhub.biz/browse/VYRNASCJBP-14',
    footerLinks: 'https://jira.uhub.biz/browse/VYRNASCJBP-9',
    headerLinks: 'https://jira.uhub.biz/browse/VYRNASCJBP-11',
    screenshotTest: 'https://jira.uhub.biz/browse/VYRNASCJBP-3'
};

test.describe.parallel("Website Testing Suite", () => {
    
    test(`Extract and save distinct links - [JIRA: ${JIRA_TICKETS.extractLinks}]`, async ({ browser }) => {
        test.setTimeout(90000);
        console.log(`Refer to JIRA ticket: ${JIRA_TICKETS.extractLinks}`);
        await extractAndSaveLinks(browser);
    });

    test(`Check all links for broken URLs - [JIRA: ${JIRA_TICKETS.checkLinks}]`, async ({ page }, testInfo) => {
        test.setTimeout(90000);
        console.log(`Refer to JIRA ticket: ${JIRA_TICKETS.checkLinks}`);
        await runLinkCheck(page, testInfo, test);
    });

    test(`Check all footer links for broken URLs - [JIRA: ${JIRA_TICKETS.footerLinks}]`, async ({ page }) => {
        test.setTimeout(90000);
        console.log(`Refer to JIRA ticket: ${JIRA_TICKETS.footerLinks}`);
        await runFooterLinkCheck(page);
    });

    test(`Check all header links for broken URLs - [JIRA: ${JIRA_TICKETS.headerLinks}]`, async ({ page }) => {
        test.setTimeout(90000);
        console.log(`Refer to JIRA ticket: ${JIRA_TICKETS.headerLinks}`);
        await runHeaderLinkCheck(page);
    });


    test(`SC Johnson Homepage Screenshot Test - [JIRA: ${JIRA_TICKETS.screenshotTest}]`, async ({ page, browserName }) => {
        test.setTimeout(60000);
        console.log(`Refer to JIRA ticket: ${JIRA_TICKETS.screenshotTest}`);
        await captureAndCompareScreenshot(page, "scjohnson_homepage", browserName);
    });

});
