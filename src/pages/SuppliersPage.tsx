import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportToExcel } from '../utils/exportUtils';

export const SuppliersPage: React.FC = () => {
  const { formatCurrency, addToast, setActivePage } = useApp();

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: '0',
    notes: '',
  });

  useEffect(() => {
    loadSuppliers();
  }, [search]);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.getSuppliers(search);
      if (res.success) {
        setSuppliers(res.suppliers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSupplier(formData);
      if (res.success) {
        addToast('Supplier added successfully', 'success');
        setShowAddModal(false);
        setFormData({ name: '', contactPerson: '', phone: '', email: '', address: '', openingBalance: '0', notes: '' });
        loadSuppliers();
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to save supplier', 'error');
    }
  };

  const handleExportExcel = () => {
    const rows = suppliers.map((s) => ({
      'Supplier ID': s.supplierId,
      'Company Name': s.name,
      'Contact Person': s.contactPerson,
      Phone: s.phone,
      Email: s.email || '',
      Address: s.address || '',
      'Total Purchases': s.totalPurchases,
      'Total Paid': s.totalPayments,
      'Current Balance (We Owe)': s.currentBalance,
    }));
    exportToExcel(rows, 'Maqsuud_Suppliers_Directory');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Suppliers &amp; Wholesale Vendors
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage wholesale distributors, procurement history, and accounts payable
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

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-[#111915] p-4 rounded-2xl border border-emerald-950/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, contact, phone..."
            className="w-full pl-9 pr-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div>
            Total Suppliers:{' '}
            <span className="font-mono font-extrabold text-emerald-600">{suppliers.length}</span>
          </div>
          <div>
            Total Payables:{' '}
            <span className="font-mono font-extrabold text-rose-600">
              {formatCurrency(suppliers.reduce((s, item) => s + item.currentBalance, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8faf9] dark:bg-[#0b110e] border-b border-emerald-950/10 dark:border-white/10 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Supplier ID</th>
                <th className="py-3.5 px-4">Company Name</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4 text-right">Total Purchases</th>
                <th className="py-3.5 px-4 text-right">Total Paid</th>
                <th className="py-3.5 px-4 text-right">Balance (We Owe)</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No suppliers found matching query.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-emerald-500/5 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {s.supplierId}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {s.contactPerson || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {s.phone}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(s.totalPurchases)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                      {formatCurrency(s.totalPayments)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-md ${
                          s.currentBalance > 0
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatCurrency(s.currentBalance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setActivePage('supplier-debts')}
                        className="px-2.5 py-1 bg-[#f1f5f3] dark:bg-white/10 hover:bg-emerald-500/15 text-slate-700 dark:text-slate-300 hover:text-emerald-600 rounded-lg text-xs font-bold"
                      >
                        Manage Debts
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      <AnimatePresence>
        {showAddModal && (
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
                <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
                  Add New Supplier
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSupplier} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Horn Electronics Wholesale"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="e.g. Khadar Guled"
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+252 61..."
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sales@supplier.so"
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Opening Debt Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Bakaara Tech Quarter, Mogadishu"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25"
                  >
                    Save Supplier
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
