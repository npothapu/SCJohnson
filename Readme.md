# Playwright Setup Guide

This guide provides step-by-step instructions for setting up Playwright for automated testing and visual verification.

---

## 📌 Prerequisites
Ensure you have the following installed before proceeding:
- **Node.js** (Latest LTS version recommended)
- **npm** (Node Package Manager)

---

## 🔧 Installation Steps
Follow these commands to set up Playwright and necessary dependencies.

### 1️⃣ Install Playwright
Run the following command to install Playwright globally:
```sh
npm install -g @playwright/test@latest
```

### 2️⃣ Install Playwright Browsers
Install the required browsers and dependencies:
```sh
npx playwright install --with-deps
```

### 3️⃣ Install Additional Dependencies
Install the necessary npm packages:
```sh
npm install typo-js playwright-html-reporter dotenv csv-parser
```
#### For image comparison:
```sh
npm install resemblejs canvas
```
#### OS-Specific Dependencies:
- **Windows:**
  ```sh
  npm install -g windows-build-tools
  ```
- **Mac/Linux:**
  ```sh
  brew install cairo pango libpng jpeg giflib
  ```

---

## 🚀 Running Tests
Once the setup is complete, run your Playwright tests using:
```sh
npx playwright test
```

### 📊 Generating HTML Reports
To generate an HTML report after running tests:
```sh
npx playwright test --reporter=html
```
After execution, open the report with:
```sh
npx playwright show-report
```

---

## 📸 Capturing Screenshots
The test script captures a full-page screenshot and stores it in a `screenshots` directory outside the `tests` folder.

### ✅ Expected Behavior
- The script navigates to the specified URL.
- It scrolls down gradually to ensure all content is loaded.
- A screenshot is saved with the format: `imagecaptured_<browserName>_<timestamp>.png`.

---

## 🔧 Troubleshooting
### ⚠️ Issue: Timeout Exceeded
- Increase the test timeout by modifying:
  ```js
  test.setTimeout(90000);
  ```

### ⚠️ Issue: Screenshots Not Capturing Entire Page
- Ensure the scrolling logic properly loads all elements before capturing the screenshot.
- Adjust the viewport size dynamically to match the full-page height.

---

## 📂 Folder Structure
```
data/
│── url_batches/   # Stores URL batch data

dictionaries/
│── en_US/
│   │── company-dictionaries/   # Company-specific dictionaries
│   │── en_US.aff   # English dictionary affix file
│   │── en_US.dic   # English dictionary words file

env/
│── .env          # Default environment file
│── .env.dev      # Development environment variables
│── .env.qa       # QA environment variables
│── .env.stage    # Staging environment variables
│── .env.prod     # Production environment variables

node_modules/
playwright_report/
tests/
│── main.spec.js    # Main test specification file

utils/
│── helpers/
│   │── extractLinksUtil.js    # Utility for extracting links
│   │── linkCheckerUtils.js    # Utilities for link checking
│   │── spellCheckerUtils.js   # Utilities for spell checking
│   │── visualTesting.js       # Utilities for visual testing

package-lock.json
package.json
playwright.config.js
readme.md
```

---

## 🌍 Running Tests in Different Environments
Run tests for specific environments:

- **Development:**
  ```sh
  ENV=dev npx playwright test
  ```
- **QA:**
  ```sh
  ENV=qa npx playwright test
  ```
- **Staging:**
  ```sh
  ENV=stage npx playwright test
  ```
- **Production:**
  ```sh
  ENV=prod npx playwright test
  ```

### 🔹 Running Specific Browsers
- Run all browsers:
  ```sh
  ENV=dev npx playwright test
  ```
- Run only **Chromium**:
  ```sh
  ENV=dev npx playwright test --project=Chromium
  ```

### 🔹 Running in CI (GitHub Actions, Jenkins, etc.)
```sh
CI=true ENV=qa npx playwright test
```

---

## 🎯 Conclusion
You are now ready to use Playwright for automated testing and visual verification. Modify the script as needed to fit your testing requirements. 🚀
