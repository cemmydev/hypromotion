const request = require('supertest');
const app = require('../../src/server');

describe('Load Testing', () => {
  const testCountryCodes = ['us', 'uk', 'de', 'fr', 'it', 'es', 'ca', 'au', 'jp', 'br'];

  describe('High Volume Track Requests', () => {
    it('should handle 100 concurrent track requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        const countryCode = testCountryCodes[i % testCountryCodes.length];
        promises.push(
          request(app)
            .post('/api/visits/track')
            .send({ countryCode })
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    }, 30000);

    it('should handle rapid sequential requests', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        const countryCode = testCountryCodes[i % testCountryCodes.length];
        const response = await request(app)
          .post('/api/visits/track')
          .send({ countryCode });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
      
      const duration = Date.now() - startTime;
      console.log(`50 sequential requests completed in ${duration}ms`);
      
      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });

  describe('High Volume Stats Requests', () => {
    it('should handle 50 concurrent stats requests', async () => {
      const promises = [];
      
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .get('/api/visits/stats')
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    }, 15000);

    it('should handle mixed concurrent requests', async () => {
      const promises = [];
      
      // 30 track requests
      for (let i = 0; i < 30; i++) {
        const countryCode = testCountryCodes[i % testCountryCodes.length];
        promises.push(
          request(app)
            .post('/api/visits/track')
            .send({ countryCode })
        );
      }
      
      // 20 stats requests
      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .get('/api/visits/stats')
        );
      }

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    }, 20000);
  });

  describe('Memory and Performance', () => {
    it('should not leak memory with repeated requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform 1000 requests
      for (let i = 0; i < 1000; i++) {
        const countryCode = testCountryCodes[i % testCountryCodes.length];
        await request(app)
          .post('/api/visits/track')
          .send({ countryCode });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`Memory increase after 1000 requests: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 60000);
  });
});

