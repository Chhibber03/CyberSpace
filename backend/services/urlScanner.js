const dns = require('dns');
const { promisify } = require('util');
const punycode = require('punycode');
const tldjs = require('tldjs');
const axios = require('axios');
const cheerio = require('cheerio');
// const puppeteer = require('puppeteer'); // Disabled for now - install separately if needed
const { getThreatIntelligence } = require('./threatIntelligence');
const { getDomainReputation } = require('./domainReputation');

// Promisify DNS functions for async/await usage
const resolveA = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);
const resolveTxt = promisify(dns.resolveTxt);



/**
 * Comprehensive URL security scanner
 */
async function scanUrlComprehensive(url, options = {}) {
  const {
    includeContent = false,
    includeScreenshot = false,
    includeThreatIntel = true
  } = options;

  const startTime = Date.now();
  const scanId = generateScanId();
  


  try {
    // Normalize and validate URL
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      throw new Error('Invalid URL format');
    }

    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const domain = tldjs.getDomain(hostname);
    const subdomain = tldjs.getSubdomain(hostname);

    // Safety check for IP addresses and invalid domains
    const isIp = isIpAddress(hostname);
    const validDomain = domain && !isIp ? domain : hostname;

    // Initialize scan result
    const scanResult = {
      scanId,
      url: normalizedUrl,
      hostname,
      domain: validDomain,
      subdomain,
      timestamp: new Date().toISOString(),
      scanDuration: 0,
      riskScore: 0,
      riskLevel: 'unknown',
      threats: [],
      warnings: [],
      safe: false,
      details: {}
    };

    // 1. BASIC URL ANALYSIS
    const basicAnalysis = await performBasicAnalysis(urlObj, hostname, domain, subdomain);
    scanResult.details.basicAnalysis = basicAnalysis;
    scanResult.threats.push(...basicAnalysis.threats);
    scanResult.warnings.push(...basicAnalysis.warnings);

    // 2. DNS ANALYSIS
    const dnsAnalysis = await performDnsAnalysis(hostname);
    scanResult.details.dnsAnalysis = dnsAnalysis;
    scanResult.threats.push(...dnsAnalysis.threats);
    scanResult.warnings.push(...dnsAnalysis.warnings);

    // 3. DOMAIN REPUTATION
    if (includeThreatIntel) {
      const reputationAnalysis = await getDomainReputation(validDomain);
      scanResult.details.reputationAnalysis = reputationAnalysis;
      scanResult.threats.push(...reputationAnalysis.threats);
      scanResult.warnings.push(...reputationAnalysis.warnings);
    }

    // 4. THREAT INTELLIGENCE
    if (includeThreatIntel) {
      const threatIntel = await getThreatIntelligence(normalizedUrl, hostname);
      scanResult.details.threatIntelligence = threatIntel;
      scanResult.threats.push(...threatIntel.threats);
      scanResult.warnings.push(...threatIntel.warnings);
    }

    // 5. CONTENT ANALYSIS
    if (includeContent) {
      const contentAnalysis = await performContentAnalysis(normalizedUrl);
      scanResult.details.contentAnalysis = contentAnalysis;
      scanResult.threats.push(...contentAnalysis.threats);
      scanResult.warnings.push(...contentAnalysis.warnings);
    }

    // 6. SCREENSHOT ANALYSIS (if requested)
    if (includeScreenshot) {
      const screenshotAnalysis = await performScreenshotAnalysis(normalizedUrl);
      scanResult.details.screenshotAnalysis = screenshotAnalysis;
      scanResult.threats.push(...screenshotAnalysis.threats);
      scanResult.warnings.push(...screenshotAnalysis.warnings);
    }

    // Calculate final risk score and level
    scanResult.riskScore = calculateRiskScore(scanResult.threats, scanResult.warnings);
    scanResult.riskLevel = determineRiskLevel(scanResult.riskScore);
    
    // Check if domain is whitelisted
    const isWhitelisted = scanResult.details.basicAnalysis?.analysis?.whitelisted;
    if (isWhitelisted) {
      scanResult.riskScore = 0;
      scanResult.riskLevel = 'safe';
      scanResult.safe = true;
    } else {
      scanResult.safe = scanResult.riskLevel === 'safe' || scanResult.riskLevel === 'low';
    }

    scanResult.scanDuration = Date.now() - startTime;
    


    return scanResult;

  } catch (error) {
    throw error;
  }
}

/**
 * Basic URL structure analysis
 */
