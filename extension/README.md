# DNS Control - Browser Extension

Chrome/Edge (Manifest V3) helper for the same Next.js project as the dashboard.

## What it does

DNS blocking and allow rules run **on the website’s server** when the browser (or OS) uses your **DoH URL** (`/api/dns-query/<token>` — path style so Firefox can append `?dns=…`). This extension stores that URL and lets you **import `dns-control-config.json`** from the dashboard (Devices → **dns-control-config.json**), which includes the URL and links to all setup downloads.

For full effect in Chrome/Edge, set **Settings → Privacy and security → Security → Use secure DNS → With** and paste the same DoH URL.

## Load unpacked

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this `extension` folder

## Import config

1. Dashboard → **Devices** → download **dns-control-config.json** for your device
2. Extension → **Details** → **Extension options** (or right-click the extension → Options)
3. **Import dns-control-config.json** → saves the DoH URL to sync storage

## Publish

Zip the contents of this folder for the Chrome Web Store. Ensure `NEXT_PUBLIC_APP_URL` on the server matches the domain users will use in the DoH URL.
