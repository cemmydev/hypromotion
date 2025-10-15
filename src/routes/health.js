const express = require('express');
const router = express.Router();
const redisClient = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    service: 'visit-tracker',
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Check Redis connection
    const isRedisHealthy = await redisClient.isHealthy();
    
    if (isRedisHealthy) {
      healthCheck.database = 'connected';
      res.status(200).json(healthCheck);
    } else {
      healthCheck.database = 'disconnected';
      res.status(503).json(healthCheck);
    }
  } catch (error) {
    healthCheck.database = 'error';
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
}));

/**
 * @route   GET /health/ready
 * @desc    Readiness check endpoint
 * @access  Public
 */
router.get('/ready', asyncHandler(async (req, res) => {
  try {
    const isRedisHealthy = await redisClient.isHealthy();
    
    if (isRedisHealthy) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      reason: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /health/live
 * @desc    Liveness check endpoint
 * @access  Public
 */
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

