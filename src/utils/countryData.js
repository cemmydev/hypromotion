const countries = require('country-list');

/**
 * Country data utilities using the country-list npm package
 */
class CountryData {
  constructor() {
    this.countries = countries.getData();
  }

  /**
   * Get all available country codes
   * @returns {Array<string>} Array of country codes
   */
  getCountryCodes() {
    return this.countries.map(country => country.code.toLowerCase());
  }

  /**
   * Get country name by code
   * @param {string} countryCode - ISO 3166-1 alpha-2 country code
   * @returns {string|null} Country name or null if not found
   */
  getCountryName(countryCode) {
    const country = this.countries.find(c => 
      c.code.toLowerCase() === countryCode.toLowerCase()
    );
    return country ? country.name : null;
  }

  /**
   * Get country code by name
   * @param {string} countryName - Country name
   * @returns {string|null} Country code or null if not found
   */
  getCountryCode(countryName) {
    const country = this.countries.find(c => 
      c.name.toLowerCase() === countryName.toLowerCase()
    );
    return country ? country.code.toLowerCase() : null;
  }

  /**
   * Check if a country code is valid
   * @param {string} countryCode - Country code to validate
   * @returns {boolean} True if valid, false otherwise
   */
  isValidCountryCode(countryCode) {
    if (!countryCode || typeof countryCode !== 'string') {
      return false;
    }
    
    const normalizedCode = countryCode.toLowerCase().trim();
    return this.countries.some(country => 
      country.code.toLowerCase() === normalizedCode
    );
  }

  /**
   * Get all countries as an object with code as key and name as value
   * @returns {Object} Object with country codes as keys and names as values
   */
  getAllCountries() {
    const result = {};
    this.countries.forEach(country => {
      result[country.code.toLowerCase()] = country.name;
    });
    return result;
  }

  /**
   * Get countries for frontend dropdown
   * @returns {Array<Object>} Array of {code, name} objects sorted by name
   */
  getCountriesForDropdown() {
    return this.countries
      .map(country => ({
        code: country.code.toLowerCase(),
        name: country.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Search countries by name or code
   * @param {string} query - Search query
   * @returns {Array<Object>} Array of matching countries
   */
  searchCountries(query) {
    if (!query || query.length < 2) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return this.countries
      .filter(country => 
        country.name.toLowerCase().includes(lowerQuery) ||
        country.code.toLowerCase().includes(lowerQuery)
      )
      .map(country => ({
        code: country.code.toLowerCase(),
        name: country.name
      }))
      .slice(0, 20); // Limit to 20 results
  }

  /**
   * Get total number of countries
   * @returns {number} Total number of countries
   */
  getTotalCountries() {
    return this.countries.length;
  }

  /**
   * Get popular countries (commonly used for web analytics)
   * @returns {Array<Object>} Array of popular countries
   */
  getPopularCountries() {
    const popularCodes = [
      'us', 'gb', 'de', 'fr', 'it', 'es', 'ca', 'au', 'jp', 'br',
      'ru', 'cn', 'in', 'mx', 'nl', 'se', 'no', 'dk', 'fi', 'pl'
    ];
    
    return popularCodes
      .map(code => {
        const country = this.countries.find(c => c.code.toLowerCase() === code);
        return country ? {
          code: country.code.toLowerCase(),
          name: country.name
        } : null;
      })
      .filter(Boolean);
  }
}

module.exports = new CountryData();
