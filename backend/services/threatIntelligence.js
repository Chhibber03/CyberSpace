const axios = require('axios');
const logger = require('../utils/logger');

// API keys and configurations
const API_KEYS = {
  GOOGLE_SAFE_BROWSING: process.env.GOOGLE_SAFE_BROWSING_API_KEY,
  VIRUS_TOTAL: process.env.VIRUS_TOTAL_API_KEY,
  URLVOID: process.env.URLVOID_API_KEY,
  PHISHTANK: process.env.PHISHTANK_API_KEY
};

/**
 * Get comprehensive threat intelligence for a URL
 */
async function getThreatIntelligence(url, hostname) {
  const threats = [];
  const warnings = [];
  const analysis = {};

  try {
    // Run all threat intelligence checks in parallel
    const [
      googleSafeBrowsing,
      virusTotal,
      urlVoid,
      phishTank
    ] = await Promise.allSettled([
      checkGoogleSafeBrowsing(url),
      checkVirusTotal(url),
      checkUrlVoid(hostname),
      checkPhishTank(url)
    ]);

    // Process Google Safe Browsing results
    if (googleSafeBrowsing.status === 'fulfilled') {
      analysis.googleSafeBrowsing = googleSafeBrowsing.value;
      if (!googleSafeBrowsing.value.safe) {
        threats.push({
          type: 'google_safe_browsing',
          severity: 'high',
          description: 'Flagged by Google Safe Browsing',
          reason: googleSafeBrowsing.value.threats.join(', ')
        });
      }
    }

    // Process VirusTotal results
    if (virusTotal.status === 'fulfilled') {
      analysis.virusTotal = virusTotal.value;
      if (virusTotal.value.malicious > 0) {
        threats.push({
          type: 'virus_total',
          severity: 'high',
          description: `Flagged by ${virusTotal.value.malicious} security vendors`,
          reason: 'Multiple security vendors have flagged this URL as malicious'
        });
      }
    }

    // Process URLVoid results
    if (urlVoid.status === 'fulfilled') {
      analysis.urlVoid = urlVoid.value;
      if (urlVoid.value.reputation < 50) {
        warnings.push({
          type: 'urlvoid_reputation',
          severity: 'medium',
          description: 'Low domain reputation score',
          reason: `Domain reputation: ${urlVoid.value.reputation}/100`
        });
      }
    }

    // Process PhishTank results
    if (phishTank.status === 'fulfilled') {
      analysis.phishTank = phishTank.value;
      if (phishTank.value.inDatabase) {
        threats.push({
          type: 'phishtank',
          severity: 'critical',
          description: 'Found in PhishTank database',
          reason: 'Community-verified phishing attempt'
        });
      }
    }

  } catch (error) {
    logger.error('Threat intelligence error:', error);
    warnings.push({
      type: 'threat_intel_failed',
      severity: 'low',
      description: 'Failed to retrieve threat intelligence',
      reason: error.message
    });
  }

  analysis.threats = threats;
  analysis.warnings = warnings;
  return analysis;
}

/**
 * Check Google Safe Browsing API
 */
async function checkGoogleSafeBrowsing(url) {
  if (!API_KEYS.GOOGLE_SAFE_BROWSING) {
    return { safe: true, reason: 'API key not configured' };
  }

  try {
    const response = await axios.post(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEYS.GOOGLE_SAFE_BROWSING}`,
      {
        client: {
          clientId: 'cyberspace',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      },
      { timeout: 10000 }
    );

    return {
      safe: !response.data.matches,
      threats: response.data.matches ? response.data.matches.map(m => m.threatType) : []
    };

  } catch (error) {
    logger.error('Google Safe Browsing API error:', error);
    return { safe: true, reason: 'API check failed' };
  }
}

/**
 * Check VirusTotal API
 */
async function checkVirusTotal(url) {
  if (!API_KEYS.VIRUS_TOTAL) {
    return { malicious: 0, total: 0, reason: 'API key not configured' };
  }

  try {
    // URL scan
    const scanResponse = await axios.post(
      'https://www.virustotal.com/vtapi/v2/url/scan',
      `url=${encodeURIComponent(url)}&apikey=${API_KEYS.VIRUS_TOTAL}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    );

    // Wait a bit and then get the report
    await new Promise(resolve => setTimeout(resolve, 2000));

    const reportResponse = await axios.get(
      `https://www.virustotal.com/vtapi/v2/url/report?apikey=${API_KEYS.VIRUS_TOTAL}&resource=${encodeURIComponent(url)}`,
      { timeout: 10000 }
    );

    const report = reportResponse.data;
    return {
      malicious: report.positives || 0,
      total: report.total || 0,
      scanDate: report.scan_date,
      permalink: report.permalink
    };

  } catch (error) {
    logger.error('VirusTotal API error:', error);
    return { malicious: 0, total: 0, reason: 'API check failed' };
  }
}

/**
 * Check URLVoid API
 */
async function checkUrlVoid(hostname) {
  if (!API_KEYS.URLVOID) {
    return { reputation: 50, reason: 'API key not configured' };
  }

  try {
    const response = await axios.get(
      `https://api.urlvoid.com/v1/purl/${hostname}`,
      {
        headers: { 'API-Key': API_KEYS.URLVOID },
        timeout: 10000
      }
    );

    const data = response.data;
    return {
      reputation: data.reputation || 50,
      riskScore: data.risk_score || 0,
      country: data.country,
      server: data.server
    };

  } catch (error) {
    logger.error('URLVoid API error:', error);
    return { reputation: 50, reason: 'API check failed' };
  }
}

/**
 * Check PhishTank API
 */
async function checkPhishTank(url) {
  try {
    const response = await axios.get(
      `https://checkurl.phishtank.com/checkurl/`,
      {
        params: { url },
        timeout: 10000
      }
    );

    // PhishTank returns HTML, so we need to parse it
    const inDatabase = response.data.includes('phish confirmed') || 
                      response.data.includes('phish verified');

    return {
      inDatabase,
      checked: true,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    logger.error('PhishTank API error:', error);
    return { inDatabase: false, checked: false, reason: 'API check failed' };
  }
}

module.exports = {
  getThreatIntelligence,
  checkGoogleSafeBrowsing,
  checkVirusTotal,
  checkUrlVoid,
  checkPhishTank
};