async function performBasicAnalysis(urlObj, hostname, domain, subdomain) {
  const threats = [];
  const warnings = [];
  const analysis = {};

  // Whitelist of known legitimate domains (reduced to only the most trusted)
  const legitimateDomains = [
    'google.com', 'gmail.com', 'drive.google.com',
    'facebook.com', 'instagram.com', 'twitter.com',
    'amazon.com', 'netflix.com', 'spotify.com',
    'apple.com', 'microsoft.com', 'github.com',
    'wikipedia.org', 'yahoo.com', 'bing.com',
    'paypal.com', 'zoom.us', 'slack.com'
  ];

  // Check if domain is in whitelist (only exact matches)
  if (legitimateDomains.includes(hostname)) {
    return { threats: [], warnings: [], analysis: { whitelisted: true } };
  }
  
  // Check if main domain is whitelisted (but be more careful)
  if (domain && legitimateDomains.includes(domain)) {
    // Only whitelist if it's a direct subdomain of a trusted domain
    const trustedSubdomains = ['www', 'mail', 'docs', 'drive', 'maps', 'translate'];
    if (subdomain && trustedSubdomains.includes(subdomain)) {
      return { threats: [], warnings: [], analysis: { whitelisted: true } };
    }
  }

  // Check for raw IP addresses
  if (isIpAddress(hostname)) {
    threats.push({
      type: 'raw_ip_address',
      severity: 'high',
      description: 'URL uses raw IP address instead of domain name',
      reason: 'Phishers often use IP addresses to bypass domain-based security measures'
    });
  }

  // Check for punycode domains
  if (hostname.includes('xn--')) {
    threats.push({
      type: 'punycode_domain',
      severity: 'high',
      description: 'Punycode domain detected',
      reason: 'Punycode can be used to create visually similar domains for phishing'
    });
  }

  // Check domain length
  if (hostname.length > 63) {
    threats.push({
      type: 'excessive_domain_length',
      severity: 'medium',
      description: 'Domain name is excessively long',
      reason: 'Very long domains are often used to hide malicious intent'
    });
  }

  // Check for suspicious TLDs (expanded list)
  const suspiciousTlds = [
    'zip', 'mov', 'country', 'gq', 'ml', 'cf', 'tk', 'ga', 'xyz', 'top', 'club', 'online', 'site', 'click', 'link', 'bid', 'loan', 'work', 'tech', 'app', 'dev', 'io', 'co', 'me', 'tv', 'cc', 'ws', 'info', 'biz'
  ];
  
  const tld = tldjs.getPublicSuffix(hostname);
  if (suspiciousTlds.includes(tld)) {
    warnings.push({
      type: 'suspicious_tld',
      severity: 'medium',
      description: `Suspicious top-level domain: .${tld}`,
      reason: 'This TLD is commonly associated with malicious sites'
    });
  }

  // Check for lookalike domains (brand impersonation)
  const knownBrands = [
    'allegro', 'paypal', 'google', 'apple', 'amazon', 'bank', 'facebook',
    'microsoft', 'netflix', 'spotify', 'instagram', 'twitter', 'linkedin',
    'ebay', 'walmart', 'target', 'chase', 'wellsfargo', 'bankofamerica',
    'citibank', 'usbank', 'pnc', 'tdbank', 'capitalone', 'americanexpress'
  ];
  
  const officialDomains = {
    allegro: 'allegro.pl',
    paypal: 'paypal.com',
    google: 'google.com',
    apple: 'apple.com',
    amazon: 'amazon.com',
    facebook: 'facebook.com',
    microsoft: 'microsoft.com',
    netflix: 'netflix.com',
    spotify: 'spotify.com',
    instagram: 'instagram.com',
    twitter: 'twitter.com',
    linkedin: 'linkedin.com',
    ebay: 'ebay.com',
    walmart: 'walmart.com',
    target: 'target.com',
    chase: 'chase.com',
    wellsfargo: 'wellsfargo.com',
    bankofamerica: 'bankofamerica.com',
    citibank: 'citibank.com',
    usbank: 'usbank.com',
    pnc: 'pnc.com',
    tdbank: 'tdbank.com',
    capitalone: 'capitalone.com',
    americanexpress: 'americanexpress.com'
  };

  // Check if domain contains a known brand but isn't the official domain
  for (const brand of knownBrands) {
    if (hostname.includes(brand)) {
      const officialDomain = officialDomains[brand];
      if (officialDomain && !hostname.endsWith(officialDomain)) {
        threats.push({
          type: 'lookalike_domain',
          severity: 'high',
          description: `Domain contains brand name "${brand}" but is not the official domain`,
          reason: 'Possible phishing/typosquatting attempt'
        });
        break; // Only flag once per domain
      }
    }
  }

  // Enhanced hyphen and character analysis
  const hyphenCount = (hostname.match(/-/g) || []).length;
  if (hyphenCount > 2) { // More aggressive threshold
    warnings.push({
      type: 'excessive_hyphens',
      severity: 'medium',
      description: `Domain contains ${hyphenCount} hyphens`,
      reason: 'Many hyphens can indicate phishing domains'
    });
  }

  // Check for random numbers/strings in domain (more aggressive)
  const hasRandomNumbers = /\d{3,}/.test(hostname); // More aggressive - 3+ digits
  const hasRandomStrings = /[a-z]{8,}/.test(hostname); // More aggressive - 8+ chars
  if (hasRandomNumbers || hasRandomStrings) {
    warnings.push({
      type: 'random_elements',
      severity: 'medium',
      description: 'Domain contains random numbers or long strings',
      reason: 'Random elements can indicate generated phishing domains'
    });
  }

  // Check for suspicious subdomain patterns
  if (subdomain && subdomain.length > 0) {
    const suspiciousSubdomains = ['login', 'secure', 'verify', 'update', 'account', 'bank'];
    if (suspiciousSubdomains.some(s => subdomain.includes(s))) {
      warnings.push({
        type: 'suspicious_subdomain',
        severity: 'medium',
        description: `Suspicious subdomain: ${subdomain}`,
        reason: 'Subdomain contains suspicious keywords'
      });
    }
  }

  // Check for common phishing patterns (more aggressive)
  const phishingPatterns = [
    /[a-z]+\d{3,}/,           // word + 3+ digits (e.g., "oferta374")
    /\d{3,}[a-z]+\d{3,}/,     // 3+ digits + word + 3+ digits
    /[a-z]+-[a-z]+-[a-z]+/,   // 3+ hyphenated words
    /[a-z]{2,}\.[a-z]{2,}\.[a-z]{2,}/, // 3+ dot-separated parts
    /[a-z]+[0-9]{3,}[a-z]+/,  // word + 3+ numbers + word
    /[a-z]{10,}/,             // very long single word
    /\d{6,}/,                 // 6+ consecutive digits
  ];

  const matchesPhishingPattern = phishingPatterns.some(pattern => pattern.test(hostname));
  if (matchesPhishingPattern) {
    warnings.push({
      type: 'phishing_pattern',
      severity: 'medium',
      description: 'Domain matches common phishing patterns',
      reason: 'Domain structure follows known phishing domain generation patterns'
    });
  }

  // Check for newly registered domain patterns
  const newDomainPatterns = [
    /^[a-z]{1,3}\d{2,4}[a-z]{1,3}$/,  // short word + numbers + short word
    /^\d{2,4}[a-z]{1,3}\d{2,4}$/,     // numbers + short word + numbers
    /^[a-z]{1,3}-[a-z]{1,3}-\d{2,4}$/, // short words + numbers
  ];

  const matchesNewDomainPattern = newDomainPatterns.some(pattern => pattern.test(hostname.split('.')[0]));
  if (matchesNewDomainPattern) {
    warnings.push({
      type: 'new_domain_pattern',
      severity: 'medium',
      description: 'Domain follows newly registered domain patterns',
      reason: 'Domain structure suggests it may be recently registered for malicious purposes'
    });
  }

  // Check for excessive domain parts (more aggressive)
  const domainParts = hostname.split('.');
  if (domainParts.length > 3) { // More aggressive - 3+ parts
    warnings.push({
      type: 'excessive_domain_parts',
      severity: 'medium',
      description: `Domain has ${domainParts.length} parts`,
      reason: 'Many domain parts can indicate phishing attempts'
    });
  }

  // Check for HTTP (non-HTTPS) URLs
  if (urlObj.protocol === 'http:') {
    threats.push({
      type: 'no_ssl_certificate',
      severity: 'high',
      description: 'No SSL certificate (HTTPS)',
      reason: 'URL uses HTTP instead of HTTPS - vulnerable to man-in-the-middle attacks'
    });
  }

  // Check for suspicious path keywords
  const suspiciousPathKeywords = [
    'login', 'verify', 'update', 'bank', 'wallet', 'free', 'gift', 'bonus',
    'secure', 'account', 'password', 'credit', 'debit', 'social', 'security'
  ];
  
  const path = urlObj.pathname.toLowerCase();
  const foundKeywords = suspiciousPathKeywords.filter(keyword => 
    path.includes(keyword)
  );
  
  if (foundKeywords.length > 0) {
    warnings.push({
      type: 'suspicious_path_keywords',
      severity: 'medium',
      description: `Suspicious keywords found in URL path: ${foundKeywords.join(', ')}`,
      reason: 'These keywords are commonly used in phishing attempts'
    });
  }

  // Check for URL shortening services
  const shortenerDomains = [
    'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'is.gd', 'v.gd',
    'shorturl.at', 'rb.gy', 'cutt.ly', 'short.io'
  ];
  
  if (shortenerDomains.includes(hostname)) {
    warnings.push({
      type: 'url_shortener',
      severity: 'medium',
      description: 'URL shortening service detected',
      reason: 'Shortened URLs can hide the true destination'
    });
  }

  analysis.threats = threats;
  analysis.warnings = warnings;
  return analysis;
}

