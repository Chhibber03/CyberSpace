const express = require('express');
const Joi = require('joi');
const { validateInput, validateQuery } = require('../middleware/validation');
const { getThreatIntelligence } = require('../services/threatIntelligence');
const logger = require('../utils/logger');

const router = express.Router();

// Get threat intelligence for a specific URL
router.get('/url/:url', validateQuery(Joi.object({
  includeReputation: Joi.boolean().default(true),
  includeHistory: Joi.boolean().default(false)
})), async (req, res) => {
  try {
    const { url } = req.params;
    const { includeReputation, includeHistory } = req.query;
    
    logger.info(`Threat intelligence request for: ${url}`);
    
    const threatIntel = await getThreatIntelligence(url, new URL(url).hostname);
    
    res.json({
      success: true,
      data: {
        url,
        threatIntelligence: threatIntel,
        includeReputation,
        includeHistory,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Threat intelligence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve threat intelligence',
      message: error.message
    });
  }
});

// Get domain reputation information
router.get('/domain/:domain/reputation', async (req, res) => {
  try {
    const { domain } = req.params;
    
    // TODO: Implement domain reputation service
    res.json({
      success: true,
      data: {
        domain,
        reputation: 'coming_soon',
        message: 'Domain reputation service will be implemented soon'
      }
    });
    
  } catch (error) {
    logger.error('Domain reputation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve domain reputation'
    });
  }
});

// Get recent threats feed
router.get('/feed/recent', validateQuery(Joi.object({
  limit: Joi.number().min(1).max(100).default(20),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
})), async (req, res) => {
  try {
    const { limit, severity } = req.query;
    
    // TODO: Implement threat feed service
    res.json({
      success: true,
      data: {
        threats: [],
        total: 0,
        limit,
        severity,
        message: 'Threat feed service will be implemented soon'
      }
    });
    
  } catch (error) {
    logger.error('Threat feed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve threat feed'
    });
  }
});

// Get threat statistics
router.get('/stats', async (req, res) => {
  try {
    // TODO: Implement threat statistics service
    res.json({
      success: true,
      data: {
        totalScans: 0,
        threatsDetected: 0,
        safeUrls: 0,
        riskDistribution: {
          safe: 0,
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        topThreatTypes: [],
        message: 'Statistics service will be implemented soon'
      }
    });
    
  } catch (error) {
    logger.error('Threat stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve threat statistics'
    });
  }
});

module.exports = router;
