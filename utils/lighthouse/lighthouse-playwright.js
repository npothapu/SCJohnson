const { chromium } = require('playwright');
const lighthouse = require('lighthouse');
const { launch } = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Function to read URLs from JSON files
function readUrlsFromJsonFiles(directory) {
    const urls = [];
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const data = fs.readFileSync(filePath);
        try {
            const json = JSON.parse(data);
            if (Array.isArray(json)) {
                urls.push(...json);  // Directly push the array of URLs
            } else {
                console.warn(`No valid array found in ${file}`);
            }
        } catch (error) {
            console.error(`Error parsing JSON file ${file}:`, error);
        }
    });
    return urls;
}

async function runLighthouse(url, retries = 3) {
    let attempt = 0;
    while (attempt < retries) {
        try {
            // Launch Playwright browser
            const browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            console.log(`Navigating to ${url}`);
            await page.goto(url, { timeout: 60000 }); // Increase timeout to 60 seconds

            // Launch Chrome separately for Lighthouse
            const chrome = await launch({ chromeFlags: ['--headless'] });
            const options = { logLevel: 'info', output: 'html', port: chrome.port };

            // Run Lighthouse audit
            const result = await lighthouse.default(url, options, null);

            // Ensure the reports directory exists
            const outputDir = path.join(__dirname, 'reports');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Define the output path using the URL as part of the filename
            const sanitizedUrl = url.replace(/[^a-zA-Z0-9]/g, '_');
            const outputPath = path.join(outputDir, `lighthouse-report-${sanitizedUrl}.html`);

            // Save the report
            fs.writeFileSync(outputPath, result.report);
            console.log(`Lighthouse report for ${url} saved as ${outputPath}`);

            await browser.close();
            await chrome.kill();
            return;
        } catch (error) {
            console.error(`Error running Lighthouse for ${url} on attempt ${attempt + 1}:`, error);
            attempt++;
            if (attempt >= retries) {
                const logMessage = `Failed to run Lighthouse for ${url} after ${retries} attempts\n`;
                fs.appendFileSync('error_log.txt', logMessage);
                console.error(logMessage);
            }
        }
    }
}

// Path to the folder containing JSON files
const jsonFolderPath = path.join(__dirname, '..', 'data', 'url_batches', 'blueparadox');
const urls = readUrlsFromJsonFiles(jsonFolderPath);

// Run Lighthouse for each URL and log errors if any
urls.forEach(url => runLighthouse(url));
