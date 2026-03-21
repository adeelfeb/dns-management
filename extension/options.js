function setStatus(msg) {
  const el = document.getElementById('status');
  if (el) el.textContent = msg || '';
}

function applyConfigPayload(data) {
  if (!data || typeof data !== 'object') return false;
  const url = typeof data.dohUrl === 'string' ? data.dohUrl.trim() : '';
  if (!url) return false;
  document.getElementById('dohUrl').value = url;
  return true;
}

document.getElementById('save').addEventListener('click', () => {
  const url = document.getElementById('dohUrl').value.trim();
  if (!url) {
    setStatus('Enter your DoH URL, or import dns-control-config.json from the dashboard.');
    return;
  }
  chrome.storage.sync.set({ dohUrl: url }, () => {
    setStatus('Saved. In Chrome/Edge, also set Settings → Privacy and security → Security → Use secure DNS → Custom → paste this URL so lookups use DNS Control.');
  });
});

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!applyConfigPayload(data)) {
        setStatus('File is not a valid dns-control-config.json (missing dohUrl).');
        return;
      }
      chrome.storage.sync.set({ dohUrl: document.getElementById('dohUrl').value.trim() }, () => {
        setStatus('Imported and saved. Use Secure DNS in the browser with this URL for full effect.');
      });
    } catch {
      setStatus('Could not read JSON. Download the file again from Devices.');
    }
  };
  reader.readAsText(file, 'utf-8');
});

chrome.storage.sync.get(['dohUrl'], (data) => {
  if (data.dohUrl) document.getElementById('dohUrl').value = data.dohUrl;
});
