import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Check,
  Zap,
  Copy,
  CheckCircle,
  X,
  Lock,
  Clock,
  ShieldAlert,
  RotateCcw,
  Crown,
  Timer,
  Smartphone,
  Landmark,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';

export const ChoosePlanPage: React.FC = () => {
  const {
    business,
    refreshBusiness,
    addToast,
    isSubscriptionExpired,
    subscriptionCountdown,
  } = useApp();

  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string>('');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<any | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<'hormuud' | 'somtel' | 'salam'>('hormuud');
  const [txRef, setTxRef] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string>('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await api.getSubscriptionPlans();
      if (res.success) {
        setPlans(res.plans);
        setCurrentPlan(res.currentPlan);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (value: string, label: string, key: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    addToast(`${label} (${value}) copied to clipboard!`, 'info');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForUpgrade) return;

    const gatewayLabel =
      selectedGateway === 'hormuud'
        ? 'Hormuud EVC Plus / WaafiPay (0611688269)'
        : selectedGateway === 'somtel'
        ? 'Somtel eDahab / WaafiPay (0621688269)'
        : 'Salaam Somali Bank (AccN: 38524624)';

    setSubmitting(true);
    try {
      const res = await api.upgradeSubscription(
        selectedPlanForUpgrade.id,
        `${gatewayLabel} — Ref: ${txRef}`
      );
      if (res.success) {
        addToast(res.message, 'success');
        setSelectedPlanForUpgrade(null);
        setTxRef('');
        await refreshBusiness();
        await loadPlans();
      }
    } catch (err: any) {
      addToast(err.message || 'Upgrade request failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activePlanName = business?.subscriptionPlan || currentPlan || '7-Day Free Trial';

  const paymentChannels = [
    {
      id: 'hormuud' as const,
      badge: 'HORMUUD EVC PLUS & WAAFIPAY',
      title: 'Send to: 0611688269',
      number: '0611688269',
      ussd30: '*712*611688269*30#',
      ussd360: '*712*611688269*360#',
      desc: 'Supports direct EVC Plus USSD & WaafiPay App wallet transfer',
      icon: Smartphone,
      accent: 'border-emerald-500/35 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    },
    {
      id: 'somtel' as const,
      badge: 'SOMTEL eDAHAB & WAAFIPAY',
      title: 'Send to: 0621688269',
      number: '0621688269',
      ussd30: '*110*621688269*30#',
      ussd360: '*110*621688269*360#',
      desc: 'Supports Somtel eDahab & WaafiPay cross-network instant payment',
      icon: Wallet,
      accent: 'border-lime-500/35 bg-lime-500/10 text-lime-800 dark:text-lime-300',
    },
    {
      id: 'salam' as const,
      badge: 'SALAAM SOMALI BANK',
      title: 'AccN: 38524624',
      number: '38524624',
      ussd30: '*714*38524624*30#',
      ussd360: '*714*38524624*360#',
      desc: 'Direct Salaam Somali Bank transfer & WaafiPay Bank-to-Account',
      icon: Landmark,
      accent: 'border-rose-500/35 bg-rose-500/8 text-rose-700 dark:text-rose-300',
    },
  ];

  return (
    <div className="space-y-6">
      {/* AUTO-LOCKOUT CRITICAL BANNER (Shown when 7-Day / 24h × 7 Trial or Subscription Expires) */}
      <AnimatePresence>
        {isSubscriptionExpired && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="p-5 sm:p-6 rounded-3xl bg-linear-to-r from-[#e11d48] via-[#be123c] to-[#9f1239] text-white shadow-2xl shadow-rose-600/30 border border-rose-400/40 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex-shrink-0">
                <Lock className="w-7 h-7 text-white animate-bounce" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 text-[10px] font-mono font-extrabold uppercase tracking-widest mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
                  <span>TERMINAL AUTO-LOCKOUT ENFORCED (24H × 7 EXPIRED)</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
                  Your 7-Day (168-Hour) Access Period Has Expired
                </h2>
                <p className="text-xs sm:text-sm text-rose-100 mt-1 max-w-2xl leading-relaxed">
                  All POS checkout, inventory, customer Deyn/Rasiid ledgers, and financial reports are permanently locked until plan activation. Send{' '}
                  <strong className="text-white underline">$30/month</strong> or{' '}
                  <strong className="text-white underline">$360/year</strong> via{' '}
                  <strong className="text-white">0611688269</strong> (EVC/WaafiPay),{' '}
                  <strong className="text-white">0621688269</strong> (Somtel/WaafiPay), or{' '}
                  <strong className="text-white">Salaam Somali Bank AccN: 38524624</strong> to unlock immediately.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Maqsuud ICT 3-Tier Enterprise Licensing</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Choose Your Maqsuud ICT POS Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Includes a strict real-time 7-Day (24h × 7 = 168 Hours) Free Trial, or unlock uninterrupted operations with our{' '}
          <strong className="text-slate-800 dark:text-slate-200">$30/month</strong> and{' '}
          <strong className="text-slate-800 dark:text-slate-200">$360/year</strong> plans.
        </p>
      </div>

      {/* Live 7-Day (24h × 7 = 168 Hours) Read-Only License Countdown & Auto-Lockout Monitor */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Timer className="w-4 h-4 text-rose-500" />
            <span>Real-Time Server License &amp; 24h × 7 Auto-Lockout Engine</span>
          </div>
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <span className="font-display text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              {activePlanName}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold uppercase ${
                isSubscriptionExpired
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isSubscriptionExpired
                ? 'LOCKED • 00:00:00:00 EXPIRED'
                : business?.subscriptionStatus === 'trial'
                ? `DAY ${subscriptionCountdown.currentDay} OF ${subscriptionCountdown.totalDays} • TRIAL ACTIVE`
                : `DAY ${subscriptionCountdown.currentDay} OF ${subscriptionCountdown.totalDays} • ACTIVE LICENSE`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isSubscriptionExpired
              ? 'Real-time 168-hour timer reached 00:00:00:00. Terminal is permanently locked until $30 Monthly or $360 Yearly Plan activation.'
              : `Day ${subscriptionCountdown.currentDay} of ${subscriptionCountdown.totalDays} (${subscriptionCountdown.totalHours} Hours Remaining) • Strictly synchronized with server timestamp.`}
          </p>
        </div>

        {/* Live Digital Countdown Blocks (DAYS : HOURS : MINS : SECS) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { label: 'DAYS', value: subscriptionCountdown.days },
            { label: 'HOURS', value: subscriptionCountdown.hours },
            { label: 'MINS', value: subscriptionCountdown.minutes },
            { label: 'SECS', value: subscriptionCountdown.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className={`w-16 sm:w-18 py-2.5 px-2 rounded-2xl border text-center ${
                isSubscriptionExpired
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                  : 'bg-[#f4f8f6] dark:bg-[#090e0c] border-emerald-500/25 text-slate-900 dark:text-white'
              }`}
            >
              <div className="font-mono text-xl sm:text-2xl font-black tracking-tight">
                {String(unit.value).padStart(2, '0')}
              </div>
              <div className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-slate-400">
                {unit.label}
              </div>
            </div>
          ))}
        </div>

        {/* Read-Only Day X of 7 Progress Pill */}
        <div className="px-4 py-2.5 rounded-2xl bg-[#f4f8f6] dark:bg-[#090e0c] border border-emerald-500/25 text-center">
          <div className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-400">
            CYCLE STATUS
          </div>
          <div className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
            {isSubscriptionExpired
              ? '7 / 7 Days Ended'
              : `Day ${subscriptionCountdown.currentDay} of ${subscriptionCountdown.totalDays}`}
          </div>
        </div>
      </div>

      {/* 3-Tier Plan Cards Grid ($0 7-Day Trial, $30/mo Monthly Pro, $360/yr Annual Enterprise) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {plans.map((p) => {
          const isCurrent = !isSubscriptionExpired && activePlanName === p.name;
          const isPopular = p.popular;
          const isAnnual = p.price === 360;
          const isTrialTier = p.price === 0 || p.id === 'plan_trial';

          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -4 }}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                isPopular
                  ? 'bg-linear-to-b from-emerald-500/12 via-white to-white dark:from-emerald-950/45 dark:via-[#111915] dark:to-[#111915] border-2 border-emerald-500 shadow-xl shadow-emerald-600/10'
                  : isAnnual
                  ? 'bg-linear-to-b from-rose-500/8 via-white to-white dark:from-rose-950/25 dark:via-[#111915] dark:to-[#111915] border border-rose-500/35 shadow-lg'
                  : 'bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 shadow-xs'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md">
                  Most Popular • $30/Month
                </div>
              )}

              {isAnnual && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>Full Year Enterprise • $360/Year</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white">
                    {p.name}
                  </h3>
                  <span className="px-2.5 py-1 rounded-lg bg-[#f4f8f6] dark:bg-white/5 border border-emerald-950/8 dark:border-white/10 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                    {p.durationHours ? `${p.durationHours} Hours` : p.period}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Billing Cycle: {p.period}</span>
                </div>

                <div className="mt-5 mb-5 p-4 rounded-2xl bg-[#f8faf9] dark:bg-[#090e0c] border border-emerald-950/8 dark:border-white/8">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                      {p.price === 0 ? '$0' : `$${p.price}`}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {p.price === 0
                        ? '/ 7 Days (24h × 7)'
                        : p.price === 30
                        ? '/ month (30 Days)'
                        : '/ year (365 Days)'}
                    </span>
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1.5">
                    Up to {p.userLimit} Operators • {p.productLimit.toLocaleString()} Products
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2.5 pt-1">
                  {p.features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mt-0.5">
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      </div>
                      <span className="leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-emerald-950/8 dark:border-white/8 space-y-2">
                {isTrialTier ? (
                  <button
                    disabled
                    className={`w-full py-3 rounded-xl font-extrabold text-xs cursor-default flex items-center justify-center gap-1.5 ${
                      isSubscriptionExpired
                        ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                        : isCurrent
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10'
                    }`}
                  >
                    {isSubscriptionExpired ? (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>7-Day Trial Expired (Locked)</span>
                      </>
                    ) : isCurrent ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Active Trial • Day {subscriptionCountdown.currentDay} of 7</span>
                      </>
                    ) : (
                      <span>Initial 7-Day Trial Tier</span>
                    )}
                  </button>
                ) : isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl font-extrabold text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-default flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Current Active Plan</span>
                  </button>
                ) : (
                  <motion.button
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedPlanForUpgrade(p)}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs transition-all shadow-md cursor-pointer ${
                      isPopular
                        ? 'bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-emerald-600/25'
                        : 'bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white shadow-rose-600/25'
                    }`}
                  >
                    {`Activate ${p.name} ($${p.price})`}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Multi-Gateway Payment Hub: Hormuud (0611688269), Somtel (0621688269), WaafiPay & Salaam Somali Bank (AccN: 38524624) */}
      <div className="p-6 rounded-3xl bg-linear-to-r from-[#eef7f2] via-white to-[#f0fdf4] dark:from-[#070b09] dark:via-[#0f2419] dark:to-[#142e20] border border-emerald-500/30 text-slate-900 dark:text-white shadow-lg shadow-emerald-950/5 dark:shadow-xl space-y-5 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="w-4 h-4 text-rose-500" />
              <span>Official Payment Gateways • WaafiPay, EVC Plus, Somtel &amp; Salaam Somali Bank</span>
            </div>
            <h3 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
              Direct Subscription Transfer &amp; WaafiPay Channels
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Send your $30/month or $360/year subscription fee to any of the verified Maqsuud ICT accounts below:
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 self-start sm:self-center">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>WaafiPay Supported on Both 0611688269 &amp; 0621688269</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paymentChannels.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0b120e] border border-emerald-950/10 dark:border-white/10 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-extrabold ${ch.accent}`}>
                      {ch.badge}
                    </span>
                    <Icon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-wide">
                      {ch.title}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(ch.number, ch.badge, `num_${ch.id}`)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedKey === `num_${ch.id}` ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedKey === `num_${ch.id}` ? 'Copied' : 'Copy #'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {ch.desc}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-emerald-950/8 dark:border-white/8 space-y-1.5">
                  <div className="flex items-center justify-between text-xs bg-[#f4f8f6] dark:bg-black/40 px-2.5 py-1.5 rounded-xl border border-emerald-500/20">
                    <span className="font-mono font-bold text-emerald-700 dark:text-lime-400">
                      $30/mo: {ch.ussd30}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ch.ussd30, `${ch.badge} $30 USSD`, `u30_${ch.id}`)}
                      className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedKey === `u30_${ch.id}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-[#f4f8f6] dark:bg-black/40 px-2.5 py-1.5 rounded-xl border border-rose-500/20">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      $360/yr: {ch.ussd360}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ch.ussd360, `${ch.badge} $360 USSD`, `u360_${ch.id}`)}
                      className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {copiedKey === `u360_${ch.id}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UPGRADE CONFIRMATION MODAL */}
      <AnimatePresence>
        {selectedPlanForUpgrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="w-full max-w-lg bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-500/30"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Activate {selectedPlanForUpgrade.name} (${selectedPlanForUpgrade.price})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Valid for {selectedPlanForUpgrade.durationHours} Hours ({selectedPlanForUpgrade.period})
                  </p>
                </div>
                <button onClick={() => setSelectedPlanForUpgrade(null)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpgrade} className="mt-4 space-y-4">
                {/* Payment Channel Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Select Payment Method / WaafiPay / Bank Account
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('hormuud')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedGateway === 'hormuud'
                          ? 'border-2 border-emerald-500 bg-emerald-500/12'
                          : 'border-emerald-950/10 dark:border-white/10 bg-[#f8faf9] dark:bg-[#141e19]'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                        Hormuud / Waafi
                      </div>
                      <div className="font-mono text-xs font-black text-slate-900 dark:text-white mt-0.5">
                        0611688269
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGateway('somtel')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedGateway === 'somtel'
                          ? 'border-2 border-emerald-500 bg-emerald-500/12'
                          : 'border-emerald-950/10 dark:border-white/10 bg-[#f8faf9] dark:bg-[#141e19]'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold text-lime-600 dark:text-lime-400">
                        Somtel / Waafi
                      </div>
                      <div className="font-mono text-xs font-black text-slate-900 dark:text-white mt-0.5">
                        0621688269
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGateway('salam')}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedGateway === 'salam'
                          ? 'border-2 border-emerald-500 bg-emerald-500/12'
                          : 'border-emerald-950/10 dark:border-white/10 bg-[#f8faf9] dark:bg-[#141e19]'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                        Salaam Bank
                      </div>
                      <div className="font-mono text-xs font-black text-slate-900 dark:text-white mt-0.5">
                        Acc: 38524624
                      </div>
                    </button>
                  </div>
                </div>

                {/* Selected Gateway Transfer Instructions */}
                <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/25 text-xs space-y-1.5">
                  {selectedGateway === 'hormuud' && (
                    <>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Hormuud EVC Plus &amp; WaafiPay Transfer:
                      </div>
                      <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        *712*611688269*{selectedPlanForUpgrade.price}#
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        Send to Number: <strong className="font-mono">0611688269</strong> (Supports EVC Plus &amp; WaafiPay)
                      </div>
                    </>
                  )}
                  {selectedGateway === 'somtel' && (
                    <>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Somtel eDahab &amp; WaafiPay Transfer:
                      </div>
                      <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        *110*621688269*{selectedPlanForUpgrade.price}#
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        Send to Somtel Number: <strong className="font-mono">0621688269</strong> (Supports eDahab &amp; WaafiPay)
                      </div>
                    </>
                  )}
                  {selectedGateway === 'salam' && (
                    <>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Salaam Somali Bank Account Transfer:
                      </div>
                      <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        AccN: 38524624 (USSD: *714*38524624*{selectedPlanForUpgrade.price}#)
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300">
                        Send to Salaam Somali Bank Account: <strong className="font-mono">38524624</strong>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Reference / Sender Phone or Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder={
                      selectedPlanForUpgrade.price === 0
                        ? 'Enter your business phone number'
                        : 'e.g. WaafiPay / EVC / Somtel / Salaam Bank Ref #'
                    }
                    className="w-full px-3 py-2.5 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPlanForUpgrade(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Activating...' : 'Confirm & Unlock Terminal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
