const request = require('supertest');
const express = require('express');
const visitsRoutes = require('../../src/routes/visits');
const redisClient = require('../../src/config/database');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/visits', visitsRoutes);

describe('Visits Routes', () => {
  let mockRedisClient;

  beforeEach(() => {
    mockRedisClient = redisClient.getClient();
    jest.clearAllMocks();
  });

  describe('POST /api/visits/track', () => {
    it('should track a visit successfully', async () => {
      mockRedisClient.hIncrBy.mockResolvedValue(1);

      const response = await request(app)
        .post('/api/visits/track')
        .send({ countryCode: 'US' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Visit tracked successfully',
        data: {
          success: true,
          country: 'us',
          count: 1
        }
      });

      expect(mockRedisClient.hIncrBy).toHaveBeenCalledWith('visit_stats', 'us', 1);
    });

    it('should handle invalid country code', async () => {
      const response = await request(app)
        .post('/api/visits/track')
        .send({ countryCode: 'INVALID' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should handle missing country code', async () => {
      const response = await request(app)
        .post('/api/visits/track')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });

    it('should handle Redis errors', async () => {
      mockRedisClient.hIncrBy.mockRejectedValue(new Error('Redis error'));

      const response = await request(app)
        .post('/api/visits/track')
        .send({ countryCode: 'US' })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/visits/stats', () => {
    it('should return all statistics', async () => {
      const mockStats = {
        'us': '100',
        'uk': '50'
      };
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/visits/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Statistics retrieved successfully',
        data: {
          'us': 100,
          'uk': 50
        }
      });
    });

    it('should handle empty statistics', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const response = await request(app)
        .get('/api/visits/stats')
        .expect(200);

      expect(response.body.data).toEqual({});
    });
  });

  describe('GET /api/visits/stats/:countryCode', () => {
    it('should return country statistics', async () => {
      mockRedisClient.hGet.mockResolvedValue('100');

      const response = await request(app)
        .get('/api/visits/stats/US')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Country statistics retrieved successfully',
        data: {
          country: 'us',
          count: 100
        }
      });
    });

    it('should return 0 for non-existing country', async () => {
      mockRedisClient.hGet.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/visits/stats/US')
        .expect(200);

      expect(response.body.data.count).toBe(0);
    });

    it('should handle invalid country code', async () => {
      const response = await request(app)
        .get('/api/visits/stats/INVALID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Parameter validation error');
    });
  });

  describe('GET /api/visits/top', () => {
    it('should return top countries', async () => {
      const mockStats = {
        'us': '100',
        'uk': '50',
        'de': '25'
      };
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/visits/top?limit=2')
        .expect(200);

      expect(response.body.data.countries).toHaveLength(2);
      expect(response.body.data.countries[0]).toEqual({ country: 'us', count: 100 });
      expect(response.body.data.countries[1]).toEqual({ country: 'uk', count: 50 });
    });

    it('should use default limit when not provided', async () => {
      const mockStats = {
        'us': '100',
        'uk': '50',
        'de': '25'
      };
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/visits/top')
        .expect(200);

      expect(response.body.data.limit).toBe(10);
    });

    it('should handle invalid limit', async () => {
      const response = await request(app)
        .get('/api/visits/top?limit=invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/visits/total', () => {
    it('should return total visits', async () => {
      const mockStats = {
        'us': '100',
        'uk': '50'
      };
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/visits/total')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Total visits retrieved successfully',
        data: { total: 150 }
      });
    });
  });

  describe('DELETE /api/visits/reset', () => {
    it('should reset statistics', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const response = await request(app)
        .delete('/api/visits/reset')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('visit_stats');
    });
  });
});

