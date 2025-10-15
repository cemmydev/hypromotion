const express = require('express');
const router = express.Router();
const VisitTracker = require('../models/VisitTracker');
const { validateBody, validateParams, validateQuery, schemas } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const countryData = require('../utils/countryData');

const visitTracker = new VisitTracker();

/**
 * @route   POST /api/visits/track
 * @desc    Track a visit for a specific country
 * @access  Public
 */
router.post('/track', validateBody(schemas.trackVisit), asyncHandler(async (req, res) => {
  const { countryCode } = req.body;
  
  const result = await visitTracker.trackVisit(countryCode);
  
  logger.info(`Visit tracked for ${countryCode}`, { result });
  
  res.status(200).json({
    success: true,
    message: 'Visit tracked successfully',
    data: result
  });
}));

/**
 * @route   GET /api/visits/stats
 * @desc    Get all visit statistics
 * @access  Public
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await visitTracker.getStatistics();
  
  logger.info('Statistics retrieved', { countriesCount: Object.keys(stats).length });
  
  res.status(200).json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: stats
  });
}));

/**
 * @route   GET /api/visits/stats/:countryCode
 * @desc    Get visit statistics for a specific country
 * @access  Public
 */
router.get('/stats/:countryCode', validateParams(schemas.countryParam), asyncHandler(async (req, res) => {
  const { countryCode } = req.params;
  
  const count = await visitTracker.getCountryStats(countryCode);
  
  logger.info(`Country stats retrieved for ${countryCode}`, { count });
  
  res.status(200).json({
    success: true,
    message: 'Country statistics retrieved successfully',
    data: {
      country: countryCode.toLowerCase(),
      count
    }
  });
}));

/**
 * @route   GET /api/visits/top
 * @desc    Get top countries by visit count
 * @access  Public
 */
router.get('/top', validateQuery(schemas.topCountriesQuery), asyncHandler(async (req, res) => {
  const { limit } = req.query;
  
  const topCountries = await visitTracker.getTopCountries(limit);
  
  logger.info('Top countries retrieved', { limit, count: topCountries.length });
  
  res.status(200).json({
    success: true,
    message: 'Top countries retrieved successfully',
    data: {
      limit,
      countries: topCountries
    }
  });
}));

/**
 * @route   GET /api/visits/total
 * @desc    Get total visit count across all countries
 * @access  Public
 */
router.get('/total', asyncHandler(async (req, res) => {
  const total = await visitTracker.getTotalVisits();
  
  logger.info('Total visits retrieved', { total });
  
  res.status(200).json({
    success: true,
    message: 'Total visits retrieved successfully',
    data: { total }
  });
}));

/**
 * @route   DELETE /api/visits/reset
 * @desc    Reset all statistics (useful for testing)
 * @access  Public
 */
router.delete('/reset', asyncHandler(async (req, res) => {
  const result = await visitTracker.resetStatistics();
  
  logger.info('Statistics reset', { result });
  
  res.status(200).json({
    success: true,
    message: 'Statistics reset successfully',
    data: result
  });
}));

/**
 * @route   GET /api/visits/countries
 * @desc    Get all available countries
 * @access  Public
 */
router.get('/countries', asyncHandler(async (req, res) => {
  const { search, popular } = req.query;
  
  let countries;
  
  if (search) {
    countries = countryData.searchCountries(search);
  } else if (popular === 'true') {
    countries = countryData.getPopularCountries();
  } else {
    countries = countryData.getCountriesForDropdown();
  }
  
  logger.info('Countries retrieved', { 
    count: countries.length, 
    search: search || null, 
    popular: popular === 'true' 
  });
  
  res.status(200).json({
    success: true,
    message: 'Countries retrieved successfully',
    data: {
      countries,
      total: countries.length
    }
  });
}));

/**
 * @route   GET /api/visits/countries/:countryCode
 * @desc    Get country information by code
 * @access  Public
 */
router.get('/countries/:countryCode', validateParams(schemas.countryParam), asyncHandler(async (req, res) => {
  const { countryCode } = req.params;
  
  const countryName = countryData.getCountryName(countryCode);
  
  if (!countryName) {
    return res.status(404).json({
      success: false,
      message: 'Country not found'
    });
  }
  
  logger.info('Country info retrieved', { countryCode, countryName });
  
  res.status(200).json({
    success: true,
    message: 'Country information retrieved successfully',
    data: {
      code: countryCode.toLowerCase(),
      name: countryName
    }
  });
}));

module.exports = router;

