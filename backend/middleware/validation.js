const Joi = require('joi');

/**
 * Middleware to validate request body against Joi schema
 */
function validateInput(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }))
      });
    }
    
    // Replace req.body with validated data
    req.body = value;
    next();
  };
}

/**
 * Middleware to validate query parameters
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }))
      });
    }
    
    req.query = value;
    next();
  };
}

/**
 * Middleware to validate URL parameters
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parameter validation failed',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }))
      });
    }
    
    req.params = value;
    next();
  };
}

module.exports = {
  validateInput,
  validateQuery,
  validateParams
};
