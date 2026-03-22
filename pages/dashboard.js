import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import 'ag-grid-community/styles/ag-grid.min.css';
import 'ag-grid-community/styles/ag-theme-quartz.min.css';
import { safeParseJsonResponse } from '../utils/safeJsonResponse';
import DashboardLayout from '../components/DashboardLayout';
import SettingsPanel from '../components/dashboard/SettingsPanel';
import UserOverviewTable from '../components/dashboard/UserOverviewTable';
import HelpPanel from '../components/dashboard/HelpPanel';
import PrivacyPanel from '../components/dashboard/PrivacyPanel';
import DevicesPanel from '../components/dashboard/DevicesPanel';
import BlockAllowPanel from '../components/dashboard/BlockAllowPanel';
import { getUserFromRequest } from '../lib/auth';
import { DashboardLocaleProvider, useDashboardLocale } from '../context/DashboardLocaleContext';
import { normalizeUserLocale } from '../lib/userLocale';

function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id?.toString?.() || user.id || null,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'base_user',
    roleRef: user.roleRef?.toString?.() || user.roleRef || null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    preferences: {
      locale: normalizeUserLocale(user.preferences?.locale),
    },
  };
}

export async function getServerSideProps(context) {
  try {
    const user = await getUserFromRequest(context.req);

    if (!user) {
      return { redirect: { destination: '/auth', permanent: false } };
    }

    const serializedUser = serializeUser(user);
    return { props: { user: serializedUser } };
  } catch (error) {
    console.error('[Dashboard] Error in getServerSideProps:', error.message);
    return { redirect: { destination: '/auth', permanent: false } };
  }
}

const NAV_KEYS_BY_ROLE = {
  superadmin: ['overview', 'devices', 'block-allow-list', 'user-management', 'help', 'privacy'],
  developer: ['overview', 'devices', 'block-allow-list', 'user-management', 'help', 'privacy'],
  admin: ['overview', 'devices', 'block-allow-list', 'user-management', 'help', 'privacy'],
  hr: ['overview', 'devices', 'block-allow-list', 'help', 'privacy'],
  hr_admin: ['overview', 'devices', 'block-allow-list', 'help', 'privacy'],
  base_user: ['overview', 'devices', 'block-allow-list', 'help', 'privacy'],
};

const FALLBACK_NAV_KEYS = ['overview', 'devices', 'block-allow-list', 'help', 'privacy'];

const NAV_LABEL_KEY = {
  overview: 'nav.overview',
  devices: 'nav.devices',
  'block-allow-list': 'nav.blockAllowList',
  'user-management': 'nav.userManagement',
  help: 'nav.help',
  privacy: 'nav.privacy',
};

function buildNavItems(t, role) {
  const normalized = (role || '').toLowerCase();
  const keys = NAV_KEYS_BY_ROLE[normalized] || FALLBACK_NAV_KEYS;
  return keys.map((key) => ({
    key,
    label: t(NAV_LABEL_KEY[key] || 'nav.overview'),
  }));
}

