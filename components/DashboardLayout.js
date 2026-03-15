import { useState, useEffect } from 'react';

// Category mapping for navigation items
const getNavCategory = (key) => {
  const hr = ['overview', 'devices', 'block-allow-list'];
  const all = ['user-management', 'help', 'privacy', 'updates', 'activity'];
  if (hr.includes(key)) return 'hr';
  return 'all';
};

// Icon mapping for navigation items
const getNavIcon = (key) => {
  const icons = {
    'overview': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    ),
    'user-management': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    'devices': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
      </svg>
    ),
    'block-allow-list': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
      </svg>
    ),
    'add-origin': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="16"></line>
        <line x1="8" y1="12" x2="16" y2="12"></line>
      </svg>
    ),
    'api-endpoints': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16M4 12h16M4 17h16"></path>
        <circle cx="8" cy="7" r="1"></circle>
        <circle cx="8" cy="12" r="1"></circle>
        <circle cx="8" cy="17" r="1"></circle>
      </svg>
    ),
    'blogs': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    'resources': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      </svg>
    ),
    'support': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    'help': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    ),
    'privacy': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="M9 12l2 2 4-4"></path>
      </svg>
    ),
    'updates': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    ),
    'activity': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
      </svg>
    ),
    'requests': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
    'messages': (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    ),
  };
  return icons[key] || (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
};

