import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import path from 'path';
import fs, { mkdirSync } from 'fs';

const app = express();
const port = 3000;

// Set up CORS middleware
// app.use(cors({
//   origin: 'https://slides-getter.vercel.app', 
//   methods: ['GET', 'POST'], 
//   allowedHeaders: ['Content-Type', 'Authorization'], 
// }));

app.use(cors())''

// app.use(cors({
//   origin:'http://localhost:5173/', 
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'x-client-key', 'x-client-token', 'x-client-secret', 'Authorization'],
//   credentials: true
// }));

// app.use((req, res, next) => {
//   // Allow requests from your front-end origin
//   res.header('Access-Control-Allow-Origin', 'http://localhost:5173'); // Replace with your front-end origin
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// Middleware to parse JSON bodies
app.use(express.json());

// Function to sanitize file names
function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:"*?<>|]+/g, '_');
}

// Route to handle the API request
app.post('/downloadNotes', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);

    await page.goto(
      'https://sso.cu.edu.ng:8443/auth/realms/Cu/protocol/saml?SAMLRequest=fZJfb8IgFMW%2FSsN7pa2tVaImTrPMxG1G3R72smB7qyQUOi7sz7cftjO6F58I93J%2Bl3NgjLyWDZs5e1Qb%2BHCANviupULWNibEGcU0R4FM8RqQ2YJtZ48rlvQi1hhtdaEluZLcVnBEMFZoRYLlYkLe82y474%2BqYdXP0yTzu3RQJFFexVEa8dFgEJejPNlne6hI8AoGvXJCPMjLER0sFVqurC9FSRJGWRjHuyhnccbS%2BI0EC%2B9GKG5b1dHaBhmliLpXuB6UrqcObJimfcq9e2qAyxrp3NGzLXryQ4LZ%2Bc5zrdDVYLZgPkUBL5vVhVprXUq4gCmKupFwIvhe6XyvOTYtkWK3JiEvsK124hAbEqz%2FZt8JVQp1uJ3mvjuE7GG3W4fr5%2B2OTMcnNGvTMdMOPKbXtXH34k%2BetlystRTFT3CvTc3t7WGniijDqj3KrOEKBSjr85FSf819fBYmxBoHhE67kf%2F%2F1fQX&RelayState=https%3A%2F%2Fmoodle.cu.edu.ng%2Flogin%2Findex.php'
    );

    await page.setViewport({ width: 1920, height: 1080 });

    await page.type('#username', username);
    await page.type('#password', password);

    const loginButtonSelector = '#kc-login';
    await Promise.all([
      page.waitForNavigation(),
      page.click(loginButtonSelector),
    ]);

    const select = '.dropdown div [aria-labelledby="actionmenuaction-2"]';
    const button = await page.waitForSelector(select);
    await button.evaluate((b) => b.click());

    const viewmore = 'li.viewmore a';
    await page.waitForSelector(viewmore);
    await page.click(viewmore);

    const selector = '.contentnode li a';
    await page.waitForSelector(selector);

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

    const downloads = [];

    for (const obj of courses) {
      await page.goto(`https://moodle.cu.edu.ng/course/view.php?id=${obj.id}`);

      const selectorNotes = '.aalink';
      await page.waitForSelector(selectorNotes);

      const notes = await page.evaluate((selectorNotes, keyword) => {
        const notesList = document.querySelectorAll(selectorNotes);
        const notesArray = Array.from(notesList);

        const filteredNotes = notesArray
          .filter((note) => note.href.includes(keyword))
          .map((note) => note.href);

        return filteredNotes;
      }, selectorNotes, 'resource');

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const notePage = await browser.newPage();

        try {
          await notePage.goto(note, { waitUntil: 'domcontentloaded' });
          const finalUrl = notePage.url();

          if (finalUrl) {
            // const downloadDir = path.join(__dirname, 'downloads');
            // mkdirSync(downloadDir, { recursive: true });
            const sanitizedFileName = sanitizeFileName(
              `note_${obj.name}_${i + 1}`
            );
            // const filePath = path.join(downloadDir, sanitizedFileName);

            await notePage.evaluate(() => {
              const downloadElement = document.createElement('a');
              downloadElement.href = window.location.href;
              downloadElement.download = 'download.pdf';
              document.body.appendChild(downloadElement);
              downloadElement.click();
              document.body.removeChild(downloadElement);
            });

            downloads.push(finalUrl);
          }
        } catch (error) {
          console.error('Error processing note:', error);
        } finally {
          await notePage.close();
        }
      }
    }

    await browser.close();

    res.json({ downloads });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});
