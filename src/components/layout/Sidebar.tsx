import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  QrCode,
  ShoppingCart,
  Receipt,
  FileText,
  Users,
  CreditCard,
  Landmark,
  Truck,
  ArrowDownCircle,
  Package,
  Layers,
  Boxes,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  ShieldCheck,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  LogOut,
  X,
  PhoneCall,
  Terminal,
  Crown,
  Briefcase,
  Calculator,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (c: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isCollapsed,
}) => {
  const {
    activePage,
    setActivePage,
    t,
    user,
    logout,
    business,
    isSubscriptionExpired,
    subscriptionCountdown,
  } = useApp();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sales: true,
    customers: true,
    supply: true,
    intelligence: true,
  });

  const [reportsOpen, setReportsOpen] = useState(
    activePage.startsWith('reports-')
  );

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navGroups = [
    {
      key: 'sales',
      title: 'Sales & Terminal',
      items: [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'pos', label: t('pos'), icon: ShoppingCart, badge: 'LIVE POS', badgeColor: 'crimson' },
        { id: 'qr-scanner', label: t('qrScanner'), icon: QrCode },
        { id: 'pos-invoices', label: t('posInvoices'), icon: Receipt },
        { id: 'invoices', label: t('invoices'), icon: FileText },
      ],
    },
    {
      key: 'customers',
      title: 'Customers & Rasiid',
      items: [
        { id: 'customers', label: t('customers'), icon: Users },
        { id: 'customer-debts', label: t('customerDebts'), icon: CreditCard, badge: 'DEYN', badgeColor: 'crimson' },
        { id: 'sales-rasiid', label: t('salesRasiid'), icon: Landmark },
      ],
    },
    {
      key: 'supply',
      title: 'Supply Chain & Stock',
      items: [
        { id: 'products', label: t('products'), icon: Boxes },
        { id: 'categories', label: t('categories'), icon: Layers },
        { id: 'inventory', label: t('inventory'), icon: Package },
        { id: 'purchases', label: t('purchases'), icon: Truck },
        { id: 'suppliers', label: t('suppliers'), icon: Truck },
        { id: 'supplier-debts', label: t('supplierDebts'), icon: ArrowDownCircle },
      ],
    },
  ];

  const reportItems = [
    { id: 'reports-sales', label: t('salesReport'), icon: BarChart3 },
    { id: 'reports-purchases', label: t('purchaseReport'), icon: TrendingUp },
    { id: 'reports-inventory', label: t('inventoryReport'), icon: Boxes },
    { id: 'reports-cogs', label: t('cogsReport'), icon: PieChart },
    { id: 'reports-customers', label: t('customerBalanceReport'), icon: FileSpreadsheet },
    { id: 'reports-suppliers', label: t('supplierBalanceReport'), icon: FileSpreadsheet },
  ];

  const adminItems = [
    { id: 'users-roles', label: t('usersRoles'), icon: ShieldCheck, requiredRole: 'admin' },
    { id: 'plans', label: t('choosePlan'), icon: Sparkles, badge: 'PRO' },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const handleNav = (id: string) => {
    setActivePage(id);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const isReportActive = activePage.startsWith('reports-');

  const roleMeta: Record<
    string,
    { label: string; scope: string; badgeClass: string; icon: React.FC<{ className?: string }> }
  > = {
    admin: {
      label: 'System Administrator',
      scope: 'Full Enterprise & Ledger Control',
      badgeClass: 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white',
      icon: Crown,
    },
    manager: {
      label: 'Store Manager',
      scope: 'Stock, PO & Operations Access',
      badgeClass: 'bg-linear-to-r from-emerald-600 to-teal-600 text-white',
      icon: Briefcase,
    },
    cashier: {
      label: 'POS Terminal Cashier',
      scope: 'High-Speed Checkout & Rasiid',
      badgeClass: 'bg-linear-to-r from-[#16a34a] to-[#65a30d] text-white',
      icon: Terminal,
    },
    accountant: {
      label: 'Senior Accountant',
      scope: 'Receivables, COGS & Audits',
      badgeClass: 'bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white',
      icon: Calculator,
    },
  };

  const currentRole = roleMeta[(user?.role || 'admin').toLowerCase()] || roleMeta.admin;
  const RoleIcon = currentRole.icon;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white/95 dark:bg-[#0d1310]/95 backdrop-blur-xl border-r border-emerald-950/10 dark:border-white/8 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Top Accent Dual-Tone Strip */}
        <div className="h-1 w-full bg-linear-to-r from-[#059669] via-[#84cc16] to-[#e11d48]" />

        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-4 border-b border-emerald-950/8 dark:border-white/8">
          <button
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2 overflow-hidden text-left focus:outline-hidden"
          >
            <Logo size={isCollapsed ? 'sm' : 'md'} variant={isCollapsed ? 'icon' : 'full'} />
          </button>

          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-emerald-50 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Plan & 7-Day (24h × 7) Countdown Badge */}
        {!isCollapsed && (
          <div
            className={`px-3.5 py-2.5 mx-3 mt-3 rounded-2xl border flex items-center justify-between gap-2 ${
              isSubscriptionExpired
                ? 'bg-rose-500/12 border-rose-500/40'
                : 'bg-linear-to-r from-emerald-500/10 via-green-500/8 to-rose-500/10 dark:from-emerald-950/60 dark:to-[#18241e] border-emerald-500/20 dark:border-emerald-500/25'
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-ping ${
                    isSubscriptionExpired ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
                <span
                  className={`text-[10px] uppercase font-extrabold tracking-wider truncate ${
                    isSubscriptionExpired
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {isSubscriptionExpired
                    ? 'AUTO-LOCKED • EXPIRED'
                    : business?.subscriptionPlan || '7-Day Free Trial'}
                </span>
              </div>
              <div className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                {isSubscriptionExpired
                  ? 'Upgrade ($30/mo • $360/yr)'
                  : `${subscriptionCountdown.days}d ${subscriptionCountdown.hours}h ${subscriptionCountdown.minutes}m (${subscriptionCountdown.totalHours}h left)`}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleNav('plans')}
              className={`text-[11px] font-bold px-2.5 py-1.5 text-white rounded-xl shadow-sm transition-all flex-shrink-0 ${
                isSubscriptionExpired
                  ? 'bg-linear-to-r from-[#e11d48] to-[#dc2626] shadow-rose-600/25'
                  : 'bg-linear-to-r from-[#059669] to-[#16a34a] shadow-emerald-600/25 hover:brightness-110'
              }`}
            >
              {isSubscriptionExpired ? 'Unlock' : 'Tier'}
            </motion.button>
          </div>
        )}

        {/* Navigation Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
          {navGroups.map((group) => {
            const isOpen = openGroups[group.key] !== false;
            return (
              <div key={group.key} className="space-y-1">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase px-2.5 py-1 tracking-[0.14em] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>{group.title}</span>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                    )}
                  </button>
                )}

                <AnimatePresence initial={false}>
                  {(isOpen || isCollapsed) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1 overflow-hidden"
                    >
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNav(item.id)}
                            title={isCollapsed ? item.label : undefined}
                            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors text-left overflow-hidden ${
                              isActive
                                ? 'text-white font-bold shadow-md shadow-emerald-600/25'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-500/8 dark:hover:bg-white/5 hover:text-emerald-700 dark:hover:text-emerald-300'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeNavIndicator"
                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                className="absolute inset-0 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] rounded-xl z-0"
                              >
                                {/* Left Crimson Accent Bar */}
                                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#e11d48]" />
                              </motion.div>
                            )}

                            <Icon
                              className={`relative z-10 w-4.5 h-4.5 flex-shrink-0 ${
                                isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="relative z-10 truncate flex-1">{item.label}</span>
                            )}
                            {!isCollapsed && item.badge && (
                              <span
                                className={`relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeColor === 'crimson'
                                    ? 'bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white shadow-xs'
                                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Intelligence & Admin Section */}
          <div className="pt-1 border-t border-emerald-950/8 dark:border-white/8 space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase px-2.5 py-1 tracking-[0.14em]">
                Intelligence &amp; Admin
              </div>
            )}

            {/* Reports Collapsible Accordion */}
            <div>
              <button
                onClick={() => setReportsOpen(!reportsOpen)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-left transition-all ${
                  isReportActive
                    ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-500/8 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  {!isCollapsed && <span>{t('reports')}</span>}
                </div>
                {!isCollapsed &&
                  (reportsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  ))}
              </button>

              <AnimatePresence initial={false}>
                {reportsOpen && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-1 ml-4 pl-3 border-l-2 border-emerald-500/30 space-y-1 overflow-hidden"
                  >
                    {reportItems.map((r) => {
                      const Icon = r.icon;
                      const isActive = activePage === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleNav(r.id)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                            isActive
                              ? 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white font-bold shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-500/10 dark:hover:bg-white/5'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{r.label}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {adminItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNav(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors text-left overflow-hidden ${
                    isActive
                      ? 'text-white font-bold shadow-md shadow-emerald-600/25'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-emerald-500/8 dark:hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] rounded-xl z-0"
                    >
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#e11d48]" />
                    </motion.div>
                  )}
                  <Icon
                    className={`relative z-10 w-4.5 h-4.5 flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  {!isCollapsed && <span className="relative z-10 truncate flex-1">{item.label}</span>}
                  {!isCollapsed && item.badge && (
                    <span className="relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white">
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Upgraded Role Badge & Operator Footer */}
        <div className="p-3 border-t border-emerald-950/10 dark:border-white/8 bg-[#f8faf9]/80 dark:bg-[#080d0b]">
          {!isCollapsed && (
            <div className="mb-2.5 p-2.5 rounded-xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider shadow-2xs ${currentRole.badgeClass}`}
                >
                  <RoleIcon className="w-3 h-3" />
                  {user?.role || 'Admin'}
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  ● ACTIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate font-medium">
                {currentRole.scope}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#059669] via-[#16a34a] to-[#65a30d] flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-sm shadow-emerald-600/30">
                {user?.name?.charAt(0) || 'M'}
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Maqsuud Director'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    {user?.email || 'admin@maqsuudict.com'}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              title={t('logout')}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {!isCollapsed && (
            <a
              href="https://wa.me/252611688269"
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold transition-colors font-mono"
            >
              <PhoneCall className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">0611688269 • 0621688269 • Acc: 38524624</span>
            </a>
          )}
        </div>
      </aside>
    </>
  );
};
