const express = require('express');
const Joi = require('joi');
const { scanUrlComprehensive } = require('../services/urlScanner');
const { validateInput } = require('../middleware/validation');

const router = express.Router();

// Input validation schema
const urlScanSchema = Joi.object({
  url: Joi.string().uri().required(),
  includeContent: Joi.boolean().default(false),
  includeScreenshot: Joi.boolean().default(false),
  includeThreatIntel: Joi.boolean().default(true)
});

// Main URL scanning endpoint
router.post('/url', validateInput(urlScanSchema), async (req, res) => {
  try {
    const { url, includeContent, includeScreenshot, includeThreatIntel } = req.body;
    

    
    const scanResult = await scanUrlComprehensive(url, {
      includeContent,
      includeScreenshot,
      includeThreatIntel
    });
    
    res.json({
      success: true,
      data: scanResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to scan URL',
      message: error.message
    });
  }
});

// Simple GET endpoint for extension compatibility
router.get('/check', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }
    
    const scanResult = await scanUrlComprehensive(url, {
      includeContent: false,
      includeScreenshot: false,
      includeThreatIntel: true
    });
    
    // Transform to match extension's expected format
    const status = scanResult.riskLevel === 'safe' || scanResult.riskLevel === 'low' ? 'safe' : 
                   scanResult.riskLevel === 'medium' ? 'suspicious' : 'unsafe';
    
    res.json({
      status: status,
      reason: `Risk Level: ${scanResult.riskLevel}. Threats: ${scanResult.threats.length}, Warnings: ${scanResult.warnings.length}`,
      ssl: !url.startsWith('http://'),
      domain_age: "Unknown",
      riskLevel: scanResult.riskLevel,
      threats: scanResult.threats,
      warnings: scanResult.warnings
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to scan URL',
      message: error.message
    });
  }
});









module.exports = router;
