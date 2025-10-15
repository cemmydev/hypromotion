const redisClient = require('../config/database');
const logger = require('../config/logger');
const countryData = require('../utils/countryData');

class VisitTracker {
  constructor() {
    this.STATS_KEY = 'visit_stats';
  }

  /**
   * Track a visit for a specific country
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   * @returns {Promise<Object>} - Result object with success status
   */
  async trackVisit(countryCode) {
    try {
      if (!countryData.isValidCountryCode(countryCode)) {
        throw new Error(`Invalid country code: ${countryCode}`);
      }

      const client = redisClient.getClient();
      
      // Use HINCRBY for atomic increment operation
      // This is crucial for high concurrency scenarios
      const newCount = await client.hIncrBy(this.STATS_KEY, countryCode.toLowerCase(), 1);
      
      logger.info(`Visit tracked for country: ${countryCode.toLowerCase()}, new count: ${newCount}`);
      
      return {
        success: true,
        country: countryCode.toLowerCase(),
        count: newCount
      };
    } catch (error) {
      logger.error('Error tracking visit:', error);
      throw error;
    }
  }

  /**
   * Get all visit statistics
   * @returns {Promise<Object>} - Object with country codes as keys and counts as values
   */
  async getStatistics() {
    try {
      const client = redisClient.getClient();
      
      // Use HGETALL to get all country statistics in one operation
      const stats = await client.hGetAll(this.STATS_KEY);
      
      // Convert string values to numbers
      const result = {};
      for (const [country, count] of Object.entries(stats)) {
        result[country] = parseInt(count, 10);
      }
      
      logger.info(`Retrieved statistics for ${Object.keys(result).length} countries`);
      
      return result;
    } catch (error) {
      logger.error('Error retrieving statistics:', error);
      throw error;
    }
  }

  /**
   * Get statistics for a specific country
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   * @returns {Promise<number>} - Visit count for the country
   */
  async getCountryStats(countryCode) {
    try {
      if (!countryData.isValidCountryCode(countryCode)) {
        throw new Error(`Invalid country code: ${countryCode}`);
      }

      const client = redisClient.getClient();
      const count = await client.hGet(this.STATS_KEY, countryCode.toLowerCase());
      
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      logger.error('Error retrieving country statistics:', error);
      throw error;
    }
  }

  /**
   * Reset all statistics (useful for testing)
   * @returns {Promise<Object>} - Result object
   */
  async resetStatistics() {
    try {
      const client = redisClient.getClient();
      await client.del(this.STATS_KEY);
      
      logger.info('Statistics reset successfully');
      
      return { success: true, message: 'Statistics reset successfully' };
    } catch (error) {
      logger.error('Error resetting statistics:', error);
      throw error;
    }
  }

  /**
   * Get country name by code
   * @param {string} countryCode - Country code
   * @returns {string|null} Country name or null if not found
   */
  getCountryName(countryCode) {
    return countryData.getCountryName(countryCode);
  }

  /**
   * Get all available country codes
   * @returns {Array<string>} Array of country codes
   */
  getAvailableCountryCodes() {
    return countryData.getCountryCodes();
  }

  /**
   * Get total visit count across all countries
   * @returns {Promise<number>} - Total visit count
   */
  async getTotalVisits() {
    try {
      const stats = await this.getStatistics();
      return Object.values(stats).reduce((total, count) => total + count, 0);
    } catch (error) {
      logger.error('Error calculating total visits:', error);
      throw error;
    }
  }

  /**
   * Get top countries by visit count
   * @param {number} limit - Number of top countries to return
   * @returns {Promise<Array>} - Array of {country, count} objects
   */
  async getTopCountries(limit = 10) {
    try {
      const stats = await this.getStatistics();
      return Object.entries(stats)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting top countries:', error);
      throw error;
    }
  }
}

module.exports = VisitTracker;

