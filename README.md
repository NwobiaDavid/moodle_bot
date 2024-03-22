# Automated Moodle Notes Downloader

 An API built using Node.js, Express.js and Puppeteer.

## Overview

This is a Node.js application designed to automate the downloading of notes from a Moodle platform. It utilizes Puppeteer, a headless browser automation library, to navigate through the Moodle platform, locate and download notes.

The application exposes two API endpoints:

1. `/api/downloadSpecificNotes`: Downloads notes for a specific course.
2. `/api/downloadNotes`: Downloads notes for all courses.

## Dependencies

The application relies on several dependencies:

- **Express**: A minimal and flexible Node.js web application framework.
- **Cors**: Middleware for enabling CORS (Cross-Origin Resource Sharing).
- **Puppeteer**: Headless Chrome Node.js API for browser automation.
- **Path**: Provides utilities for working with file and directory paths.
- **fs**: File system module for interacting with the file system.
- **getCourses**: A custom function to fetch courses from Moodle.

## Functionality

### 1. `downloadSpecificNotes` Endpoint

- **Route**: `/api/downloadSpecificNotes`
- **Method**: POST

This endpoint downloads notes for a specific course. It takes `username`, `password`, and `coursecode` in the request body. It then:

1. Fetches courses using `getCourses`.
2. Searches for the specified course.
3. Navigates to the course page on Moodle.
4. Scrapes all notes links from the page.
5. Downloads each note.

```javascript
app.post('/api/downloadSpecificNotes', async (req, res) => {
  // Extract username, password, and coursecode from request body
  const { username, password, coursecode } = req.body;

  // Fetch courses based on username and password
  const courses = await getCourses(username, password);
  const searchTerm = coursecode;

  // Find the course matching the provided coursecode
  const searchedCourse = courses.find((course) =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  try {
    if (searchedCourse) {
      // Navigate to the course page on Moodle
      await page.goto(
        `https://moodle.cu.edu.ng/course/view.php?id=${searchedCourse.id}`
      );

      // Scraping notes links from the page
      const notes = await page.evaluate(...);

      // Iterate through notes and download each one
      for (let i = 0; i < notes.length; i++) {
        // Download note code here...
      }
    } else {
      console.log(`Course with search term "${searchTerm}" not found.`);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 2. `downloadNotes` Endpoint

- **Route**: `/api/downloadNotes`
- **Method**: POST

This endpoint downloads notes for all courses. It takes `username` and `password` in the request body. It then:

1. Fetches all courses using `getCourses`.
2. Navigates to each course page on Moodle.
3. Scrapes all notes links from each course page.
4. Downloads each note.

```javascript
app.post('/api/downloadNotes', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    const downloads = [];

    // Fetch all courses
    const courses = await getCourses(username, password);

    // Iterate through courses and download notes for each
    for (const obj of courses) {
      // Code to download notes for each course
    }

    // Close browser instance
    await browser.close();

    res.json({ downloads });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```


## Usage

1. Install dependencies: `npm install`.
2. Run the application: `node index.js`.
3. Access the API endpoints using appropriate HTTP requests.


## Conclusion

This documentation provides an overview of the automated Moodle notes downloader application, including its functionality, code structure, and usage. It serves as a guide for understanding and testing the application.

### P.S. the Raw Script is located in the script folder