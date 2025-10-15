const redis = require('redis');

class OptimizedRedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connectionPool = [];
    this.maxConnections = 10;
    this.connectionTimeout = 5000;
  }

  async connect() {
    try {
      // Create main connection
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: this.connectionTimeout,
          lazyConnect: true,
          keepAlive: 30000,
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              return new Error('Too many reconnection attempts');
            }
            return Math.min(retries * 100, 3000);
          }
        },
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      // Configure for high performance
      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
      // Create connection pool for high concurrency
      await this.createConnectionPool();
      
      return this.client;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async createConnectionPool() {
    const poolPromises = [];
    
    for (let i = 0; i < this.maxConnections; i++) {
      const poolClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: this.connectionTimeout,
          lazyConnect: true,
          keepAlive: 30000
        }
      });
      
      poolPromises.push(poolClient.connect());
      this.connectionPool.push(poolClient);
    }
    
    await Promise.all(poolPromises);
    console.log(`Created Redis connection pool with ${this.maxConnections} connections`);
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  getPoolClient() {
    if (this.connectionPool.length === 0) {
      return this.getClient();
    }
    
    // Simple round-robin selection
    const client = this.connectionPool.shift();
    this.connectionPool.push(client);
    return client;
  }

  async batchOperations(operations) {
    const client = this.getPoolClient();
    const pipeline = client.multi();
    
    operations.forEach(op => {
      switch (op.type) {
        case 'hincrby':
          pipeline.hIncrBy(op.key, op.field, op.value);
          break;
        case 'hget':
          pipeline.hGet(op.key, op.field);
          break;
        case 'hgetall':
          pipeline.hGetAll(op.key);
          break;
        default:
          throw new Error(`Unsupported operation type: ${op.type}`);
      }
    });
    
    return await pipeline.exec();
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
    
    // Disconnect pool connections
    const disconnectPromises = this.connectionPool.map(client => client.quit());
    await Promise.all(disconnectPromises);
    this.connectionPool = [];
  }

  async isHealthy() {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // High-performance batch tracking
  async batchTrackVisits(visits) {
    const operations = visits.map(visit => ({
      type: 'hincrby',
      key: 'visit_stats',
      field: visit.countryCode.toLowerCase(),
      value: visit.count || 1
    }));
    
    return await this.batchOperations(operations);
  }

  // Optimized statistics retrieval with caching
  async getStatisticsCached(ttl = 30) {
    const cacheKey = 'stats_cache';
    const client = this.getClient();
    
    try {
      // Try to get cached data first
      const cached = await client.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      
      // If no cache, get fresh data
      const stats = await client.hGetAll('visit_stats');
      const result = {};
      for (const [country, count] of Object.entries(stats)) {
        result[country] = parseInt(count, 10);
      }
      
      // Cache the result
      await client.setEx(cacheKey, ttl, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Error getting cached statistics:', error);
      throw error;
    }
  }
}

module.exports = new OptimizedRedisClient();
