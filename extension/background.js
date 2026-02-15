// Background service worker (Manifest V3)
// We keep logic straightforward. The server does the heavy lifting.
// This script focuses on: auto-checking tabs, setting the badge, and caching results.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache feels ok for demos

function normalizeUrl(raw) {
  try {
    let u = raw.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    return new URL(u).toString();
  } catch (e) {
    return null;
  }
}

async function getApiBase() {
  const data = await chrome.storage.sync.get(["apiBase"]);
  if (data.apiBase) {
    return data.apiBase;
  }
  
  // Set default API base based on environment
  const defaultApiBase = "https://cyberspace-backend.onrender.com/api/v1/scan";
  await chrome.storage.sync.set({ apiBase: defaultApiBase });
  return defaultApiBase;
}

async function callApiCheck(apiBase, url) {
  // Try GET endpoint first (simpler), fallback to POST
  const getEndpoint = apiBase.replace(/\/$/, "") + "/check?url=" + encodeURIComponent(url);
  
  try {
    const res = await fetch(getEndpoint, { method: "GET" });
    if (res.ok) {
      const result = await res.json();
      return result;
    }
  } catch (e) {
    console.log("GET endpoint failed, trying POST:", e.message);
  }
  
  // Fallback to POST endpoint
  const postEndpoint = apiBase.replace(/\/$/, "") + "/url";
  
  const requestBody = {
    url: url,
    includeContent: false,
    includeScreenshot: false,
    includeThreatIntel: true
  };
  
  const res = await fetch(postEndpoint, { 
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!res.ok) throw new Error("API error: " + res.status);
  const response = await res.json();
  
  // Transform the response to match the expected format
  if (response.success && response.data) {
    const data = response.data;
    return {
      status: data.riskLevel === 'safe' || data.riskLevel === 'low' ? 'safe' : 
              data.riskLevel === 'medium' ? 'suspicious' : 'unsafe',
      reason: `Risk Level: ${data.riskLevel}. Threats: ${data.threats.length}, Warnings: ${data.warnings.length}`,
      ssl: !url.startsWith('http://'),
      domain_age: "Unknown",
      riskLevel: data.riskLevel,
      threats: data.threats,
      warnings: data.warnings
    };
  } else {
    throw new Error("Invalid API response format");
  }
}

async function setBadge(status, tabId) {
  let text = "";
  if (status === "safe") text = "OK";
  else if (status === "suspicious") text = "?!";
  else if (status === "unsafe") text = "NO";

  const color = status === "safe" ? "#10b981" : status === "suspicious" ? "#f59e0b" : "#ef4444";

  await chrome.action.setBadgeText({ text, tabId });
  await chrome.action.setBadgeBackgroundColor({ color, tabId });
}

async function checkAndCache(url, tabId) {
  const apiBase = await getApiBase();
  if (!apiBase) return;

  const normalized = normalizeUrl(url);
  if (!normalized) return;

  // Basic cache
  const { cache = {} } = await chrome.storage.session.get(["cache"]);
  const entry = cache[normalized];
  const now = Date.now();
  if (entry && now - entry.ts < CACHE_TTL_MS) {
    await setBadge(entry.result.status, tabId);
    return entry.result;
  }

  try {
    const result = await callApiCheck(apiBase, normalized);
    cache[normalized] = { result, ts: now };
    await chrome.storage.session.set({ cache });
    await setBadge(result.status, tabId);
    // Tell the content script
    chrome.tabs.sendMessage(tabId, { type: "statusUpdate", url: normalized, result }, (response) => {
      if (chrome.runtime.lastError) {
        // No content script in this tab, ignore or log
        console.warn('No content script in this tab:', chrome.runtime.lastError.message);
      }
      // handle response if needed
    });
    return result;
  } catch (e) {
    console.warn("check failed", e);
    await chrome.action.setBadgeText({ text: "?", tabId });
    await chrome.action.setBadgeBackgroundColor({ color: "#6b7280", tabId });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId);
  if (tab?.url?.startsWith("chrome")) return;
  checkAndCache(tab.url, tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome")) {
    checkAndCache(tab.url, tabId);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "cacheResult" && msg.url && msg.result) {
    (async () => {
      const { cache = {} } = await chrome.storage.session.get(["cache"]);
      cache[msg.url] = { result: msg.result, ts: Date.now() };
      await chrome.storage.session.set({ cache });
      if (sender?.tab?.id) {
        setBadge(msg.result.status, sender.tab.id);
      }
    })();
  }
  // We use sendResponse for sync ack only when needed
});
