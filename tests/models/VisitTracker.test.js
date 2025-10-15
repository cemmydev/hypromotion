const VisitTracker = require('../../src/models/VisitTracker');
const redisClient = require('../../src/config/database');

// Mock the country data utility
jest.mock('../../src/utils/countryData', () => ({
  isValidCountryCode: jest.fn((code) => {
    const validCodes = ['us', 'uk', 'de', 'fr', 'it', 'es', 'ca', 'au', 'jp', 'br'];
    return validCodes.includes(code.toLowerCase());
  }),
  getCountryName: jest.fn((code) => {
    const names = {
      'us': 'United States',
      'uk': 'United Kingdom',
      'de': 'Germany',
      'fr': 'France',
      'it': 'Italy',
      'es': 'Spain',
      'ca': 'Canada',
      'au': 'Australia',
      'jp': 'Japan',
      'br': 'Brazil'
    };
    return names[code.toLowerCase()] || null;
  }),
  getCountryCodes: jest.fn(() => ['us', 'uk', 'de', 'fr', 'it', 'es', 'ca', 'au', 'jp', 'br'])
}));

describe('VisitTracker', () => {
  let visitTracker;
  let mockRedisClient;

  beforeEach(() => {
    visitTracker = new VisitTracker();
    mockRedisClient = redisClient.getClient();
    jest.clearAllMocks();
  });

  describe('trackVisit', () => {
    it('should track a visit for a valid country code', async () => {
      const countryCode = 'US';
      const expectedCount = 5;
      
      mockRedisClient.hIncrBy.mockResolvedValue(expectedCount);

      const result = await visitTracker.trackVisit(countryCode);

      expect(mockRedisClient.hIncrBy).toHaveBeenCalledWith(
        'visit_stats',
        'us',
        1
      );
      expect(result).toEqual({
        success: true,
        country: 'us',
        count: expectedCount
      });
    });

    it('should throw error for invalid country code', async () => {
      const invalidCountryCode = 'INVALID';

      await expect(visitTracker.trackVisit(invalidCountryCode))
        .rejects.toThrow('Invalid country code: INVALID');
    });

    it('should throw error for empty country code', async () => {
      await expect(visitTracker.trackVisit(''))
        .rejects.toThrow('Invalid country code: ');
    });

    it('should throw error for null country code', async () => {
      await expect(visitTracker.trackVisit(null))
        .rejects.toThrow('Invalid country code: null');
    });

    it('should handle Redis errors', async () => {
      const countryCode = 'US';
      const redisError = new Error('Redis connection failed');
      
      mockRedisClient.hIncrBy.mockRejectedValue(redisError);

      await expect(visitTracker.trackVisit(countryCode))
        .rejects.toThrow('Redis connection failed');
    });
  });

  describe('getStatistics', () => {
    it('should return all statistics', async () => {
      const mockStats = {
        'us': '100',
        'uk': '50',
        'de': '25'
      };
      
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const result = await visitTracker.getStatistics();

      expect(mockRedisClient.hGetAll).toHaveBeenCalledWith('visit_stats');
      expect(result).toEqual({
        'us': 100,
        'uk': 50,
        'de': 25
      });
    });

    it('should return empty object when no statistics exist', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await visitTracker.getStatistics();

      expect(result).toEqual({});
    });

    it('should handle Redis errors', async () => {
      const redisError = new Error('Redis connection failed');
      mockRedisClient.hGetAll.mockRejectedValue(redisError);

      await expect(visitTracker.getStatistics())
        .rejects.toThrow('Redis connection failed');
    });
  });

  describe('getCountryStats', () => {
    it('should return count for existing country', async () => {
      const countryCode = 'US';
      const expectedCount = '100';
      
      mockRedisClient.hGet.mockResolvedValue(expectedCount);

      const result = await visitTracker.getCountryStats(countryCode);

      expect(mockRedisClient.hGet).toHaveBeenCalledWith('visit_stats', 'us');
      expect(result).toBe(100);
    });

    it('should return 0 for non-existing country', async () => {
      const countryCode = 'US';
      
      mockRedisClient.hGet.mockResolvedValue(null);

      const result = await visitTracker.getCountryStats(countryCode);

      expect(result).toBe(0);
    });

    it('should throw error for invalid country code', async () => {
      await expect(visitTracker.getCountryStats('INVALID'))
        .rejects.toThrow('Invalid country code: INVALID');
    });
  });

  describe('resetStatistics', () => {
    it('should reset all statistics', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await visitTracker.resetStatistics();

      expect(mockRedisClient.del).toHaveBeenCalledWith('visit_stats');
      expect(result).toEqual({
        success: true,
        message: 'Statistics reset successfully'
      });
    });
  });

  describe('getTotalVisits', () => {
    it('should return total visits across all countries', async () => {
      const mockStats = {
        'us': 100,
        'uk': 50,
        'de': 25
      };
      
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const result = await visitTracker.getTotalVisits();

      expect(result).toBe(175);
    });

    it('should return 0 when no statistics exist', async () => {
      mockRedisClient.hGetAll.mockResolvedValue({});

      const result = await visitTracker.getTotalVisits();

      expect(result).toBe(0);
    });
  });

  describe('getTopCountries', () => {
    it('should return top countries sorted by count', async () => {
      const mockStats = {
        'us': 100,
        'uk': 50,
        'de': 25,
        'fr': 75
      };
      
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const result = await visitTracker.getTopCountries(3);

      expect(result).toEqual([
        { country: 'us', count: 100 },
        { country: 'fr', count: 75 },
        { country: 'uk', count: 50 }
      ]);
    });

    it('should respect limit parameter', async () => {
      const mockStats = {
        'us': 100,
        'uk': 50,
        'de': 25,
        'fr': 75
      };
      
      mockRedisClient.hGetAll.mockResolvedValue(mockStats);

      const result = await visitTracker.getTopCountries(2);

      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { country: 'us', count: 100 },
        { country: 'fr', count: 75 }
      ]);
    });
  });

  describe('getCountryName', () => {
    it('should return country name for valid codes', () => {
      expect(visitTracker.getCountryName('US')).toBe('United States');
      expect(visitTracker.getCountryName('uk')).toBe('United Kingdom');
      expect(visitTracker.getCountryName('DE')).toBe('Germany');
    });

    it('should return null for invalid country codes', () => {
      expect(visitTracker.getCountryName('INVALID')).toBe(null);
      expect(visitTracker.getCountryName('')).toBe(null);
      expect(visitTracker.getCountryName(null)).toBe(null);
    });
  });

  describe('getAvailableCountryCodes', () => {
    it('should return array of available country codes', () => {
      const codes = visitTracker.getAvailableCountryCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes).toContain('us');
      expect(codes).toContain('uk');
      expect(codes).toContain('de');
    });
  });
});