export default function DashboardLayout({
  user,
  navItems,
  activeNav,
  onNavSelect,
  onOpenSettings,
  onLogout,
  isLoggingOut,
  chatUnreadCount = 0,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'User';
  const items = Array.isArray(navItems) ? navItems : [];
  const messagesUnread = typeof chatUnreadCount === 'number' ? chatUnreadCount : 0;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 960) {
        setSidebarOpen(false);
      }
    };

    const handleClickOutside = (e) => {
      if (sidebarOpen && window.innerWidth <= 960) {
        const sidebar = document.querySelector('.sidebar');
        const toggle = document.querySelector('.sidebar-toggle');
        if (sidebar && toggle && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="dashboard-shell">
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
      >
        <span className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand" aria-label="Application" style={{ padding: '0.8rem 0.85rem 0.6rem' }}>
            <div className="brand-mark">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#14b8a6"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill="#0d9488"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill="#0d9488"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill="#14b8a6"/>
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">
                <span className="brand-title-teal">DNS</span>
                <span className="brand-title-separator"> </span>
                <span className="brand-title-teal-alt">Control</span>
              </span>
              <span className="brand-subtitle">{roleLabel}</span>
            </div>
          </div>

          <nav className="nav" aria-label="Primary" style={{ padding: '0 0.85rem' }}>
            <ul className="nav-list">
              {items.map((item) => {
                const isActive = item.key === activeNav;
                const category = getNavCategory(item.key);
                return (
                  <li key={item.key} className="nav-list-item">
                    <button
                      type="button"
                      className={`nav-button nav-button--${category}${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => {
                        onNavSelect?.(item.key);
                        if (window.innerWidth <= 960) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <span className="nav-icon">{getNavIcon(item.key)}</span>
                      <span className="nav-label">{item.label}</span>
                      {item.key === 'messages' && messagesUnread > 0 && (
                        <span className="nav-badge" aria-label={`${messagesUnread} unread`}>
                          {messagesUnread > 99 ? '99+' : messagesUnread}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="sidebar-bottom" aria-label="Secondary" style={{ padding: '0.6rem 0.85rem 0.85rem' }}>
          <button
            type="button"
            className={`secondary-button secondary-button--settings${activeNav === 'settings' ? ' is-active' : ''}`}
            onClick={() => {
              onOpenSettings?.();
              if (window.innerWidth <= 960) {
                setSidebarOpen(false);
              }
            }}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
              </svg>
            </span>
            <span className="nav-label">SETTINGS</span>
          </button>
          <button
            type="button"
            className="secondary-button secondary-button--logout"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <span className="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </span>
            <span className="nav-label">{isLoggingOut ? 'LOGGING OUT…' : 'LOGOUT'}</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <div className="content-inner">{children}</div>
      </main>

      <style jsx>{`
        .dashboard-shell {
          height: 100vh;
          display: flex;
          background: var(--dashboard-surface, #faf8f5);
          color: var(--dashboard-foreground, #1c1917);
          overflow: hidden;
          position: relative;
        }

        .sidebar-toggle {
          display: none;
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 1001;
          background: #faf8f5;
          color: #1c1917;
          border: 1px solid rgba(120, 113, 108, 0.25);
          border-radius: 12px;
          padding: 0.75rem;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(28, 25, 23, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
        }

        .sidebar-toggle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }

        .sidebar-toggle:active {
          transform: scale(0.98);
        }

        .hamburger-icon {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 24px;
          height: 18px;
        }

        .hamburger-icon span {
          display: block;
          width: 100%;
          height: 2px;
          background: #1c1917;
          border-radius: 2px;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }

        .sidebar {
          width: min(236px, 21vw);
          background: linear-gradient(180deg, #0f2a2a 0%, #13403d 35%, #0d3838 70%, #0f1f1f 100%);
          color: #e7e5e4;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          height: 100%;
          padding: 0;
          border-right: 1px solid rgba(20, 184, 166, 0.2);
          box-shadow: 16px 0 42px rgba(15, 42, 42, 0.4);
          transition: transform 0.3s ease;
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .sidebar::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 10%, rgba(20, 184, 166, 0.18), transparent 55%),
            radial-gradient(circle at 25% -10%, rgba(13, 148, 136, 0.2), transparent 60%),
            radial-gradient(circle at 85% 0%, rgba(45, 212, 191, 0.1), transparent 65%),
            linear-gradient(180deg, rgba(20, 184, 166, 0.06), transparent 50%);
          opacity: 0.98;
          pointer-events: none;
          z-index: 0;
        }

        .sidebar-top {
          display: flex;
          flex-direction: column;
          padding: 0;
          gap: 1.05rem;
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }

        .brand-mark {
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 12px;
          background: rgba(15, 42, 42, 0.5);
          display: grid;
          place-items: center;
          border: 1px solid rgba(94, 234, 212, 0.25);
          box-shadow: 0 8px 16px rgba(15, 42, 42, 0.35);
          flex-shrink: 0;
        }
        .brand-mark svg {
          width: 20px;
          height: 20px;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .brand-title {
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          line-height: 1.2;
        }
        .brand-title-teal {
          color: #5eead4;
        }
        .brand-title-separator {
          color: rgba(231, 229, 228, 0.5);
          margin: 0 0.15rem;
        }
        .brand-title-teal-alt {
          color: #99f6e4;
        }

        .brand-subtitle {
          font-size: 0.72rem;
          color: rgba(231, 229, 228, 0.75);
          text-transform: capitalize;
        }

        .nav-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0;
          margin: 0;
        }

        .nav-button {
          width: 100%;
          text-align: left;
          padding: 0.85rem 1rem;
          border-radius: 18px;
          border: 1px solid rgba(94, 234, 212, 0.2);
          background: linear-gradient(135deg, rgba(15, 42, 42, 0.75), rgba(15, 42, 42, 0.45));
          color: #e7e5e4;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          box-shadow: 0 18px 32px rgba(15, 42, 42, 0.35);
          backdrop-filter: blur(8px);
        }

        .nav-button:hover,
        .nav-button:focus-visible {
          outline: none;
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.3), rgba(15, 42, 42, 0.6));
          border-color: rgba(94, 234, 212, 0.45);
          transform: translateX(4px);
          box-shadow: 0 24px 40px rgba(13, 148, 136, 0.35);
          color: #f0fdfa;
        }

        .nav-button.is-active {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.45), rgba(13, 148, 136, 0.5));
          border-color: rgba(94, 234, 212, 0.5);
          color: #fff;
        }

        .nav-button.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: #14b8a6;
          border-radius: 0 4px 4px 0;
        }

        .nav-button--marketing {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.25), rgba(15, 42, 42, 0.45));
          color: #e7e5e4;
          border-color: rgba(94, 234, 212, 0.25);
        }

        .nav-button--marketing:hover,
        .nav-button--marketing:focus-visible {
          outline: none;
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(15, 42, 42, 0.55));
          transform: translateX(4px);
          box-shadow: 0 20px 38px rgba(13, 148, 136, 0.3);
          color: #f0fdfa;
        }

        .nav-button--marketing.is-active {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.5), rgba(20, 184, 166, 0.4));
          box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.6), 0 6px 20px rgba(20, 184, 166, 0.25);
          color: #fff;
        }

        .nav-button--marketing.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: #14b8a6;
          border-radius: 0 4px 4px 0;
        }

        .nav-button--marketing.is-active .nav-icon {
          filter: drop-shadow(0 0 4px rgba(94, 234, 212, 0.5));
        }

        .nav-button--hr {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.25), rgba(15, 42, 42, 0.45));
          color: #e7e5e4;
          border-color: rgba(94, 234, 212, 0.25);
        }

        .nav-button--hr:hover,
        .nav-button--hr:focus-visible {
          outline: none;
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(15, 42, 42, 0.55));
          transform: translateX(4px);
          box-shadow: 0 20px 38px rgba(13, 148, 136, 0.3);
          color: #f0fdfa;
        }

        .nav-button--hr.is-active {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.5), rgba(20, 184, 166, 0.45));
          box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.6), 0 6px 20px rgba(20, 184, 166, 0.25);
          color: #fff;
        }

        .nav-button--hr.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: #14b8a6;
          border-radius: 0 4px 4px 0;
        }

        .nav-button--hr.is-active .nav-icon {
          filter: drop-shadow(0 0 4px rgba(94, 234, 212, 0.5));
        }

        .nav-button--all {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.28), rgba(15, 42, 42, 0.45));
          color: #e7e5e4;
          border-color: rgba(94, 234, 212, 0.3);
        }

        .nav-button--all:hover,
        .nav-button--all:focus-visible {
          outline: none;
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.4), rgba(15, 42, 42, 0.55));
          transform: translateX(4px);
          box-shadow: 0 20px 38px rgba(13, 148, 136, 0.3);
          color: #f0fdfa;
        }

        .nav-button--all.is-active {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.5), rgba(20, 184, 166, 0.4));
          box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.6), 0 6px 20px rgba(20, 184, 166, 0.25);
          color: #fff;
        }

        .nav-button--all.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: #14b8a6;
          border-radius: 0 4px 4px 0;
        }

        .nav-button--all.is-active .nav-icon {
          filter: drop-shadow(0 0 4px rgba(94, 234, 212, 0.5));
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          opacity: 0.9;
          transition: opacity 0.25s ease, transform 0.25s ease, color 0.25s ease;
          color: currentColor;
        }

        .nav-button:hover .nav-icon,
        .nav-button.is-active .nav-icon {
          opacity: 1;
          transform: scale(1.15);
        }
        
        .nav-button.is-active .nav-icon {
          filter: drop-shadow(0 0 4px rgba(94, 234, 212, 0.5));
        }

        .nav-label {
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          font-weight: 600;
          transition: color 0.25s ease;
        }

        .nav-button.is-active .nav-label {
          font-weight: 700;
        }

        .nav-badge {
          flex-shrink: 0;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 999px;
          background: linear-gradient(135deg, #0d9488, #0f766e);
          color: #fff;
          font-size: 0.7rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          box-shadow: 0 2px 6px rgba(13, 148, 136, 0.4);
        }

        .sidebar-bottom {
          margin-top: auto;
          display: grid;
          gap: 0.6rem;
          padding: 0;
          position: relative;
          z-index: 1;
        }

        .secondary-button {
          width: 100%;
          text-align: left;
          padding: 0.8rem 1rem;
          border-radius: 16px;
          border: 1px solid rgba(94, 234, 212, 0.18);
          background: linear-gradient(135deg, rgba(15, 42, 42, 0.65), rgba(15, 42, 42, 0.4));
          color: #e7e5e4;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: relative;
          box-shadow: 0 16px 28px rgba(15, 42, 42, 0.35);
          backdrop-filter: blur(6px);
        }

        .secondary-button .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          opacity: 0.9;
          transition: opacity 0.25s ease, transform 0.25s ease, color 0.25s ease;
          color: currentColor;
        }

        .secondary-button .nav-label {
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-size: 0.875rem;
          font-weight: 600;
          transition: color 0.25s ease;
        }

        .secondary-button:hover .nav-icon,
        .secondary-button.is-active .nav-icon {
          opacity: 1;
          transform: scale(1.15);
        }
        
        .secondary-button.is-active .nav-icon {
          filter: drop-shadow(0 0 4px rgba(94, 234, 212, 0.5));
        }

        .secondary-button:hover,
        .secondary-button:focus-visible {
          outline: none;
          transform: translateX(4px);
          box-shadow: 0 22px 38px rgba(15, 42, 42, 0.45);
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.35), rgba(15, 42, 42, 0.55));
          border-color: rgba(94, 234, 212, 0.45);
          color: #fff;
        }

        .secondary-button--settings:hover,
        .secondary-button--settings:focus-visible {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.45), rgba(13, 148, 136, 0.45));
          color: #f0fdfa;
        }

        .secondary-button--settings.is-active {
          background: linear-gradient(135deg, rgba(45, 212, 191, 0.5), rgba(20, 184, 166, 0.4));
          box-shadow: inset 0 0 0 1px rgba(94, 234, 212, 0.6), 0 6px 20px rgba(20, 184, 166, 0.25);
          color: #fff;
        }

        .secondary-button--settings.is-active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 60%;
          background: #14b8a6;
          border-radius: 0 4px 4px 0;
        }

        .secondary-button--settings.is-active .nav-label {
          font-weight: 700;
        }

        .secondary-button--logout {
          background: linear-gradient(135deg, rgba(120, 113, 108, 0.4), rgba(87, 83, 78, 0.3));
          color: #e7e5e4;
          box-shadow: inset 0 0 0 1px rgba(168, 162, 158, 0.3);
          border-color: rgba(168, 162, 158, 0.35);
        }

        .secondary-button--logout:hover,
        .secondary-button--logout:focus-visible {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.35), rgba(185, 28, 28, 0.3));
          box-shadow: inset 0 0 0 1px rgba(254, 202, 202, 0.4), 0 6px 20px rgba(239, 68, 68, 0.25);
          color: #fee2e2;
          border-color: rgba(248, 113, 113, 0.4);
        }

        .secondary-button--logout:disabled {
          cursor: wait;
          opacity: 0.7;
          transform: none;
        }

        .content {
          flex: 1;
          display: flex;
          min-height: 0;
        }

        .content-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0 3rem 2.5rem 3rem;
          overflow-y: auto;
          gap: 2rem;
        }

        @media (max-width: 960px) {
          .sidebar-toggle {
            display: flex;
          }

          .dashboard-shell {
            flex-direction: column;
            height: 100vh;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: min(280px, 85vw);
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
            overflow-y: auto;
            overflow-x: hidden;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .sidebar.is-open {
            transform: translateX(0);
          }

          .sidebar-top,
          .sidebar-bottom {
            padding: 1.25rem;
          }

          .sidebar-top {
            padding-top: 1.25rem;
          }

          .nav-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .nav-button {
            padding: 0.7rem 0.85rem;
            font-size: 0.875rem;
          }

          .nav-icon {
            width: 18px;
            height: 18px;
          }

          .secondary-button {
            width: 100%;
            padding: 0.7rem 0.85rem;
            font-size: 0.875rem;
          }

          .secondary-button .nav-icon {
            width: 18px;
            height: 18px;
          }

          .content-inner {
            padding: 2rem 1.5rem 3rem;
            margin-top: 0;
            padding-top: 4.5rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            animation: fadeIn 0.3s ease;
            backdrop-filter: blur(2px);
            -webkit-backdrop-filter: blur(2px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .sidebar-toggle {
            top: 0.75rem;
            right: 0.75rem;
            width: 44px;
            height: 44px;
            padding: 0.65rem;
            border-radius: 10px;
          }

          .content-inner {
            padding: 1.5rem 1rem 2rem;
            padding-top: 4rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            overflow-x: hidden;
          }

          .sidebar {
            width: min(260px, 90vw);
          }

          .nav-button {
            padding: 0.65rem 0.8rem;
            font-size: 0.85rem;
            gap: 0.65rem;
          }

          .nav-icon {
            width: 16px;
            height: 16px;
          }

          .secondary-button {
            padding: 0.65rem 0.8rem;
            font-size: 0.85rem;
            gap: 0.65rem;
          }

          .secondary-button .nav-icon {
            width: 16px;
            height: 16px;
          }

          .brand-mark {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 10px;
          }

          .sidebar-top,
          .sidebar-bottom {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .nav-button {
            padding: 0.6rem 0.75rem;
            font-size: 0.8rem;
            gap: 0.6rem;
          }

          .nav-label {
            font-size: 0.8rem;
          }

          .secondary-button {
            padding: 0.6rem 0.75rem;
            font-size: 0.8rem;
            gap: 0.6rem;
          }

          .secondary-button .nav-label {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}