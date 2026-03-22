import { createContext, useContext, useMemo } from 'react';
import { createDashboardT, getDashboardMessages } from '../lib/dashboardI18n';
import { normalizeUserLocale } from '../lib/userLocale';

const DashboardLocaleContext = createContext(null);

export function DashboardLocaleProvider({ locale, children }) {
  const normalized = normalizeUserLocale(locale);
  const value = useMemo(() => {
    const messages = getDashboardMessages(normalized);
    return {
      locale: normalized,
      messages,
      t: createDashboardT(messages),
    };
  }, [normalized]);

  return (
    <DashboardLocaleContext.Provider value={value}>{children}</DashboardLocaleContext.Provider>
  );
}

export function useDashboardLocale() {
  const ctx = useContext(DashboardLocaleContext);
  if (!ctx) {
    throw new Error('useDashboardLocale must be used within DashboardLocaleProvider');
  }
  return ctx;
}
