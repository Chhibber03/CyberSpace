const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { checkEmailBreach, checkApiConfiguration } = require('../services/emailBreachChecker');
const { validateInput } = require('../middleware/validation');
const logger = require('../utils/logger');

// Email breach check schemas
const emailCheckSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email address is required'
  })
});

const batchEmailCheckSchema = Joi.object({
  emails: Joi.array().items(Joi.string().email()).min(1).max(100).required().messages({
    'array.min': 'At least one email address is required',
    'array.max': 'Maximum 100 email addresses allowed per batch',
    'any.required': 'Emails array is required'
  })
});

/**
 * Check single email for breaches
 * POST /api/v1/breach/email
 */
router.post('/email', validateInput(emailCheckSchema), async (req, res) => {
  try {
    const { email } = req.body;
    
    logger.info(`Email breach check requested for: ${email}`);
    
    const result = await checkEmailBreach(email);
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Email breach check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Email breach check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Check multiple emails for breaches
 * POST /api/v1/breach/email/batch
 */
router.post('/email/batch', validateInput(batchEmailCheckSchema), async (req, res) => {
  try {
    const { emails } = req.body;
    
    logger.info(`Batch email breach check requested for ${emails.length} emails`);
    
    const startTime = Date.now();
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Process emails in parallel with rate limiting
    const results = await Promise.allSettled(
      emails.map(email => checkEmailBreach(email))
    );
    
    const processedResults = results.map((result, index) => ({
      email: emails[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
    
    const batchResult = {
      batchId,
      timestamp: new Date().toISOString(),
      totalEmails: emails.length,
      successfulChecks: processedResults.filter(r => r.success).length,
      failedChecks: processedResults.filter(r => !r.success).length,
      results: processedResults,
      batchDuration: Date.now() - startTime
    };
    
    logger.info(`Batch email breach check ${batchId} completed in ${batchResult.batchDuration}ms. Success: ${batchResult.successfulChecks}/${batchResult.totalEmails}`);
    
    res.json({
      success: true,
      data: batchResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Batch email breach check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Batch email breach check failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get breach check statistics
 * GET /api/v1/breach/stats
 */
router.get('/stats', async (req, res) => {
  try {
    // This could be enhanced with actual database statistics
    const stats = {
      totalChecks: 0,
      totalBreaches: 0,
      averageRiskScore: 0,
      topBreachedDomains: [],
      lastUpdated: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to get breach statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get breach statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Health check for email breach service
 * GET /api/v1/breach/health
 */
router.get('/health', async (req, res) => {
  try {
    // Get API configuration status
    const apiConfig = checkApiConfiguration();
    
    // Test with a dummy email to check service health
    const testResult = await checkEmailBreach('test@example.com');
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'email-breach-checker',
      timestamp: new Date().toISOString(),
      apiConfiguration: apiConfig,
      testResult: {
        success: testResult !== null,
        duration: testResult?.checkDuration || 0
      }
    });
    
  } catch (error) {
    logger.error('Email breach service health check failed:', error);
    
    // Get API configuration even if test fails
    const apiConfig = checkApiConfiguration();
    
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: 'email-breach-checker',
      error: error.message,
      apiConfiguration: apiConfig,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
