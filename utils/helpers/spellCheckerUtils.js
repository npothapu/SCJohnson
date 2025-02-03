const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Function to create a delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkSpelling(page, link, typoJsPath, affContent, dicContent, customWords) {
  await page.goto(link);

  const typoJsCode = fs.readFileSync(typoJsPath, 'utf8');
  await page.addScriptTag({ content: typoJsCode });

  await page.evaluate(({ affContent, dicContent, customWords }) => {
    window.typo = new Typo('en_US', affContent, dicContent);
    customWords.forEach(word => window.typo.dictionaryTable[word] = null);
    console.log('Typo.js initialized successfully with custom dictionary');
  }, { affContent, dicContent, customWords });

  const pageText = await page.evaluate(() => document.body.innerText);
  console.log('Extracted Page Text:', pageText);

  const misspelledWords = await page.evaluate(text => {
    const normalizeWord = word => word.replace(/[^\w'-]/g, '').toLowerCase();
    const words = text.split(/\s+/).map(normalizeWord).filter(Boolean);
    return Array.from(new Set(words.filter(word => !window.typo.check(word)))); // Ensure distinct misspelled words
  }, pageText);

  console.log('Distinct Misspelled Words:', misspelledWords);
  return misspelledWords;
}

async function runSpellCheckTests(test) {
  test.describe('Spell Check for All Links', () => {
    const typoJsPath = path.resolve('./node_modules/typo-js/typo.js');
    const affPath = path.resolve('./dictionaries/en_US/en_US.aff');
    const dicPath = path.resolve('./dictionaries/en_US/en_US.dic');
    const url = process.env.URL || 'https://www.teenvoice.com'; // Dynamic URL
    const dictionaryFilename = process.env.DIC_FILENAME || 'teenvoice';
    const customDicPath = path.resolve(`./dictionaries/en_US/company-dictionaries/${dictionaryFilename}.dic`);
    const folderName = process.env.FOLDER_NAME || 'teenvoice'; // Dynamic Folder Name

    let affContent, dicContent, customWords;

    test.beforeAll(() => {
      affContent = fs.readFileSync(affPath, 'utf8');
      dicContent = fs.readFileSync(dicPath, 'utf8');
      customWords = fs.readFileSync(customDicPath, 'utf8').split('\n').map(word => word.trim()).filter(word => word.length > 0);
    });

    // Load all distinct links from the batches in the specified folder
    const distinctLinks = new Set();
    const folderPath = path.join(__dirname, `../../data/url_batches/${folderName}`); // Adjusted path
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true }); // Create folder if it doesn't exist
    }
    
    for (let i = 1; i <= 10; i++) {
      const batchPath = path.join(folderPath, `batch_${i}.json`);
      if (fs.existsSync(batchPath)) {
        const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));
        batch.forEach(link => distinctLinks.add(link));
      }
    }

    // Convert set to array for indexing
    const linksArray = Array.from(distinctLinks);

    linksArray.forEach((link, index) => {
      test(`Check spelling on link ${index + 1} of ${linksArray.length}: ${link}`, async ({ page }) => {
        console.log(`Executing link ${index + 1} of ${linksArray.length}: ${link}`);
        try {
          const misspelledWords = await checkSpelling(page, link, typoJsPath, affContent, dicContent, customWords);
          if (misspelledWords.length) {
            console.error(`Distinct misspelled words on ${link}:`, misspelledWords);
            test.soft(expect(misspelledWords.length).toBe(0)); // Soft assertion for misspelled words
          } else {
            console.log(`No spelling errors on ${link}`);
          }
        } catch (error) {
          console.error(`Error checking link ${link}:`, error.message);
          test.soft(expect(false).toBe(true)); // Soft assertion for errors
        }

        // Add delay before next request to avoid 429 errors
        await delay(1200);
      });
    });
  });
}

module.exports = { runSpellCheckTests };
