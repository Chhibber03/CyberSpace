const logger = require('../utils/logger');

/**
 * Get domain reputation using free heuristics
 * This replaces paid services like URLVoid
 */
async function getDomainReputation(domain) {
  const threats = [];
  const warnings = [];
  const analysis = {};

  try {
    // Safety check for null/undefined domain
    if (!domain || typeof domain !== 'string') {
      logger.warn('Domain reputation check: Invalid domain parameter:', domain);
      return {
        threats: [],
        warnings: [{
          type: 'invalid_domain',
          severity: 'low',
          description: 'Invalid domain parameter',
          reason: 'Domain is null, undefined, or not a string'
        }],
        analysis: {
          domainInfo: {
            domain: domain || 'unknown',
            tld: 'unknown',
            suspicious: false,
            reasons: ['Invalid domain parameter'],
            hyphenCount: 0,
            length: 0
          }
        }
      };
    }

    // Check domain age using basic heuristics
    const domainInfo = await analyzeDomainHeuristics(domain);
    analysis.domainInfo = domainInfo;

    if (domainInfo.suspicious) {
      warnings.push({
        type: 'domain_heuristics',
        severity: 'medium',
        description: 'Domain shows suspicious patterns',
        reason: domainInfo.reasons.join(', ')
      });
    }

    return {
      threats,
      warnings,
      analysis
    };

  } catch (error) {
    logger.error('Domain reputation check error:', error);
    return {
      threats: [],
      warnings: [{
        type: 'reputation_check_failed',
        severity: 'low',
        description: 'Failed to check domain reputation',
        reason: error.message
      }],
      analysis: {}
    };
  }
}

/**
 * Analyze domain using free heuristics
 */
async function analyzeDomainHeuristics(domain) {
  // Add null/undefined check
  if (!domain || typeof domain !== 'string') {
    logger.warn('Domain reputation check: Invalid domain parameter:', domain);
    return {
      domain: domain || 'unknown',
      tld: 'unknown',
      suspicious: false,
      reasons: ['Invalid domain parameter'],
      hyphenCount: 0,
      length: 0
    };
  }

  const reasons = [];
  let suspicious = false;

  try {
    // Check for suspicious TLDs (expanded list)
    const suspiciousTlds = ['xyz', 'top', 'club', 'online', 'site', 'gq', 'ml', 'cf', 'tk', 'click', 'link', 'bid', 'loan', 'work', 'tech', 'app', 'dev', 'io', 'co', 'me', 'tv', 'cc', 'ws', 'info', 'biz', 'zip', 'mov', 'country', 'ga'];
    const domainParts = domain.split('.');
    const tld = domainParts.length > 0 ? domainParts[domainParts.length - 1] : 'unknown';
    
    if (suspiciousTlds.includes(tld)) {
      reasons.push(`Suspicious TLD: .${tld}`);
      suspicious = true;
    }

    // Check for excessive hyphens (more aggressive)
    const hyphenCount = (domain.match(/-/g) || []).length;
    if (hyphenCount > 2) {
      reasons.push(`Excessive hyphens: ${hyphenCount}`);
      suspicious = true;
    }

    // Check domain length
    if (domain.length > 50) {
      reasons.push('Domain name too long');
      suspicious = true;
    }

    // Check for punycode
    if (domain.includes('xn--')) {
      reasons.push('Punycode domain detected');
      suspicious = true;
    }

    // Check for suspicious patterns (expanded list)
    const suspiciousPatterns = ['bank', 'secure', 'login', 'verify', 'update', 'account', 'password', 'credit', 'debit', 'social', 'security', 'irs', 'paypal', 'wallet', 'free', 'gift', 'bonus', 'claim', 'reward', 'prize', 'winner', 'urgent', 'limited', 'offer', 'discount', 'sale', 'deal', 'save', 'money', 'cash', 'payment', 'billing', 'invoice', 'refund', 'support', 'help', 'customer', 'service'];
    const foundPatterns = suspiciousPatterns.filter(pattern => 
      domain.toLowerCase().includes(pattern)
    );
    
    if (foundPatterns.length > 0) {
      reasons.push(`Suspicious keywords: ${foundPatterns.join(', ')}`);
      suspicious = true;
    }

    return {
      domain,
      tld,
      suspicious,
      reasons,
      hyphenCount,
      length: domain.length
    };
    
  } catch (error) {
    logger.error('Error analyzing domain heuristics:', error);
    return {
      domain,
      tld: 'unknown',
      suspicious: false,
      reasons: ['Error analyzing domain'],
      hyphenCount: 0,
      length: domain.length || 0
    };
  }
}

module.exports = {
  getDomainReputation,
  analyzeDomainHeuristics
};
