import React from 'react';
import Link from 'next/link';

export default function HelpPanel() {
  return (
    <div className="help-panel">
      <div className="help-header">
        <h2>Two ways to enable DNS control</h2>
        <p>Use the browser extension (this browser only) or download a setup file for your platform (whole device). After you add a device in the <strong>Devices</strong> section, you can get the extension link or download the setup file.</p>
      </div>

      <div className="help-setups">
        <div className="help-setup-card">
          <h3>1. Browser extension</h3>
          <p>Install our extension from the dashboard or store. One click—no system settings. Filtering applies to that browser only (Chrome, Firefox, etc.).</p>
        </div>
        <div className="help-setup-card">
          <h3>2. Download setup file (full device)</h3>
          <p>In <strong>Devices</strong>, add a device and click <strong>Download setup file</strong> for your platform:</p>
          <ul className="help-platform-list">
            <li><strong>Windows</strong> — Download the file and run it once (approve &quot;Run as administrator&quot; if prompted).</li>
            <li><strong>Mac</strong> — Download the file or profile and run / install it once.</li>
            <li><strong>Linux</strong> — Download the script and run it once with <code>sudo</code>.</li>
            <li><strong>iOS</strong> — Download the configuration profile, open it, then go to Settings → Profile Downloaded → Install.</li>
            <li><strong>Android</strong> — Download our app (or use the Play Store link) and tap Enable in the app.</li>
          </ul>
        </div>
      </div>

      <div className="help-manual">
        <h3>Manual setup</h3>
        <p>If the downloaded file does not work on your OS version, you can configure DNS manually: open your system or Wi‑Fi settings, find DNS, and enter the DoH URL shown for your device in the <strong>Devices</strong> section.</p>
      </div>

      <div className="help-setup-card">
        <h3>How DNS retrieval works</h3>
        <p>Once your device or browser uses your DoH URL as its DNS server:</p>
        <ol className="help-numbered-list">
          <li>When you open a website, the system sends a DNS query to our server (your DoH URL).</li>
          <li>We look up your block/allow rules for that device. If the domain is <strong>blocked</strong>, we return no answer (the site won’t load).</li>
          <li>If it’s not blocked, we forward the query to an upstream DNS and return the result so the site loads.</li>
          <li>Blocked requests appear under <strong>Block / Allow list</strong> → <strong>Recently blocked (live)</strong> so you can see what was blocked.</li>
        </ol>
        <p>If you open your DoH URL in a browser, you’ll see a short explanation and a “Copy” button—that’s normal. The URL is meant to be set in your system or browser DNS settings, not opened like a normal page.</p>
      </div>

      <p className="help-home-link">
        <Link href="/#how-it-works">How it works</Link> (home page)
      </p>

      <style jsx>{`
        .help-panel { display: grid; gap: 1.5rem; max-width: 56rem; }
        .help-header h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem 0; }
        .help-header p { color: #475569; line-height: 1.6; margin: 0; }
        .help-setups { display: grid; gap: 1rem; }
        .help-setup-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.25rem; }
        .help-setup-card h3 { font-size: 1.1rem; font-weight: 600; color: #0f172a; margin: 0 0 0.5rem 0; }
        .help-setup-card p { color: #475569; font-size: 0.95rem; line-height: 1.6; margin: 0 0 0.5rem 0; }
        .help-setup-card p:last-of-type { margin-bottom: 0; }
        .help-platform-list { margin: 0.5rem 0 0 1.25rem; padding: 0; color: #475569; font-size: 0.95rem; line-height: 1.7; }
        .help-platform-list li { margin-bottom: 0.35rem; }
        .help-numbered-list { margin: 0.5rem 0 0 1.25rem; padding: 0; color: #475569; font-size: 0.95rem; line-height: 1.7; }
        .help-numbered-list li { margin-bottom: 0.5rem; }
        .help-platform-list code { background: #e2e8f0; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.85em; }
        .help-manual { background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.75rem; padding: 1rem; }
        .help-manual h3 { font-size: 1rem; font-weight: 600; color: #92400e; margin: 0 0 0.35rem 0; }
        .help-manual p { color: #78350f; font-size: 0.9rem; line-height: 1.5; margin: 0; }
        .help-home-link { font-size: 0.9rem; color: #64748b; }
        .help-home-link a { color: #2563eb; text-decoration: none; }
        .help-home-link a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
