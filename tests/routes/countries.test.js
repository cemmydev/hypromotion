const request = require('supertest');
const express = require('express');
const visitsRoutes = require('../../src/routes/visits');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/visits', visitsRoutes);

// Mock the country data utility
jest.mock('../../src/utils/countryData', () => ({
  searchCountries: jest.fn((query) => {
    if (query === 'united') {
      return [
        { code: 'us', name: 'United States' },
        { code: 'gb', name: 'United Kingdom' }
      ];
    }
    return [];
  }),
  getPopularCountries: jest.fn(() => [
    { code: 'us', name: 'United States' },
    { code: 'gb', name: 'United Kingdom' },
    { code: 'de', name: 'Germany' },
    { code: 'fr', name: 'France' }
  ]),
  getCountriesForDropdown: jest.fn(() => [
    { code: 'ad', name: 'Andorra' },
    { code: 'ae', name: 'United Arab Emirates' },
    { code: 'af', name: 'Afghanistan' }
  ]),
  getCountryName: jest.fn((code) => {
    const names = {
      'us': 'United States',
      'gb': 'United Kingdom',
      'de': 'Germany',
      'fr': 'France'
    };
    return names[code.toLowerCase()] || null;
  })
}));

describe('Countries Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/visits/countries', () => {
    it('should return popular countries when popular=true', async () => {
      const response = await request(app)
        .get('/api/visits/countries?popular=true')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Countries retrieved successfully',
        data: {
          countries: [
            { code: 'us', name: 'United States' },
            { code: 'gb', name: 'United Kingdom' },
            { code: 'de', name: 'Germany' },
            { code: 'fr', name: 'France' }
          ],
          total: 4
        }
      });
    });

    it('should return searched countries when search query provided', async () => {
      const response = await request(app)
        .get('/api/visits/countries?search=united')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Countries retrieved successfully',
        data: {
          countries: [
            { code: 'us', name: 'United States' },
            { code: 'gb', name: 'United Kingdom' }
          ],
          total: 2
        }
      });
    });

    it('should return all countries when no parameters provided', async () => {
      const response = await request(app)
        .get('/api/visits/countries')
        .expect(200);

      expect(response.body.data.countries).toHaveLength(3);
      expect(response.body.data.countries[0]).toEqual({ code: 'ad', name: 'Andorra' });
    });
  });

  describe('GET /api/visits/countries/:countryCode', () => {
    it('should return country information for valid code', async () => {
      const response = await request(app)
        .get('/api/visits/countries/US')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Country information retrieved successfully',
        data: {
          code: 'us',
          name: 'United States'
        }
      });
    });

    it('should return 404 for invalid country code', async () => {
      const response = await request(app)
        .get('/api/visits/countries/INVALID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Parameter validation error');
    });

    it('should return 404 for non-existent country code', async () => {
      const response = await request(app)
        .get('/api/visits/countries/XX')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Country not found');
    });
  });
});
