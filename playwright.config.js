require('dotenv').config({ path: `./config/.env.${process.env.ENV || 'dev'}` });

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: 'tests',   // Directory containing tests
    retries: 1,         // Retries failed tests up to 2 times
    workers: process.env.CI ? 4 : 10,  // Use 4 workers in CI, 10 locally
    timeout: 30 * 1000, // 30-second timeout per test
    
    use: {
        headless: true,  // Run browsers in headless mode
        baseURL: process.env.BASE_URL,
        screenshot: 'on', // Capture screenshots only on failure
        trace: 'retain-on-failure'     // Keep trace files only on failures
    },

    projects: [
        {
            name: 'Chromium',
            use: { browserName: 'chromium' }
        },
        // {
        //     name: 'Firefox',
        //     use: { browserName: 'firefox' }
        // },
        // {
        //     name: 'WebKit',
        //     use: { browserName: 'webkit' }
        // }
    ],

    reporter: [
        ['list'],                    // Default console output
        ['junit', { outputFile: 'results/test-results.xml' }], // JUnit XML report (for CI)
        ['html', { outputFolder: 'playwright-report' }]       // HTML Report
    ]
});
