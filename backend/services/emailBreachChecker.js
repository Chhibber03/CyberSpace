const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Check API configuration and return status
 */
function checkApiConfiguration() {
  const config = {
    rapidapi: {
      configured: !!(process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here' && process.env.RAPIDAPI_KEY !== 'demo-key'),
      key: process.env.RAPIDAPI_KEY ? '***' + process.env.RAPIDAPI_KEY.slice(-4) : 'Not set'
    }
  };
  
  logger.info('Email breach API configuration:', {
    service: 'cyberspace-backend',
    config
  });
  
  return config;
}

/**
 * Check if an email has been compromised in data breaches using free APIs
 * @param {string} email - Email address to check
 * @returns {Object} Breach check result
 */
async function checkEmailBreach(email) {
  const startTime = Date.now();
  const checkId = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info(`Email breach check ${checkId} started for: ${email}`);
    
    // Check API configuration and log status
    const apiConfig = checkApiConfiguration();
    
    // Validate email format
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    const results = await Promise.allSettled([
      checkBreachDirectory(email),
      checkEmailReputation(email)
    ]);
    
    // Process results
    const breachResults = [];
    const warnings = [];
    let totalBreaches = 0;
    let reputationRiskScore = 0;
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        if (result.value.breaches) {
          breachResults.push(...result.value.breaches);
          totalBreaches += result.value.breaches.length;
        }
        if (result.value.warnings) {
          warnings.push(...result.value.warnings);
        }
        // Collect reputation risk score
        if (result.value.riskScore) {
          reputationRiskScore = Math.max(reputationRiskScore, result.value.riskScore);
        }
      } else if (result.status === 'rejected') {
        logger.warn(`API check ${index} failed:`, result.reason);
        warnings.push({
          type: 'api_failure',
          severity: 'low',
          description: `API check failed`,
          reason: result.reason.message || 'Unknown error'
        });
      }
    });
    
    // Remove duplicate breaches
    const uniqueBreaches = removeDuplicateBreaches(breachResults);
    
    // Calculate risk score
    const breachRiskScore = calculateBreachRiskScore(uniqueBreaches);
    const totalRiskScore = Math.min(breachRiskScore + reputationRiskScore, 100);
    const riskLevel = determineBreachRiskLevel(totalRiskScore);
    
    const result = {
      checkId,
      email,
      timestamp: new Date().toISOString(),
      checkDuration: Date.now() - startTime,
      riskScore: totalRiskScore,
      riskLevel,
      totalBreaches: uniqueBreaches.length,
      breaches: uniqueBreaches,
      warnings,
      safe: riskLevel === 'safe',
      details: {
        apiResults: results.map((r, i) => ({
          api: ['BreachDirectory', 'EmailReputation'][i],
          success: r.status === 'fulfilled',
          data: r.status === 'fulfilled' ? r.value : null,
          error: r.status === 'rejected' ? r.reason.message : null
        }))
      }
    };
    
    logger.info(`Email breach check ${checkId} completed in ${result.checkDuration}ms. Risk: ${riskLevel}, Breaches: ${uniqueBreaches.length}`);
    
    return result;
    
  } catch (error) {
    logger.error(`Email breach check ${checkId} failed:`, error);
    throw error;
  }
}

// HaveIBeenPwned API removed - requires paid subscription

/**
 * Check BreachDirectory API (free)
 */
