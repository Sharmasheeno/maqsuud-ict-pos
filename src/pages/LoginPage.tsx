import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  ShieldAlert,
  ArrowRight,
  QrCode,
  TrendingUp,
  Coins,
  Clock,
  Cpu,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
} from 'lucide-react';
import { useApp, ThemeMode } from '../context/AppContext';
import { api, setStoredToken } from '../services/apiService';
import { Logo } from '../components/common/Logo';

export const LoginPage: React.FC = () => {
  const { setUser, addToast, themeMode, setTheme } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eatTime, setEatTime] = useState<string>('');
  const [eatDate, setEatDate] = useState<string>('');
  const [activeFeatureIdx, setActiveFeatureIdx] = useState(0);

  // Live Mogadishu / EAT Digital Clock Widget
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      try {
        setEatTime(
          now.toLocaleTimeString('en-US', {
            timeZone: 'Africa/Mogadishu',
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
        setEatDate(
          now.toLocaleDateString('en-US', {
            timeZone: 'Africa/Mogadishu',
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        );
      } catch {
        setEatTime(now.toLocaleTimeString());
        setEatDate(now.toDateString());
      }
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      title: 'Real-Time QR POS & Hardware Terminal',
      desc: 'Sub-second barcode & camera scanning with instant thermal receipt generation.',
      icon: QrCode,
      accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/12 border-emerald-500/30',
    },
    {
      title: 'Perpetual Weighted-Average COGS Engine',
      desc: 'Automated real-time gross profit margin and inventory valuation on every checkout.',
      icon: TrendingUp,
      accent: 'text-lime-700 dark:text-lime-400 bg-lime-500/15 border-lime-500/30',
    },
    {
      title: 'Multi-Currency EVC Plus / Zaad / Sahal Ledger',
      desc: 'Immutable double-entry customer Deyn & Rasiid tracking across USD, SOS, SLSH, KES, ETB & DJF.',
      icon: Coins,
      accent: 'text-rose-600 dark:text-rose-400 bg-rose-500/12 border-rose-500/30',
    },
  ];

  useEffect(() => {
    const ticker = setInterval(() => {
      setActiveFeatureIdx((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(ticker);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.success && res.token) {
        setStoredToken(res.token);
        setUser(res.user);
        addToast(`Welcome back to Maqsuud ICT POS, ${res.user.name}!`, 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8f6] dark:bg-[#060a08] text-slate-900 dark:text-white grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden font-sans transition-colors duration-300">
      {/* LEFT PANEL: Brand Showcase & Live Enterprise Terminal (Visible on lg:) */}
      <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-10 xl:p-14 border-r border-emerald-950/10 dark:border-white/8 bg-linear-to-br from-[#eef6f2] via-[#f8faf9] to-[#f1f7f4] dark:from-[#060a08] dark:via-[#070c09] dark:to-[#060a08] overflow-hidden transition-colors duration-300">
        {/* Animated SVG Circuit-Grid Background Pattern */}
        <div className="absolute inset-0 bg-circuit-grid opacity-70 dark:opacity-50 pointer-events-none" />

        {/* Ambient Floating Emerald & Crimson Aurora Orbs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 w-[28rem] h-[28rem] bg-emerald-500/15 dark:bg-emerald-500/18 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-10 right-10 w-96 h-96 bg-rose-500/10 dark:bg-rose-600/15 rounded-full blur-3xl pointer-events-none"
        />

        {/* Decorative SVG Circuit Trace Overlay */}
        <svg
          className="absolute right-0 top-0 h-full w-1/2 opacity-20 dark:opacity-15 pointer-events-none"
          viewBox="0 0 400 800"
          fill="none"
        >
          <path
            d="M350 0 V180 L260 270 V450 L320 510 V800"
            stroke="url(#circuitGrad1)"
            strokeWidth="2"
          />
          <path
            d="M280 0 V120 L190 210 V390 L250 450 V800"
            stroke="url(#circuitGrad2)"
            strokeWidth="1.5"
          />
          <circle cx="260" cy="270" r="5" fill="#10b981" />
          <circle cx="190" cy="210" r="4" fill="#e11d48" />
          <circle cx="320" cy="510" r="5" fill="#84cc16" />
          <defs>
            <linearGradient id="circuitGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
              <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="circuitGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e11d48" stopOpacity="0" />
              <stop offset="50%" stopColor="#e11d48" stopOpacity="1" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top Bar: Maqsuud ICT Brand & Mogadishu Live Clock */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <Logo size="lg" variant="full" />

          {/* Live Mogadishu / EAT Digital Clock Widget */}
          <div className="px-4 py-2.5 rounded-2xl bg-white/85 dark:bg-[#111915]/90 border border-emerald-950/10 dark:border-white/10 backdrop-blur-xl flex items-center gap-3 shadow-md shadow-emerald-950/5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white tracking-wider">
                  {eatTime || '12:00:00'}
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  EAT (UTC+3)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Mogadishu • {eatDate || 'Enterprise Node'}
              </div>
            </div>
          </div>
        </div>

        {/* Center Hero Copy & Live Feature Ticker */}
        <div className="relative z-10 my-auto max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
            <Cpu className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>NEXT-GEN ICT &amp; RETAIL INTELLIGENCE</span>
          </div>

          <h1 className="font-display text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.12] text-slate-900 dark:text-white">
            High-Velocity POS &amp;{' '}
            <span className="bg-linear-to-r from-[#059669] via-[#65a30d] to-[#e11d48] bg-clip-text text-transparent">
              Perpetual Financial
            </span>{' '}
            Command Center.
          </h1>

          <p className="text-sm xl:text-base text-slate-600 dark:text-slate-300/90 leading-relaxed max-w-xl">
            Engineered by <strong className="text-slate-900 dark:text-white">Maqsuud ICT</strong> for modern electronics,
            wholesale, and retail enterprises across East Africa. Instant QR checkout, automated COGS
            accounting, and real-time multi-currency Deyn &amp; Rasiid ledgers.
          </p>

          {/* Interactive Feature Ticker Cards */}
          <div className="grid grid-cols-1 gap-3 pt-2">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              const isActive = idx === activeFeatureIdx;
              return (
                <motion.div
                  key={feat.title}
                  onClick={() => setActiveFeatureIdx(idx)}
                  whileHover={{ x: 4 }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    isActive
                      ? 'bg-white/95 dark:bg-[#111915]/95 border-emerald-500/45 shadow-lg shadow-emerald-600/10 dark:shadow-emerald-950/50'
                      : 'bg-white/55 dark:bg-white/[0.02] border-emerald-950/8 dark:border-white/8 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl border ${feat.accent} flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                      {isActive && (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ● ACTIVE MODULE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-emerald-950/10 dark:border-white/10 pt-5">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Core Ledger Engine v4.2 Online
            </span>
            <span>•</span>
            <span>EVC Plus / Zaad / Sahal USSD Ready</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Maqsuud ICT — Smart POS &amp; Enterprise Management
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication & One-Tap Role Terminal */}
      <div className="lg:col-span-5 flex flex-col justify-center items-center p-5 sm:p-8 lg:p-10 relative z-10 bg-[#f8faf9] dark:bg-[#070b09] transition-colors duration-300">
        {/* Top-Right Direct Theme Switcher Pill (Light / Dark / System) */}
        <div className="w-full max-w-md flex justify-end mb-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white/90 dark:bg-[#111915]/90 border border-emerald-950/10 dark:border-white/10 shadow-sm backdrop-blur-xl">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themeMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setTheme(opt.mode)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all ${
                    isSelected
                      ? 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300'
                  }`}
                  title={`Switch to ${opt.label} Theme`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Ambient Glow */}
        <div className="lg:hidden absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md bg-white/90 dark:bg-[#111915]/90 border border-emerald-950/10 dark:border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-emerald-950/8 dark:shadow-black/60 relative overflow-hidden transition-colors duration-300"
        >
          {/* Top Dual-Tone Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#059669] via-[#84cc16] to-[#e11d48]" />

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="lg:hidden mb-3">
              <Logo size="lg" variant="full" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ENCRYPTED OPERATOR TERMINAL</span>
            </div>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign In to Maqsuud POS
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your authorized operator credentials to access the enterprise terminal
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mb-4 p-3 bg-rose-500/12 border border-rose-500/35 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Operator Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your operator email"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f4f8f6] dark:bg-[#090e0c] border border-emerald-950/12 dark:border-white/12 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Security Passkey
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your security passkey"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f4f8f6] dark:bg-[#090e0c] border border-emerald-950/12 dark:border-white/12 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] hover:brightness-110 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Launch Maqsuud POS Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

        </motion.div>

        <div className="mt-5 text-xs text-slate-500 text-center font-medium">
          Maqsuud ICT POS • Next-Gen ICT &amp; Retail Intelligence
        </div>
      </div>
    </div>
  );
};
