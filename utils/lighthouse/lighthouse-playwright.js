const { chromium } = require('playwright');
const lighthouse = require('lighthouse');
const { launch } = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

async function runLighthouse(url) {
    // Launch Playwright browser
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log(`Navigating to ${url}`);
    await page.goto(url);

    // Launch Chrome separately for Lighthouse
    const chrome = await launch({ chromeFlags: ['--headless'] });
    const options = { logLevel: 'info', output: 'html', port: chrome.port };

    try {
        // Run Lighthouse audit
        const result = await lighthouse.default(url, options, null);
        
        // Ensure the reports directory exists
        const outputDir = path.join(__dirname, 'reports');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Define the output path
        const outputPath = path.join(outputDir, 'lighthouse-report.html');
        
        // Save the report
        fs.writeFileSync(outputPath, result.report);
        console.log(`Lighthouse report saved as ${outputPath}`);

    } catch (error) {
        console.error('Error running Lighthouse:', error);
    } finally {
        await browser.close();
        await chrome.kill();
    }
}

const url = process.argv[2] || 'https://www.blueparadox.com/';
runLighthouse(url);
