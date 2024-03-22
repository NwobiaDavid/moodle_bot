import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import path from 'path';
import fs, { mkdirSync } from 'fs';
import { getCourses } from './src/getCourses';

const app = express();
const port = 3000;

// Set up CORS middleware
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Function to sanitize file names
function sanitizeFileName(fileName) {
  return fileName.replace(/[\\/:"*?<>|]+/g, '_');
}

// Download specific note
app.post('/api/downloadSpecificNotes', async (req, res) => {
  const { username, password, coursecode } = req.body;

  const courses = await getCourses(username, password);
  const searchTerm = coursecode;

  const searchedCourse = courses.find((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  try {
    if (searchedCourse) {
      console.log(
        `found course: ${searchedCourse.name}, and now downloading...`
      );

      await page.goto(
        `https://moodle.cu.edu.ng/course/view.php?id=${searchedCourse.id}`
      );
      console.log(`inside ${searchedCourse.name}`);

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

        // Open a new page for each note URL
        const notePage = await browser.newPage();
        new Promise((r) => setTimeout(r, 10000));

        try {
          await notePage.goto(note, { waitUntil: 'domcontentloaded' });

          // Wait for the PDF to load
          new Promise((r) => setTimeout(r, 10000));

          // Get the final URL after the click
          const finalUrl = notePage.url();
          console.log(`After click: ${finalUrl}`);

          if (finalUrl) {
            // Generate file path and name
            const downloadDir = path.join(__dirname, 'downloads');
            mkdirSync(downloadDir, { recursive: true });
            const sanitizedFileName = sanitizeFileName(
              `note_${searchedCourse.name}_${i + 1}`
            );
            const filePath = path.join(downloadDir, sanitizedFileName);

            await notePage.evaluate(() => {
              const downloadElement = document.createElement('a');
              downloadElement.href = window.location.href;
              downloadElement.download = 'download.pdf';
              document.body.appendChild(downloadElement);
              downloadElement.click();
              document.body.removeChild(downloadElement);
            });

            new Promise((r) => setTimeout(r, 5000));

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
    } else {
      console.log(`Course with search term "${searchTerm}" not found.`);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Download all notes
app.post('/api/downloadNotes', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const downloads = [];

    const courses = await getCourses(username, password);

    for (const obj of courses) {
      await page.goto(`https://moodle.cu.edu.ng/course/view.php?id=${obj.id}`);

      const selectorNotes = '.aalink';
      await page.waitForSelector(selectorNotes);

      const notes = await page.evaluate(
        (selectorNotes, keyword) => {
          const notesList = document.querySelectorAll(selectorNotes);
          const notesArray = Array.from(notesList);

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
        const notePage = await browser.newPage();

        try {
          await notePage.goto(note, { waitUntil: 'domcontentloaded' });
          const finalUrl = notePage.url();

          if (finalUrl) {
            const sanitizedFileName = sanitizeFileName(
              `note_${obj.name}_${i + 1}`
            );

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
