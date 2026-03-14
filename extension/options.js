document.getElementById('save').addEventListener('click', () => {
  const url = document.getElementById('dohUrl').value.trim();
  const status = document.getElementById('status');
  if (!url) {
    status.textContent = 'Please enter your DoH URL from the dashboard.';
    return;
  }
  chrome.storage.sync.set({ dohUrl: url }, () => {
    status.textContent = 'Saved. The extension will use this URL for DNS (full implementation in progress).';
  });
});

chrome.storage.sync.get(['dohUrl'], (data) => {
  if (data.dohUrl) document.getElementById('dohUrl').value = data.dohUrl;
});
