import { useCallback, useEffect, useState } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';
import { useDashboardLocale } from '../../context/DashboardLocaleContext';

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function BlockAllowPanel({ user }) {
  const { t } = useDashboardLocale();
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [newDomain, setNewDomain] = useState('');
  const [newAction, setNewAction] = useState('block');
  const [newType, setNewType] = useState('exact');
  const [addLoading, setAddLoading] = useState(false);
  const [blockLog, setBlockLog] = useState([]);
  const [blockLogLoading, setBlockLogLoading] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t('blockAllow.failedToLoad'));
      const list = data?.data?.devices || [];
      setDevices(list);
      if (list.length > 0 && !selectedDeviceId) setSelectedDeviceId(list[0]._id);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('blockAllow.failedToLoad') });
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDeviceId, t]);

  const fetchRules = useCallback(async () => {
    if (!selectedDeviceId) {
      setRules([]);
      return;
    }
    setRulesLoading(true);
    try {
      const res = await fetch(`/api/devices/${selectedDeviceId}/rules`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t('blockAllow.failedToLoadRules'));
      setRules(data?.data?.rules || []);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('blockAllow.failedToLoadRules') });
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  }, [selectedDeviceId, t]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const fetchBlockLog = useCallback(async () => {
    if (!selectedDeviceId) {
      setBlockLog([]);
      return;
    }
    setBlockLogLoading(true);
    try {
      const res = await fetch(`/api/devices/${selectedDeviceId}/block-log?limit=50`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) setBlockLog([]);
      else setBlockLog(data?.data?.logs || []);
    } catch {
      setBlockLog([]);
    } finally {
      setBlockLogLoading(false);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    fetchBlockLog();
  }, [fetchBlockLog]);

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!newDomain.trim() || !selectedDeviceId || addLoading) return;
    setAddLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/devices/${selectedDeviceId}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          domain: newDomain.trim(),
          action: newAction,
          type: newType,
          scope: 'device',
        }),
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t('blockAllow.failedToAdd'));
      setNewDomain('');
      fetchRules();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('blockAllow.failedToAdd') });
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      const res = await fetch(`/api/rules/${ruleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t('blockAllow.failedToDelete'));
      fetchRules();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || t('blockAllow.failedToDelete') });
    }
  };

  if (loading) {
    return (
      <div className="block-allow-panel">
        <p>{t('blockAllow.loadingPanel')}</p>
      </div>
    );
  }

  const selectedDevice = devices.find((d) => d._id === selectedDeviceId);

  return (
    <div className="block-allow-panel">
      {message && (
        <div className={`panel-message panel-message--${message.type}`} role="alert">
          {message.text}
        </div>
      )}
      <p className="block-allow-intro">{t('blockAllow.intro')}</p>
      {devices.length === 0 ? (
        <p className="block-allow-empty">{t('blockAllow.addDeviceFirst')}</p>
      ) : (
        <>
          <label className="device-select-label">
            {t('blockAllow.device')}
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
            >
              {devices.map((d) => (
                <option key={d._id} value={d._id}>{d.name} ({d.platform})</option>
              ))}
            </select>
          </label>

          <form onSubmit={handleAddRule} className="rules-add-form">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder={t('blockAllow.placeholder')}
            />
            <select value={newAction} onChange={(e) => setNewAction(e.target.value)}>
              <option value="block">{t('blockAllow.block')}</option>
              <option value="allow">{t('blockAllow.allow')}</option>
            </select>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              <option value="exact">{t('blockAllow.exact')}</option>
              <option value="suffix">{t('blockAllow.suffix')}</option>
            </select>
            <button type="submit" disabled={addLoading || !newDomain.trim()}>
              {addLoading ? t('blockAllow.adding') : t('blockAllow.add')}
            </button>
          </form>

          {rulesLoading ? (
            <p>{t('blockAllow.loadingRules')}</p>
          ) : (
            <ul className="rules-list">
              {rules.length === 0 && (
                <li className="rules-empty">{t('blockAllow.noRules')}</li>
              )}
              {rules.map((r) => (
                <li key={r._id} className="rule-item">
                  <span className="rule-domain">{r.domain}</span>
                  <span className={`rule-action rule-action--${r.action}`}>{r.action}</span>
                  <span className="rule-type">{r.type}</span>
                  <button type="button" className="btn-delete" onClick={() => handleDeleteRule(r._id)}>
                    {t('blockAllow.remove')}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedDeviceId && (
            <div className="block-log-section">
              <h3 className="block-log-title">{t('blockAllow.recentlyBlockedTitle')}</h3>
              <p className="block-log-intro">{t('blockAllow.blockLogIntro')}</p>
              {blockLogLoading ? (
                <p className="block-log-loading">{t('blockAllow.loadingPanel')}</p>
              ) : blockLog.length === 0 ? (
                <p className="block-log-empty">{t('blockAllow.blockLogEmpty')}</p>
              ) : (
                <ul className="block-log-list">
                  {blockLog.map((entry) => (
                    <li key={entry._id} className="block-log-item">
                      <span className="block-log-domain">{entry.domain}</span>
                      <span className="block-log-time">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
