const $ = (s) => document.querySelector(s);

async function getApiBase() {
  const data = await chrome.storage.sync.get(["apiBase"]);
  if (data.apiBase) {
    return data.apiBase;
  }
  
  // Set default API base
  const defaultApiBase = "http://localhost:3000/api/v1/scan";
  await chrome.storage.sync.set({ apiBase: defaultApiBase });
  return defaultApiBase;
}

async function testApi() {
  const apiBase = await getApiBase();
  const url = "https://example.com";
  
  // Try GET endpoint first
  const getEndpoint = apiBase.replace(/\/$/, "") + "/check?url=" + encodeURIComponent(url);

  try {
    const res = await fetch(getEndpoint, { method: "GET" });
    if (res.ok) {
      const json = await res.json();
      $("#out").textContent = "✅ API Connection Successful (GET)!\n" + JSON.stringify(json, null, 2);
      return;
    }
  } catch (e) {
    console.log("GET endpoint failed, trying POST:", e.message);
  }
  
  // Fallback to POST endpoint
  const postEndpoint = apiBase.replace(/\/$/, "") + "/url";

  try {
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
    
    const json = await res.json();
    $("#out").textContent = "✅ API Connection Successful (POST)!\n" + JSON.stringify(json, null, 2);
  } catch (e) {
    $("#out").textContent = "❌ API Connection Failed: " + e.message;
  }
}

(async function init() {
  const apiBase = await getApiBase();
  
  // Show status message
  $("#out").textContent = "✅ Local API endpoint ready: " + apiBase;
  
  $("#testApi").addEventListener("click", testApi);
})();
