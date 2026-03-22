import { useCallback, useEffect, useState } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';
import { useDashboardLocale } from '../../context/DashboardLocaleContext';

const PLATFORMS = ['windows', 'linux', 'android', 'ios', 'mac'];

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function DevicesPanel({ user }) {
  const { t } = useDashboardLocale();
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
      if (!res.ok) throw new Error(data?.message || t('devices.failedToLoad'));
      setDevices(data?.data?.devices || []);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('devices.failedToLoad') });
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      if (!res.ok) throw new Error(data?.message || t('devices.failedToAdd'));
      setCreatedDevice(data?.data?.device || null);
      setAddName('');
      setAddPlatform('windows');
      setAddOpen(false);
      fetchDevices();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('devices.failedToAdd') });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRevoke = async (deviceId) => {
    if (!window.confirm(t('devices.revokeConfirm'))) return;
    try {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t('devices.failedToRevoke'));
      fetchDevices();
      setCreatedDevice(null);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('devices.failedToRevoke') });
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
      if (!res.ok) throw new Error(data?.message || t('devices.failedToUpdate'));
      await fetchDevices();
      setMessage({
        type: 'success',
        text: !currentValue ? t('devices.adultBlockedOn') : t('devices.adultAllowed'),
      });
      setTimeout(() => setMessage(null), 2000);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('devices.failedToUpdate') });
    } finally {
      setUpdatingDeviceId(null);
    }
  };

  const copyDohUrl = (url) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setMessage({ type: 'success', text: t('devices.copiedToClipboard') });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="devices-panel">
        <p>{t('devices.loading')}</p>
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
      <p className="devices-intro">{t('devices.longIntro')}</p>
      <p className="devices-intro-secondary">
        {t('devices.longIntroSecondary')}{' '}
        <a href="/#setup-by-device">{t('devices.homePageLink')}</a>.
      </p>
      <div className="devices-actions">
        <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
          {t('devices.addDevice')}
        </button>
      </div>

      {addOpen && (
        <form onSubmit={handleAdd} className="devices-add-form">
          <label>
            {t('devices.name')}
            <input
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder={t('devices.namePlaceholder')}
              autoFocus
            />
          </label>
          <label>
            {t('devices.platform')}
            <select value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
              {t('devices.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={addLoading || !addName.trim()}>
              {addLoading ? t('devices.adding') : t('devices.add')}
            </button>
          </div>
        </form>
      )}

      {createdDevice && (
        <div className="devices-created-card">
          <h3>{t('devices.deviceAdded')}</h3>
          <p>{t('devices.useThisUrl')}</p>
          <div className="doh-url-wrap">
            <code className="doh-url">{createdDevice.dohUrl}</code>
            <button type="button" onClick={() => copyDohUrl(createdDevice.dohUrl)}>
              {t('devices.copy')}
            </button>
          </div>
          <div className="devices-setup-buttons">
            <span className="devices-download-hint-label">{t('devices.setupForSystem')}</span>
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
            <span className="devices-download-hint-label devices-download-hint-label--secondary">
              {t('devices.extensionBundleChrome')}
            </span>
            <div className="devices-setup-buttons-row">
              <a
                href={`/api/extension-config?device=${createdDevice.token}`}
                className="btn btn-ghost btn-ghost--emphasis"
                download
              >
                {t('devices.extensionFilename')}
              </a>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={() => setCreatedDevice(null)}>
            {t('devices.dismiss')}
          </button>
        </div>
      )}

      <ul className="devices-list">
        {devices.length === 0 && !addOpen && (
          <li className="devices-empty">{t('devices.noDevices')}</li>
        )}
        {devices.map((d) => (
          <li key={d._id} className="device-item">
            <div className="device-info">
              <strong>{d.name}</strong>
              <span className="device-platform">{d.platform}</span>
            </div>
            <div className="device-doh">
              <code>{d.dohUrl}</code>
              <button type="button" onClick={() => copyDohUrl(d.dohUrl)}>
                {t('devices.copy')}
              </button>
            </div>
            <div className="device-meta">
              {t('devices.added')}{' '}
              {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
            </div>
            <div className="device-flags">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(d.blockAdultContent)}
                  onChange={() => handleToggleAdultBlock(d._id, Boolean(d.blockAdultContent))}
                  disabled={updatingDeviceId === d._id}
                />
                <span className="toggle-label">{t('devices.blockAdult')}</span>
              </label>
              {d.blockAdultContent && (
                <span className="tag tag-teal">{t('devices.adultBlocked')}</span>
              )}
            </div>
            <div className="devices-setup-buttons">
              <span className="devices-download-hint-label">{t('devices.setupFiles')}</span>
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
              <span className="devices-download-hint-label devices-download-hint-label--secondary">
                {t('devices.extensionBundle')}
              </span>
              <div className="devices-setup-buttons-row">
                <a
                  href={`/api/extension-config?device=${d.token}`}
                  className="btn btn-ghost btn-ghost--emphasis"
                  download
                >
                  {t('devices.extensionFilename')}
                </a>
              </div>
            </div>
            <button type="button" className="btn-revoke" onClick={() => handleRevoke(d._id)}>
              {t('devices.revoke')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