function OverviewBody({ user, t }) {
  const [deviceCount, setDeviceCount] = useState(0);
  const normalizedRole = (user?.role || '').toLowerCase();
  const showUserManagement = ['admin', 'superadmin', 'developer'].includes(normalizedRole);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch('/api/devices', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data?.devices) setDeviceCount(data.data.devices.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const introKey = deviceCount === 1 ? 'overview.intro' : 'overview.intro_other';
  const introText = t(introKey, { count: deviceCount });
  const countStr = String(deviceCount);
  const introParts = introText.split(countStr);

  return (
    <div className="overview-body">
      <p className="overview-intro">
        {introParts.map((part, i) => (
          <span key={`${i}-${part.slice(0, 8)}`}>
            {part}
            {i < introParts.length - 1 ? <strong>{deviceCount}</strong> : null}
          </span>
        ))}
      </p>
      <ul className="overview-links">
        <li>
          <a href="#devices">{t('overview.devicesLink')}</a>
        </li>
        <li>
          <a href="#block-allow-list">{t('overview.blockAllowLink')}</a>
        </li>
        {showUserManagement && (
          <li>
            <a href="#user-management">{t('overview.userManagementLink')}</a>
          </li>
        )}
      </ul>
      {showUserManagement && <UserOverviewTable currentUser={user} />}
    </div>
  );
}

function getSectionDescriptors(t) {
  return {
    overview: {
      subtitle: t('sections.overviewSubtitle'),
      hideHeader: true,
      body: (user) => <OverviewBody user={user} t={t} />,
    },
    devices: {
      subtitle: t('sections.devicesSubtitle'),
      hideHeader: true,
      body: (user) => <DevicesPanel user={user} />,
    },
    'block-allow-list': {
      subtitle: t('sections.blockAllowSubtitle'),
      hideHeader: true,
      body: (user) => <BlockAllowPanel user={user} />,
    },
    help: {
      subtitle: t('sections.helpSubtitle'),
      hideHeader: true,
      body: () => <HelpPanel />,
    },
    privacy: {
      subtitle: t('sections.privacySubtitle'),
      hideHeader: true,
      body: () => <PrivacyPanel />,
    },
    'user-management': {
      subtitle: t('sections.userManagementSubtitle'),
      panels: [
        { title: t('userManagement.teamRoster'), description: t('userManagement.teamRosterDesc') },
        { title: t('userManagement.roleControls'), description: t('userManagement.roleControlsDesc') },
      ],
      listTitle: t('sections.administrativeShortcuts'),
      list: [
        { title: t('userManagement.inviteTeammate') },
        { title: t('userManagement.reviewAccessRequests') },
        { title: t('userManagement.auditRecentChanges') },
      ],
      body: (user) => <UserOverviewTable currentUser={user} />,
    },
    updates: {
      subtitle: t('sections.comingSoon'),
      panels: [{ title: t('sections.stayTuned'), description: t('sections.stayTunedDescription') }],
    },
    activity: {
      subtitle: t('sections.comingSoon'),
      panels: [{ title: t('sections.inProgress'), description: t('sections.inProgressDescription') }],
    },
  };
}

function DashboardPageContent({ sessionUser, setSessionUser }) {
  const { t, locale } = useDashboardLocale();
  const router = useRouter();
  const normalizedRole = (sessionUser?.role || '').toLowerCase();
  const primaryNav = useMemo(() => buildNavItems(t, normalizedRole), [t, normalizedRole]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'nl' ? 'nl' : 'en';
    }
  }, [locale]);

  useEffect(() => {
    const fetchToken = async () => {
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include',
          });
          if (response.ok) {
            const data = await safeParseJsonResponse(response);
            if (data.success && data.data?.token) {
              localStorage.setItem('token', data.data.token);
            }
            if (data.success && data.data?.user?.preferences) {
              setSessionUser((prev) => ({
                ...prev,
                preferences: data.data.user.preferences,
              }));
            }
          }
        } catch (error) {
          console.error('Failed to fetch token:', error);
        }
      }
    };
    fetchToken();
  }, [setSessionUser]);

  const resolveSectionKey = useCallback(
    (key) => {
      if (!key) return null;
      const sanitized = `${key}`.trim();
      if (!sanitized) return null;
      const normalized = sanitized.toLowerCase();
      if (normalized === 'settings') {
        return 'settings';
      }
      const match = primaryNav.find((item) => item.key.toLowerCase() === normalized);
      return match?.key || null;
    },
    [primaryNav]
  );

  const [activeSection, setActiveSection] = useState('overview');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dnsPromptDismissed, setDnsPromptDismissed] = useState(false);
  const [deviceCountForPrompt, setDeviceCountForPrompt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch('/api/devices', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.data?.devices) setDeviceCountForPrompt(data.data.devices.length);
      })
      .catch(() => setDeviceCountForPrompt(0));
    return () => {
      cancelled = true;
    };
  }, [activeSection]);

  const updateUrlHash = useCallback((key) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('section')) {
        url.searchParams.delete('section');
      }
      url.hash = key ? key : '';
      const next = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState(null, '', next);
    } catch {
      const basePath = `${window.location.pathname}${window.location.search}`;
      const hashPart = key ? `#${key}` : '';
      window.history.replaceState(null, '', `${basePath}${hashPart}`);
    }
  }, []);

  const sectionParam = router.query?.section;

  useEffect(() => {
    if (!router.isReady) return;
    if (typeof sectionParam !== 'string') return;
    const resolvedKey = resolveSectionKey(sectionParam);
    if (!resolvedKey) return;
    setActiveSection((prev) => (prev === resolvedKey ? prev : resolvedKey));
    updateUrlHash(resolvedKey);
  }, [router.isReady, sectionParam, resolveSectionKey, updateUrlHash]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const applyHashToState = () => {
      let hashValue = window.location.hash.replace(/^#/, '');
      try {
        hashValue = decodeURIComponent(hashValue);
      } catch {
        // ignore
      }
      if (hashValue) {
        const resolvedKey = resolveSectionKey(hashValue);
        if (resolvedKey) {
          setActiveSection((prev) => (prev === resolvedKey ? prev : resolvedKey));
          updateUrlHash(resolvedKey);
          return;
        }
      }
      const firstNavKey = primaryNav[0]?.key || 'overview';
      setActiveSection((prev) => (prev === firstNavKey ? prev : firstNavKey));
    };

    const rafId = requestAnimationFrame(() => {
      applyHashToState();
    });

    window.addEventListener('hashchange', applyHashToState);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('hashchange', applyHashToState);
    };
  }, [resolveSectionKey, updateUrlHash, primaryNav]);

  const isOverviewSection = activeSection === 'overview';

  useEffect(() => {
    if (!primaryNav.length) return;
    const hasActive = primaryNav.some((item) => item.key === activeSection);
    const isSettings = activeSection === 'settings';
    if (!hasActive && !isSettings) {
      const fallbackKey = primaryNav[0].key;
      setActiveSection(fallbackKey);
      updateUrlHash(fallbackKey);
    }
  }, [primaryNav, activeSection, updateUrlHash]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!router.isReady) return;
    if (!activeSection) return;
    if (typeof sectionParam === 'string') return;
    if (window.location.hash) return;
    updateUrlHash(activeSection);
  }, [activeSection, router.isReady, sectionParam, updateUrlHash]);

  const handleSelectNav = useCallback(
    (key) => {
      setActiveSection(key);
      updateUrlHash(key);
    },
    [updateUrlHash]
  );

  const handleOpenSettings = useCallback(() => {
    setActiveSection('settings');
    updateUrlHash('settings');
  }, [updateUrlHash]);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    const confirmed =
      typeof window !== 'undefined' ? window.confirm(t('logoutConfirm')) : false;
    if (!confirmed) return;
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('auth_redirect_count');
        sessionStorage.removeItem('auth_redirect_time');
      }
      await router.replace('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router, t]);

  const sectionDescriptors = useMemo(() => getSectionDescriptors(t), [t]);
  const resolvedSectionKey = activeSection;
  const activeNavItem = primaryNav.find((item) => item.key === activeSection);
  const sectionDescriptor = sectionDescriptors[resolvedSectionKey] || {
    subtitle: t('sections.comingSoon'),
    panels: [
      {
        title: t('sections.inProgress'),
        description: t('sections.inProgressDescription'),
      },
    ],
  };

  const panels = sectionDescriptor.panels || [];
  const list = sectionDescriptor.list || [];
  const hasCustomBody = typeof sectionDescriptor.body === 'function';
  const sectionTitle =
    activeSection === 'settings' ? t('nav.settings') : activeNavItem?.label || t('brand.title');
  const sectionSubtitle =
    activeSection === 'settings'
      ? t('sections.settingsSubtitle')
      : typeof sectionDescriptor.subtitle === 'function'
        ? sectionDescriptor.subtitle(sessionUser)
        : sectionDescriptor.subtitle;
  const hideHeader = Boolean(sectionDescriptor.hideHeader);

  const safeSectionTitle =
    typeof sectionTitle === 'string'
      ? sectionTitle
      : Array.isArray(sectionTitle)
        ? sectionTitle.join(' ')
        : String(sectionTitle || t('brand.title'));
  const pageTitle = `${safeSectionTitle} | ${t('brand.title')}`;

  const handleLocaleChange = useCallback(
    async (nextLocale) => {
      try {
        const res = await fetch('/api/users/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ locale: nextLocale }),
        });
        const result = await safeParseJsonResponse(res).catch(() => ({}));
        if (!res.ok) throw new Error(result?.message || 'Failed');
        if (result?.data?.user) {
          setSessionUser((prev) => ({
            ...prev,
            ...result.data.user,
            preferences: result.data.user.preferences || { locale: nextLocale },
          }));
        }
      } catch (e) {
        console.error(e);
      }
    },
    [setSessionUser]
  );

  return (
    <>
      <Head>
        <title>{String(pageTitle)}</title>
      </Head>
      <DashboardLayout
        user={sessionUser}
        navItems={primaryNav}
        activeNav={activeSection}
        onNavSelect={handleSelectNav}
        onOpenSettings={handleOpenSettings}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        t={t}
      >
        <div className="dashboard-page">
          <header className="dashboard-toolbar" aria-label={t('layout.language')}>
            <div className="dashboard-toolbar-main">
              <h2 className="dashboard-toolbar-title">{t('brand.title')}</h2>
              <p className="dashboard-toolbar-sub">{t('brand.subtitle')}</p>
            </div>
            <div className="dashboard-toolbar-locale">
              <label htmlFor="dashboard-locale-select" className="dashboard-toolbar-locale-label">
                {t('layout.language')}
              </label>
              <select
                id="dashboard-locale-select"
                className="dashboard-toolbar-select"
                value={locale}
                onChange={(e) => handleLocaleChange(e.target.value)}
              >
                <option value="en">{t('settings.english')}</option>
                <option value="nl">{t('settings.dutch')}</option>
              </select>
            </div>
          </header>

          {deviceCountForPrompt === 0 && !dnsPromptDismissed && (
            <div className="dns-prompt-banner">
              <p className="dns-prompt-title">{t('dnsPrompt.title')}</p>
              <p className="dns-prompt-text">{t('dnsPrompt.text')}</p>
              <div className="dns-prompt-actions">
                <a href="#devices" className="dns-prompt-btn dns-prompt-btn--primary">
                  {t('dnsPrompt.getSetup')}
                </a>
                <button
                  type="button"
                  className="dns-prompt-dismiss"
                  onClick={() => setDnsPromptDismissed(true)}
                >
                  {t('dnsPrompt.dismiss')}
                </button>
              </div>
            </div>
          )}
          <section className={`section ${isOverviewSection ? 'section--compact' : ''}`}>
            {!isOverviewSection && !hideHeader && (
              <header className="section-header">
                <h1 className="section-title">{sectionTitle}</h1>
                {sectionSubtitle && <p className="section-subtitle">{sectionSubtitle}</p>}
              </header>
            )}
            <div className={`section-body ${isOverviewSection ? 'section-body--compact' : ''}`}>
              {activeSection === 'settings' ? (
                <SettingsPanel
                  user={sessionUser}
                  onProfileUpdated={(updated) => {
                    if (!updated) return;
                    setSessionUser((prev) => ({
                      ...prev,
                      name: updated.name ?? prev.name,
                      email: updated.email ?? prev.email,
                      preferences: updated.preferences
                        ? { ...prev.preferences, ...updated.preferences }
                        : prev.preferences,
                    }));
                  }}
                />
              ) : (
                <>
                  {panels.length > 0 && (
                    <div className="section-panels">
                      {panels.map((panel) => (
                        <article className="section-card" key={panel.title}>
                          <div className="section-card-header">
                            <h2>{panel.title}</h2>
                            {panel.meta && <span className="section-meta">{panel.meta}</span>}
                          </div>
                          <p>{panel.description}</p>
                        </article>
                      ))}
                    </div>
                  )}

                  {list.length > 0 && (
                    <div className="section-list-wrap">
                      <h3 className="section-list-title">
                        {sectionDescriptor.listTitle || t('sections.keyActions')}
                      </h3>
                      <ul className="section-list">
                        {list.map((item) => {
                          const id = typeof item === 'string' ? item : item.title;
                          const content = typeof item === 'string' ? { title: item } : item;
                          return (
                            <li key={id} className="section-list-item">
                              <span className="section-list-item-title">{content.title}</span>
                              {content.description && <p>{content.description}</p>}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {hasCustomBody && (
                    <div className="section-custom">{sectionDescriptor.body(sessionUser)}</div>
                  )}

                  {panels.length === 0 && list.length === 0 && !hasCustomBody && (
                    <div className="empty-state">
                      <h2>{t('sections.stayTuned')}</h2>
                      <p>{t('sections.stayTunedDescription')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function Dashboard({ user }) {
  const [sessionUser, setSessionUser] = useState(user);
  const dashboardLocale = sessionUser?.preferences?.locale || 'en';

  return (
    <DashboardLocaleProvider locale={dashboardLocale}>
      <DashboardPageContent sessionUser={sessionUser} setSessionUser={setSessionUser} />
    </DashboardLocaleProvider>
  );
}
