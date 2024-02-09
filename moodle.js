import puppeteer from 'puppeteer';
import path from 'path';
import fs, { mkdirSync, writeFileSync } from 'fs';
import axios from 'axios';
import https from 'https';
import HttpsProxyAgent from 'https-proxy-agent';
import { DownloaderHelper } from 'node-downloader-helper';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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

    await page.screenshot({ path: screenshotPathBeforeClick });
    console.log('Screenshot before click saved at:', screenshotPathBeforeClick);

    const loginButtonSelector = '#kc-login';
    await Promise.all([
      page.waitForNavigation(),
      page.click(loginButtonSelector),
    ]);

    // Wait for 3 seconds before taking the screenshot after the click
    new Promise((r) => setTimeout(r, 3000));

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

    //to download all notes from each course
    for (const obj of courses) {
      await page.goto(`https://moodle.cu.edu.ng/course/view.php?id=${obj.id}`);
      console.log(`inside ${obj.name}`);

      const selectorNotes = '.aalink';
      await page.waitForSelector(selectorNotes);
      console.log('waited...');

      const notes = await page.evaluate(
        (selectorNotes, keyword) => {
          const notesList = document.querySelectorAll(selectorNotes);
          const notesArray = Array.from(notesList);

          // Filter notes to include only those containing the keyword "resource"
          const filteredNotes = notesArray
            .filter((note) => note.href.includes(keyword))
            .map((note) => note.href);

          return filteredNotes;
        },
        selectorNotes,
        'resource'
      );

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        console.log(`Before click: ${note}`);
    
        // Open a new page for each note URL
        const notePage = await browser.newPage();
        
        try {
          // Navigate to the note URL
          await notePage.goto(note, { waitUntil: 'domcontentloaded' });
    
          // Wait for the PDF to load
          // await notePage.waitForTimeout(10000); 
          new Promise(r => setTimeout(r, 10000));
    
          // Get the final URL after the click
          const finalUrl = notePage.url();
          console.log(`After click: ${finalUrl}`);
    
          if (finalUrl) {
            // Generate file path and name
            const downloadDir = path.join(__dirname, 'downloads');
            mkdirSync(downloadDir, { recursive: true });
            const sanitizedFileName = sanitizeFileName(
              `note_${obj.name}_${i + 1}`
            );
            const filePath = path.join(downloadDir, sanitizedFileName);
    
            await notePage.evaluate(() => {
              const downloadElement = document.createElement('a');
              downloadElement.href = window.location.href; // Use the current URL or final URL as needed
              downloadElement.download = 'download.pdf'; // You can set any default file name
              document.body.appendChild(downloadElement);
              downloadElement.click();
              document.body.removeChild(downloadElement);
            });
    
            // Wait for the download to complete (you may need to adjust the wait time)
            // await notePage.waitForTimeout(5000);
            new Promise(r => setTimeout(r, 5000));
    
            console.log(`File saved at: ${filePath}`);
          } else {
            console.log('no url');
          }
        } catch (error) {
          console.error('Error processing note:', error);
        } finally {
          // Close the new page after processing
          await notePage.close();
        }
      }
    }
       

    await page.screenshot({ path: screenshotPathAfterClick });
    console.log('Screenshot after click saved at:', screenshotPathAfterClick);

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();



