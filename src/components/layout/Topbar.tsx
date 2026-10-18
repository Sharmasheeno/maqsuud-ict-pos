import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Moon,
  Sun,
  Globe,
  Coins,
  QrCode,
  ShoppingCart,
  Wifi,
  WifiOff,
  Search,
  Command,
} from 'lucide-react';
import { useApp, ThemeMode } from '../../context/AppContext';

interface TopbarProps {
  onToggleMobile: () => void;
  isMobileOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onGlobalSearch?: (term: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobile,
  isMobileOpen,
  onToggleCollapse,
}) => {
  const {
    currency,
    setCurrency,
    lang,
    setLang,
    theme,
    themeMode,
    setTheme,
    setActivePage,
    isOffline,
    toasts,
    removeToast,
  } = useApp();

  const [currencyDropdown, setCurrencyDropdown] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);
  const [themeDropdown, setThemeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'SOS', name: 'Somali Shilling', symbol: 'S.Sh' },
    { code: 'SLSH', name: 'Somaliland Shilling', symbol: 'Sl.Sh' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
    { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj' },
  ];

  const themeOptions: { mode: ThemeMode; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light Mode', desc: 'Frosted Alabaster UI', icon: Sun },
    { mode: 'dark', label: 'Dark Mode', desc: 'Carbon Obsidian UI', icon: Moon },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActivePage('products');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 sm:h-18 bg-white/85 dark:bg-[#0d1310]/85 backdrop-blur-xl border-b border-emerald-950/8 dark:border-white/8 transition-all duration-300">
        <div className="h-full min-w-0 px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left section: Hamburger & Command Search */}
          <div className="flex min-w-0 items-center gap-1 sm:gap-3 flex-1 max-w-xl">
            <button
              onClick={onToggleMobile}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10"
              aria-label="Toggle Navigation"
              aria-expanded={isMobileOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              title="Toggle Sidebar Expand"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Global Command Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products, SKU, customers, QR..."
                className="w-full pl-10 pr-16 py-2 bg-[#f1f5f3] dark:bg-[#141e19] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 transition-all border border-emerald-950/8 dark:border-white/8 focus:border-emerald-500"
              />
              <span className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white dark:bg-[#0d1310] border border-slate-200 dark:border-white/10 text-[10px] font-mono font-semibold text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2">
                <Command className="w-2.5 h-2.5" />K
              </span>
            </form>
          </div>

          {/* Right section: Quick Actions & Controls */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2.5">
            {/* Animated POS Terminal CTA Button */}
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActivePage('pos')}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 hover:brightness-110 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <ShoppingCart className="w-4 h-4" />
              <span>POS Terminal</span>
            </motion.button>

            {/* Quick QR Scanner Button */}
            <motion.button
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActivePage('qr-scanner')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-[#f1f5f3] dark:bg-[#141e19] border border-emerald-950/8 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:border-emerald-500/40 transition-all"
              title="Scan QR Code"
            >
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Scan QR</span>
            </motion.button>

            {/* Currency Selector Pill */}
            <div className="relative">
              <button
                onClick={() => {
                  setCurrencyDropdown(!currencyDropdown);
                  setLangDropdown(false);
                  setThemeDropdown(false);
                }}
              className="flex items-center gap-1 px-1.5 py-2 sm:gap-1.5 sm:px-2.5 rounded-xl bg-[#f1f5f3] dark:bg-[#141e19] border border-emerald-950/8 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-mono font-bold hover:border-emerald-500/40 transition-all"
              >
                <Coins className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{currency}</span>
              </button>

              <AnimatePresence>
                {currencyDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#111915] rounded-2xl shadow-xl border border-emerald-950/10 dark:border-white/10 py-1.5 z-50"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Multi-Currency Ledger
                    </div>
                    {currencies.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code, c.symbol);
                          setCurrencyDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-500/10 transition-colors ${
                          currency === c.code
                            ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 font-mono text-[11px]">
                          {c.code}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Language Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangDropdown(!langDropdown);
                  setCurrencyDropdown(false);
                  setThemeDropdown(false);
                }}
              className="flex items-center gap-1 px-1.5 py-2 sm:px-2.5 rounded-xl bg-[#f1f5f3] dark:bg-[#141e19] border border-emerald-950/8 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold hover:border-emerald-500/40 transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-rose-500" />
                <span className="uppercase font-mono">{lang}</span>
              </button>

              <AnimatePresence>
                {langDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#111915] rounded-2xl shadow-xl border border-emerald-950/10 dark:border-white/10 py-1.5 z-50"
                  >
                    <button
                      onClick={() => {
                        setLang('en');
                        setLangDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-500/10 ${
                        lang === 'en' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>English</span>
                      <span className="text-[10px] font-mono text-slate-400">EN</span>
                    </button>
                    <button
                      onClick={() => {
                        setLang('so');
                        setLangDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-500/10 ${
                        lang === 'so' ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>Soomaali</span>
                      <span className="text-[10px] font-mono text-slate-400">SO</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Light / Dark Theme Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setThemeDropdown(!themeDropdown);
                  setCurrencyDropdown(false);
                  setLangDropdown(false);
                }}
                className="flex items-center gap-1 px-1.5 py-2 sm:gap-1.5 sm:px-2.5 rounded-xl bg-[#f1f5f3] dark:bg-[#141e19] border border-emerald-950/8 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 transition-colors text-xs font-bold"
                title="Change Theme (Light / Dark)"
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <span className="hidden lg:inline capitalize">{themeMode}</span>
              </button>

              <AnimatePresence>
                {themeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#111915] rounded-2xl shadow-xl border border-emerald-950/10 dark:border-white/10 py-1.5 z-50"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Appearance Mode
                    </div>
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = themeMode === opt.mode;
                      return (
                        <button
                          key={opt.mode}
                          onClick={() => {
                            setTheme(opt.mode);
                            setThemeDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-emerald-500/10 transition-colors ${
                            isSelected
                              ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/8'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <div>
                              <div className="leading-tight">{opt.label}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{opt.desc}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Offline/Online Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border ${
                isOffline
                  ? 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-300'
                  : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300'
              }`}
              title={isOffline ? 'Working Offline - Data will sync automatically' : 'Connected to Maqsuud ICT Engine'}
            >
              {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
              <span className="hidden xl:inline">{isOffline ? 'Offline' : 'Synced'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Notifications / Toasts Stack */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onClick={() => removeToast(toast.id)}
              className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl shadow-xl text-xs font-bold backdrop-blur-md cursor-pointer border ${
                toast.type === 'error'
                  ? 'bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white border-rose-400/30'
                  : toast.type === 'info'
                  ? 'bg-white dark:bg-[#111915] text-slate-900 dark:text-white border-emerald-950/15 dark:border-white/15'
                  : 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white border-emerald-400/30'
              }`}
            >
              <span>{toast.message}</span>
              <span className="ml-2 opacity-70 hover:opacity-100 font-bold">×</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
