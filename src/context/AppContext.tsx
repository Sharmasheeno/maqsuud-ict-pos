import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setStoredToken, getStoredToken } from '../services/apiService';
import { translations, Language } from '../locales/translations';

export type ThemeMode = 'light' | 'dark';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  permissions: string[];
  biometricEnabled?: boolean;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface SubscriptionCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalHours: number;
  currentDay: number;
  totalDays: number;
  isExpired: boolean;
}

interface AppContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  currency: string;
  currencySymbol: string;
  formatCurrency: (amount: number | string) => string;
  setCurrency: (curr: string, symbol?: string) => Promise<void>;
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
  theme: 'light' | 'dark';
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  activePage: string;
  setActivePage: (page: string) => void;
  business: any;
  refreshBusiness: () => Promise<void>;
  isSubscriptionExpired: boolean;
  subscriptionCountdown: SubscriptionCountdown;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  isOffline: boolean;
  canAccess: (permission: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const computeCountdown = (business: any): SubscriptionCountdown => {
  if (!business) {
    return {
      days: 7,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 168,
      currentDay: 1,
      totalDays: 7,
      isExpired: false,
    };
  }

  const isPaidActive = business.subscriptionStatus === 'active' && !!business.subscriptionExpiry;
  const trialStartMs = business.trialStartedAt
    ? new Date(business.trialStartedAt).getTime()
    : Date.now();

  const expiryMs = isPaidActive
    ? new Date(business.subscriptionExpiry).getTime()
    : trialStartMs + 7 * 24 * 60 * 60 * 1000;

  const diffMs = expiryMs - Date.now();
  const totalDays = isPaidActive
    ? business.subscriptionPlan?.toLowerCase().includes('annual')
      ? 365
      : 30
    : 7;

  const elapsedMs = Math.max(0, Date.now() - trialStartMs);
  const currentDay = isPaidActive
    ? Math.min(totalDays, Math.max(1, totalDays - Math.floor(Math.max(0, diffMs) / 86400000)))
    : Math.min(7, Math.max(1, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1));

  if (business.subscriptionStatus === 'expired' || isNaN(expiryMs) || diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalHours: 0,
      currentDay: totalDays,
      totalDays,
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));

  return {
    days,
    hours,
    minutes,
    seconds,
    totalHours,
    currentDay,
    totalDays,
    isExpired: false,
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('maqsuud_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('maqsuud_lang') as Language) || 'en';
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('maqsuud_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const resolvedTheme: 'light' | 'dark' = themeMode;

  const [activePage, setActivePageState] = useState<string>('dashboard');
  const [currency, setCurrencyState] = useState<string>('USD');
  const [currencySymbol, setCurrencySymbolState] = useState<string>('$');
  const [business, setBusiness] = useState<any>(null);
  const [subscriptionCountdown, setSubscriptionCountdown] = useState<SubscriptionCountdown>(() =>
    computeCountdown(null)
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  const isSubscriptionExpired = subscriptionCountdown.isExpired;

  // Live 1-second tick for 7-Day (24h × 7 = 168h) Trial / Subscription Countdown & Auto-Lockout
  useEffect(() => {
    const updateTick = () => {
      const next = computeCountdown(business);
      setSubscriptionCountdown(next);
      if (next.isExpired && activePage !== 'plans') {
        setActivePageState('plans');
      }
    };
    updateTick();
    const timer = setInterval(updateTick, 1000);
    return () => clearInterval(timer);
  }, [business, activePage]);

  const setActivePage = (page: string) => {
    if (isSubscriptionExpired && page !== 'plans') {
      setActivePageState('plans');
      addToast(
        'Terminal Auto-Locked: 7-Day (24h × 7) Trial expired. Upgrade to $30/mo or $360/yr to unlock.',
        'error'
      );
      return;
    }
    setActivePageState(page);
  };

  // Sync resolved theme with HTML root class & color-scheme
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('maqsuud_theme', themeMode);
  }, [resolvedTheme, themeMode]);

  // Monitor online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast('Network connection restored. Syncing data...', 'info');
    };
    const handleOffline = () => {
      setIsOffline(true);
      addToast('Working in offline mode. Changes saved locally.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load business info and user on mount
  useEffect(() => {
    refreshBusiness();
    const token = getStoredToken();
    if (token) {
      api.getMe()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('maqsuud_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          // Keep local user or clear if invalid
        });
    }
  }, []);

  const refreshBusiness = async () => {
    try {
      const res = await api.getBusinessSettings();
      if (res.success && res.business) {
        setBusiness(res.business);
        setCurrencyState(res.business.currency || 'USD');
        setCurrencySymbolState(res.business.currencySymbol || '$');
      }
    } catch (e) {
      // offline fallback default
    }
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('maqsuud_lang', newLang);
  };

  const setTheme = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('maqsuud_theme', mode);
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const logout = () => {
    setUser(null);
    setStoredToken(null);
    localStorage.removeItem('maqsuud_user');
    addToast('Logged out successfully', 'info');
  };

  const setCurrency = async (curr: string, symbol?: string) => {
    try {
      const res = await api.updateCurrency(curr, symbol);
      if (res.success) {
        setCurrencyState(curr);
        setCurrencySymbolState(res.symbol);
        await refreshBusiness();
        addToast(`Currency switched to ${curr}`, 'success');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to update currency', 'error');
    }
  };

  const formatCurrency = (val: number | string): string => {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    return `${currencySymbol}${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const t = (key: keyof typeof translations['en']): string => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || String(key);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const canAccess = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.permissions && user.permissions.includes('all')) return true;
    return user.permissions ? user.permissions.includes(permission) : false;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser: (u) => {
          setUser(u);
          if (u) localStorage.setItem('maqsuud_user', JSON.stringify(u));
          else localStorage.removeItem('maqsuud_user');
        },
        logout,
        currency,
        currencySymbol,
        formatCurrency,
        setCurrency,
        lang,
        setLang,
        t,
        theme: resolvedTheme,
        themeMode,
        resolvedTheme,
        setTheme,
        toggleTheme,
        activePage,
        setActivePage,
        business,
        refreshBusiness,
        isSubscriptionExpired,
        subscriptionCountdown,
        toasts,
        addToast,
        removeToast,
        isOffline,
        canAccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
