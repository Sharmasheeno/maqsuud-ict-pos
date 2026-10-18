import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  UserPlus,
  FileDown,
  FileSpreadsheet,
  Eye,
  Edit,
  X,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportCustomerProfilePDF, exportToExcel } from '../utils/exportUtils';

export const CustomersPage: React.FC = () => {
  const { formatCurrency, business, addToast, user } = useApp();
  const canDeleteCustomers = String(user?.role || '').trim().toLowerCase() === 'admin';

  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [viewCustomerDetails, setViewCustomerDetails] = useState<any | null>(null);
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: '0',
    notes: '',
  });

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers(search);
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCustomer) {
        const res = await api.updateCustomer(selectedCustomer.id, formData);
        if (res.success) {
          addToast('Customer details updated successfully', 'success');
        }
      } else {
        const res = await api.createCustomer(formData);
        if (res.success) {
          addToast('Customer registered successfully', 'success');
          if (res.customer) {
            exportCustomerProfilePDF(res.customer, business || {});
          }
        }
      }
      setShowAddModal(false);
      setSelectedCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '', openingBalance: '0', notes: '' });
      loadCustomers();
    } catch (err: any) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleOpenEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      openingBalance: String(customer.openingBalance || 0),
      notes: customer.notes || '',
    });
    setShowAddModal(true);
  };

  const handleViewCustomer = async (id: string) => {
    try {
      const res = await api.getCustomerById(id);
      if (res.success) {
        setViewCustomerDetails(res);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to load customer profile', 'error');
    }
  };

  const handleDeleteCustomer = async (customer: any) => {
    const confirmed = window.confirm(
      `Permanently delete ${customer.name} (${customer.customerId}) and remove their linked invoices, payments, and ledger entries? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingCustomerId(customer.id);
    try {
      const res = await api.deleteCustomer(customer.id);
      if (!res.success) {
        throw new Error(res.message || 'Failed to delete customer');
      }
      setCustomers((current) => current.filter((item) => item.id !== customer.id));
      if (viewCustomerDetails?.customer?.id === customer.id) {
        setViewCustomerDetails(null);
      }
      addToast(res.message || 'Customer and linked records deleted', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setDeletingCustomerId(null);
    }
  };

  const handleExportExcel = () => {
    const rows = customers.map((c) => ({
      'Customer ID': c.customerId,
      'Full Name': c.name,
      Phone: c.phone,
      Email: c.email || '',
      Address: c.address || '',
      'Opening Balance': c.openingBalance,
      'Total Credit Sales': c.totalCredit,
      'Total Payments': c.totalPayments,
      'Current Balance': c.currentBalance,
      'Registered Date': new Date(c.createdAt).toLocaleDateString(),
    }));
    exportToExcel(rows, 'Maqsuud_Customers_List');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Customer Directory &amp; Credit Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage customer credit accounts, opening balances, statements, and contact profiles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Export Excel</span>
          </button>

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedCustomer(null);
              setFormData({ name: '', phone: '', email: '', address: '', openingBalance: '0', notes: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </motion.button>
        </div>
      </div>

      {/* Search Bar & Stats */}
      <div className="bg-white dark:bg-[#111915] p-4 rounded-2xl border border-emerald-950/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or customer ID..."
            className="w-full pl-9 pr-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div>
            Total Customers:{' '}
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              {customers.length}
            </span>
          </div>
          <div>
            With Deyn (Debts):{' '}
            <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400">
              {customers.filter((c) => c.currentBalance > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/10 dark:border-white/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f8faf9] dark:bg-[#0b110e] border-b border-emerald-950/10 dark:border-white/10 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4 text-right">Opening Bal</th>
                <th className="py-3.5 px-4 text-right">Total Credit</th>
                <th className="py-3.5 px-4 text-right">Total Paid</th>
                <th className="py-3.5 px-4 text-right">Current Balance</th>
                <th className="sticky right-0 z-20 min-w-[160px] bg-[#f8faf9] py-3.5 px-4 text-center dark:bg-[#0b110e] shadow-[-8px_0_10px_-10px_rgba(0,0,0,0.4)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const owes = c.currentBalance > 0;
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-emerald-500/5 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {c.customerId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {c.phone}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(c.openingBalance)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(c.totalCredit)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                        {formatCurrency(c.totalPayments)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-extrabold">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            owes
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {formatCurrency(c.currentBalance)}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 min-w-[160px] bg-white py-3 px-4 dark:bg-[#111915] shadow-[-8px_0_10px_-10px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleViewCustomer(c.id)}
                            title="View Profile & Ledger"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => exportCustomerProfilePDF(c, business || {})}
                            title="Download Customer PDF Profile"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Customer"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {canDeleteCustomers && (
                            <button
                              onClick={() => handleDeleteCustomer(c)}
                              disabled={deletingCustomerId === c.id}
                              title="Delete customer and linked history"
                              aria-label={`Delete ${c.name} and linked records`}
                              className="p-2 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-500/10 disabled:opacity-50 disabled:cursor-wait shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
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
                  {selectedCustomer ? 'Edit Customer Account' : 'Register New Customer'}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Hassan Omar Ali"
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="customer@domain.com"
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Address / District
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Bakaara Market, Hodan"
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
                      disabled={!!selectedCustomer}
                      value={formData.openingBalance}
                      onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Credit Limit
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Wholesale account terms, credit limit..."
                    className="w-full px-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs"
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
                    {selectedCustomer ? 'Update Profile' : 'Save & Generate PDF'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW CUSTOMER PROFILE & LEDGER MODAL */}
      <AnimatePresence>
        {viewCustomerDetails && (
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
              className="w-full max-w-2xl bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-500/30 max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-display font-extrabold text-slate-900 dark:text-white">
                    {viewCustomerDetails.customer.name} ({viewCustomerDetails.customer.customerId})
                  </h3>
                </div>
                <button
                  onClick={() => setViewCustomerDetails(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Phone</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {viewCustomerDetails.customer.phone}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Opening Debt</div>
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {formatCurrency(viewCustomerDetails.customer.openingBalance)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141e19]">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Total Payments</div>
                    <div className="font-mono font-bold text-emerald-600 mt-0.5">
                      {formatCurrency(viewCustomerDetails.customer.totalPayments)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                    <div className="text-[10px] text-rose-600 font-bold uppercase">Current Balance</div>
                    <div className="font-mono font-extrabold text-rose-600 mt-0.5">
                      {formatCurrency(viewCustomerDetails.customer.currentBalance)}
                    </div>
                  </div>
                </div>

                {/* Ledger Entries */}
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
                    Customer Statement &amp; Ledger History
                  </h4>
                  <div className="border border-emerald-950/10 dark:border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-[#f8faf9] dark:bg-[#0b110e] text-[10px] text-slate-400 uppercase font-extrabold">
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Type</th>
                          <th className="p-2.5">Description</th>
                          <th className="p-2.5 text-right">Debit (+)</th>
                          <th className="p-2.5 text-right">Credit (-)</th>
                          <th className="p-2.5 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                        {viewCustomerDetails.ledger.map((l: any) => (
                          <tr key={l.id}>
                            <td className="p-2.5 text-slate-500 font-mono">
                              {new Date(l.date).toLocaleDateString()}
                            </td>
                            <td className="p-2.5 font-bold text-emerald-600">{l.type}</td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300">{l.description}</td>
                            <td className="p-2.5 text-right font-mono text-rose-500">
                              {l.debit > 0 ? formatCurrency(l.debit) : '-'}
                            </td>
                            <td className="p-2.5 text-right font-mono text-emerald-600">
                              {l.credit > 0 ? formatCurrency(l.credit) : '-'}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatCurrency(l.newBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-950/10 dark:border-white/10 flex justify-between gap-2">
                <button
                  onClick={() =>
                    exportCustomerProfilePDF(
                      viewCustomerDetails.customer,
                      business || {},
                      viewCustomerDetails.ledger
                    )
                  }
                  className="px-4 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export Statement PDF</span>
                </button>

                <button
                  onClick={() => setViewCustomerDetails(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
