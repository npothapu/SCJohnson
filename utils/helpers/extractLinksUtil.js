/**
 * Author: Nandakumar Pothapu Reddy
 * Title: Associate Director of Technology
 * Date: January 30, 2025
 */

require("dotenv").config(); // Load environment variables
const fs = require("fs");
const path = require("path");

async function extractAndSaveLinks(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const url = process.env.URL || "https://www.teenvoice.com"; // Dynamic URL

  await page.goto(url);

  const links = await page.$$eval(
    "a",
    (anchors, url) =>
      Array.from(
        new Set(
          anchors.map((anchor) => anchor.href).filter((href) => href.startsWith(url))
        )
      ),
    url
  );

  console.log("Extracted Links:", links);
  console.log("Total number of distinct hyperlinks:", links.length);

  const batches = [];
  while (links.length) {
    batches.push(links.splice(0, 25));
  }

  const folderName = process.env.FOLDER_NAME;
  if (!folderName) {
    console.error("Error: FOLDER_NAME is not defined in the .env file.");
    return;
  }

  const folderPath = path.resolve(__dirname, `../data/url_batches/${folderName}`);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  batches.forEach((batch, index) => {
    const filePath = path.join(folderPath, `batch_${index + 1}.json`);
    fs.writeFileSync(filePath, JSON.stringify(batch, null, 2), "utf8");
  });

  await context.close();
}

module.exports = { extractAndSaveLinks };
