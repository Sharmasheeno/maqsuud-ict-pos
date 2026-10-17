import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  DollarSign,
  User,
  X,
  FileDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportReportPDF } from '../utils/exportUtils';
import { Logo } from '../components/common/Logo';

export const SalesRasiidPage: React.FC = () => {
  const { formatCurrency, business, addToast } = useApp();

  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);

  // New Payment Modal
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Cash');
  const [payRef, setPayRef] = useState<string>('');
  const [payNote, setPayNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Printable Rasiid Modal
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerAccount(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const loadCustomers = async () => {
    try {
      const res = await api.getCustomers();
      if (res.success && res.customers.length > 0) {
        setCustomers(res.customers);
        setSelectedCustomerId(res.customers[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadCustomerAccount = async (id: string) => {
    try {
      const res = await api.getCustomerById(id);
      if (res.success) {
        setCustomerDetails(res);
      }
    } catch (err) {
      console.error(err);
    }
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
      const res = await api.recordCustomerPayment({
        customerId: selectedCustomerId,
        amount,
        paymentMethod: payMethod,
        reference: payRef,
        note: payNote,
      });

      if (res.success && res.payment) {
        addToast(res.message, 'success');
        setShowPayModal(false);
        setActiveReceipt(res.payment);
        setPayAmount('');
        setPayRef('');
        setPayNote('');
        loadCustomerAccount(selectedCustomerId);
      }
    } catch (err: any) {
      addToast(err.message || 'Payment submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportStatement = () => {
    if (!customerDetails) return;
    const columns = ['Date', 'Type', 'Description', 'Debit (+)', 'Credit (-)', 'Balance'];
    const rows = customerDetails.ledger.map((l: any) => [
      new Date(l.date).toLocaleDateString(),
      l.type,
      l.description,
      l.debit > 0 ? formatCurrency(l.debit) : '-',
      l.credit > 0 ? formatCurrency(l.credit) : '-',
      formatCurrency(l.newBalance),
    ]);
    exportReportPDF(
      `Statement_${customerDetails.customer.name}`,
      columns,
      rows,
      `Customer Account Statement for ${customerDetails.customer.name} (${customerDetails.customer.customerId}). Current Balance: ${formatCurrency(customerDetails.customer.currentBalance)}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sales &amp; Rasiid (Customer Ledger)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer credit sales, Rasiid payments, account ledgers, and printable official receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {customerDetails && (
            <button
              onClick={handleExportStatement}
              className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Export Statement</span>
            </button>
          )}

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowPayModal(true)}
            className="px-4 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" />
            <span>Record Payment (Rasiid)</span>
          </motion.button>
        </div>
      </div>

      {/* Customer Selection Bar */}
      <div className="p-4 bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <User className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full p-2.5 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.customerId}) - Balance: {formatCurrency(c.currentBalance)}
              </option>
            ))}
          </select>
        </div>

        {customerDetails && (
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-500">
              Phone: <span className="text-slate-900 dark:text-white font-mono">{customerDetails.customer.phone}</span>
            </span>
            <span className="text-slate-500">
              Opening Debt:{' '}
              <span className="text-slate-900 dark:text-white font-mono">
                {formatCurrency(customerDetails.customer.openingBalance)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Account Balances Summary Banner */}
      {customerDetails && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase">Opening Balance</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
              {formatCurrency(customerDetails.customer.openingBalance)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase">Total Credit Sales</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
              {formatCurrency(customerDetails.customer.totalCredit)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase">Total Payments Made</div>
            <div className="text-xl font-extrabold text-emerald-600 font-mono mt-1">
              {formatCurrency(customerDetails.customer.totalPayments)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25">
            <div className="text-[10px] font-extrabold text-rose-600 uppercase">Current Outstanding</div>
            <div className="text-xl font-extrabold text-rose-600 font-mono mt-1">
              {formatCurrency(customerDetails.customer.currentBalance)}
            </div>
          </div>
        </div>
      )}

      {/* Customer Account Ledger Table */}
      {customerDetails && (
        <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-emerald-950/8 dark:border-white/8 flex items-center justify-between">
            <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
              Ledger Transactions &amp; Rasiid History
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {customerDetails.ledger.length} entries recorded
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8faf9] dark:bg-[#0b110e] border-b border-emerald-950/10 dark:border-white/10 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Transaction / Notes</th>
                  <th className="py-3.5 px-4 text-right">Debit (+)</th>
                  <th className="py-3.5 px-4 text-right">Credit (-)</th>
                  <th className="py-3.5 px-4 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                {customerDetails.ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No ledger history for this customer.
                    </td>
                  </tr>
                ) : (
                  customerDetails.ledger.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                            entry.type === 'CREDIT_SALE'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              : entry.type === 'PAYMENT'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {entry.description}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-500 font-bold">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(entry.newBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      <AnimatePresence>
        {showPayModal && customerDetails && (
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
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Record Payment (Rasiid)
                </h3>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="mt-4 space-y-3.5">
                <div className="p-3 bg-[#f8faf9] dark:bg-[#141e19] rounded-xl flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">Customer:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {customerDetails.customer.name}
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
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-base font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="EVC Plus / WaafiPay (0611688269)">Hormuud EVC Plus / WaafiPay (0611688269)</option>
                    <option value="Somtel eDahab / WaafiPay (0621688269)">Somtel eDahab / WaafiPay (0621688269)</option>
                    <option value="Salaam Somali Bank (AccN: 38524624)">Salaam Somali Bank (AccN: 38524624)</option>
                    <option value="Zaad / Sahal">Zaad / Sahal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference # (optional)
                  </label>
                  <input
                    type="text"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    placeholder="EVC / TRX Code"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    placeholder="Account payment deposit"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50"
                  >
                    {submitting ? 'Recording...' : 'Save & Print Rasiid'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRINT RASIID RECEIPT MODAL */}
      <AnimatePresence>
        {activeReceipt && (
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
              className="w-full max-w-sm bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-500/30"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Official Rasiid Receipt
                </h3>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 px-2 space-y-3 font-mono text-xs border-dashed border-y-2 border-emerald-600/30 my-2 bg-[#fcfdfc] dark:bg-[#0a0f0d] rounded-xl">
                <div className="text-center">
                  <Logo size="sm" variant="full" className="justify-center mb-1" />
                  <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                    {business?.name || 'Maqsuud ICT — Smart POS & Enterprise Management'}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    OFFICIAL PAYMENT RECEIPT / RASIID
                  </div>
                </div>

                <div className="space-y-1 text-slate-600 dark:text-slate-300 pt-2 border-t border-dashed border-slate-300 dark:border-white/15">
                  <div className="flex justify-between">
                    <span>Receipt #:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeReceipt.paymentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{activeReceipt.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(activeReceipt.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-bold text-emerald-600">{activeReceipt.paymentMethod}</span>
                  </div>
                  {activeReceipt.reference && (
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span>{activeReceipt.reference}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-white/15 space-y-1 text-right">
                  <div className="flex justify-between text-slate-500">
                    <span>Previous Balance:</span>
                    <span>{formatCurrency(activeReceipt.previousBalance)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-emerald-600">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(activeReceipt.amount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/15">
                    <span>Remaining Balance:</span>
                    <span>{formatCurrency(activeReceipt.newBalance)}</span>
                  </div>
                </div>

                <div className="text-center text-[10px] text-slate-400 pt-2">
                  Mahadsanid! Waad ku mahadsantahay bixinta lacagtaada.
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Rasiid</span>
                </button>
                <button
                  onClick={() => setActiveReceipt(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
