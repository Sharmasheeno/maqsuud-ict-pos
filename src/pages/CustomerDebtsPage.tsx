import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  DollarSign,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportToExcel, exportReportPDF } from '../utils/exportUtils';

export const CustomerDebtsPage: React.FC = () => {
  const { formatCurrency, addToast } = useApp();

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState<any | null>(null);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);

  useEffect(() => {
    loadDebtData();
  }, [search]);

  const loadDebtData = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers(search);
      if (res.success) {
        setCustomers(res.customers.filter((c: any) => c.currentBalance > 0));
      }
    } catch (err) {
      console.error('Error loading debt data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (cust: any) => {
    setSelectedCustomerForPay(cust);
    setPaymentAmount(cust.currentBalance.toFixed(2));
    setPaymentMethod('Cash');
    setReference('');
    setNote('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.recordCustomerPayment({
        customerId: selectedCustomerForPay.id,
        amount,
        paymentMethod,
        reference,
        note,
      });

      if (res.success) {
        addToast(res.message, 'success');
        setSelectedCustomerForPay(null);
        loadDebtData();
      }
    } catch (err: any) {
      addToast(err.message || 'Payment submission failed', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleExportExcel = () => {
    const rows = filteredCustomers.map((c) => ({
      'Customer ID': c.customerId,
      'Customer Name': c.name,
      Phone: c.phone,
      'Opening Balance': c.openingBalance,
      'Total Credit Sales': c.totalCredit,
      'Total Payments': c.totalPayments,
      'Current Outstanding Debt': c.currentBalance,
      'Registered Date': new Date(c.createdAt).toLocaleDateString(),
    }));
    exportToExcel(rows, 'Maqsuud_Customer_Debts_Report');
  };

  const handleExportPDF = () => {
    const columns = ['Customer ID', 'Customer Name', 'Phone', 'Credit Sales', 'Paid', 'Outstanding Debt'];
    const rows = filteredCustomers.map((c) => [
      c.customerId,
      c.name,
      c.phone,
      formatCurrency(c.totalCredit),
      formatCurrency(c.totalPayments),
      formatCurrency(c.currentBalance),
    ]);
    const totalDebt = filteredCustomers.reduce((s, c) => s + c.currentBalance, 0);
    exportReportPDF(
      'Outstanding Customer Debts (Deyn)',
      columns,
      rows,
      `Total Outstanding Customer Receivables: ${formatCurrency(totalDebt)} across ${filteredCustomers.length} accounts.`
    );
  };

  const filteredCustomers = customers.filter((c) => {
    if (minAmount && c.currentBalance < parseFloat(minAmount)) return false;
    return true;
  });

  const totalOutstanding = filteredCustomers.reduce((sum, c) => sum + c.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Customer Debts &amp; Deyn Receivables
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track unpaid balances, record partial and full Rasiid payments, and maintain debt ledgers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-rose-500/40 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Crimson Debt Summary Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white shadow-lg shadow-rose-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-wider text-rose-100">
            Total Customer Receivables (Deyn Owed to Shop)
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-xs text-rose-100 mt-1 font-medium">
            {filteredCustomers.length} customer accounts currently owe money to Maqsuud ICT
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/15 p-2.5 rounded-xl backdrop-blur-xs text-xs font-bold">
          <AlertCircle className="w-4 h-4" />
          <span>All recorded Rasiid payments update customer accounts automatically</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-[#111915] p-4 rounded-2xl border border-emerald-950/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search debtor by name, phone, customer ID..."
            className="w-full pl-9 pr-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Min Debt:</span>
          <input
            type="number"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="0.00"
            className="w-24 px-2.5 py-1.5 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-mono"
          />
        </div>
      </div>

      {/* Debtors List Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8faf9] dark:bg-[#0b110e] border-b border-emerald-950/10 dark:border-white/10 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Debtor Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4 text-right">Total Credit</th>
                <th className="py-3.5 px-4 text-right">Total Payments</th>
                <th className="py-3.5 px-4 text-right">Outstanding Debt</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading customer debts...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No outstanding customer debts found! All accounts are settled.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {c.customerId}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(c.totalCredit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                      {formatCurrency(c.totalPayments)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-600 text-sm">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleOpenPaymentModal(c)}
                        className="px-3 py-1.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1 mx-auto"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </motion.button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECORD PAYMENT / RASIID MODAL */}
      <AnimatePresence>
        {selectedCustomerForPay && (
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
              className="w-full max-w-md bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-500/30"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                <div>
                  <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                    Record Customer Payment (Rasiid)
                  </h3>
                  <p className="text-xs text-slate-500">{selectedCustomerForPay.name}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomerForPay(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    Current Balance Owed:
                  </span>
                  <span className="font-extrabold font-mono text-rose-600 text-sm">
                    {formatCurrency(selectedCustomerForPay.currentBalance)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-base font-mono font-bold text-emerald-600 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(selectedCustomerForPay.currentBalance.toFixed(2))}
                      className="text-[11px] font-extrabold text-emerald-600 underline"
                    >
                      Pay Full Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount((selectedCustomerForPay.currentBalance / 2).toFixed(2))}
                      className="text-[11px] font-bold text-slate-500 underline"
                    >
                      Pay 50%
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="EVC Plus / WaafiPay (0611688269)">Hormuud EVC Plus / WaafiPay (0611688269)</option>
                    <option value="Somtel eDahab / WaafiPay (0621688269)">Somtel eDahab / WaafiPay (0621688269)</option>
                    <option value="Salaam Somali Bank (AccN: 38524624)">Salaam Somali Bank (AccN: 38524624)</option>
                    <option value="Zaad / Sahal">Zaad / Sahal Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction / Mobile Ref #
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. EVC-TX-990184"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receipt Note
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Debt installment payment..."
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerForPay(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50"
                  >
                    {submittingPayment ? 'Processing...' : 'Confirm & Save Payment'}
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
