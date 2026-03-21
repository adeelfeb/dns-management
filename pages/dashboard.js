import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
// AG Grid only used on dashboard (UserOverviewTable); load here so other pages stay light
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

function serializeUser(user) {
  if (!user) return null;
  return {
    id: user._id?.toString?.() || user.id || null,
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'base_user',
    roleRef: user.roleRef?.toString?.() || user.roleRef || null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

export async function getServerSideProps(context) {
  try {
    const { req, resolvedUrl } = context;
    const user = await getUserFromRequest(req);

    if (!user) {
      // Don't include hash in redirect - it causes issues
      // The login page will handle redirecting back after auth
      return { redirect: { destination: '/login', permanent: false } };
    }

    const serializedUser = serializeUser(user);
    return { props: { user: serializedUser } };
  } catch (error) {
    // If auth fails (e.g., DB not available), redirect to login
    // This allows the app to work even without backend
    console.error('[Dashboard] Error in getServerSideProps:', error.message);
    return { redirect: { destination: '/login', permanent: false } };
  }
}

const NAVIGATION_BY_ROLE = {
  superadmin: [
    { key: 'overview', label: 'Overview' },
    { key: 'devices', label: 'Devices' },
    { key: 'block-allow-list', label: 'Block / Allow list' },
    { key: 'user-management', label: 'User Management' },
    { key: 'help', label: 'Help' },
    { key: 'privacy', label: 'Privacy' },
  ],
  developer: [
    { key: 'overview', label: 'Overview' },
    { key: 'devices', label: 'Devices' },
    { key: 'block-allow-list', label: 'Block / Allow list' },
    { key: 'user-management', label: 'User Management' },
    { key: 'help', label: 'Help' },
    { key: 'privacy', label: 'Privacy' },
  ],
  admin: [
    { key: 'overview', label: 'Overview' },
    { key: 'devices', label: 'Devices' },
    { key: 'block-allow-list', label: 'Block / Allow list' },
    { key: 'user-management', label: 'User Management' },
    { key: 'help', label: 'Help' },
    { key: 'privacy', label: 'Privacy' },
  ],
  hr: [
    { key: 'overview', label: 'Overview' },
    { key: 'devices', label: 'Devices' },
    { key: 'block-allow-list', label: 'Block / Allow list' },
    { key: 'help', label: 'Help' },
    { key: 'privacy', label: 'Privacy' },
  ],
  hr_admin: [
    { key: 'overview', label: 'Overview' },
    { key: 'devices', label: 'Devices' },
    { key: 'block-allow-list', label: 'Block / Allow list' },
    { key: 'help', label: 'Help' },
    { key: 'privacy', label: 'Privacy' },
  ],
  base_user: [
    { key: 'overview', label: 'Overview' },
    { key: 'devices', label: 'Devices' },
    { key: 'block-allow-list', label: 'Block / Allow list' },
    { key: 'help', label: 'Help' },
    { key: 'privacy', label: 'Privacy' },
  ],
};

const FALLBACK_NAV = [
  { key: 'overview', label: 'Overview' },
  { key: 'devices', label: 'Devices' },
  { key: 'block-allow-list', label: 'Block / Allow list' },
  { key: 'help', label: 'Help' },
  { key: 'privacy', label: 'Privacy' },
];

function OverviewBody({ user }) {
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
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="overview-body">
      <p className="overview-intro">
        You have <strong>{deviceCount}</strong> {deviceCount === 1 ? 'device' : 'devices'}. Add a device to get started, then manage block/allow lists below.
      </p>
      <ul className="overview-links">
        <li><a href="#devices">Devices</a> — Add devices and get setup links.</li>
        <li><a href="#block-allow-list">Block / Allow list</a> — Manage which sites to block or allow per device.</li>
        {showUserManagement && (
          <li><a href="#user-management">User Management</a> — Manage users and roles.</li>
        )}
      </ul>
      {showUserManagement && <UserOverviewTable currentUser={user} />}
    </div>
  );
}

const SECTION_DESCRIPTORS = {
  overview: {
    subtitle: 'You have your devices and DNS rules here. Add a device to get started, then manage block/allow lists below.',
    hideHeader: true,
    body: (user) => <OverviewBody user={user} />,
  },
  devices: {
    subtitle: 'Add a device to get a unique setup link. Then use the extension or download the setup file for your platform.',
    hideHeader: true,
    body: (user) => <DevicesPanel user={user} />,
  },
  'block-allow-list': {
    subtitle: 'Block or allow websites for each device. Domains listed here are checked when the device uses our DNS.',
    hideHeader: true,
    body: (user) => <BlockAllowPanel user={user} />,
  },
  help: {
    subtitle: 'Start on Devices for your personal link, then follow the three steps below—or open Help anytime.',
    hideHeader: true,
    body: () => <HelpPanel />,
  },
  privacy: {
    subtitle: 'Privacy and confidentiality commitment.',
    hideHeader: true,
    body: () => <PrivacyPanel />,
  },
  'user-management': {
    subtitle: 'Manage access, roles, and permissions across your organization.',
    panels: [
      { title: 'Team roster', description: 'View who is active, pending, or requires action.' },
      { title: 'Role controls', description: 'Assign, update, or revoke roles in a few clicks.' },
    ],
    listTitle: 'Administrative shortcuts',
    list: [
      { title: 'Invite a new teammate' },
      { title: 'Review access requests' },
      { title: 'Audit recent changes' },
    ],
    body: (user) => <UserOverviewTable currentUser={user} />,
  },
  updates: {
    subtitle: 'Catch up on new announcements and reminders.',
    panels: [{ title: 'Announcements', description: 'Updates will appear here.' }],
  },
  activity: {
    subtitle: 'Follow recent actions across your workspace.',
    panels: [{ title: 'Recent activity', description: 'See recent changes.' }],
  },
};

export default function Dashboard({ user }) {
  const [sessionUser, setSessionUser] = useState(user);
  const normalizedRole = (sessionUser?.role || '').toLowerCase();
  const navItems = NAVIGATION_BY_ROLE[normalizedRole] || FALLBACK_NAV;
  const router = useRouter();

  // Fetch and store token from cookies if not in localStorage
  useEffect(() => {
    const fetchToken = async () => {
      // Only fetch if token is not in localStorage
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
          }
        } catch (error) {
          console.error('Failed to fetch token:', error);
        }
      }
    };
    fetchToken();
  }, []);

  const primaryNav = useMemo(() => navItems, [navItems]);
  
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

  // Initialize activeSection - will be set properly by useEffect after mount
  const [activeSection, setActiveSection] = useState(() => {
    // Default to first nav item, hash will be processed in useEffect
    return navItems[0]?.key || FALLBACK_NAV[0].key;
  });
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
    return () => { cancelled = true; };
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

  // Process hash on mount and when hash changes
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const applyHashToState = () => {
      let hashValue = window.location.hash.replace(/^#/, '');
      try {
        hashValue = decodeURIComponent(hashValue);
      } catch {
        // ignore decode errors and fall back to raw hash
      }
      if (hashValue) {
        const resolvedKey = resolveSectionKey(hashValue);
        if (resolvedKey) {
          setActiveSection((prev) => {
            // Only update if different to avoid unnecessary re-renders
            return prev === resolvedKey ? prev : resolvedKey;
          });
          // Update URL hash to ensure it's properly formatted
          updateUrlHash(resolvedKey);
          return;
        }
      }
      // If no valid hash, ensure we're showing the first nav item
      const firstNavKey = navItems[0]?.key || FALLBACK_NAV[0].key;
      setActiveSection((prev) => {
        return prev === firstNavKey ? prev : firstNavKey;
      });
    };

    // Apply hash on mount - use requestAnimationFrame to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      applyHashToState();
    });
    
    window.addEventListener('hashchange', applyHashToState);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('hashchange', applyHashToState);
    };
  }, [resolveSectionKey, updateUrlHash, navItems]);

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
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (!confirmed) return;
    }
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      // Clear all auth-related storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        sessionStorage.removeItem('auth_redirect_count');
        sessionStorage.removeItem('auth_redirect_time');
      }
      await router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, router]);

  const resolvedSectionKey = activeSection;

  const activeNavItem = primaryNav.find((item) => item.key === activeSection);
  const sectionDescriptor = SECTION_DESCRIPTORS[resolvedSectionKey] || {
    subtitle: 'This area will be available soon.',
    panels: [
      {
        title: 'In progress',
        description: 'Content for this section is being prepared.',
      },
    ],
  };

  const panels = sectionDescriptor.panels || [];
  const list = sectionDescriptor.list || [];
  const hasCustomBody = typeof sectionDescriptor.body === 'function';
  const sectionTitle = activeSection === 'settings' ? 'Settings' : activeNavItem?.label || 'Dashboard';
  const sectionSubtitle =
    activeSection === 'settings'
      ? 'Manage your personal details and keep your account secure.'
      : typeof sectionDescriptor.subtitle === 'function'
        ? sectionDescriptor.subtitle(sessionUser)
        : sectionDescriptor.subtitle;
  const hideHeader = Boolean(sectionDescriptor.hideHeader);

  // Ensure sectionTitle is always a string to prevent React warnings
  const safeSectionTitle = typeof sectionTitle === 'string' ? sectionTitle : (Array.isArray(sectionTitle) ? sectionTitle.join(' ') : String(sectionTitle || 'Dashboard'));
  const pageTitle = `${safeSectionTitle} | DNS Control`;

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
      >
        <div className="dashboard-page">
        {deviceCountForPrompt === 0 && !dnsPromptDismissed && (
          <div className="dns-prompt-banner">
            <p className="dns-prompt-title">Use our DNS for this device?</p>
            <p className="dns-prompt-text">Copy your secure DNS link from Devices, paste it into Firefox or Chrome secure DNS, or download a setup file for your whole device.</p>
            <div className="dns-prompt-actions">
              <a href="#devices" className="dns-prompt-btn dns-prompt-btn--primary">Get setup</a>
              <button type="button" className="dns-prompt-dismiss" onClick={() => setDnsPromptDismissed(true)}>Dismiss</button>
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
                onProfileUpdated={(updated) => updated && setSessionUser(updated)}
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
                    <h3 className="section-list-title">{sectionDescriptor.listTitle || 'Key actions'}</h3>
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
                    <h2>Stay tuned</h2>
                    <p>We’re preparing something great for this section.</p>
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