/**
 * DNS analysis and resolution using built-in Node.js DNS
 */
async function performDnsAnalysis(hostname) {
  const threats = [];
  const warnings = [];
  const analysis = {};

  try {
    // Resolve A records
    const aRecords = await resolveA(hostname);
    analysis.aRecords = aRecords;
    
    // Check for multiple IPs (potential load balancing or malicious)
    if (aRecords.length > 5) {
      warnings.push({
        type: 'multiple_ips',
        severity: 'low',
        description: 'Domain resolves to many IP addresses',
        reason: 'Could indicate CDN usage or potential malicious infrastructure'
      });
    }

    // Resolve MX records
    try {
      const mxRecords = await resolveMx(hostname);
      analysis.mxRecords = mxRecords.map(record => record.exchange);
    } catch (error) {
      // No MX records - could be suspicious for certain domains
      if (hostname.includes('bank') || hostname.includes('secure')) {
        warnings.push({
          type: 'no_mx_records',
          severity: 'low',
          description: 'No mail exchange records found',
          reason: 'Legitimate financial/security sites typically have email infrastructure'
        });
      }
    }

    // Resolve TXT records
    try {
      const txtRecords = await resolveTxt(hostname);
      analysis.txtRecords = txtRecords.map(record => record.join(''));
      
      // Check for security-related TXT records
      const hasSpf = txtRecords.some(record => 
        record.some(txt => txt.includes('v=spf1'))
      );
      const hasDmarc = txtRecords.some(record => 
        record.some(txt => txt.includes('v=DMARC1'))
      );
      
      if (!hasSpf) {
        warnings.push({
          type: 'no_spf_record',
          severity: 'low',
          description: 'No SPF record found',
          reason: 'Missing SPF record makes domain vulnerable to email spoofing'
        });
      }
      
      if (!hasDmarc) {
        warnings.push({
          type: 'no_dmarc_record',
          severity: 'low',
          description: 'No DMARC record found',
          reason: 'Missing DMARC record reduces email security'
        });
      }
    } catch (error) {
      // No TXT records
    }

  } catch (error) {
    threats.push({
      type: 'dns_resolution_failed',
      severity: 'high',
      description: 'DNS resolution failed',
      reason: 'Could indicate malicious or non-existent domain'
    });
  }

  analysis.threats = threats;
  analysis.warnings = warnings;
  return analysis;
}

