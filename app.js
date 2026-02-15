// Import configuration
import { config } from './config.js';

(function(){
  'use strict';

  // Elements
  const sections = document.querySelectorAll('.section');
  const navLinks = document.querySelectorAll('[data-nav]');
  const yearEl = document.getElementById('year');

  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const urlError = document.getElementById('urlError');

  const emailForm = document.getElementById('emailForm');
  const emailInput = document.getElementById('emailInput');
  const emailError = document.getElementById('emailError');

  const resultsEl = document.getElementById('results');
  const urlHistoryEl = document.getElementById('urlHistory');
  const emailHistoryEl = document.getElementById('emailHistory');
  const backendStatusEl = document.getElementById('backendStatusText');

  const scoreValueEl = document.getElementById('scoreValue');
  const ringProgressEl = document.querySelector('.ring__progress');

  const downloadExtensionBtn = document.getElementById('downloadExtension');
  const downloadInstructions = document.getElementById('downloadInstructions');

  const STORAGE_KEYS = {
    SCORE: 'cyberspace_score',
    URL_HISTORY: 'cyberspace_url_history',
    EMAIL_HISTORY: 'cyberspace_email_history',
    BACKEND_URL: 'cyberspace_backend_url',
  };

  const BACKEND_CONFIG = {
    URL: readJson(STORAGE_KEYS.BACKEND_URL, config.BACKEND_URL),
    FALLBACK_TO_DEMO: config.FEATURES.DEMO_FALLBACK,
  };

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function readNumber(key, fallback = 0){
    const raw = localStorage.getItem(key);
    if(raw == null) return fallback;
    const val = Number(raw);
    return Number.isFinite(val) ? val : fallback;
  }
  function writeNumber(key, value){
    localStorage.setItem(key, String(value));
  }
  function readJson(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      return JSON.parse(raw);
    }catch(_){
      return fallback;
    }
  }
  function writeJson(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }



  const initialScore = clamp(readNumber(STORAGE_KEYS.SCORE, 0), -100, 100);
  updateScore(initialScore, false);
  renderHistories();
  if(yearEl){ yearEl.textContent = String(new Date().getFullYear()); }
  
  checkBackendStatus();
  setInterval(checkBackendStatus, 30000);

  downloadExtensionBtn?.addEventListener('click', downloadExtension);

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href') || '#home';
      if(href.startsWith('#')){
        e.preventDefault();
        const id = href.slice(1);
        switchSection(id);
        history.replaceState(null, '', href);
      }
    });
  });
  function switchSection(id){
    sections.forEach(s => s.classList.remove('section--active'));
    const target = document.getElementById(id) || document.getElementById('home');
    if(target) target.classList.add('section--active');
  }
  if(location.hash){ switchSection(location.hash.slice(1)); }

  urlForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    urlError.textContent = '';
    const raw = (urlInput.value || '').trim();
    if(!raw){ urlError.textContent = 'Enter a URL.'; return; }

    const normalized = normalizeUrl(raw);
    if(!normalized){ urlError.textContent = 'Please enter a valid URL.'; return; }

    // Show loading state
    const submitBtn = urlForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Scanning...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${BACKEND_CONFIG.URL}/api/v1/scan/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: normalized })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        const safe = data.safe;
        const riskScore = data.riskScore || 0;
        const riskLevel = data.riskLevel || 'unknown';
        const warnings = data.warnings || [];
        const threats = data.threats || [];
        
        const verdict = { safe, riskScore, riskLevel, warnings, threats };
        pushUrlHistory({ url: normalized, verdict, ts: Date.now() });

        if(safe){
          adjustScore(+1);
          renderResultCard({
            kind: 'url',
            title: 'Safe Website',
            message: `No obvious phishing signs detected. Risk level: ${riskLevel}, Score: ${riskScore}/100`,
            status: 'safe',
            url: normalized,
          });
        }else{
          adjustScore(-10);
          renderResultCard({
            kind: 'url',
            title: 'Phishing Detected',
            message: `Suspicious indicators found. Risk level: ${riskLevel}, Score: ${riskScore}/100`,
            status: 'danger',
            url: normalized,
          });
        }
        renderUrlHistory();
      } else {
        throw new Error(result.message || 'Unknown API error');
      }
    } catch (error) {
      console.error('URL scan error:', error);
      
      // Try demo fallback if enabled
      if (BACKEND_CONFIG.FALLBACK_TO_DEMO) {
        console.log('Backend unavailable, using demo fallback');
        urlError.textContent = 'Backend unavailable, using demo mode.';
        
        const verdict = scanUrlHeuristic(normalized);
        pushUrlHistory({ url: normalized, verdict, ts: Date.now() });

        if(verdict.safe){
          adjustScore(+1);
          renderResultCard({
            kind: 'url',
            title: 'Safe Website (Demo)',
            message: 'No obvious phishing signs detected (demo mode - backend unavailable)',
            status: 'safe',
            url: normalized,
          });
        }else{
          adjustScore(-10);
          renderResultCard({
            kind: 'url',
            title: 'Phishing Detected (Demo)',
            message: verdict.reason || 'Suspicious indicators found (demo mode - backend unavailable)',
            status: 'danger',
            url: normalized,
          });
        }
        renderUrlHistory();
      } else {
        urlError.textContent = `Error: ${error.message}. Please try again.`;
        
        // Show error result card
        renderResultCard({
          kind: 'url',
          title: 'Scan Failed',
          message: `Unable to scan URL: ${error.message}`,
          status: 'danger',
          url: normalized,
        });
      }
    } finally {
      // Restore button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  emailForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailError.textContent = '';
    const email = (emailInput.value || '').trim();
    if(!email){ emailError.textContent = 'Enter an email.'; return; }
    if(!isValidEmail(email)){ emailError.textContent = 'Please enter a valid email.'; return; }

    // Show loading state
    const submitBtn = emailForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Checking...';
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${BACKEND_CONFIG.URL}/api/v1/breach/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const data = result.data;
        const breached = data.safe === false; // Backend returns safe: true/false
        const riskScore = data.riskScore || 0;
        const breachCount = data.totalBreaches || 0;
        const riskLevel = data.riskLevel || 'unknown';
        const warnings = data.warnings || [];
        
        pushEmailHistory({ 
          email, 
          breached, 
          riskScore,
          breachCount,
          riskLevel,
          warnings,
          ts: Date.now() 
        });

        if(breached){
          adjustScore(-10);
          renderResultCard({
            kind: 'email',
            title: 'Found in leaks',
            message: `This email appears in ${breachCount} breach dataset(s). Risk level: ${riskLevel}, Score: ${riskScore}/100`,
            status: 'danger',
            email,
          });
        }else{
          // No score change for safe email per spec
          renderResultCard({
            kind: 'email',
            title: 'Not found',
            message: `No breach indicators found. Risk level: ${riskLevel}, Score: ${riskScore}/100`,
            status: 'safe',
            email,
          });
        }
        renderEmailHistory();
      } else {
        throw new Error(result.message || 'Unknown API error');
      }
    } catch (error) {
      console.error('Email breach check error:', error);
      
      // Try demo fallback if enabled
      if (BACKEND_CONFIG.FALLBACK_TO_DEMO) {
        console.log('Backend unavailable, using demo fallback');
        emailError.textContent = 'Backend unavailable, using demo mode.';
        
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

        if(breached){
          adjustScore(-10);
          renderResultCard({
            kind: 'email',
            title: 'Found in leaks (Demo)',
            message: 'This email appears in breach datasets (demo mode - backend unavailable)',
            status: 'danger',
            email,
          });
        }else{
          renderResultCard({
            kind: 'email',
            title: 'Not found (Demo)',
            message: 'No breach indicators found (demo mode - backend unavailable)',
            status: 'safe',
            email,
          });
        }
        renderEmailHistory();
      } else {
        emailError.textContent = `Error: ${error.message}. Please try again.`;
        
        // Show error result card
        renderResultCard({
          kind: 'email',
          title: 'Check Failed',
          message: `Unable to check email: ${error.message}`,
          status: 'danger',
          email,
        });
      }
    } finally {
      // Restore button state
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  function downloadExtension() {
    // Show download instructions
    downloadInstructions.classList.remove('hidden');
    
    // Create download link for the extension
    const downloadLink = document.createElement('a');
    downloadLink.href = config.EXTENSION_DOWNLOAD_URL;
    downloadLink.textContent = 'Download Extension ZIP';
    downloadLink.className = 'btn btn--primary';
    downloadLink.style.marginTop = '12px';
    downloadLink.target = '_blank';
    
    // Replace the download button with the download link
    const downloadBtn = document.getElementById('downloadExtension');
    downloadBtn.parentNode.insertBefore(downloadLink, downloadBtn.nextSibling);
    downloadBtn.style.display = 'none';
    
    console.log('Extension download page opened');
  }



  async function checkBackendStatus() {
    if (!backendStatusEl) return;
    
    try {
      const response = await fetch(`${BACKEND_CONFIG.URL}/api/v1/breach/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        backendStatusEl.textContent = 'Connected';
        backendStatusEl.style.color = '#22c55e';
      } else {
        backendStatusEl.textContent = 'Error';
        backendStatusEl.style.color = '#ef4444';
      }
    } catch (error) {
      backendStatusEl.textContent = 'Offline (Demo Mode)';
      backendStatusEl.style.color = '#f59e0b';
    }
  }



  function normalizeUrl(input){
    try{
      const str = input.match(/^https?:\/\//i) ? input : `https://${input}`;
      const u = new URL(str);
      return u.href;
    }catch(_){ return null; }
  }
  function isValidEmail(email){
    // Simple robust regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }
  function formatWhen(ts){
    const d = new Date(ts);
    return d.toLocaleString();
  }

  function isIpAddress(host){
    return /^\d+\.\d+\.\d+\.\d+$/.test(host);
  }

  function scanUrlHeuristic(href){
    try{
      const u = new URL(href);
      const host = u.hostname.toLowerCase();
      const path = u.pathname.toLowerCase();

      const badKeywords = ['login', 'verify', 'update', 'bank', 'wallet', 'free', 'gift', 'bonus'];
      const suspiciousTlds = ['zip','mov','country','gq','ml','cf','tk'];
      const knownBadHosts = ['bad-phish.test', 'totally-legit-security.xyz'];

      if(knownBadHosts.includes(host)) return { safe:false, reason:'Known malicious host.' };
      if(host.startsWith('xn--')) return { safe:false, reason:'Punycode domain detected.' };
      if(isIpAddress(host)) return { safe:false, reason:'Raw IP address used.' };
      if(host.split('-').length > 4) return { safe:false, reason:'Excessive hyphens in domain.' };
      if(host.length > 40) return { safe:false, reason:'Very long domain.' };
      if(suspiciousTlds.some(t => host.endsWith('.'+t))) return { safe:false, reason:'Suspicious TLD.' };
      if(path.split('/').some(seg => badKeywords.some(k => seg.includes(k)))) return { safe:false, reason:'Phishy keywords in path.' };

      return { safe:true };
    }catch(_){
      return { safe:false, reason:'Invalid URL.' };
    }
  }

  function isEmailBreachedDemo(email){
    // Deterministic pseudo-hash: if sum of char codes % 7 is 0 or domain in list
    const domain = email.split('@')[1]?.toLowerCase() || '';
    const flaggedDomains = ['example.com','test.com','mailinator.com','tempmail.com'];
    if(flaggedDomains.includes(domain)) return true;
    let sum = 0;
    for(let i=0;i<email.length;i++){ sum = (sum + email.charCodeAt(i)) % 997; }
    return (sum % 7) === 0;
  }

  function pushUrlHistory(entry){
    const list = readJson(STORAGE_KEYS.URL_HISTORY, []);
    list.unshift(entry);
    writeJson(STORAGE_KEYS.URL_HISTORY, list.slice(0, 20));
  }
  function pushEmailHistory(entry){
    const list = readJson(STORAGE_KEYS.EMAIL_HISTORY, []);
    list.unshift(entry);
    writeJson(STORAGE_KEYS.EMAIL_HISTORY, list.slice(0, 20));
  }

  function renderUrlHistory(){
    const list = readJson(STORAGE_KEYS.URL_HISTORY, []);
    urlHistoryEl.innerHTML = list.map(item => {
      const status = item.verdict?.safe ? 'Safe' : 'Phishing';
      const statusCls = item.verdict?.safe ? 'badge badge--success' : 'badge badge--danger';
      const riskInfo = item.verdict?.riskScore ? ` (${item.verdict.riskScore}/100)` : '';
      const riskLevel = item.verdict?.riskLevel ? ` [${item.verdict.riskLevel}]` : '';
      return `<div class="table__row"><div class="url">${escapeHtml(item.url)}</div><div><span class="${statusCls}">${status}${riskInfo}${riskLevel}</span></div><div>${formatWhen(item.ts)}</div></div>`;
    }).join('');
  }
  function renderEmailHistory(){
    const list = readJson(STORAGE_KEYS.EMAIL_HISTORY, []);
    emailHistoryEl.innerHTML = list.map(item => {
      const status = item.breached ? 'Found in leaks' : 'Not found';
      const statusCls = item.breached ? 'badge badge--danger' : 'badge badge--success';
      const riskInfo = item.riskScore ? ` (${item.riskScore}/100)` : '';
      const riskLevel = item.riskLevel ? ` [${item.riskLevel}]` : '';
      const breachInfo = item.breachCount ? ` - ${item.breachCount} breach(es)` : '';
      return `<div class="table__row"><div>${escapeHtml(item.email)}</div><div><span class="${statusCls}">${status}${riskInfo}${riskLevel}</span></div><div>${formatWhen(item.ts)}</div></div>`;
    }).join('');
  }
  function renderHistories(){
    renderUrlHistory();
    renderEmailHistory();
  }

  function renderResultCard({ kind, title, message, status, url, email }){
    const icon = status === 'safe' ? '✅' : '❌';
    const klass = status === 'safe' ? 'badge badge--success' : 'badge badge--danger';
    const cardKlass = status === 'safe' ? 'card--safe' : 'card--danger';
    const right = status === 'safe' ? 'green glow' : 'red warning';

    const line = kind === 'url' ? `<div class="url">${escapeHtml(url || '')}</div>` : `<div>${escapeHtml(email || '')}</div>`;

    const html = `
      <div class="result-card ${cardKlass}">
        <div class="result-card__left">
          <span class="${klass}">${icon} ${escapeHtml(title)}</span>
          ${line}
        </div>
        <div class="muted">${escapeHtml(message)}</div>
      </div>
    `;
    resultsEl.insertAdjacentHTML('afterbegin', html);
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function adjustScore(delta){
    const current = clamp(readNumber(STORAGE_KEYS.SCORE, 0), -100, 100);
    const next = clamp(current + delta, -100, 100);
    updateScore(next, true);
    writeNumber(STORAGE_KEYS.SCORE, next);
  }
  function updateScore(value, animate){
    if(scoreValueEl) scoreValueEl.textContent = String(value);

    // Map [-100..100] to [0..1]
    const pct = (value + 100) / 200;
    const length = 2 * Math.PI * 52; // circumference
    const offset = length * (1 - pct);

    if(!ringProgressEl) return;

    if(animate){
      ringProgressEl.style.transition = 'stroke-dashoffset 650ms cubic-bezier(.22,1,.36,1)';
      requestAnimationFrame(() => {
        ringProgressEl.style.strokeDashoffset = String(offset);
      });
    }else{
      ringProgressEl.style.transition = 'none';
      ringProgressEl.style.strokeDashoffset = String(offset);
    }
  }

})();
