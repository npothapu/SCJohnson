# Playwright Setup Guide

This guide provides step-by-step instructions for setting up Playwright for automated testing and visual testing verification.

## Prerequisites
Ensure you have the following installed before proceeding:
- Node.js (Latest LTS version recommended)
- npm (Node Package Manager)

## Installation Steps
Follow these commands to set up Playwright and necessary dependencies.

### 1. Install Playwright
Run the following command to install Playwright globally:
```sh
npm install -g @playwright/test@latest
```

### 2. Install Playwright Browsers
Install the required browsers and dependencies:
```sh
npx playwright install --with-deps
```

### 3. Install Additional Dependencies
Install the necessary npm packages:
```sh
npm install typo-js
npm install playwright-html-reporter
npm install dotenv
npm install csv-parser
## for image comparision
    npm install resemblejs
    npm install canvas
        ## for windows-build-tools
        npm install -g windows-build-tools 
        ##  for mac/linux
        brew install cairo pango libpng jpeg giflib  
```

## Running Tests
Once the setup is complete, you can run your Playwright tests using:
```sh
npx playwright test
```

## Generating HTML Reports
To generate an HTML report after running tests:
```sh
npx playwright test --reporter=html
```
After execution, open the report with:
```sh
npx playwright show-report
```

## Capturing Screenshots
The test script is designed to capture a full-page screenshot and store it in a `screenshots` directory outside the `tests` folder.

### Expected Behavior
- The script will navigate to the specified URL.
- It will scroll down gradually to ensure all content is loaded.
- A screenshot will be saved with the format: `imagecaptured_<browserName>_<timestamp>.png`.

## Troubleshooting
### Issue: Timeout Exceeded
- Increase the test timeout by modifying `test.setTimeout(90000);` in your test script.

### Issue: Screenshots Not Capturing Entire Page
- Ensure the scrolling logic properly loads all elements before capturing the screenshot.
- Adjust the viewport size dynamically to match the full page height.

## Conclusion
You are now ready to use Playwright for automated testing and visual verification. Modify the script as needed to fit your testing requirements.

## overview folder structure
tests/
│── helpers/
│   │── linkChecker.js          
│   │── spellChecker.js        
│   │── headerFooterChecker.js  
│   │── screenCapture.js        # Screenshot capture helper
│
│── config/
│   │── .env                    # Default environment file
│   │── .env.dev                # Development environment variables
│   │── .env.qa                 # QA environment variables
│   │── .env.stage              # Staging environment variables
│   │── .env.prod               # Production environment variables
│
│── main.spec.js                
│── links.spec.js                
│── spell.spec.js                
│── headerFooter.spec.js         
│
└── playwright.config.js         

## Run tests for different environments while capturing failures.

Run for Development: bash ENV=dev npx playwright test

Run for QA:          bash ENV=qa npx playwright test

Run for Staging:     bash ENV=stage npx playwright test

Run for Production:  bash ENV=prod npx playwright test

## 🚀 Running the Tests
Run all browsers  -- bash: ENV=dev npx playwright test
Run only Chromium -- bash: ENV=dev npx playwright test --project=Chromium

Run in CI (GitHub Actions, Jenkins, etc.)
bash: CI=true ENV=qa npx playwright test
