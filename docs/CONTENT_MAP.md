# Content map – pages and translation keys

This document lists every user-facing page/screen and where its copy lives in the translation files (by namespace and key). Use it to find or add strings when editing content or adding locales.

**Locales:** `en` (default), `nl`  
**Namespaces:** `common`, `landing`, `auth`, `dashboard`, `privacy`, `contact`, `notFound`

---

## App Router (locale-prefixed)

### Home page – `/en`, `/nl`
- **Route:** `app/[locale]/page.js`
- **Namespaces:** `landing`, `common`
- **Content:**
  - **Header:** `common.siteName`, `common.nav.howItWorks`, `common.nav.logIn`, `common.nav.signUp` + `LocaleSwitcher`
  - **Hero:** `landing.hero.title`, `landing.hero.subtitle`, `landing.hero.getStarted`, `landing.hero.logIn`
  - **What is DNS:** `landing.whatIsDns.heading`, `landing.whatIsDns.paragraph`, `landing.whatIsDns.learnMore`
  - **How it works:** `landing.howItWorks.heading`, `landing.howItWorks.intro`, `landing.howItWorks.steps.1–4.title/details`, `landing.howItWorks.flowTitle`, `landing.howItWorks.flowDetail`
  - **Two ways:** `landing.twoWays.heading`, `landing.twoWays.browserExtension.*`, `landing.twoWays.setupFile.*`
  - **CTA:** `landing.cta.tagline`, `landing.cta.signUp`, `landing.cta.logIn`
  - **Footer:** `common.footer.siteName`, `common.nav.login`, `common.nav.signUp`, `common.nav.dashboard`, `common.nav.privacy`

### 404 – Not Found
- **Route:** `app/not-found.js` (currently not using i18n; can be wired to `notFound.*`)
- **Namespace (for reference):** `notFound.title`, `notFound.code`, `notFound.message`, `notFound.goHome`

---

## Pages Router (no locale prefix; can use cookie for locale later)

### Login – `/login`
- **Route:** `pages/login.js`
- **Namespace:** `auth.login`, `auth.errors.*`, `common.nav.*`, `common.aria.*`
- **Content:** Headings, labels, placeholders, buttons, links, error messages (see `messages/en/auth.json`).

### Signup – `/signup`
- **Route:** `pages/signup.js`
- **Namespace:** `auth.signup`, `auth.errors.*`, `common.*`

### Verify email – `/verify-email`
- **Route:** `pages/verify-email.js`
- **Namespace:** `auth.verifyEmail.*`, `auth.errors.*`

### Dashboard – `/dashboard`
- **Route:** `pages/dashboard.js` + `components/DashboardLayout.js`, `components/dashboard/*`
- **Namespace:** `dashboard.*` (nav, overview, sections, devices, blockAllow, help, settings, privacyPanel, dnsPrompt, etc.)

### Privacy policy – `/privacy-policy`
- **Route:** `pages/privacy-policy.js`
- **Namespace:** `privacy.*` (meta, heading, lastUpdated, sections.*)

### Contact – `/contact`
- **Route:** `pages/contact.js`
- **Namespace:** `contact.*` (meta, heading, subtitle, whyChooseUs, whatWeOffer)

---

## Meta / SEO

- **Root layout:** `app/layout.js` – metadata is static (could be moved to `landing.meta.*` per locale later).
- **Landing meta:** `landing.meta.title`, `landing.meta.description`, `landing.meta.keywords`, `landing.meta.ogTitle`, `landing.meta.ogDescription`, `landing.meta.ogSiteName`.
- **Privacy:** `privacy.meta.*`
- **Contact:** `contact.meta.*`

---

## Design summary (for reference)

- **Layout:** Sticky header (logo, nav, CTA, language switcher), full-width sections, footer with links.
- **Sections:** Hero (headline + CTAs), “What is DNS”, “How it works” (accordion), “Two ways” (two cards), final CTA, footer.
- **Colors:** Slate text, blue primary (buttons/links), white/slate-50 backgrounds, light borders.
- **Typography:** Poppins; clear hierarchy (h1 hero, h2 section, h3 cards).
- **Patterns:** Numbered accordion steps with +/- icons; pill/secondary buttons; card hover states.
