// Test setup file
const redis = require('redis-mock');

// Mock Redis client for testing
jest.mock('../src/config/database', () => {
  const mockClient = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getClient: jest.fn(),
    isHealthy: jest.fn(() => Promise.resolve(true)),
    isConnected: true
  };

  const mockRedisClient = redis.createClient();
  
  // Mock Redis operations
  mockRedisClient.hIncrBy = jest.fn();
  mockRedisClient.hGetAll = jest.fn();
  mockRedisClient.hGet = jest.fn();
  mockRedisClient.del = jest.fn();
  mockRedisClient.ping = jest.fn(() => Promise.resolve('PONG'));
  
  mockClient.getClient.mockReturnValue(mockRedisClient);
  
  return mockClient;
});

// Global test timeout
jest.setTimeout(10000);

