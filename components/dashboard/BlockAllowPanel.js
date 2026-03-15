import { useCallback, useEffect, useState } from 'react';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function BlockAllowPanel({ user }) {
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
      if (!res.ok) throw new Error(data?.message || 'Failed to load devices');
      const list = data?.data?.devices || [];
      setDevices(list);
      if (list.length > 0 && !selectedDeviceId) setSelectedDeviceId(list[0]._id);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to load devices' });
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDeviceId]);

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
      if (!res.ok) throw new Error(data?.message || 'Failed to load rules');
      setRules(data?.data?.rules || []);
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to load rules' });
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  }, [selectedDeviceId]);

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
      if (!res.ok) throw new Error(data?.message || 'Failed to add rule');
      setNewDomain('');
      fetchRules();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to add rule' });
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
      if (!res.ok) throw new Error(data?.message || 'Failed to delete rule');
      fetchRules();
    } catch (e) {
      setMessage({ type: 'error', text: e.message || 'Failed to delete rule' });
    }
  };

  if (loading) {
    return (
      <div className="block-allow-panel">
        <p>Loading…</p>
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
      <p className="block-allow-intro">
        Block or allow websites for each device. Domains listed here are checked when the device uses our DNS.
      </p>
      {devices.length === 0 ? (
        <p className="block-allow-empty">Add a device first in the Devices section.</p>
      ) : (
        <>
          <label className="device-select-label">
            Device
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
              placeholder="e.g. example.com or *.example.com"
            />
            <select value={newAction} onChange={(e) => setNewAction(e.target.value)}>
              <option value="block">Block</option>
              <option value="allow">Allow</option>
            </select>
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              <option value="exact">Exact</option>
              <option value="suffix">Suffix</option>
            </select>
            <button type="submit" disabled={addLoading || !newDomain.trim()}>
              {addLoading ? 'Adding…' : 'Add'}
            </button>
          </form>

          {rulesLoading ? (
            <p>Loading rules…</p>
          ) : (
            <ul className="rules-list">
              {rules.length === 0 && (
                <li className="rules-empty">No rules for this device yet.</li>
              )}
              {rules.map((r) => (
                <li key={r._id} className="rule-item">
                  <span className="rule-domain">{r.domain}</span>
                  <span className={`rule-action rule-action--${r.action}`}>{r.action}</span>
                  <span className="rule-type">{r.type}</span>
                  <button type="button" className="btn-delete" onClick={() => handleDeleteRule(r._id)}>Remove</button>
                </li>
              ))}
            </ul>
          )}

          {selectedDeviceId && (
            <div className="block-log-section">
              <h3 className="block-log-title">Recently blocked (live)</h3>
              <p className="block-log-intro">Domains that were blocked when this device used our DNS. Add block rules above to block more.</p>
              {blockLogLoading ? (
                <p className="block-log-loading">Loading…</p>
              ) : blockLog.length === 0 ? (
                <p className="block-log-empty">No blocked requests yet. Once this device uses your DoH URL and hits a blocked domain, it will appear here.</p>
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
