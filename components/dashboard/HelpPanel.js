import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { safeParseJsonResponse } from '../../utils/safeJsonResponse';

function getAuthHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function platformLabel(platform) {
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
      return platform || 'Device';
  }
}

function IconDevices() {
  return (
    <svg className="help-step-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" strokeLinecap="round" />
    </svg>
  );
}

function IconCopyLink() {
  return (
    <svg className="help-step-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M10 13a5 5 0 0 1 7.07 0l.71.71a5 5 0 0 1-7.07 7.07l-.71-.71" strokeLinecap="round" />
      <path d="M14 11a5 5 0 0 0-7.07 0L6.22 11.71a5 5 0 0 0 7.07 7.07l.71-.71" strokeLinecap="round" />
    </svg>
  );
}

function IconBrowser() {
  return (
    <svg className="help-step-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <circle cx="6" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFirefox() {
  return (
    <svg className="help-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 16c2 2 6 2 8 0M10 10h.01M14 10h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconChrome() {
  return (
    <svg className="help-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg className="help-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 3v12m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="help-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 3l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V7l8-4z" strokeLinejoin="round" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="help-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinejoin="round" />
    </svg>
  );
}

export default function HelpPanel() {
  const [devices, setDevices] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [copyHint, setCopyHint] = useState('');

  const fetchDevices = useCallback(async () => {
    setDevicesLoading(true);
    try {
      const res = await fetch('/api/devices', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await safeParseJsonResponse(res).catch(() => ({}));
      if (res.ok && data?.data?.devices) {
        setDevices(data.data.devices);
      } else {
        setDevices([]);
      }
    } catch {
      setDevices([]);
    } finally {
      setDevicesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    const onHash = () => {
      const key = window.location.hash.replace(/^#/, '');
      if (key === 'help') fetchDevices();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [fetchDevices]);

  const copyDoh = (url, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopyHint(id);
      setTimeout(() => setCopyHint(''), 2000);
    }
  };

  return (
    <div className="help-panel">
      <div className="help-hero">
        <p className="help-hero-kicker">Simple guide</p>
        <h2 className="help-hero-title">Connect your devices to DNS Control</h2>
        <p className="help-hero-lead">
          You don’t type a classic “DNS number” here. Instead, each device gets a <strong>personal secure link</strong> (called a
          DNS-over-HTTPS URL). Your browser or computer uses that link whenever it looks up a website—so your{' '}
          <a href="#block-allow-list" className="help-inline-a">
            block and allow lists
          </a>{' '}
          can apply.
        </p>
        <a href="#devices" className="help-cta">
          <span className="help-cta-icon" aria-hidden>
            <IconDevices />
          </span>
          <span className="help-cta-text">
            <strong>Open Devices</strong>
            <span className="help-cta-sub">Add a device and copy your link there</span>
          </span>
        </a>
      </div>

      <section className="help-steps" aria-labelledby="help-steps-heading">
        <h3 id="help-steps-heading" className="help-section-title">
          Three steps
        </h3>
        <ol className="help-steps-grid">
          <li className="help-step-card">
            <div className="help-step-badge" aria-hidden>
              1
            </div>
            <div className="help-step-icon-wrap" aria-hidden>
              <IconDevices />
            </div>
            <h4 className="help-step-title">Go to Devices</h4>
            <p className="help-step-body">Add a phone, laptop, or “Living room PC”. Each one gets its own link and rules.</p>
          </li>
          <li className="help-step-card">
            <div className="help-step-badge" aria-hidden>
              2
            </div>
            <div className="help-step-icon-wrap" aria-hidden>
              <IconCopyLink />
            </div>
            <h4 className="help-step-title">Copy your secure DNS link</h4>
            <p className="help-step-body">Use <strong>Copy</strong> next to the long URL. That’s what you paste—not a normal website address for daily browsing.</p>
          </li>
          <li className="help-step-card">
            <div className="help-step-badge" aria-hidden>
              3
            </div>
            <div className="help-step-icon-wrap" aria-hidden>
              <IconBrowser />
            </div>
            <h4 className="help-step-title">Paste into Firefox, Chrome, or your system</h4>
            <p className="help-step-body">Follow the guides below. Or download a setup file from Devices for your whole computer.</p>
          </li>
        </ol>
      </section>

      <section className="help-doh-section" aria-labelledby="help-doh-heading">
        <div className="help-doh-header">
          <h3 id="help-doh-heading" className="help-section-title">
            Your DNS links (same as on Devices)
          </h3>
          <a href="#devices" className="help-text-link">
            Manage in Devices →
          </a>
        </div>
        <p className="help-doh-intro">
          These are the exact values to paste into <strong>Secure DNS</strong> / <strong>DNS over HTTPS</strong> settings. Each device can have its own link.
        </p>
        {devicesLoading ? (
          <p className="help-doh-loading">Loading your devices…</p>
        ) : devices.length === 0 ? (
          <div className="help-doh-empty">
            <p>You don’t have a device yet. Add one on the Devices page—then your personal link will show here and there.</p>
            <a href="#devices" className="help-cta help-cta--compact">
              <span className="help-cta-text">
                <strong>Add a device</strong>
              </span>
            </a>
          </div>
        ) : (
          <ul className="help-doh-list">
            {devices.map((d) => {
              const id = d._id?.toString?.() || d.id || d.token;
              return (
                <li key={id} className="help-doh-item">
                  <div className="help-doh-item-head">
                    <span className="help-doh-name">{d.name}</span>
                    <span className="help-doh-platform">{platformLabel(d.platform)}</span>
                  </div>
                  <div className="help-doh-url-row">
                    <code className="help-doh-code">{d.dohUrl}</code>
                    <button type="button" className="help-copy-btn" onClick={() => copyDoh(d.dohUrl, id)}>
                      {copyHint === id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="help-guides">
        <h3 className="help-section-title">Where to paste the link</h3>
        <div className="help-guide-grid">
          <article className="help-guide-card">
            <div className="help-guide-card-top">
              <span className="help-guide-icon" aria-hidden>
                <IconFirefox />
              </span>
              <h4>Firefox</h4>
            </div>
            <p className="help-guide-deck">Stays inside Firefox only unless you set DNS elsewhere too.</p>
            <ol className="help-guide-ol">
              <li>Copy the link from above or from <a href="#devices">Devices</a>.</li>
              <li>Menu → <strong>Settings</strong> → <strong>General</strong> → <strong>Network Settings</strong> → <strong>Settings…</strong></li>
              <li>Turn on <strong>Enable DNS over HTTPS</strong> → <strong>Custom</strong> → paste the link.</li>
            </ol>
            <p className="help-guide-note">
              <strong>Android:</strong> Menu → Settings → <strong>DNS over HTTPS</strong> → Custom → paste.
            </p>
          </article>

          <article className="help-guide-card">
            <div className="help-guide-card-top">
              <span className="help-guide-icon" aria-hidden>
                <IconChrome />
              </span>
              <h4>Chrome or Edge</h4>
            </div>
            <p className="help-guide-deck">No extension needed. Stays inside that browser.</p>
            <ol className="help-guide-ol">
              <li>Copy your link from above or <a href="#devices">Devices</a>.</li>
              <li>
                <strong>Chrome:</strong> Settings → Privacy and security → Security → <strong>Use secure DNS</strong> → <strong>With</strong> → paste.
              </li>
              <li>
                <strong>Edge:</strong> Settings → Privacy, search, and services → Security → <strong>Use secure DNS</strong> → custom → paste.
              </li>
            </ol>
          </article>

          <article className="help-guide-card">
            <div className="help-guide-card-top">
              <span className="help-guide-icon" aria-hidden>
                <IconDownload />
              </span>
              <h4>Whole computer or phone</h4>
            </div>
            <p className="help-guide-deck">Uses DNS Control for more than one browser at once (where the file supports it).</p>
            <ol className="help-guide-ol">
              <li>Open <a href="#devices">Devices</a> and pick your device.</li>
              <li>Click <strong>Windows</strong>, <strong>macOS</strong>, <strong>Linux</strong>, or <strong>iOS</strong> to download the helper file.</li>
              <li>Open or run the file and follow any prompts (admin OK on Windows, profile install on iOS, etc.).</li>
            </ol>
            <p className="help-guide-note">
              <strong>Android:</strong> “Private DNS” is a different technology; use Firefox with custom DNS over HTTPS, or an app that supports custom DoH.
            </p>
          </article>
        </div>
      </div>

      <details className="help-details">
        <summary className="help-details-summary">
          <span className="help-details-summary-icon" aria-hidden>
            <IconWrench />
          </span>
          Technical notes &amp; developer extension
        </summary>
        <div className="help-details-body">
          <ul className="help-details-ul">
            <li>
              The app serves a real DNS-over-HTTPS endpoint at <code className="help-inline-code">/api/dns-query</code> and setup files from{' '}
              <code className="help-inline-code">/api/setup-file</code>.
            </li>
            <li>There is no Chrome Web Store install button in this project yet—use browser Secure DNS with your link.</li>
            <li>
              Optional: in the repo, the <code className="help-inline-code">extension</code> folder loads in Chrome via{' '}
              <code className="help-inline-code">chrome://extensions</code> → Developer mode → Load unpacked. It stores your URL; full browser DNS still uses Secure DNS for most people.
            </li>
          </ul>
        </div>
      </details>

      <div className="help-manual">
        <div className="help-manual-top">
          <span className="help-guide-icon help-guide-icon--amber" aria-hidden>
            <IconShield />
          </span>
          <h3>If something doesn’t work</h3>
        </div>
        <p>
          Try your Wi‑Fi or Ethernet <strong>DNS / DNS over HTTPS</strong> screen and paste the same link. If you open the link in a tab, you’ll see a short page with a Copy button—that’s normal; it’s still meant for DNS settings.
        </p>
      </div>

      <article className="help-flow-card">
        <h3 className="help-section-title">How it works (short version)</h3>
        <ol className="help-flow-ol">
          <li>You ask to open a site; your device sends a lookup to <strong>your</strong> DNS Control link.</li>
          <li>We check your rules. Blocked sites get no answer, so they don’t load.</li>
          <li>Allowed sites are resolved normally. Blocks show under <a href="#block-allow-list">Block / Allow list</a> → Recently blocked.</li>
        </ol>
      </article>

      <p className="help-home-link">
        <Link href="/#how-it-works">How it works</Link> (marketing site) · <Link href="/#setup-by-device">Setup by device</Link> (marketing site)
      </p>

      <style jsx>{`
        .help-panel {
          display: grid;
          gap: 1.75rem;
          max-width: 56rem;
        }
        .help-hero {
          display: grid;
          gap: 0.75rem;
        }
        .help-hero-kicker {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0d9488;
        }
        .help-hero-title {
          margin: 0;
          font-size: 1.45rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.25;
        }
        .help-hero-lead {
          margin: 0;
          color: #475569;
          line-height: 1.65;
          font-size: 0.98rem;
        }
        .help-inline-a {
          color: #0d9488;
          font-weight: 600;
          text-decoration: none;
        }
        .help-inline-a:hover {
          text-decoration: underline;
        }
        .help-cta {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 0.35rem;
          padding: 1rem 1.25rem;
          border-radius: 0.85rem;
          background: linear-gradient(135deg, #0d9488, #0f766e);
          color: #fff;
          text-decoration: none;
          box-shadow: 0 10px 28px rgba(13, 148, 136, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .help-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 32px rgba(13, 148, 136, 0.4);
          color: #fff;
        }
        .help-cta--compact {
          justify-content: center;
          width: fit-content;
        }
        .help-cta-icon {
          display: flex;
          width: 2.75rem;
          height: 2.75rem;
          align-items: center;
          justify-content: center;
          border-radius: 0.65rem;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .help-cta-icon :global(.help-step-icon-svg) {
          width: 1.5rem;
          height: 1.5rem;
        }
        .help-cta-text {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          text-align: left;
        }
        .help-cta-text strong {
          font-size: 1.05rem;
        }
        .help-cta-sub {
          font-size: 0.88rem;
          opacity: 0.92;
          font-weight: 400;
        }
        .help-section-title {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }
        .help-steps {
          display: grid;
          gap: 1rem;
        }
        .help-steps-grid {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 768px) {
          .help-steps-grid {
            grid-template-columns: 1fr;
          }
        }
        .help-step-card {
          position: relative;
          margin: 0;
          padding: 1.15rem 1.1rem 1.15rem 1.1rem;
          border-radius: 0.85rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          display: grid;
          gap: 0.5rem;
        }
        .help-step-badge {
          position: absolute;
          top: 0.65rem;
          right: 0.65rem;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 999px;
          background: #ccfbf1;
          color: #0f766e;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .help-step-icon-wrap {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.65rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0d9488;
        }
        .help-step-icon-svg {
          width: 1.35rem;
          height: 1.35rem;
        }
        .help-step-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #0f172a;
          padding-right: 2rem;
        }
        .help-step-body {
          margin: 0;
          font-size: 0.88rem;
          color: #64748b;
          line-height: 1.55;
        }
        .help-doh-section {
          padding: 1.25rem 1.35rem;
          border-radius: 0.9rem;
          border: 2px solid #99f6e4;
          background: linear-gradient(180deg, #f0fdfa 0%, #ecfeff 100%);
        }
        .help-doh-header {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 0.5rem 1rem;
        }
        .help-text-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0d9488;
          text-decoration: none;
        }
        .help-text-link:hover {
          text-decoration: underline;
        }
        .help-doh-intro {
          margin: 0.5rem 0 0.85rem 0;
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.55;
        }
        .help-doh-loading {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }
        .help-doh-empty {
          padding: 1rem;
          border-radius: 0.65rem;
          background: #fff;
          border: 1px dashed #94a3b8;
        }
        .help-doh-empty p {
          margin: 0 0 0.85rem 0;
          color: #475569;
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .help-doh-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.85rem;
        }
        .help-doh-item {
          margin: 0;
          padding: 0.85rem 1rem;
          border-radius: 0.65rem;
          background: #fff;
          border: 1px solid #cbd5e1;
        }
        .help-doh-item-head {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem 0.75rem;
          margin-bottom: 0.5rem;
        }
        .help-doh-name {
          font-weight: 600;
          color: #0f172a;
        }
        .help-doh-platform {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #0d9488;
          background: rgba(20, 184, 166, 0.12);
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
        }
        .help-doh-url-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: flex-start;
        }
        .help-doh-code {
          flex: 1 1 12rem;
          min-width: 0;
          font-size: 0.78rem;
          line-height: 1.45;
          word-break: break-all;
          background: #f1f5f9;
          padding: 0.45rem 0.55rem;
          border-radius: 0.4rem;
          color: #334155;
        }
        .help-copy-btn {
          flex-shrink: 0;
          padding: 0.45rem 0.85rem;
          border-radius: 0.45rem;
          border: 1px solid #0d9488;
          background: #fff;
          color: #0f766e;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .help-copy-btn:hover {
          background: #f0fdfa;
        }
        .help-guides {
          display: grid;
          gap: 1rem;
        }
        .help-guide-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }
        .help-guide-card {
          margin: 0;
          padding: 1.15rem 1.2rem;
          border-radius: 0.85rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
        }
        .help-guide-card-top {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.35rem;
        }
        .help-guide-card-top h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
        }
        .help-guide-icon {
          display: flex;
          width: 2.25rem;
          height: 2.25rem;
          align-items: center;
          justify-content: center;
          border-radius: 0.55rem;
          background: rgba(13, 148, 136, 0.1);
          color: #0d9488;
        }
        .help-guide-icon--amber {
          background: rgba(245, 158, 11, 0.15);
          color: #b45309;
        }
        .help-card-icon-svg {
          width: 1.2rem;
          height: 1.2rem;
        }
        .help-guide-deck {
          margin: 0 0 0.65rem 0;
          font-size: 0.88rem;
          color: #64748b;
          line-height: 1.5;
        }
        .help-guide-ol {
          margin: 0;
          padding-left: 1.2rem;
          color: #475569;
          font-size: 0.88rem;
          line-height: 1.65;
        }
        .help-guide-ol li {
          margin-bottom: 0.4rem;
        }
        .help-guide-ol a {
          color: #0d9488;
          font-weight: 600;
          text-decoration: none;
        }
        .help-guide-ol a:hover {
          text-decoration: underline;
        }
        .help-guide-note {
          margin: 0.65rem 0 0 0;
          font-size: 0.82rem;
          color: #64748b;
          line-height: 1.5;
        }
        .help-details {
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0;
          background: #f8fafc;
          overflow: hidden;
        }
        .help-details-summary {
          cursor: pointer;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.9rem 1.1rem;
          font-weight: 600;
          color: #334155;
          font-size: 0.92rem;
        }
        .help-details-summary::-webkit-details-marker {
          display: none;
        }
        .help-details-summary-icon {
          display: flex;
          color: #64748b;
        }
        .help-details-body {
          padding: 0 1.1rem 1rem 1.1rem;
          border-top: 1px solid #e2e8f0;
        }
        .help-details-ul {
          margin: 0.75rem 0 0 1.1rem;
          padding: 0;
          color: #475569;
          font-size: 0.88rem;
          line-height: 1.65;
        }
        .help-details-ul li {
          margin-bottom: 0.45rem;
        }
        .help-inline-code {
          background: #e2e8f0;
          padding: 0.1rem 0.35rem;
          border-radius: 0.25rem;
          font-size: 0.85em;
        }
        .help-manual {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 0.85rem;
          padding: 1.1rem 1.2rem;
        }
        .help-manual-top {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.4rem;
        }
        .help-manual-top h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #92400e;
        }
        .help-manual p {
          margin: 0;
          color: #78350f;
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .help-flow-card {
          padding: 1.15rem 1.2rem;
          border-radius: 0.85rem;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .help-flow-ol {
          margin: 0.6rem 0 0 0;
          padding-left: 1.2rem;
          color: #475569;
          font-size: 0.9rem;
          line-height: 1.65;
        }
        .help-flow-ol a {
          color: #2563eb;
          font-weight: 500;
          text-decoration: none;
        }
        .help-flow-ol a:hover {
          text-decoration: underline;
        }
        .help-home-link {
          font-size: 0.9rem;
          color: #64748b;
        }
        .help-home-link :global(a) {
          color: #2563eb;
          text-decoration: none;
        }
        .help-home-link :global(a:hover) {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
