// Import necessary modules and functions
import request from 'supertest';
import app from '../index';
import { getCourses } from '../scrape/src/getCourses';
import { mocked } from "jest-mock";

// Mock getCourses function
jest.mock('../src/getCourses');

describe('API Endpoints', () => {
  let server;

  beforeAll(() => {
    server = app.listen(3000);
  });

  afterAll((done) => {
    server.close(done);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/downloadSpecificNotes', () => {
    it('should return 500 if getCourses throws an error', async () => {
      mocked(getCourses).mockRejectedValue(new Error('Test error'));
      const res = await request(server)
        .post('/api/downloadSpecificNotes')
        .send({ username: '2100732', password: 'david2005', coursecode: 'phy412' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/downloadNotes', () => {
    it('should return 500 if getCourses throws an error', async () => {
      mocked(getCourses).mockRejectedValue(new Error('Test error'));
      const res = await request(server)
        .post('/api/downloadNotes')
        .send({ username: '2100732', password: 'david2005' });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
});
