// DNS Control - Browser extension
// To finish: use chrome.dns or fetch DoH when the user has set a DoH URL in options.
// For now this is a placeholder; the extension should read the user's DoH URL from
// chrome.storage.sync (set in options.html) and use it for DNS resolution in the browser.
chrome.runtime.onInstalled.addListener(() => {
  console.log('DNS Control extension installed.');
});
