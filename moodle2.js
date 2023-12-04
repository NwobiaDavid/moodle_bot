import puppeteer from 'puppeteer';
import path from 'path';
import { writeFileSync } from 'fs';
import axios from 'axios';
import HttpsProxyAgent from 'https-proxy-agent';


const __dirname = path.resolve();

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false, });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.goto('https://sso.cu.edu.ng:8443/auth/realms/Cu/protocol/saml?SAMLRequest=fZJfb8IgFMW%2FSsN7pa2tVaImTrPMxG1G3R72smB7qyQUOi7sz7cftjO6F58I93J%2Bl3NgjLyWDZs5e1Qb%2BHCANviupULWNibEGcU0R4FM8RqQ2YJtZ48rlvQi1hhtdaEluZLcVnBEMFZoRYLlYkLe82y474%2BqYdXP0yTzu3RQJFFexVEa8dFgEJejPNlne6hI8AoGvXJCPMjLER0sFVqurC9FSRJGWRjHuyhnccbS%2BI0EC%2B9GKG5b1dHaBhmliLpXuB6UrqcObJimfcq9e2qAyxrp3NGzLXryQ4LZ%2Bc5zrdDVYLZgPkUBL5vVhVprXUq4gCmKupFwIvhe6XyvOTYtkWK3JiEvsK124hAbEqz%2FZt8JVQp1uJ3mvjuE7GG3W4fr5%2B2OTMcnNGvTMdMOPKbXtXH34k%2BetlystRTFT3CvTc3t7WGniijDqj3KrOEKBSjr85FSf819fBYmxBoHhE67kf%2F%2F1fQX&RelayState=https%3A%2F%2Fmoodle.cu.edu.ng%2Flogin%2Findex.php');
    await page.setViewport({ width: 1920, height: 1080 });

    const screenshotPathBeforeClick = path.join(__dirname, 'screenshot_before.png');
    const screenshotPathAfterClick = path.join(__dirname, 'screenshot_after.png');

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
    new Promise(r => setTimeout(r, 3000));

    // const selector = 'div.dashboard-card.card';

    // Wait for the courses to load
    // await page.waitForSelector(selector, {timeout: 0});

    // Extract data attributes using page.evaluate

    // await page.waitForFunction(() => document.querySelector('.dropdown #action-menu-1-menu [aria-labelledby="actionmenuaction-2"]'));
    // await page.click('.dropdown #action-menu-1-menu [aria-labelledby="actionmenuaction-2"]');
    

    // const select = '#action-menu-1-menubar .dropdown div#action-menu-1-menu a:nth-child(2)'
    // const select = '.dropdown div a.dropdown-item:nth-child(2)'
    const select = '.dropdown div [aria-labelledby="actionmenuaction-2"]'
    const button = await page.waitForSelector(select)
    await button.evaluate(b => b.click());
    console.log('clicked :)')

    const viewmore = 'li.viewmore a'
    await page.waitForSelector(viewmore);
    await page.click(viewmore);

    const selector = '.contentnode dd ul li a'
        // Extract data attributes using page.evaluate
        const courses = await page.evaluate((selector) => {
            const courseElements = document.querySelectorAll(selector);
            const courseData = [];
      
            courseElements.forEach((courseElement) => {
            //   const dataCourseId = courseElement.getAttribute('data-course-id');
              const courseName = courseElement.textContent.trim();

              const courselink = courseElement.getAttribute('href');
      
              courseData.push({ link: courselink, name: courseName });
            });
      
            return courseData;
          }, selector);

    // Output the course information
    console.log('User Courses:', courses);

    // const courses = await page.evaluate((selector) => {
    //   const courseElements = document.querySelectorAll(selector);
    //   const courseData = [];

    //   courseElements.forEach((courseElement) => {
    //     const dataCourseId = courseElement.getAttribute('data-course-id');
    //     const courseName = courseElement.querySelector('.coursename > .multiline').textContent.trim();

    //     courseData.push({ id: dataCourseId, name: courseName });
    //   });

    //   return courseData;
    // }, selector);

    // // Output the course information
    // console.log('User Courses:', courses);

    // for (const obj of courses) {
    //   await page.goto(`https://moodle.cu.edu.ng/course/view.php?id=${obj.id}`);
    //   console.log(`inside ${obj.name}`);

    //   const selectorNotes = '.aalink';
    //   await page.waitForSelector(selectorNotes);

    //   const notes = await page.evaluate((selectorNotes) => {
    //     const notesList = document.querySelectorAll(selectorNotes);
    //     const notesArray = Array.from(notesList);
    //     return notesArray.map((note) => note.href);
    //   }, selectorNotes);

    //   for (let i = 0; i < notes.length; i++) {
    //     const note = notes[i];

       
    //     // Using Axios to download PDF files
    //     // const agent = new HttpsProxyAgent('http://your-proxy-url');
    //     // const response = await axios.get(note, { responseType:

    //     // Alternatively, you can use the following to save the file directly
    //     const pdfPath = path.join(__dirname, `note_${obj.name}_${i + 1}.pdf`);
    //     writeFileSync(pdfPath, Buffer.from(response.data));

    //     console.log(`PDF file saved at: ${pdfPath}`);

    //   }
    // }

    await page.screenshot({ path: screenshotPathAfterClick });
    console.log('Screenshot after click saved at:', screenshotPathAfterClick);

    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
})();
