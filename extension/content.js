// Content script: shows an in-page banner if site is unsafe or suspicious.
// This keeps things obvious for judges/users without being too fancy.

let bannerEl = null;

function ensureBanner() {
  if (!bannerEl) {
    bannerEl = document.createElement("div");
    bannerEl.className = "banner";
    bannerEl.style.display = "none";
    bannerEl.textContent = "WebX Safety: status unknown";
    document.documentElement.appendChild(bannerEl);
  }
  return bannerEl;
}

function showBanner(status, message) {
  const el = ensureBanner();
  el.classList.remove("safe", "suspicious", "unsafe");
  if (status) el.classList.add(status);
  el.textContent = message || "WebX Safety: " + (status || "unknown");
  el.style.display = "block";
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "statusUpdate" && msg.result) {
    const status = msg.result.status;
    const label =
      status === "safe"
        ? "Site status: Safe ✅"
        : status === "suspicious"
        ? "Be careful — suspicious ⚠️"
        : "Danger — unsafe ❌";
    showBanner(status, label);
  }
});

// Ask background (politely) right after load to update us
chrome.runtime.sendMessage({ type: "contentReady" });