async function checkBreachDirectory(email) {
  try {
    // Check if we have a valid RapidAPI key
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey || rapidApiKey === 'your_rapidapi_key_here' || rapidApiKey === 'demo-key') {
      logger.warn('BreachDirectory API check skipped: No valid RapidAPI key configured');
      return { 
        breaches: [], 
        warnings: [{
          type: 'api_unavailable',
          severity: 'low',
          description: 'BreachDirectory API not configured',
          reason: 'RapidAPI key not set in environment variables'
        }]
      };
    }

    const response = await axios.get(`https://breachdirectory.p.rapidapi.com/?func=auto&term=${encodeURIComponent(email)}`, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'breachdirectory.p.rapidapi.com'
      },
      timeout: 15000 // Increased timeout
    });
    
    if (response.data && response.data.result) {
      const breaches = response.data.result.map(breach => ({
        source: 'BreachDirectory',
        name: breach.line || 'Unknown',
        domain: breach.domain || 'Unknown',
        breachDate: breach.date || 'Unknown',
        description: 'Data breach detected',
        dataClasses: ['email', 'password'],
        isVerified: true
      }));
      
      return { breaches, warnings: [] };
    }
    
    return { breaches: [], warnings: [] };
    
  } catch (error) {
    let errorMessage = error.message;
    let errorType = 'api_unavailable';
    let severity = 'low';
    
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded - try again later';
        errorType = 'rate_limit_exceeded';
        severity = 'medium';
      } else if (error.response.status === 401) {
        errorMessage = 'Invalid API key';
        errorType = 'invalid_api_key';
        severity = 'high';
      } else if (error.response.status === 403) {
        errorMessage = 'API access forbidden';
        errorType = 'access_forbidden';
        severity = 'high';
      } else {
        errorMessage = `HTTP ${error.response.status}: ${error.message}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
      errorType = 'timeout';
      severity = 'medium';
    }
    
    logger.warn(`BreachDirectory API check failed: ${errorMessage}`, {
      service: 'cyberspace-backend',
      errorType,
      statusCode: error.response?.status,
      email: email.substring(0, 3) + '***' // Log partial email for debugging
    });
    
    return { 
      breaches: [], 
      warnings: [{
        type: errorType,
        severity,
        description: 'BreachDirectory API temporarily unavailable',
        reason: errorMessage
      }]
    };
  }
}

/**
 * Check email reputation using free services and enhanced heuristics
 */
async function checkEmailReputation(email) {
  try {
    const warnings = [];
    const breaches = [];
    let riskScore = 0;
    
    // Check for disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.org',
      'throwaway.email', 'yopmail.com', 'getnada.com', 'mailnesia.com',
      'temp-mail.org', 'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net',
      'spam4.me', 'bccto.me', 'chacuo.net', 'dispostable.com', 'fakeinbox.com',
      'maildrop.cc', 'mailnesia.com', 'mintemail.com', 'mytrashmail.com',
      'nwldx.com', 'sharklasers.com', 'spamspot.com', 'tempr.email', 'trashmail.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      warnings.push({
        type: 'disposable_email',
        severity: 'medium',
        description: 'Email uses disposable email service',
        reason: 'Disposable emails are often used for malicious purposes'
      });
      riskScore += 30;
    }
    
    // Check for suspicious email patterns
    const suspiciousPatterns = [
      { pattern: /admin|root|test|demo|example/, reason: 'Common admin/test emails are often targeted' },
      { pattern: /[0-9]{8,}/, reason: 'Email contains excessive numbers (potential spam)' },
      { pattern: /[a-z]{20,}/, reason: 'Email contains very long random string' },
      { pattern: /[a-z0-9]{15,}@/, reason: 'Email username is suspiciously long' }
    ];
    
    suspiciousPatterns.forEach(({ pattern, reason }) => {
      if (pattern.test(email.toLowerCase())) {
        warnings.push({
          type: 'suspicious_email_pattern',
          severity: 'low',
          description: 'Email contains suspicious patterns',
          reason
        });
        riskScore += 10;
      }
    });
    
    // Check for common breach patterns
    const breachPatterns = [
      { pattern: /password|pwd|pass/, reason: 'Email contains password-related keywords' },
      { pattern: /login|signin|auth/, reason: 'Email contains authentication keywords' },
      { pattern: /bank|paypal|stripe|venmo/, reason: 'Email contains financial keywords' },
      { pattern: /crypto|bitcoin|wallet/, reason: 'Email contains cryptocurrency keywords' }
    ];
    
    breachPatterns.forEach(({ pattern, reason }) => {
      if (pattern.test(email.toLowerCase())) {
        warnings.push({
          type: 'potential_breach_target',
          severity: 'medium',
          description: 'Email matches common breach target patterns',
          reason
        });
        riskScore += 20;
      }
    });
    
    // Check for domain age and reputation (heuristic)
    const suspiciousDomains = [
      'xyz', 'top', 'site', 'online', 'web', 'net', 'info', 'buzz', 'click',
      'icu', 'tk', 'ml', 'cf', 'ga', 'gq', 'co', 'cc', 'ws', 'me'
    ];
    
    if (domain && suspiciousDomains.some(sd => domain.endsWith('.' + sd))) {
      warnings.push({
        type: 'suspicious_domain',
        severity: 'medium',
        description: 'Email uses suspicious domain extension',
        reason: 'New or less reputable domain extensions are often used for phishing'
      });
      riskScore += 25;
    }
    
    // If high risk score, create a synthetic breach record
    if (riskScore >= 50) {
      breaches.push({
        source: 'EmailReputation',
        name: 'High Risk Email Pattern',
        domain: domain || 'Unknown',
        breachDate: new Date().toISOString().split('T')[0],
        description: 'Email matches multiple high-risk patterns',
        dataClasses: ['email', 'pattern_analysis'],
        isVerified: false,
        isFabricated: false,
        isSensitive: false,
        isRetired: false,
        isSpamList: false
      });
    }
    
    return { breaches, warnings, riskScore };
    
  } catch (error) {
    logger.warn('Email reputation check failed:', error.message);
    return { 
      breaches: [], 
      warnings: [{
        type: 'reputation_check_failed',
        severity: 'low',
        description: 'Email reputation check failed',
        reason: error.message
      }],
      riskScore: 0
    };
  }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Remove duplicate breaches based on name and domain
 */
function removeDuplicateBreaches(breaches) {
  const seen = new Set();
  return breaches.filter(breach => {
    const key = `${breach.name}-${breach.domain}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Calculate breach risk score
 */
function calculateBreachRiskScore(breaches) {
  let score = 0;
  
  breaches.forEach(breach => {
    // Base score for each breach
    score += 20;
    
    // Additional points for sensitive data
    if (breach.isSensitive) score += 15;
    if (breach.isVerified) score += 10;
    if (breach.dataClasses && breach.dataClasses.length > 3) score += 10;
    
    // Recent breaches are more concerning
    if (breach.breachDate) {
      const breachYear = new Date(breach.breachDate).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - breachYear <= 2) score += 10;
    }
  });
  
  return Math.min(score, 100);
}

/**
 * Determine breach risk level
 */
function determineBreachRiskLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'safe';
}

module.exports = {
  checkEmailBreach,
  checkApiConfiguration
};

