import puppeteer from 'puppeteer';
import path from 'path';

const __dirname = path.resolve();

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({headless: 'new'});
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto('https://developer.chrome.com/');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});


  const screenshotPathBeforeClick = path.join(__dirname, 'screenshot_before.png');
  const screenshotPathAfterClick = path.join(__dirname, 'screenshot_after.png');


  // Type into search box
  await page.type('.search-box__input', 'automate beyond recorder');

  
  await page.screenshot({ path: screenshotPathBeforeClick });
    console.log('Screenshot before click saved at:', screenshotPathBeforeClick);

//   // Wait and click on first result
  const searchResultSelector = '.search-box__link';
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);


  await page.screenshot({ path: screenshotPathAfterClick });
  console.log('Screenshot after click saved at:', screenshotPathAfterClick);


//   // Locate the full title with a unique string
//   const textSelector = await page.waitForSelector(
//     'text/Customize and automate'
//   );
//   const fullTitle = await textSelector?.evaluate(el => el.textContent);

//   // Print the full title
//   console.log('The title of this blog post is "%s".', fullTitle);

  await browser.close();
})();