/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Date: January 23, 2025
 */
const { test, expect } = require('@playwright/test');
const fs = require('fs'); // Use synchronous fs for existsSync and mkdirSync
const fsp = fs.promises; // Use fs.promises for async operations
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `../../env/.env.${process.env.ENV || 'dev'}`) });

// Validate required environment variables
const requiredEnvVars = ["BASE_URL", "FOLDER_NAME", "FILE_NAME"];
requiredEnvVars.forEach(key => {
    expect.soft(process.env[key], `Missing required environment variable: ${key}`).not.toBeNull();
});

const BASE_URL = process.env.BASE_URL;
const FOLDER_NAME = process.env.FOLDER_NAME;
const FILE_NAME = process.env.FILE_NAME || "batch"; // Default to 'batch' if not specified
const FOLDER_PATH = path.resolve(__dirname, `../../utils/data/url_batches/${FOLDER_NAME}`);

// Utility function for delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function checkSpelling(page, link, typoJsPath, affContent, dicContent, customWords) {
    await page.goto(link);

    const typoJsCode = await fsp.readFile(typoJsPath, 'utf8');
    await page.addScriptTag({ content: typoJsCode });

    await page.evaluate(({ affContent, dicContent, customWords }) => {
        window.typo = new Typo('en_US', affContent, dicContent);
        customWords.forEach(word => window.typo.dictionaryTable[word] = null);
    }, { affContent, dicContent, customWords });

    const pageText = await page.evaluate(() => document.body.innerText);
    const misspelledWords = await page.evaluate(text => {
        const normalizeWord = word => word.replace(/[^\w'-]/g, '').toLowerCase();
        const words = text.split(/\s+/).map(normalizeWord).filter(Boolean);
        return Array.from(new Set(words.filter(word => !window.typo.check(word))));
    }, pageText);

    return misspelledWords;
}

module.exports = function (test) {
    test.describe('Spell Check for All Links', () => {
        const typoJsPath = path.resolve(__dirname, '../../node_modules/typo-js/typo.js');
        const affPath = path.resolve(__dirname, '../../dictionaries/en_US/en_US.aff');
        const dicPath = path.resolve(__dirname, '../../dictionaries/en_US/en_US.dic');
        const dictionaryFilename = process.env.DIC_FILENAME || 'teenvoice';
        const customDicPath = path.resolve(__dirname, `../../dictionaries/en_US/company-dictionaries/${dictionaryFilename}.dic`);

        let affContent, dicContent, customWords;
        let totalLinks = 0;
        let linksWithErrors = [];
        let failedLinks = [];

        test.beforeAll(async () => {
            [affContent, dicContent, customWords] = await Promise.all([
                fsp.readFile(affPath, 'utf8'),
                fsp.readFile(dicPath, 'utf8'),
                fsp.readFile(customDicPath, 'utf8').then(data => data.split('\n').map(word => word.trim()).filter(Boolean))
            ]);
        });

        const distinctLinks = new Set();

        if (!fs.existsSync(FOLDER_PATH)) {
            fs.mkdirSync(FOLDER_PATH, { recursive: true });
        }

        for (let i = 1; i <= 10; i++) {
            const filePath = path.join(FOLDER_PATH, `${FILE_NAME}_${i}.json`);
            if (fs.existsSync(filePath)) {
                const batch = require(filePath);
                batch.forEach(link => distinctLinks.add(link));
            }
        }

        const linksArray = Array.from(distinctLinks);
        totalLinks = linksArray.length;

        linksArray.forEach((link, index) => {
            test(`Check spelling on link ${index + 1} of ${totalLinks}: ${link}`, async ({ page }) => {
                try {
                    const misspelledWords = await checkSpelling(page, link, typoJsPath, affContent, dicContent, customWords);
                    if (misspelledWords.length > 0) {
                        linksWithErrors.push({ link, misspelledWords });
                    }
                    expect.soft(misspelledWords.length).toBe(0, `Misspelled words found on ${link}: ${misspelledWords}`);
                } catch (error) {
                    failedLinks.push(link);
                    console.error(`Error checking link ${link}: ${error.message}`);
                    expect.soft(false).toBe(true, `Error occurred while checking ${link}`);
                }

                await delay(1200);
            });
        });

        test.afterAll(() => {
            console.log('\n========= SPELL CHECK SUMMARY =========');
            console.log(`✅ Total Links Checked: ${totalLinks}`);
            console.log(`❌ Links with Spelling Errors: ${linksWithErrors.length}`);
            linksWithErrors.forEach(({ link, misspelledWords }) => {
                console.log(`  - ${link}: ${misspelledWords.join(', ')}`);
            });
            console.log(`🛑 Links that Failed to Load: ${failedLinks.length}`);
            failedLinks.forEach(link => console.log(`  - ${link}`));
            console.log('=======================================\n');
        });
    });
};