/**
 * Content analysis of the webpage
 */
async function performContentAnalysis(url) {
  const threats = [];
  const warnings = [];
  const analysis = {};

  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const title = $('title').text().toLowerCase();
    const bodyText = $('body').text().toLowerCase();

    // Check for suspicious title keywords
    const suspiciousTitleKeywords = [
      'login', 'sign in', 'verify', 'update', 'secure', 'bank', 'account',
      'password', 'credit', 'debit', 'social security', 'irs', 'paypal'
    ];

    const foundTitleKeywords = suspiciousTitleKeywords.filter(keyword => 
      title.includes(keyword)
    );

    if (foundTitleKeywords.length > 0) {
      warnings.push({
        type: 'suspicious_title_keywords',
        severity: 'medium',
        description: `Suspicious keywords in page title: ${foundTitleKeywords.join(', ')}`,
        reason: 'These keywords are commonly used in phishing pages'
      });
    }

    // Check for forms (potential credential harvesting)
    const forms = $('form');
    if (forms.length > 0) {
      analysis.formCount = forms.length;
      
      forms.each((i, form) => {
        const action = $(form).attr('action') || '';
        const method = $(form).attr('method') || 'get';
        
        if (method.toLowerCase() === 'post' && action.includes('login')) {
          warnings.push({
            type: 'login_form_detected',
            severity: 'medium',
            description: 'Login form detected',
            reason: 'Could be legitimate or credential harvesting attempt'
          });
        }
      });
    }

    // Check for external scripts
    const externalScripts = $('script[src^="http"]');
    if (externalScripts.length > 5) {
      warnings.push({
        type: 'many_external_scripts',
        severity: 'low',
        description: 'Many external scripts loaded',
        reason: 'Could indicate tracking or malicious code injection'
      });
    }

    // Check for iframes
    const iframes = $('iframe');
    if (iframes.length > 0) {
      analysis.iframeCount = iframes.length;
      warnings.push({
        type: 'iframes_detected',
        severity: 'low',
        description: 'Iframes detected on page',
        reason: 'Iframes can be used for clickjacking or content injection'
      });
    }

  } catch (error) {
    warnings.push({
      type: 'content_analysis_failed',
      severity: 'low',
      description: 'Failed to analyze page content',
      reason: error.message
    });
  }

  analysis.threats = threats;
  analysis.warnings = warnings;
  return analysis;
}

