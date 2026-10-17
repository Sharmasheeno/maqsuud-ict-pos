import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Boxes,
  CreditCard,
  Landmark,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Receipt,
  QrCode,
  Crown,
  Briefcase,
  Terminal,
  Calculator,
  Sparkles,
  Truck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';

export const DashboardPage: React.FC = () => {
  const { formatCurrency, t, setActivePage, user, theme } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'year'>('week');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardMetrics();
      if (res.success) {
        setData(res);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-500">Loading Maqsuud ICT intelligence...</span>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recent = data?.recentActivity || {};

  // Role-Adaptive Welcome Banner Configuration
  const roleKey = (user?.role || 'admin').toLowerCase();
  const roleBannerConfig: Record<
    string,
    {
      badge: string;
      headline: string;
      subtext: string;
      icon: React.FC<{ className?: string }>;
      actions: { label: string; page: string; primary?: boolean }[];
    }
  > = {
    admin: {
      badge: 'EXECUTIVE COMMAND CENTER',
      headline: `Welcome back, ${user?.name || 'Maqsuud Director'}`,
      subtext:
        'Full enterprise visibility across POS revenue, perpetual COGS gross margins, and customer/supplier ledgers.',
      icon: Crown,
      actions: [
        { label: 'Launch POS Terminal', page: 'pos', primary: true },
        { label: 'COGS & Profit Report', page: 'reports-cogs' },
        { label: 'Users & Roles', page: 'users-roles' },
      ],
    },
    manager: {
      badge: 'STORE OPERATIONS & SUPPLY CHAIN',
      headline: `Operations Desk • ${user?.name || 'Store Manager'}`,
      subtext:
        'Monitor stock levels, receive purchase orders, and oversee floor checkout velocity.',
      icon: Briefcase,
      actions: [
        { label: 'Inventory & Stock', page: 'inventory', primary: true },
        { label: 'Create Purchase Order', page: 'purchases' },
        { label: 'Products Catalog', page: 'products' },
      ],
    },
    cashier: {
      badge: 'HIGH-SPEED POS TERMINAL DESK',
      headline: `Ready for Checkout, ${user?.name || 'Cashier'}`,
      subtext:
        'Scan QR codes, process Cash/EVC/Zaad/Sahal sales, or record instant customer Rasiid payments.',
      icon: Terminal,
      actions: [
        { label: 'Open POS Checkout', page: 'pos', primary: true },
        { label: 'Scan Product QR', page: 'qr-scanner' },
        { label: 'Record Rasiid', page: 'sales-rasiid' },
      ],
    },
    accountant: {
      badge: 'FINANCIAL LEDGER & AUDIT DESK',
      headline: `Financial Control • ${user?.name || 'Accountant'}`,
      subtext:
        'Reconcile customer Deyn receivables, supplier payables, and verify perpetual inventory valuation.',
      icon: Calculator,
      actions: [
        { label: 'Customer Deyn Ledger', page: 'customer-debts', primary: true },
        { label: 'Record Rasiid Payment', page: 'sales-rasiid' },
        { label: 'Supplier Payables', page: 'supplier-debts' },
      ],
    },
  };

  const activeBanner = roleBannerConfig[roleKey] || roleBannerConfig.admin;
  const BannerIcon = activeBanner.icon;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Dynamic Role-Aware Welcome Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-linear-to-r from-[#eef7f2] via-white to-[#f0fdf4] dark:from-[#070b09] dark:via-[#0f1f18] dark:to-[#132a1f] text-slate-900 dark:text-white p-6 sm:p-7 border border-emerald-500/25 shadow-lg shadow-emerald-950/5 dark:shadow-xl transition-colors duration-300"
      >
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-emerald-500/12 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-20 w-64 h-64 rounded-full bg-rose-500/10 dark:bg-rose-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/12 dark:bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-extrabold tracking-widest text-emerald-700 dark:text-emerald-300 uppercase">
              <BannerIcon className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              <span>{activeBanner.badge}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {activeBanner.headline}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{activeBanner.subtext}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeBanner.actions.map((act) => (
              <motion.button
                key={act.page}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActivePage(act.page)}
                className={
                  act.primary
                    ? 'px-4 py-2.5 rounded-xl bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 hover:brightness-110 transition-all'
                    : 'px-3.5 py-2.5 rounded-xl bg-white/90 hover:bg-emerald-50 dark:bg-white/10 dark:hover:bg-white/15 border border-emerald-950/12 dark:border-white/15 text-slate-800 dark:text-white text-xs font-bold backdrop-blur-md transition-all shadow-2xs'
                }
              >
                {act.label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Controls Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Real-Time Enterprise Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Live synchronized metrics from POS invoices, perpetual stock, and customer ledgers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 p-1 rounded-xl flex items-center text-xs font-bold">
            {(['day', 'week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                  timeFilter === period
                    ? 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={fetchDashboardData}
            title="Refresh Data"
            className="p-2.5 rounded-xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-emerald-600 dark:text-emerald-400 hover:border-emerald-500/40 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </motion.div>

      {/* Primary KPI Grid (4 Layered Enterprise Cards with Sparklines) */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Today's Revenue */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3 }}
          onClick={() => setActivePage('pos-invoices')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 shadow-sm cursor-pointer group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {t('todayRevenue')}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(metrics.todayRevenue || 0)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              +14.8% Live POS
            </span>
            <svg className="w-16 h-6 text-emerald-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 20 L14 14 L26 17 L38 8 L50 11 L62 3"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>

        {/* Today's Gross Profit */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3 }}
          onClick={() => setActivePage('reports-cogs')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 shadow-sm cursor-pointer group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#16a34a] to-[#84cc16]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-lime-700 dark:text-lime-400">
              {t('todayProfit')}
            </span>
            <div className="p-2 rounded-xl bg-lime-500/15 text-lime-600 dark:text-lime-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(metrics.todayProfit || 0)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-md bg-lime-500/15 text-lime-700 dark:text-lime-300 text-[10px] font-bold">
              Net of COGS
            </span>
            <svg className="w-16 h-6 text-lime-500" viewBox="0 0 64 24" fill="none">
              <path
                d="M2 18 L16 15 L28 10 L42 12 L54 5 L62 2"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </motion.div>

        {/* Customer Debts (Receivables - Crimson Highlight) */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3 }}
          onClick={() => setActivePage('customer-debts')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 shadow-sm cursor-pointer group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#e11d48] to-[#dc2626]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              {t('customerDebtsTotal')}
            </span>
            <div className="p-2 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl lg:text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
            {formatCurrency(metrics.customerDebts || 0)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-rose-500/12 text-rose-600 dark:text-rose-300 text-[10px] font-bold">
              Active Deyn Accounts
            </span>
            <ArrowUpRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </motion.div>

        {/* Total Inventory Valuation */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -3 }}
          onClick={() => setActivePage('inventory')}
          className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 shadow-sm cursor-pointer group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-[#059669] to-[#0d9488]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {t('inventoryValue')}
            </span>
            <div className="p-2 rounded-xl bg-teal-500/12 text-teal-600 dark:text-teal-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(metrics.totalInventoryValue || 0)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-[11px]">{metrics.totalProducts || 0} Active SKUs</span>
            <ArrowUpRight className="w-4 h-4 text-teal-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </motion.div>
      </motion.div>

      {/* Secondary Metrics Bar (6 Compact Ledger Cards) */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        <div className="p-3.5 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Cumulative Sales
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(metrics.totalSales || 0)}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Total Purchases
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(metrics.totalPurchases || 0)}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8">
          <div className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider">
            Supplier Payables
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(metrics.supplierDebts || 0)}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8">
          <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
            Rasiid Collected
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(metrics.totalCustomerPayments || 0)}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Registered Clients
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.totalCustomers || 0}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Active Vendors
          </div>
          <div className="font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {metrics.totalSuppliers || 0}
          </div>
        </div>
      </motion.div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend (2 Cols) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 p-5 sm:p-6 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                Revenue &amp; Gross Profit Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Real-time Maqsuud ICT perpetual accounting telemetry
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Sales Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-lime-500" />
                <span className="text-slate-600 dark:text-slate-300">Net Profit</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.salesTrend || []}>
                <defs>
                  <linearGradient id="maqsuudSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="maqsuudProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84cc16" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#84cc16" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.18} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#070b09' : '#ffffff',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '14px',
                    color: theme === 'dark' ? '#ffffff' : '#0f172a',
                    fontSize: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.15)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales Revenue"
                  stroke="#059669"
                  strokeWidth={2.8}
                  fillOpacity={1}
                  fill="url(#maqsuudSalesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Gross Profit"
                  stroke="#84cc16"
                  strokeWidth={2.8}
                  fillOpacity={1}
                  fill="url(#maqsuudProfitGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Best Selling Products */}
        <motion.div
          variants={itemVariants}
          className="p-5 sm:p-6 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
              Top Moving SKUs
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              By Volume
            </span>
          </div>

          <div className="flex-1 space-y-2.5">
            {charts.bestSellingProducts && charts.bestSellingProducts.length > 0 ? (
              charts.bestSellingProducts.map((item: any, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#0b110e] border border-emerald-950/8 dark:border-white/8 flex items-center justify-between hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-linear-to-br from-[#059669] to-[#16a34a] text-white text-xs font-mono font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">
                      {item.quantity} sold
                    </div>
                    <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">No sales recorded yet.</div>
            )}
          </div>

          {/* Low Stock Alert Box */}
          {charts.lowStockProducts && charts.lowStockProducts.length > 0 && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                  {charts.lowStockProducts.length} SKUs Below Minimum Stock!
                </span>
              </div>
              <button
                onClick={() => setActivePage('inventory')}
                className="text-xs font-extrabold text-rose-600 dark:text-rose-400 underline"
              >
                Restock
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity Sections (Recent Invoices & Customer Payments) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <motion.div
          variants={itemVariants}
          className="p-5 sm:p-6 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recent POS Invoices</span>
            </h3>
            <button
              onClick={() => setActivePage('invoices')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-950/8 dark:border-white/8 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5">Invoice #</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Amount</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                {(recent.recentInvoices || []).map((inv: any) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-emerald-500/5 transition-colors"
                  >
                    <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                      {inv.customerName}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent Customer Payments / Rasiid */}
        <motion.div
          variants={itemVariants}
          className="p-5 sm:p-6 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recent Payments (Rasiid)</span>
            </h3>
            <button
              onClick={() => setActivePage('sales-rasiid')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View Ledger
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-emerald-950/8 dark:border-white/8 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5">Receipt #</th>
                  <th className="pb-2.5">Customer</th>
                  <th className="pb-2.5">Method</th>
                  <th className="pb-2.5">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                {(recent.recentCustomerPayments || []).map((pay: any) => (
                  <tr
                    key={pay.id}
                    className="hover:bg-emerald-500/5 transition-colors"
                  >
                    <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {pay.paymentNumber}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300 font-medium">
                      {pay.customerName}
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(pay.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
