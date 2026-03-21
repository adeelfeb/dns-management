import { useCallback, useEffect, useState } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

const PLATFORMS = ['windows', 'linux', 'android', 'ios', 'mac'];

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DevicesPanel({ user }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPlatform, setAddPlatform] = useState('windows');
  const [addLoading, setAddLoading] = useState(false);
  const [createdDevice, setCreatedDevice] = useState(null);
  const [updatingDeviceId, setUpdatingDeviceId] = useState(null);

  const platformLabel = (platform) => {
    switch (platform) {
      case 'windows':
        return 'Windows';
      case 'linux':
        return 'Linux';
      case 'android':
        return 'Android';
      case 'ios':
        return 'iOS';
      case 'mac':
        return 'macOS';
      default:
        return platform;
    }
  };

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/devices', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to load devices');
      setDevices(data?.data?.devices || []);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to load devices' });
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addName.trim() || addLoading) return;
    setAddLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ name: addName.trim(), platform: addPlatform }),
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to add device');
      setCreatedDevice(data?.data?.device || null);
      setAddName('');
      setAddPlatform('windows');
      setAddOpen(false);
      fetchDevices();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to add device' });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRevoke = async (deviceId) => {
    if (!window.confirm('Revoke this device? It will stop using your DNS.')) return;
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to revoke');
      fetchDevices();
      setCreatedDevice(null);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to revoke' });
    }
  };

  const handleToggleAdultBlock = async (deviceId, currentValue) => {
    setUpdatingDeviceId(deviceId);
    setMessage(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ blockAdultContent: !currentValue }),
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to update device');
      await fetchDevices();
      setMessage({ type: 'success', text: !currentValue ? 'Adult content blocked for this device' : 'Adult content allowed for this device' });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to update device' });
    } finally {
      setUpdatingDeviceId(null);
    }
  };

  const copyDohUrl = (url) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setMessage({ type: 'success', text: 'Copied to clipboard' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="devices-panel">
        <p>Loading devices…</p>
      </div>
    );
  }

  return (
    <div className="devices-panel">
      {message && (
        <div className={`panel-message panel-message--${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <p className="devices-intro">
        Each device gets a <strong>personal DNS link</strong>. When a phone, PC, or browser uses that link, <strong>lookups go to our website</strong>, we apply your block/allow rules (and optional adult blocking), log blocks to your dashboard, then answer or forward the query.
      </p>
      <p className="devices-intro-secondary">
        Need help? See setup steps for each device type on the <a href="/#setup-by-device">home page</a>.
      </p>
      <div className="devices-actions">
        <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
          Add device
        </button>
      </div>

      {addOpen && (
        <form onSubmit={handleAdd} className="devices-add-form">
          <label>
            Name
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. My iPhone"
              autoFocus
            />
          </label>
          <label>
            Platform
            <select value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={addLoading || !addName.trim()}>
              {addLoading ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {createdDevice && (
        <div className="devices-created-card">
          <h3>Device added</h3>
          <p>Use this URL when setting up DNS for this device:</p>
          <div className="doh-url-wrap">
            <code className="doh-url">{createdDevice.dohUrl}</code>
            <button type="button" onClick={() => copyDohUrl(createdDevice.dohUrl)}>Copy</button>
          </div>
          <div className="devices-setup-buttons">
            <span className="devices-download-hint-label">Download setup for your system:</span>
            <div className="devices-setup-buttons-row">
              {PLATFORMS.map((os) => (
                <a
                  key={os}
                  href={`/api/setup-file?device=${createdDevice.token}&os=${os}`}
                  className="btn btn-ghost"
                  download
                >
                  {platformLabel(os)}
                </a>
              ))}
            </div>
            <span className="devices-download-hint-label devices-download-hint-label--secondary">Bundle for Chrome extension:</span>
            <div className="devices-setup-buttons-row">
              <a
                href={`/api/extension-config?device=${createdDevice.token}`}
                className="btn btn-ghost btn-ghost--emphasis"
                download
              >
                dns-control-config.json
              </a>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={() => setCreatedDevice(null)}>Dismiss</button>
        </div>
      )}

      <ul className="devices-list">
        {devices.length === 0 && !addOpen && (
          <li className="devices-empty">No devices yet. Add one to get started.</li>
        )}
        {devices.map((d) => (
          <li key={d._id} className="device-item">
            <div className="device-info">
              <strong>{d.name}</strong>
              <span className="device-platform">{d.platform}</span>
            </div>
            <div className="device-doh">
              <code>{d.dohUrl}</code>
              <button type="button" onClick={() => copyDohUrl(d.dohUrl)}>Copy</button>
            </div>
            <div className="device-meta">
              Added {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
            </div>
            <div className="device-flags">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(d.blockAdultContent)}
                  onChange={() => handleToggleAdultBlock(d._id, Boolean(d.blockAdultContent))}
                  disabled={updatingDeviceId === d._id}
                />
                <span className="toggle-label">
                  Block adult content (porn, explicit sites)
                </span>
              </label>
              {d.blockAdultContent && (
                <span className="tag tag-teal">Adult content blocked</span>
              )}
            </div>
            <div className="devices-setup-buttons">
              <span className="devices-download-hint-label">Setup files:</span>
              <div className="devices-setup-buttons-row">
                {PLATFORMS.map((os) => (
                  <a
                    key={os}
                    href={`/api/setup-file?device=${d.token}&os=${os}`}
                    className="btn btn-ghost"
                    download
                  >
                    {platformLabel(os)}
                  </a>
                ))}
              </div>
              <span className="devices-download-hint-label devices-download-hint-label--secondary">Extension bundle:</span>
              <div className="devices-setup-buttons-row">
                <a
                  href={`/api/extension-config?device=${d.token}`}
                  className="btn btn-ghost btn-ghost--emphasis"
                  download
                >
                  dns-control-config.json
                </a>
              </div>
            </div>
            <button type="button" className="btn-revoke" onClick={() => handleRevoke(d._id)}>Revoke</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
