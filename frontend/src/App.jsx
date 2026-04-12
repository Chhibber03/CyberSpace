import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeSection from './components/HomeSection';
import DashboardSection from './components/DashboardSection';
import ExtensionSection from './components/ExtensionSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import { BACKEND_CONFIG } from './config';

// Helpers
const STORAGE_KEYS = {
  SCORE: 'cyberspace_score',
  URL_HISTORY: 'cyberspace_url_history',
  EMAIL_HISTORY: 'cyberspace_email_history',
};

function readNumber(key, fallback = 0) {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback;
  const val = Number(raw);
  return Number.isFinite(val) ? val : fallback;
}

function writeNumber(key, value) {
  localStorage.setItem(key, String(value));
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeUrl(input) {
  try {
    const str = input.match(/^https?:\/\//i) ? input : `https://${input}`;
    const u = new URL(str);
    return u.href;
  } catch (_) { return null; }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Fallback heuristics
function isIpAddress(host) {
  return /^\d+\.\d+\.\d+\.\d+$/.test(host);
}

function scanUrlHeuristic(href) {
  try {
    const u = new URL(href);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();

    const badKeywords = ['login', 'verify', 'update', 'bank', 'wallet', 'free', 'gift', 'bonus'];
    const suspiciousTlds = ['zip', 'mov', 'country', 'gq', 'ml', 'cf', 'tk'];
    const knownBadHosts = ['bad-phish.test', 'totally-legit-security.xyz'];

    if (knownBadHosts.includes(host)) return { safe: false, reason: 'Known malicious host.' };
    if (host.startsWith('xn--')) return { safe: false, reason: 'Punycode domain detected.' };
    if (isIpAddress(host)) return { safe: false, reason: 'Raw IP address used.' };
    if (host.split('-').length > 4) return { safe: false, reason: 'Excessive hyphens in domain.' };
    if (host.length > 40) return { safe: false, reason: 'Very long domain.' };
    if (suspiciousTlds.some(t => host.endsWith('.' + t))) return { safe: false, reason: 'Suspicious TLD.' };
    if (path.split('/').some(seg => badKeywords.some(k => seg.includes(k)))) return { safe: false, reason: 'Phishy keywords in path.' };

    return { safe: true };
  } catch (_) {
    return { safe: false, reason: 'Invalid URL.' };
  }
}

function isEmailBreachedDemo(email) {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const flaggedDomains = ['example.com', 'test.com', 'mailinator.com', 'tempmail.com'];
  if (flaggedDomains.includes(domain)) return true;
  let sum = 0;
  for (let i = 0; i < email.length; i++) { sum = (sum + email.charCodeAt(i)) % 997; }
  return (sum % 7) === 0;
}

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [score, setScore] = useState(0);
  const [urlHistory, setUrlHistory] = useState([]);
  const [emailHistory, setEmailHistory] = useState([]);
  const [results, setResults] = useState([]);

  const [isScanningUrl, setIsScanningUrl] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [backendStatusText, setBackendStatusText] = useState('Checking...');
  const [backendStatusClass, setBackendStatusClass] = useState('');

  // Initial load
  useEffect(() => {
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const initialScore = clamp(readNumber(STORAGE_KEYS.SCORE, 0), -100, 100);
    setScore(initialScore);
    setUrlHistory(readJson(STORAGE_KEYS.URL_HISTORY, []));
    setEmailHistory(readJson(STORAGE_KEYS.EMAIL_HISTORY, []));

    if (location.hash) {
      setActiveSection(location.hash.slice(1));
    }

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const adjustScore = (delta) => {
    setScore(prev => {
      const current = Math.max(-100, Math.min(100, prev));
      const next = Math.max(-100, Math.min(100, current + delta));
      writeNumber(STORAGE_KEYS.SCORE, next);
      return next;
    });
  };

  const pushUrlHistory = (entry) => {
    setUrlHistory(prev => {
      const list = [entry, ...prev].slice(0, 20);
      writeJson(STORAGE_KEYS.URL_HISTORY, list);
      return list;
    });
  };

  const pushEmailHistory = (entry) => {
    setEmailHistory(prev => {
      const list = [entry, ...prev].slice(0, 20);
      writeJson(STORAGE_KEYS.EMAIL_HISTORY, list);
      return list;
    });
  };

  const addResult = (res) => {
    setResults(prev => [res, ...prev]);
  };

  async function checkBackendStatus() {
    try {
      const response = await fetch(`${BACKEND_CONFIG.URL}/api/v1/breach/health`, {
        method: 'GET',
        // In native fetch, timeout is usually handled with an AbortController, but omitting for simplicity
      });
      
      if (response.ok) {
        setBackendStatusText('Connected');
        setBackendStatusClass('status-dot--connected');
      } else {
        setBackendStatusText('Error');
        setBackendStatusClass('status-dot--error');
      }
    } catch (error) {
      setBackendStatusText('Offline (Demo Mode)');
      setBackendStatusClass('status-dot--offline');
    }
  }

  const handleScanUrl = async (rawUrl) => {
    if (!rawUrl) { alert('Enter a URL.'); return; }
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) { alert('Please enter a valid URL.'); return; }

    setIsScanningUrl(true);

    try {
      const response = await fetch(`${BACKEND_CONFIG.URL}/api/v1/scan/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        const verdict = { 
          safe: data.safe, 
          riskScore: data.riskScore || 0, 
          riskLevel: data.riskLevel || 'unknown', 
          warnings: data.warnings || [], 
          threats: data.threats || [] 
        };
        
        pushUrlHistory({ url: normalized, verdict, ts: Date.now() });

        if (data.safe) {
          adjustScore(+1);
          addResult({
            kind: 'url',
            title: 'Safe Website',
            message: `No obvious phishing signs detected. Risk level: ${data.riskLevel}, Score: ${data.riskScore}/100`,
            status: 'safe',
            url: normalized,
          });
        } else {
          adjustScore(-10);
          addResult({
            kind: 'url',
            title: 'Phishing Detected',
            message: `Suspicious indicators found. Risk level: ${data.riskLevel}, Score: ${data.riskScore}/100`,
            status: 'danger',
            url: normalized,
          });
        }
      } else {
        throw new Error(result.message || 'Unknown API error');
      }
    } catch (error) {
      console.error('URL scan error:', error);
      if (BACKEND_CONFIG.FALLBACK_TO_DEMO) {
        const verdict = scanUrlHeuristic(normalized);
        pushUrlHistory({ url: normalized, verdict, ts: Date.now() });

        if (verdict.safe) {
          adjustScore(+1);
          addResult({
            kind: 'url',
            title: 'Safe Website (Demo)',
            message: 'No obvious phishing signs detected (demo mode)',
            status: 'safe',
            url: normalized,
          });
        } else {
          adjustScore(-10);
          addResult({
            kind: 'url',
            title: 'Phishing Detected (Demo)',
            message: verdict.reason || 'Suspicious indicators found (demo mode)',
            status: 'danger',
            url: normalized,
          });
        }
      } else {
        addResult({
          kind: 'url',
          title: 'Scan Failed',
          message: `Unable to scan URL: ${error.message}`,
          status: 'danger',
          url: normalized,
        });
      }
    } finally {
      setIsScanningUrl(false);
    }
  };

  const handleCheckEmail = async (email) => {
    if (!email) { alert('Enter an email.'); return; }
    if (!isValidEmail(email)) { alert('Please enter a valid email.'); return; }

    setIsCheckingEmail(true);

    try {
      const response = await fetch(`${BACKEND_CONFIG.URL}/api/v1/breach/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        const breached = data.safe === false;
        
        pushEmailHistory({ 
          email, 
          breached, 
          riskScore: data.riskScore || 0,
          breachCount: data.totalBreaches || 0,
          riskLevel: data.riskLevel || 'unknown',
          warnings: data.warnings || [],
          ts: Date.now() 
        });

        if (breached) {
          adjustScore(-10);
          addResult({
            kind: 'email',
            title: 'Found in leaks',
            message: `This email appears in ${data.totalBreaches || 0} breach dataset(s). Risk level: ${data.riskLevel}, Score: ${data.riskScore}/100`,
            status: 'danger',
            email,
          });
        } else {
          addResult({
            kind: 'email',
            title: 'Not found',
            message: `No breach indicators found. Risk level: ${data.riskLevel}, Score: ${data.riskScore}/100`,
            status: 'safe',
            email,
          });
        }
      } else {
        throw new Error(result.message || 'Unknown API error');
      }
    } catch (error) {
      console.error('Email breach check error:', error);
      if (BACKEND_CONFIG.FALLBACK_TO_DEMO) {
        const breached = isEmailBreachedDemo(email);
        pushEmailHistory({ 
          email, 
          breached, 
          riskScore: breached ? 75 : 25,
          breachCount: breached ? 1 : 0,
          riskLevel: breached ? 'high' : 'low',
          warnings: [],
          ts: Date.now() 
        });

        if (breached) {
          adjustScore(-10);
          addResult({
            kind: 'email',
            title: 'Found in leaks (Demo)',
            message: 'This email appears in breach datasets (demo mode)',
            status: 'danger',
            email,
          });
        } else {
          addResult({
            kind: 'email',
            title: 'Not found (Demo)',
            message: 'No breach indicators found (demo mode)',
            status: 'safe',
            email,
          });
        }
      } else {
        addResult({
          kind: 'email',
          title: 'Check Failed',
          message: `Unable to check email: ${error.message}`,
          status: 'danger',
          email,
        });
      }
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleNavigate = (id) => {
    setActiveSection(id);
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <>
      <Navbar activeSection={activeSection} onNavigate={handleNavigate} />
      
      <main className="main">
        <HomeSection 
          isActive={activeSection === 'home'} 
          score={score}
          results={results}
          onScanUrl={handleScanUrl}
          onCheckEmail={handleCheckEmail}
          isScanningUrl={isScanningUrl}
          isCheckingEmail={isCheckingEmail}
          backendStatusText={backendStatusText}
          backendStatusClass={backendStatusClass}
        />
        <DashboardSection 
          isActive={activeSection === 'dashboard'} 
          urlHistory={urlHistory}
          emailHistory={emailHistory}
        />
        <ExtensionSection isActive={activeSection === 'extension'} />
        <AboutSection isActive={activeSection === 'about'} />
      </main>

      <Footer onNavigate={handleNavigate} />
    </>
  );
}
