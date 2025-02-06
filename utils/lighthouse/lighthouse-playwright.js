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

// Function to save reports in a structured manner
function saveReport(url, name, result) {
    const outputDir = path.join(__dirname, 'reports', url.replace(/[^a-zA-Z0-9]/g, '_'));
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `lighthouse-report-${name}.html`);
    fs.writeFileSync(outputPath, result.report);
    console.log(`Lighthouse report for ${url} (${name}) saved as ${outputPath}`);
}

// Function to run Lighthouse for both desktop and mobile
async function runLighthouse(url, retries = 3) {
    const configs = [
        { name: 'desktop', config: { extends: 'lighthouse:default', settings: { emulatedFormFactor: 'desktop' } } },
        { name: 'mobile', config: { extends: 'lighthouse:default', settings: { emulatedFormFactor: 'mobile' } } }
    ];

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

            for (const { name, config } of configs) {
                const options = { logLevel: 'info', output: 'html', port: chrome.port, config };

                // Run Lighthouse audit
                const result = await lighthouse.default(url, options, null);

                // Save the report using the structured saveReport function
                saveReport(url, name, result);
            }

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

// Create the comparison HTML file
function createComparisonHtml(url) {
    const sanitizedUrl = url.replace(/[^a-zA-Z0-9]/g, '_');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse Report Comparison</title>
    <style>
        .container {
            display: flex;
            flex-direction: row; /* Ensures side by side (right and left) display */
        }
        .report {
            width: 50%;
            height: 100vh;
            overflow: auto;
        }
        .report-title {
            text-align: center;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <h1>Lighthouse Report Comparison for ${url}</h1>
    <div class="container">
        <div class="report">
            <div class="report-title">Desktop Report</div>
            <iframe src="reports/${sanitizedUrl}/lighthouse-report-desktop.html" width="100%" height="90%"></iframe>
        </div>
        <div class="report">
            <div class="report-title">Mobile Report</div>
            <iframe src="reports/${sanitizedUrl}/lighthouse-report-mobile.html" width="100%" height="90%"></iframe>
        </div>
    </div>
</body>
</html>`;

    const outputPath = path.join(__dirname, `comparison-${sanitizedUrl}.html`);
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`Comparison HTML for ${url} saved as ${outputPath}`);
}

// Create comparison HTML for each URL
urls.forEach(url => createComparisonHtml(url));
