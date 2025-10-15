const Joi = require('joi');
const logger = require('../config/logger');

/**
 * Middleware to validate request body against Joi schema
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Validation error:', { errors: errorDetails, body: req.body });
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorDetails
      });
    }
    
    req.body = value;
    next();
  };
};

/**
 * Middleware to validate request parameters against Joi schema
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Parameter validation error:', { errors: errorDetails, params: req.params });
      
      return res.status(400).json({
        success: false,
        message: 'Parameter validation error',
        errors: errorDetails
      });
    }
    
    req.params = value;
    next();
  };
};

/**
 * Middleware to validate query parameters against Joi schema
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      logger.warn('Query validation error:', { errors: errorDetails, query: req.query });
      
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        errors: errorDetails
      });
    }
    
    req.query = value;
    next();
  };
};

/**
 * Validation schemas
 */
const schemas = {
  trackVisit: Joi.object({
    countryCode: Joi.string()
      .length(2)
      .pattern(/^[a-zA-Z]{2}$/)
      .required()
      .messages({
        'string.length': 'Country code must be exactly 2 characters',
        'string.pattern.base': 'Country code must contain only letters',
        'any.required': 'Country code is required'
      })
  }),
  
  countryParam: Joi.object({
    countryCode: Joi.string()
      .length(2)
      .pattern(/^[a-zA-Z]{2}$/)
      .required()
      .messages({
        'string.length': 'Country code must be exactly 2 characters',
        'string.pattern.base': 'Country code must contain only letters',
        'any.required': 'Country code is required'
      })
  }),
  
  topCountriesQuery: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  })
};

module.exports = {
  validateBody,
  validateParams,
  validateQuery,
  schemas
};

