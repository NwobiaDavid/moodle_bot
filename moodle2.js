import puppeteer from 'puppeteer';
import path from 'path';
import fs,{ writeFileSync, mkdirSync } from 'fs';
import axios from 'axios';
import https from 'https';
import HttpsProxyAgent from 'https-proxy-agent';
import { DownloaderHelper } from 'node-downloader-helper';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = path.resolve();

function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:"*?<>|]+/g, '_');
}

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, devtools: true });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.goto(
      'https://sso.cu.edu.ng:8443/auth/realms/Cu/protocol/saml?SAMLRequest=fZJfb8IgFMW%2FSsN7pa2tVaImTrPMxG1G3R72smB7qyQUOi7sz7cftjO6F58I93J%2Bl3NgjLyWDZs5e1Qb%2BHCANviupULWNibEGcU0R4FM8RqQ2YJtZ48rlvQi1hhtdaEluZLcVnBEMFZoRYLlYkLe82y474%2BqYdXP0yTzu3RQJFFexVEa8dFgEJejPNlne6hI8AoGvXJCPMjLER0sFVqurC9FSRJGWRjHuyhnccbS%2BI0EC%2B9GKG5b1dHaBhmliLpXuB6UrqcObJimfcq9e2qAyxrp3NGzLXryQ4LZ%2Bc5zrdDVYLZgPkUBL5vVhVprXUq4gCmKupFwIvhe6XyvOTYtkWK3JiEvsK124hAbEqz%2FZt8JVQp1uJ3mvjuE7GG3W4fr5%2B2OTMcnNGvTMdMOPKbXtXH34k%2BetlystRTFT3CvTc3t7WGniijDqj3KrOEKBSjr85FSf819fBYmxBoHhE67kf%2F%2F1fQX&RelayState=https%3A%2F%2Fmoodle.cu.edu.ng%2Flogin%2Findex.php'
    );
    await page.setViewport({ width: 1920, height: 1080 });

    const screenshotPathBeforeClick = path.join(
      __dirname,
      'screenshot_before.png'
    );
    const screenshotPathAfterClick = path.join(
      __dirname,
      'screenshot_after.png'
    );

    await page.type('#username', '2100732');
    await page.type('#password', 'david2005');

    // await page.screenshot({ path: screenshotPathBeforeClick });
    // console.log('Screenshot before click saved at:', screenshotPathBeforeClick);

    const loginButtonSelector = '#kc-login';
    await Promise.all([
      page.waitForNavigation(),
      page.click(loginButtonSelector),
    ]);

    // Wait for 3 seconds before taking the screenshot after the click
    new Promise((r) => setTimeout(r, 3000));

    // const selector = 'div.dashboard-card.card';

    // Wait for the courses to load
    // await page.waitForSelector(selector, {timeout: 0});

    // Extract data attributes using page.evaluate

    // await page.waitForFunction(() => document.querySelector('.dropdown #action-menu-1-menu [aria-labelledby="actionmenuaction-2"]'));
    // await page.click('.dropdown #action-menu-1-menu [aria-labelledby="actionmenuaction-2"]');

    // const select = '#action-menu-1-menubar .dropdown div#action-menu-1-menu a:nth-child(2)'
    // const select = '.dropdown div a.dropdown-item:nth-child(2)'
    const select = '.dropdown div [aria-labelledby="actionmenuaction-2"]';
    const button = await page.waitForSelector(select);
    await button.evaluate((b) => b.click());
    console.log('clicked :)');

    const viewmore = 'li.viewmore a';
    await page.waitForSelector(viewmore);
    await page.click(viewmore);

    const selector = '.contentnode li a';
    await page.waitForSelector(selector);

    // Extract data attributes using page.evaluate
    const courses = await page.evaluate((selector) => {
      const courseElements = document.querySelectorAll(selector);

      return Array.from(courseElements).map((courseElement) => {
        const courseName = courseElement.textContent.trim();
        const courselink = courseElement.getAttribute('href');
        const url = new URL(courselink);
        const courseId = url.searchParams.get('course');

        return { link: courselink, id: courseId, name: courseName };
      });
    }, selector);

    // Output the course information
    console.log('User Courses:', courses);

    for (const obj of courses) {
      await page.goto(`https://moodle.cu.edu.ng/course/view.php?id=${obj.id}`);
      console.log(`inside ${obj.name}`);

      const selectorNotes = '.aalink';
      await page.waitForSelector(selectorNotes);
      console.log('waited...');

      const notes = await page.evaluate((selectorNotes, keyword) => {
        const notesList = document.querySelectorAll(selectorNotes);
        const notesArray = Array.from(notesList);
      
        // Filter notes to include only those containing the keyword "resource"
        const filteredNotes = notesArray
          .filter((note) => note.href.includes(keyword))
          .map((note) => note.href);
      
        return filteredNotes;
      }, selectorNotes, 'resource');

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        console.log(`Before click: ${note}`);

        // Click on the note link
        await page.goto(note, {waitUntil: "domcontentloaded"});

        // Wait for the PDF to load
        new Promise((r) => setTimeout(r, 3000));

        // Get the final URL after the click
        const finalUrl = page.url();
        console.log(`After click: ${finalUrl}`);

        // Generate PDF file path
        const pdfDir = path.join(__dirname, 'pdfs');
        mkdirSync(pdfDir, { recursive: true });
        const sanitizedFileName = sanitizeFileName(`note_${obj.name}_${i + 1}.pdf`);
        const pdfPath = path.join(pdfDir, sanitizedFileName);

        // Download the PDF using page.pdf()
        await page.pdf({ path: pdfPath, format: 'A4' });

        console.log(`PDF file saved at: ${pdfPath}`);
      }
      
    }

    await page.screenshot({ path: screenshotPathAfterClick });
    console.log('Screenshot after click saved at:', screenshotPathAfterClick);

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
