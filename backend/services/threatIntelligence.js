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
    logger.warn('[GoogleSafeBrowsing] API key not configured — check skipped');
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
 * Check VirusTotal API v3
 */
async function checkVirusTotal(url) {
  if (!API_KEYS.VIRUS_TOTAL) {
    logger.warn('[VirusTotal] API key not configured — check skipped');
    return { malicious: 0, suspicious: 0, total: 0, safe: true, reason: 'API key not configured' };
  }

  try {
    // Submit URL for scanning via v3 API
    const submitResponse = await axios.post(
      'https://www.virustotal.com/api/v3/urls',
      `url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-apikey': API_KEYS.VIRUS_TOTAL,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      }
    );

    const analysisId = submitResponse.data.data.id;

    // Poll for results up to 3 times with 2s delay
    let analysisData = null;
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const reportResponse = await axios.get(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          headers: { 'x-apikey': API_KEYS.VIRUS_TOTAL },
          timeout: 10000
        }
      );

      if (reportResponse.data.data.attributes.status === 'completed') {
        analysisData = reportResponse.data.data.attributes;
        break;
      }
    }

    if (!analysisData) {
      return { malicious: 0, suspicious: 0, total: 0, safe: true, reason: 'Analysis timed out' };
    }

    const stats = analysisData.stats;
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const harmless = stats.harmless || 0;
    const undetected = stats.undetected || 0;
    const total = malicious + suspicious + harmless + undetected;

    return {
      malicious,
      suspicious,
      total,
      safe: malicious === 0
    };

  } catch (error) {
    logger.error('VirusTotal API error:', error);
    return { malicious: 0, suspicious: 0, total: 0, safe: true, reason: 'API check failed' };
  }
}

/**
 * Check URLVoid (APIVoid) API
 */
async function checkUrlVoid(hostname) {
  if (!API_KEYS.URLVOID) {
    logger.warn('[URLVoid] API key not configured — check skipped');
    return { reputation: 50, detections: 0, reason: 'API key not configured' };
  }

  try {
    const response = await axios.get(
      `https://endpoint.apivoid.com/urlrep/v1/pay-as-you-go/`,
      {
        params: {
          key: API_KEYS.URLVOID,
          host: hostname
        },
        timeout: 10000
      }
    );

    const data = response.data;
    const riskResult = data.data?.report?.risk_score?.result || 0;
    const detections = data.data?.report?.blacklists?.detections || 0;

    return {
      reputation: 100 - riskResult,
      detections,
      safe: detections === 0
    };

  } catch (error) {
    logger.error('URLVoid API error:', error);
    return { reputation: 50, detections: 0, reason: 'API check failed' };
  }
}

/**
 * Check PhishTank API (JSON)
 */
async function checkPhishTank(url) {
  if (!API_KEYS.PHISHTANK) {
    logger.warn('[PhishTank] API key not configured — check skipped');
    return { inDatabase: false, checked: false, reason: 'API key not configured' };
  }

  try {
    const response = await axios.post(
      'https://checkurl.phishtank.com/checkurl/',
      `url=${encodeURIComponent(url)}&format=json&app_key=${encodeURIComponent(API_KEYS.PHISHTANK)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      }
    );

    const results = response.data.results;
    return {
      inDatabase: !!results.in_database,
      verified: !!results.verified
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