/**
 * Screenshot analysis using Puppeteer (Disabled - install puppeteer separately if needed)
 */
async function performScreenshotAnalysis(url) {
  const threats = [];
  const warnings = [];
  const analysis = {};

  warnings.push({
    type: 'screenshot_disabled',
    severity: 'low',
    description: 'Screenshot analysis disabled',
    reason: 'Puppeteer not installed - install separately with: npm install puppeteer'
  });

  // Basic SSL check without puppeteer
  try {
    if (!url.startsWith('https://')) {
      threats.push({
        type: 'no_ssl_certificate',
        severity: 'high',
        description: 'No SSL certificate (HTTPS)',
        reason: 'URL uses HTTP instead of HTTPS - vulnerable to man-in-the-middle attacks'
      });
    }
  } catch (error) {
    warnings.push({
      type: 'ssl_check_failed',
      severity: 'low',
      description: 'Failed to check SSL',
      reason: error.message
    });
  }

  analysis.threats = threats;
  analysis.warnings = warnings;
  return analysis;
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(threats, warnings) {
  let score = 0;
  
  // Threats contribute more to risk score
  threats.forEach(threat => {
    switch (threat.severity) {
      case 'critical': score += 40; break;
      case 'high': score += 25; break;
      case 'medium': score += 15; break;
      case 'low': score += 8; break;
    }
    
    // Bonus points for specific high-risk threat types
    if (threat.type === 'lookalike_domain') score += 10; // Brand impersonation is risky
    if (threat.type === 'raw_ip_address') score += 8;    // IP addresses are suspicious
    if (threat.type === 'punycode_domain') score += 8;   // Punycode is often malicious
  });
  
  // Warnings contribute less to risk score
  warnings.forEach(warning => {
    switch (warning.severity) {
      case 'high': score += 12; break;
      case 'medium': score += 8; break;
      case 'low': score += 3; break;
    }
    
    // Bonus points for specific warning types
    if (warning.type === 'suspicious_tld') score += 5;    // Suspicious TLDs are risky
    if (warning.type === 'random_elements') score += 3;   // Random elements suggest phishing
    if (warning.type === 'suspicious_subdomain') score += 3; // Suspicious subdomains
  });
  
  return Math.min(score, 100); // Cap at 100
}

/**
 * Determine risk level based on score
 */
function determineRiskLevel(score) {
  if (score >= 50) return 'critical';
  if (score >= 30) return 'high';
  if (score >= 15) return 'medium';
  if (score >= 5) return 'low';
  return 'safe';
}

/**
 * Utility functions
 */
function normalizeUrl(input) {
  try {
    const str = input.match(/^https?:\/\//i) ? input : `https://${input}`;
    const u = new URL(str);
    return u.href;
  } catch (_) {
    return null;
  }
}

function isIpAddress(host) {
  return /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

function generateScanId() {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  scanUrlComprehensive,
  performBasicAnalysis,
  performDnsAnalysis,
  performContentAnalysis,
  performScreenshotAnalysis
};
