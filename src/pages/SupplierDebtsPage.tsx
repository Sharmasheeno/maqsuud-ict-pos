import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileSpreadsheet,
  FileText,
  X,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportToExcel, exportReportPDF } from '../utils/exportUtils';

export const SupplierDebtsPage: React.FC = () => {
  const { formatCurrency, addToast } = useApp();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<any | null>(null);

  // Payment form
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Bank Transfer');
  const [payRef, setPayRef] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadDebts();
  }, [search]);

  const loadDebts = async () => {
    setLoading(true);
    try {
      const res = await api.getSuppliers(search);
      if (res.success) {
        setSuppliers(res.suppliers.filter((s: any) => s.currentBalance > 0));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (supplier: any) => {
    setSelectedSupplierForPay(supplier);
    setPayAmount(supplier.currentBalance.toFixed(2));
    setPayMethod('Bank Transfer');
    setPayRef('');
    setPayNote('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      addToast('Please enter a valid payment amount.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.recordSupplierPayment({
        supplierId: selectedSupplierForPay.id,
        amount,
        paymentMethod: payMethod,
        reference: payRef,
        note: payNote,
      });

      if (res.success) {
        addToast(res.message, 'success');
        setSelectedSupplierForPay(null);
        loadDebts();
      }
    } catch (err: any) {
      addToast(err.message || 'Payment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const rows = suppliers.map((s) => ({
      'Supplier ID': s.supplierId,
      'Supplier Name': s.name,
      'Contact Person': s.contactPerson,
      Phone: s.phone,
      'Total Invoiced': s.totalPurchases,
      'Total Paid': s.totalPayments,
      'Outstanding Balance (We Owe)': s.currentBalance,
    }));
    exportToExcel(rows, 'Maqsuud_Supplier_Debts_Report');
  };

  const handleExportPDF = () => {
    const columns = ['Supplier ID', 'Supplier Name', 'Contact', 'Phone', 'Purchases', 'Paid', 'We Owe'];
    const rows = suppliers.map((s) => [
      s.supplierId,
      s.name,
      s.contactPerson,
      s.phone,
      formatCurrency(s.totalPurchases),
      formatCurrency(s.totalPayments),
      formatCurrency(s.currentBalance),
    ]);
    const totalDebt = suppliers.reduce((sum, s) => sum + s.currentBalance, 0);
    exportReportPDF(
      'Outstanding Supplier Debts',
      columns,
      rows,
      `Total Shop Accounts Payable to Suppliers: ${formatCurrency(totalDebt)} across ${suppliers.length} vendors.`
    );
  };

  const totalPayables = suppliers.reduce((s, item) => s + item.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Supplier Debts & Accounts Payable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track payments owed to vendors and record bank wire or cash disbursements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-rose-500/40 flex items-center gap-1.5 shadow-xs transition-all"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white shadow-xl shadow-rose-600/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-rose-100">
            Total Outstanding Supplier Payables
          </div>
          <div className="text-3xl font-extrabold tracking-tight mt-1 font-mono">
            {formatCurrency(totalPayables)}
          </div>
          <div className="text-xs text-rose-100 mt-1 font-medium">
            Amount owed to {suppliers.length} distributors and merchandise suppliers
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 hidden sm:flex items-center gap-2">
          <Truck className="w-6 h-6 text-white" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Vendor Ledger</span>
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-emerald-950/8 dark:border-white/8 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Supplier ID</th>
                <th className="py-3.5 px-4">Supplier Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-right">Total Purchases</th>
                <th className="py-3.5 px-4 text-right">Total Paid</th>
                <th className="py-3.5 px-4 text-right">Amount We Owe</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading debts...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    No outstanding supplier debts! All vendor accounts are fully paid.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-emerald-500/4 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {s.supplierId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {s.contactPerson}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {s.phone}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(s.totalPurchases)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(s.totalPayments)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                      {formatCurrency(s.currentBalance)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <motion.button
                        whileHover={{ y: -1, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleOpenPayModal(s)}
                        className="px-3.5 py-1.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-1 mx-auto"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Disburse Payment</span>
                      </motion.button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISBURSE PAYMENT MODAL */}
      <AnimatePresence>
        {selectedSupplierForPay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="w-full max-w-md bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-950/10 dark:border-white/10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/8 dark:border-white/8">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Disburse Supplier Payment
                  </h3>
                  <p className="text-xs text-slate-500">{selectedSupplierForPay.name}</p>
                </div>
                <button
                  onClick={() => setSelectedSupplierForPay(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5">
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-700 dark:text-rose-300">
                    Total Debt Owed:
                  </span>
                  <span className="font-extrabold font-mono text-rose-600 dark:text-rose-400 text-sm">
                    {formatCurrency(selectedSupplierForPay.currentBalance)}
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
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Disbursement Channel
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    <option value="Salaam Somali Bank (AccN: 38524624)">Salaam Somali Bank (AccN: 38524624)</option>
                    <option value="EVC Plus / WaafiPay (0611688269)">Hormuud EVC Plus / WaafiPay (0611688269)</option>
                    <option value="Somtel eDahab / WaafiPay (0621688269)">Somtel eDahab / WaafiPay (0621688269)</option>
                    <option value="Cash Voucher">Cash Office Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bank Reference / Check #
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="e.g. PRM-WT-88219"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Voucher Note
                  </label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Invoice settlement..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSupplierForPay(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Disburse & Update Ledger'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
