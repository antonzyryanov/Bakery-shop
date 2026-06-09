import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe('API integration', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown API route', async () => {
    const response = await request(app).get('/api/not-found');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Route not found.');
  });
});
