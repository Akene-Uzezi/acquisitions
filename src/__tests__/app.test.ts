import request from 'supertest';
import app from '../app.js';

describe('API Endpoints', () => {
  describe('GET /', () => {
    it('should return a welcome message', async () => {
      const response = await request(app).get('/').expect(200);
      expect(response.body).toHaveProperty(
        'message',
        'Hello from acquisitions!'
      );
    });
  });
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app).get('/api').expect(200);
      expect(response.body).toHaveProperty(
        'message',
        'Acquisitions API is running'
      );
    });
  });
  describe('GET /nonexistent', () => {
    it('should return 404 for nonexistent routes', async () => {
      const response = await request(app).get('/nonexistent').expect(404);
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});
