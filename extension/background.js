// DNS Control — background service worker (MV3).
// DNS resolution is enforced by the browser/OS using the DoH URL from the dashboard.
// This worker keeps the install hook for future features (e.g. syncing rules).

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    console.log('[DNS Control] Extension ready. Import dns-control-config.json in options or paste your DoH URL.');
  }
});
