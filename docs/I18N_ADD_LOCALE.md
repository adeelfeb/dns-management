# Adding a new locale

Follow these steps to add another language (e.g. German `de`) to the app.

## 1. Add the locale to config

Edit `i18n/config.js`:

```js
export const locales = ['en', 'nl', 'de'];  // add 'de'
```

No need to change `defaultLocale` unless you want a different default.

## 2. Create message files for the new locale

Copy one existing locale folder and translate:

```bash
cp -r messages/en messages/de
# Then edit every file in messages/de/*.json and translate values (keep keys unchanged).
```

Required files (same as `en`/`nl`):

- `messages/de/common.json`
- `messages/de/landing.json`
- `messages/de/auth.json`
- `messages/de/dashboard.json`
- `messages/de/privacy.json`
- `messages/de/contact.json`
- `messages/de/notFound.json`

Keep the **key structure** identical; only change the string values.

## 3. Register the locale in routing

Edit `i18n/routing.js`. The `routing` object is built from `defineRouting({ locales, defaultLocale, ... })`. The `locales` array is imported from `i18n/config.js`, so step 1 is enough for routing. No change needed in `i18n/routing.js` if you only updated `i18n/config.js`.

## 4. Optional: language switcher label

If you show locale names in the UI (e.g. “English”, “Nederlands”), add the new label in `messages/*/common.json`:

```json
"language": {
  "label": "Language",
  "en": "English",
  "nl": "Nederlands",
  "de": "Deutsch"
}
```

Then use `tCommon('language.de')` (or similar) in your `LocaleSwitcher` if you switch to a dropdown with full names.

## 5. Build and test

```bash
npm run build
npm run start
```

- Open `/` (should redirect to default or cookie locale).
- Open `/de` (or your new code) and confirm the homepage and switcher work.
- Switch language and confirm the cookie persists (e.g. `NEXT_LOCALE=de`).

## Notes

- **Middleware:** All non-api pathnames are handled by `next-intl` middleware; new locales in `locales` are automatically accepted in the URL (e.g. `/de`, `/de/...`).
- **Static params:** `app/[locale]/layout.js` uses `generateStaticParams()` from `routing.locales`, so new locales are pre-rendered at build time.
- **Pages Router:** Login, signup, dashboard, etc. are under `pages/` and do not use the locale prefix yet. To localize them, you would either migrate them into `app/[locale]/...` or provide a `NextIntlClientProvider` in `_app.js` with locale/messages from a cookie and load the same namespaces there.
