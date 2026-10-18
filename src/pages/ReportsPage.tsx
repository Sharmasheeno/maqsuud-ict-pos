import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  PieChart,
  FileSpreadsheet,
  FileText,
  Search,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportToExcel, exportReportPDF } from '../utils/exportUtils';

interface ReportsPageProps {
  initialReport?: 'sales' | 'purchases' | 'inventory' | 'cogs' | 'customers' | 'suppliers';
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ initialReport = 'sales' }) => {
  const { formatCurrency } = useApp();

  const [activeReport, setActiveReport] = useState<
    'sales' | 'purchases' | 'inventory' | 'cogs' | 'customers' | 'suppliers'
  >(initialReport);

  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const requestSequence = useRef(0);

  const loadReportData = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setLoadError('');
    try {
      const filters = { startDate, endDate };
      let res: any;
      if (activeReport === 'sales') {
        res = await api.getSalesReport(filters);
      } else if (activeReport === 'purchases') {
        res = await api.getPurchaseReport(filters);
      } else if (activeReport === 'inventory') {
        res = await api.getInventoryReport();
      } else if (activeReport === 'cogs') {
        res = await api.getCOGSReport(filters);
      } else if (activeReport === 'customers') {
        res = await api.getCustomerBalanceReport();
      } else {
        res = await api.getSupplierBalanceReport();
      }

      if (!res?.success) throw new Error(res?.message || 'Report data could not be loaded.');
      if (sequence === requestSequence.current) {
        setData(Array.isArray(res.data) ? res.data : []);
        setSummary(res.summary || {});
      }
    } catch (err: any) {
      console.error('Failed to load report data:', err);
      if (sequence === requestSequence.current) {
        setData([]);
        setSummary({});
        setLoadError(err.message || 'Report data could not be loaded.');
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [activeReport, startDate, endDate]);

  useEffect(() => {
    setActiveReport(initialReport);
  }, [initialReport]);

  useEffect(() => {
    void loadReportData();
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadReportData();
    };
    const interval = window.setInterval(refreshWhenVisible, 30_000);
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('maqsuud:data-changed', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      requestSequence.current += 1;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('maqsuud:data-changed', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadReportData]);

  // Filtered view by search term
  const filteredData = data.filter((row) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(row).some(
      (val) => val && String(val).toLowerCase().includes(s)
    );
  });

  const handleExportExcel = () => {
    exportToExcel(filteredData, `Maqsuud_${activeReport.toUpperCase()}_Report`);
  };

  const handleExportPDF = () => {
    if (activeReport === 'sales') {
      const cols = ['Invoice #', 'Date', 'Customer', 'Cashier', 'Grand Total', 'Paid', 'Balance', 'Status'];
      const rows = filteredData.map((r) => [
        r.invoiceNumber,
        new Date(r.date).toLocaleDateString(),
        r.customerName,
        r.cashierName,
        formatCurrency(r.grandTotal),
        formatCurrency(r.amountPaid),
        formatCurrency(r.balanceDue),
        r.paymentStatus,
      ]);
      exportReportPDF('Sales Report', cols, rows, `Total Sales: ${formatCurrency(summary.totalSales || 0)} across ${filteredData.length} transactions.`);
    } else if (activeReport === 'cogs') {
      const cols = ['Product Name', 'SKU', 'Units Sold', 'Unit Cost', 'COGS Total', 'Revenue', 'Gross Profit', 'Margin %'];
      const rows = filteredData.map((r) => [
        r.name,
        r.sku,
        r.quantitySold,
        formatCurrency(r.costPerUnit),
        formatCurrency(r.totalCOGS),
        formatCurrency(r.revenue),
        formatCurrency(r.grossProfit),
        `${r.grossMargin.toFixed(1)}%`,
      ]);
      exportReportPDF('Cost of Goods Sold & Profit Report', cols, rows, `Total Revenue: ${formatCurrency(summary.totalRevenue || 0)} | Total COGS: ${formatCurrency(summary.totalCOGS || 0)} | Gross Profit: ${formatCurrency(summary.totalGrossProfit || 0)} (${summary.overallMargin}% Margin)`);
    } else if (activeReport === 'inventory') {
      const cols = ['Product Name', 'SKU', 'Category', 'Stock Qty', 'Purchase Cost', 'Selling Price', 'Stock Value'];
      const rows = filteredData.map((r) => [
        r.name,
        r.sku,
        r.category,
        `${r.stock} ${r.unit}`,
        formatCurrency(r.purchaseCost),
        formatCurrency(r.sellingPrice),
        formatCurrency(r.stock * r.purchaseCost),
      ]);
      exportReportPDF('Inventory Valuation Report', cols, rows, `Total Inventory Valuation at Cost: ${formatCurrency(summary.totalValuationCost || 0)}`);
    } else if (activeReport === 'customers') {
      const cols = ['Customer ID', 'Name', 'Phone', 'Opening Bal', 'Credit Sales', 'Payments', 'Current Debt'];
      const rows = filteredData.map((r) => [
        r.customerId,
        r.name,
        r.phone,
        formatCurrency(r.openingBalance),
        formatCurrency(r.totalCredit),
        formatCurrency(r.totalPayments),
        formatCurrency(r.currentBalance),
      ]);
      exportReportPDF('Customer Balances Report', cols, rows, `Total Customer Receivables: ${formatCurrency(summary.totalReceivables || 0)}`);
    } else if (activeReport === 'suppliers') {
      const cols = ['Supplier ID', 'Name', 'Contact', 'Phone', 'Purchases', 'Payments', 'Amount We Owe'];
      const rows = filteredData.map((r) => [
        r.supplierId,
        r.name,
        r.contactPerson,
        r.phone,
        formatCurrency(r.totalPurchases),
        formatCurrency(r.totalPayments),
        formatCurrency(r.currentBalance),
      ]);
      exportReportPDF('Supplier Balances Report', cols, rows, `Total Supplier Accounts Payable: ${formatCurrency(summary.totalPayables || 0)}`);
    } else {
      const cols = ['PO #', 'Date', 'Supplier', 'Cost', 'Paid', 'Balance', 'Status'];
      const rows = filteredData.map((r) => [
        r.purchaseNumber,
        new Date(r.date).toLocaleDateString(),
        r.supplierName,
        formatCurrency(r.totalCost),
        formatCurrency(r.amountPaid),
        formatCurrency(r.balanceDue),
        r.status,
      ]);
      exportReportPDF('Purchase Report', cols, rows, `Total Purchases: ${formatCurrency(summary.totalCost || 0)}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial & Operational Reports Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-ready reports with weighted average COGS, gross margins, ledgers, and exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void loadReportData()}
            disabled={loading}
            aria-label="Refresh report data"
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-rose-500/40 flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {[
          { id: 'sales', label: 'Sales Report', icon: BarChart3 },
          { id: 'purchases', label: 'Purchase Report', icon: TrendingUp },
          { id: 'inventory', label: 'Inventory Report', icon: Boxes },
          { id: 'cogs', label: 'COGS & Profit Report', icon: PieChart },
          { id: 'customers', label: 'Customer Balances', icon: FileSpreadsheet },
          { id: 'suppliers', label: 'Supplier Balances', icon: FileSpreadsheet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveReport(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-md shadow-emerald-600/25'
                  : 'bg-white dark:bg-[#111915] text-slate-700 dark:text-slate-300 border border-emerald-950/8 dark:border-white/8 hover:border-emerald-500/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Date Range & Search Filters */}
      <div className="p-4 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Filter ${activeReport} records...`}
            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs font-mono focus:outline-hidden"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs font-mono focus:outline-hidden"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-500/25 bg-rose-500/8 px-4 py-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <span>Report refresh failed: {loadError}</span>
          <button onClick={() => void loadReportData()} className="font-extrabold underline">Retry</button>
        </div>
      )}

      {/* Report Summary Metric Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {activeReport === 'sales' && (
            <>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Sales</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  {formatCurrency(summary.totalSales || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cash Received</div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
                  {formatCurrency(summary.totalReceived || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Outstanding Credit</div>
                <div className="text-xl font-extrabold text-amber-600 font-mono mt-1">
                  {formatCurrency(summary.totalBalanceDue || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tax Collected</div>
                <div className="text-xl font-extrabold text-lime-600 dark:text-lime-400 font-mono mt-1">
                  {formatCurrency(summary.totalTax || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Refunded Invoices</div>
                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
                  {summary.refundedCount || 0}
                </div>
              </div>
            </>
          )}

          {activeReport === 'cogs' && (
            <>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  {formatCurrency(summary.totalRevenue || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Cost of Goods Sold (COGS)</div>
                <div className="text-xl font-extrabold text-rose-500 font-mono mt-1">
                  {formatCurrency(summary.totalCOGS || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Profit</div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
                  {formatCurrency(summary.totalGrossProfit || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Margin %</div>
                <div className="text-xl font-extrabold text-lime-600 dark:text-lime-400 font-mono mt-1">
                  {summary.overallMargin || 0}%
                </div>
              </div>
            </>
          )}

          {activeReport === 'inventory' && (
            <>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valuation (Cost)</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {formatCurrency(summary.totalValuationCost || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valuation (Retail)</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                  {formatCurrency(summary.totalValuationRetail || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Potential Profit</div>
                <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
                  {formatCurrency(summary.potentialProfit || 0)}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Low / Out of Stock</div>
                <div className="text-xl font-extrabold text-rose-500 font-mono mt-1">
                  {(summary.lowStockCount || 0) + (summary.outOfStockCount || 0)} Items
                </div>
              </div>
            </>
          )}

          {activeReport === 'customers' && (
            <>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Customer Accounts</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {summary.customerCount || 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/20">
                <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Receivables (Debts)</div>
                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
                  {formatCurrency(summary.totalReceivables || 0)}
                </div>
              </div>
            </>
          )}

          {activeReport === 'suppliers' && (
            <>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Supplier Accounts</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                  {summary.supplierCount || 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/20">
                <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total Accounts Payable</div>
                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
                  {formatCurrency(summary.totalPayables || 0)}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Dynamic Data Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-emerald-950/8 dark:border-white/8 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                {activeReport === 'sales' && (
                  <>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Cashier</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-4 text-right">Paid</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </>
                )}

                {activeReport === 'cogs' && (
                  <>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4 text-center">Units Sold</th>
                    <th className="py-3.5 px-4 text-right">Unit Cost</th>
                    <th className="py-3.5 px-4 text-right">COGS Total</th>
                    <th className="py-3.5 px-4 text-right">Revenue</th>
                    <th className="py-3.5 px-4 text-right">Gross Profit</th>
                    <th className="py-3.5 px-4 text-center">Margin %</th>
                  </>
                )}

                {activeReport === 'inventory' && (
                  <>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">SKU / QR</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-center">Stock</th>
                    <th className="py-3.5 px-4 text-right">Cost</th>
                    <th className="py-3.5 px-4 text-right">Price</th>
                    <th className="py-3.5 px-4 text-right">Stock Valuation</th>
                  </>
                )}

                {activeReport === 'customers' && (
                  <>
                    <th className="py-3.5 px-4">Customer ID</th>
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4 text-right">Opening Bal</th>
                    <th className="py-3.5 px-4 text-right">Total Credit</th>
                    <th className="py-3.5 px-4 text-right">Total Paid</th>
                    <th className="py-3.5 px-4 text-right">Outstanding Debt</th>
                  </>
                )}

                {activeReport === 'suppliers' && (
                  <>
                    <th className="py-3.5 px-4">Supplier ID</th>
                    <th className="py-3.5 px-4">Supplier Name</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4 text-right">Total Purchases</th>
                    <th className="py-3.5 px-4 text-right">Total Paid</th>
                    <th className="py-3.5 px-4 text-right">We Owe</th>
                  </>
                )}

                {activeReport === 'purchases' && (
                  <>
                    <th className="py-3.5 px-4">PO #</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Supplier</th>
                    <th className="py-3.5 px-4 text-right">Total Cost</th>
                    <th className="py-3.5 px-4 text-right">Amount Paid</th>
                    <th className="py-3.5 px-4 text-right">Balance Due</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Calculating report figures...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No data records found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredData.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-emerald-500/4 transition-colors">
                    {activeReport === 'sales' && (
                      <>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {row.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {row.customerName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">{row.cashierName}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(row.grandTotal)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(row.amountPaid)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {row.balanceDue > 0 ? formatCurrency(row.balanceDue) : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {row.isRefunded ? 'REFUNDED' : row.paymentStatus}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'cogs' && (
                      <>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{row.sku}</td>
                        <td className="py-3.5 px-4 text-center font-bold font-mono">{row.quantitySold}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(row.costPerUnit)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-rose-500">
                          {formatCurrency(row.totalCOGS)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.grossProfit)}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-lime-600 dark:text-lime-400">
                          {row.grossMargin.toFixed(1)}%
                        </td>
                      </>
                    )}

                    {activeReport === 'inventory' && (
                      <>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-400">{row.sku}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{row.category}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold">
                          {row.stock} {row.unit}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(row.purchaseCost)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.sellingPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(row.stock * row.purchaseCost)}
                        </td>
                      </>
                    )}

                    {activeReport === 'customers' && (
                      <>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {row.customerId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{row.phone}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          {formatCurrency(row.openingBalance)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(row.totalCredit)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(row.totalPayments)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                          {formatCurrency(row.currentBalance)}
                        </td>
                      </>
                    )}

                    {activeReport === 'suppliers' && (
                      <>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {row.supplierId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{row.contactPerson}</td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{row.phone}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatCurrency(row.totalPurchases)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(row.totalPayments)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400">
                          {formatCurrency(row.currentBalance)}
                        </td>
                      </>
                    )}

                    {activeReport === 'purchases' && (
                      <>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {row.purchaseNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {new Date(row.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {row.supplierName}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatCurrency(row.totalCost)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(row.amountPaid)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {row.balanceDue > 0 ? formatCurrency(row.balanceDue) : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
