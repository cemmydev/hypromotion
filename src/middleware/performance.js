const logger = require('../config/logger');

/**
 * Performance monitoring middleware
 */
const performanceMonitor = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  const startMemory = process.memoryUsage();
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage();
    
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    
    // Log performance metrics for slow requests
    if (duration > 100) { // Log requests slower than 100ms
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`,
        statusCode: res.statusCode
      });
    }
    
    // Log high memory usage
    if (memoryDelta > 10 * 1024 * 1024) { // 10MB
      logger.warn('High memory usage detected', {
        method: req.method,
        url: req.originalUrl,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Connection pooling optimization
 */
const optimizeConnections = (req, res, next) => {
  // Set keep-alive headers for better connection reuse
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Keep-Alive', 'timeout=5, max=1000');
  
  next();
};

/**
 * Compression middleware for better performance
 */
const compression = require('compression');

const compressionConfig = compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if already compressed or if it's a small response
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

/**
 * Request size limiter to prevent abuse
 */
const requestSizeLimiter = (req, res, next) => {
  const contentLength = parseInt(req.get('content-length') || '0', 10);
  const maxSize = 1024 * 1024; // 1MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large'
    });
  }
  
  next();
};

/**
 * Memory usage monitoring
 */
const memoryMonitor = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: (memUsage.rss / 1024 / 1024).toFixed(2),
      heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2),
      heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2),
      external: (memUsage.external / 1024 / 1024).toFixed(2)
    };
    
    // Log memory usage if it's getting high
    if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
      logger.info('Memory usage', memUsageMB);
    }
    
    // Force garbage collection if available and memory usage is high
    if (global.gc && memUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
      global.gc();
      logger.info('Forced garbage collection');
    }
  }, 30000); // Check every 30 seconds
};

/**
 * CPU usage monitoring
 */
const cpuMonitor = () => {
  const startUsage = process.cpuUsage();
  
  setInterval(() => {
    const usage = process.cpuUsage(startUsage);
    const userPercent = usage.user / 1000000; // Convert to seconds
    const systemPercent = usage.system / 1000000;
    
    // Log high CPU usage
    if (userPercent + systemPercent > 80) { // 80% CPU usage
      logger.warn('High CPU usage detected', {
        user: `${userPercent.toFixed(2)}s`,
        system: `${systemPercent.toFixed(2)}s`,
        total: `${(userPercent + systemPercent).toFixed(2)}s`
      });
    }
  }, 60000); // Check every minute
};

module.exports = {
  performanceMonitor,
  optimizeConnections,
  compressionConfig,
  requestSizeLimiter,
  memoryMonitor,
  cpuMonitor
};
