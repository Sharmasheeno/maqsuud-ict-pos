import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { QRScannerPage } from './pages/QRScannerPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDebtsPage } from './pages/CustomerDebtsPage';
import { SalesRasiidPage } from './pages/SalesRasiidPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SupplierDebtsPage } from './pages/SupplierDebtsPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { InventoryPage } from './pages/InventoryPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersRolesPage } from './pages/UsersRolesPage';
import { ChoosePlanPage } from './pages/ChoosePlanPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { user, activePage, isSubscriptionExpired } = useApp();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If user is not authenticated, render Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Dynamic Route Rendering (Enforces Auto-Lockout if 7-Day Trial / Subscription Expired)
  const renderActivePage = () => {
    if (isSubscriptionExpired) {
      return <ChoosePlanPage />;
    }
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'qr-scanner':
        return <QRScannerPage />;
      case 'pos':
        return <POSPage />;
      case 'pos-invoices':
        return <InvoicesPage posOnly={true} />;
      case 'invoices':
        return <InvoicesPage posOnly={false} />;
      case 'customers':
        return <CustomersPage />;
      case 'customer-debts':
        return <CustomerDebtsPage />;
      case 'sales-rasiid':
        return <SalesRasiidPage />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'supplier-debts':
        return <SupplierDebtsPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'products':
        return <ProductsPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'reports-sales':
        return <ReportsPage initialReport="sales" />;
      case 'reports-purchases':
        return <ReportsPage initialReport="purchases" />;
      case 'reports-inventory':
        return <ReportsPage initialReport="inventory" />;
      case 'reports-cogs':
        return <ReportsPage initialReport="cogs" />;
      case 'reports-customers':
        return <ReportsPage initialReport="customers" />;
      case 'reports-suppliers':
        return <ReportsPage initialReport="suppliers" />;
      case 'users-roles':
        return <UsersRolesPage />;
      case 'plans':
        return <ChoosePlanPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] dark:bg-[#070b09] text-slate-900 dark:text-slate-100 font-sans transition-colors relative overflow-x-hidden">
      {/* Subtle Ambient Background Accents */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-emerald-500/5 dark:bg-emerald-500/8 blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-80 h-80 rounded-full bg-rose-500/4 dark:bg-rose-500/6 blur-3xl" />
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main App Layout */}
      <div
        className={`relative z-10 flex flex-col min-h-screen transition-all duration-300 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        <Topbar
          onToggleMobile={() => setIsMobileOpen(!isMobileOpen)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 12, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
