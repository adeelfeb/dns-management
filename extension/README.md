# DNS Control - Browser Extension

This folder contains the DNS Control browser extension (Chrome). It is part of the same project as the Next.js app.

## Status

Placeholder implementation: options page lets users save their DoH URL from the dashboard. Full DNS filtering in the browser would require using the DoH URL for all DNS lookups made by the browser (e.g. via Chrome's proxy or DNS APIs where available).

## Load in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this `extension` folder

## Build / Publish

To publish to the Chrome Web Store, zip the contents of this folder and upload. Ensure the DoH URL in options points to your deployed app (e.g. `https://yourdomain.com/api/dns-query?device=TOKEN`).
