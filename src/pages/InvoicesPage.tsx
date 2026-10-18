import React, { useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Printer,
  FileDown,
  RotateCcw,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportInvoicePDF, exportToExcel } from '../utils/exportUtils';

interface InvoicesPageProps {
  posOnly?: boolean;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ posOnly = false }) => {
  const { formatCurrency, business, addToast } = useApp();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);

  // Refund modal
  const [refundInvoiceTarget, setRefundInvoiceTarget] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [submittingRefund, setSubmittingRefund] = useState<boolean>(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoiceCustomerId, setInvoiceCustomerId] = useState('');
  const [invoiceProductId, setInvoiceProductId] = useState('');
  const [invoiceQty, setInvoiceQty] = useState(1);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoicePaid, setInvoicePaid] = useState('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, [search, statusFilter]);

  useEffect(() => {
    if (posOnly) return;
    Promise.all([api.getProducts(), api.getCustomers()]).then(([productRes, customerRes]) => {
      if (productRes.success) setProducts(productRes.products || []);
      if (customerRes.success) setCustomers(customerRes.customers || []);
    }).catch((err) => console.error('Invoice form data load failed:', err));
  }, [posOnly]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoices({
        search,
        status: statusFilter,
      });
      if (res.success) {
        let list = res.invoices;
        if (posOnly) {
          list = list.filter((i: any) => i.isPOS);
        } else {
          list = list.filter((i: any) => !i.isPOS);
        }
        setInvoices(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openInvoiceDetails = async (invoice: any) => {
    try {
      if (invoice.items?.length) {
        setViewInvoice(invoice);
        return;
      }
      const result = await api.getInvoiceById(invoice.id);
      if (result.success) setViewInvoice(result.invoice);
      else addToast('Could not load invoice details', 'error');
    } catch (err: any) {
      addToast(err.message || 'Could not load invoice details', 'error');
    }
  };

  const downloadInvoicePDF = async (invoice: any) => {
    try {
      const result = invoice.items?.length ? { success: true, invoice } : await api.getInvoiceById(invoice.id);
      if (!result.success || !result.invoice?.items?.length) {
        addToast('Invoice line items are unavailable; PDF was not created.', 'error');
        return;
      }
      exportInvoicePDF(result.invoice, business || {});
    } catch (err: any) {
      addToast(err.message || 'Could not load invoice for PDF export', 'error');
    }
  };

  const addInvoiceItem = () => {
    const product = products.find((item) => item.id === invoiceProductId);
    if (!product) return;
    const qty = Math.max(1, Math.floor(invoiceQty));
    const existing = invoiceItems.find((item) => item.productId === product.id);
    const nextQty = (existing?.quantity || 0) + qty;
    if (nextQty > Number(product.stock)) {
      addToast(`Only ${product.stock} ${product.unit || 'units'} of ${product.name} are in stock.`, 'error');
      return;
    }
    setInvoiceItems((items) => existing
      ? items.map((item) => item.productId === product.id ? { ...item, quantity: nextQty } : item)
      : [...items, { productId: product.id, name: product.name, sku: product.sku, unitPrice: Number(product.sellingPrice), stock: Number(product.stock), quantity: qty, discount: 0 }]);
    setInvoiceQty(1);
  };

  const createSalesInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    const customer = customers.find((item) => item.id === invoiceCustomerId);
    if (!customer || invoiceItems.length === 0) {
      addToast('Choose a customer and add at least one product.', 'error');
      return;
    }
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const paid = Math.max(0, Number(invoicePaid) || 0);
    if (paid > subtotal) {
      addToast('Amount paid cannot exceed the invoice total.', 'error');
      return;
    }
    setCreatingInvoice(true);
    try {
      const result = await api.checkoutPOS({
        invoiceMode: 'generated', items: invoiceItems, customerId: customer.id,
        customerName: customer.name, customerPhone: customer.phone,
        saleType: paid >= subtotal ? 'CASH' : 'CREDIT', paymentMethod: paid >= subtotal ? 'Cash' : 'Credit (Deyn)',
        cashReceived: paid, discountTotal: 0, taxEnabled: false,
        notes: 'Generated sales invoice',
      });
      if (!result.success || !result.invoice) throw new Error(result.message || 'Invoice creation failed');
      addToast(`Sales invoice ${result.invoice.invoiceNumber} created. Stock and customer balance were updated.`, 'success');
      setShowCreateInvoice(false);
      setInvoiceCustomerId(''); setInvoiceItems([]); setInvoicePaid('');
      await loadInvoices();
    } catch (err: any) {
      addToast(err.message || 'Could not create sales invoice', 'error');
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundInvoiceTarget) return;

    setSubmittingRefund(true);
    try {
      const res = await api.refundInvoice(refundInvoiceTarget.id, refundReason);
      if (res.success) {
        addToast(res.message, 'success');
        setRefundInvoiceTarget(null);
        setRefundReason('');
        loadInvoices();
      }
    } catch (err: any) {
      addToast(err.message || 'Refund failed', 'error');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleExportExcel = () => {
    const rows = invoices.map((i) => ({
      'Invoice #': i.invoiceNumber,
      Date: new Date(i.date).toLocaleDateString(),
      Customer: i.customerName,
      Cashier: i.cashierName,
      Subtotal: i.subtotal,
      Discount: i.discountTotal,
      Tax: i.taxTotal,
      'Grand Total': i.grandTotal,
      'Amount Paid': i.amountPaid,
      'Balance Due': i.balanceDue,
      'Payment Status': i.paymentStatus,
      'Payment Method': i.paymentMethod,
      'Sale Type': i.saleType,
      'Is Refunded': i.isRefunded ? 'YES' : 'NO',
    }));
    exportToExcel(rows, posOnly ? 'Maqsuud_POS_Invoices_Report' : 'Maqsuud_Sales_Invoices_Report');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {posOnly ? 'POS Checkout Invoices' : 'Generated Sales Invoices'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {posOnly
              ? 'Receipts created automatically by quick POS checkout.'
              : 'Prepare a customer invoice with itemized products. Submitting records the sale, reduces stock, and updates any customer balance.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start">
        {!posOnly && <button type="button" onClick={() => setShowCreateInvoice(true)} className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <Plus className="w-4 h-4" /> Create Sales Invoice
        </button>}
        <button
          onClick={handleExportExcel}
          className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5 self-start shadow-xs transition-all"
        >
          <FileDown className="w-4 h-4 text-emerald-600" />
          <span>Export Excel</span>
        </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111915] p-4 rounded-2xl border border-emerald-950/8 dark:border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer name, phone..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PAID', 'PARTIAL', 'UNPAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === status
                  ? 'bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-white/6 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/10'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-emerald-950/8 dark:border-white/8 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4 text-right">Subtotal</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`hover:bg-emerald-500/4 transition-colors ${
                      inv.isRefunded ? 'opacity-60 bg-rose-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {inv.invoiceNumber}
                      {inv.isRefunded && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded text-[9px] font-extrabold">
                          REFUNDED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(inv.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {inv.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.cashierName}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {formatCurrency(inv.subtotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {inv.balanceDue > 0 ? formatCurrency(inv.balanceDue) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : inv.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => void openInvoiceDetails(inv)}
                          title="View Details"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => void downloadInvoicePDF(inv)}
                          title="Download PDF"
                          className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {!inv.isRefunded && (
                          <button
                            onClick={() => setRefundInvoiceTarget(inv)}
                            title="Process Authorized Refund"
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SALES INVOICE */}
      <AnimatePresence>
        {showCreateInvoice && !posOnly && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-5">
            <motion.form onSubmit={createSalesInvoice} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl dark:bg-[#111915] sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">Create a sales invoice</h2>
                  <p className="mt-1 text-xs text-slate-500">This submits a sale immediately: inventory is reduced and any unpaid balance is added to the customer ledger.</p>
                </div>
                <button type="button" onClick={() => setShowCreateInvoice(false)} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold">Customer
                  <select required value={invoiceCustomerId} onChange={(e) => setInvoiceCustomerId(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-black/30">
                    <option value="">Select customer</option>
                    {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}{customer.phone ? ` — ${customer.phone}` : ''}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_100px_auto] sm:items-end">
                  <label className="block text-xs font-bold">Product
                    <select value={invoiceProductId} onChange={(e) => setInvoiceProductId(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-black/30">
                      <option value="">Select product</option>
                      {products.filter((product) => Number(product.stock) > 0).map((product) => <option key={product.id} value={product.id}>{product.name} · {formatCurrency(product.sellingPrice)} · stock {product.stock}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-bold">Quantity
                    <input type="number" min="1" value={invoiceQty} onChange={(e) => setInvoiceQty(Number(e.target.value))} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-black/30" />
                  </label>
                  <button type="button" onClick={addInvoiceItem} disabled={!invoiceProductId} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"><Plus className="inline h-4 w-4" /> Add item</button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
                  <table className="w-full min-w-[420px] text-left text-xs"><thead className="bg-slate-50 dark:bg-white/5"><tr><th className="p-3">Item</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Total</th><th className="p-3" /></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-white/10">
                    {invoiceItems.map((item) => <tr key={item.productId}><td className="p-3 font-semibold">{item.name}<span className="block text-[10px] text-slate-500">{item.sku}</span></td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td><td className="p-3 text-right font-bold">{formatCurrency(item.unitPrice * item.quantity)}</td><td className="p-3 text-right"><button type="button" onClick={() => setInvoiceItems((items) => items.filter((row) => row.productId !== item.productId))} title="Remove item" className="text-rose-600"><Trash2 className="h-4 w-4" /></button></td></tr>)}
                    {!invoiceItems.length && <tr><td colSpan={5} className="p-5 text-center text-slate-500">Add at least one product.</td></tr>}
                  </tbody></table>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:items-end">
                  <div className="text-sm font-extrabold">Invoice total: {formatCurrency(invoiceItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}</div>
                  <label className="block text-xs font-bold">Amount received now
                    <input type="number" min="0" step="0.01" value={invoicePaid} onChange={(e) => setInvoicePaid(e.target.value)} placeholder="0.00" className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-white/10 dark:bg-black/30" />
                  </label>
                </div>
              </div>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setShowCreateInvoice(false)} className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold dark:bg-white/10">Cancel</button>
                <button type="submit" disabled={creatingInvoice || invoiceItems.length === 0 || !invoiceCustomerId} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{creatingInvoice ? 'Recording sale…' : 'Create invoice and record sale'}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VIEW INVOICE MODAL */}
      <AnimatePresence>
        {viewInvoice && (
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
              className="w-full max-w-xl bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-950/10 dark:border-white/10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/8 dark:border-white/8">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {viewInvoice.isPOS ? 'POS Checkout Invoice' : 'Generated Sales Invoice'} {viewInvoice.invoiceNumber}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {new Date(viewInvoice.date).toLocaleString()} • {viewInvoice.cashierName}
                  </span>
                </div>
                <button onClick={() => setViewInvoice(null)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-emerald-950/8 dark:border-white/8 flex justify-between items-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Customer</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {viewInvoice.customerName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Payment Mode</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {viewInvoice.paymentMethod} ({viewInvoice.saleType})
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-emerald-950/10 dark:border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-white/4 text-[10px] text-slate-400 uppercase font-extrabold">
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                      {viewInvoice.items.map((it: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{it.name}</td>
                          <td className="p-2.5 font-mono text-slate-400">{it.sku}</td>
                          <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(it.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="space-y-1 text-right border-t border-emerald-950/8 dark:border-white/8 pt-2 font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(viewInvoice.subtotal)}</span>
                  </div>
                  {viewInvoice.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount:</span>
                      <span>-{formatCurrency(viewInvoice.discountTotal)}</span>
                    </div>
                  )}
                  {viewInvoice.taxTotal > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Tax:</span>
                      <span>+{formatCurrency(viewInvoice.taxTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-1">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(viewInvoice.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Amount Paid:</span>
                    <span>{formatCurrency(viewInvoice.amountPaid)}</span>
                  </div>
                  {viewInvoice.balanceDue > 0 && (
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(viewInvoice.balanceDue)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-950/8 dark:border-white/8 flex justify-between gap-2">
                <button
                  onClick={() => void downloadInvoicePDF(viewInvoice)}
                  className="px-4 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button
                  onClick={() => setViewInvoice(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REFUND MODAL */}
      <AnimatePresence>
        {refundInvoiceTarget && (
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
                <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                  Process Return / Refund
                </h3>
                <button onClick={() => setRefundInvoiceTarget(null)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRefundSubmit} className="mt-4 space-y-3.5">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Refunding <strong>{refundInvoiceTarget.invoiceNumber}</strong> will automatically return all sold items back into active warehouse inventory and adjust customer ledger balances.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason for Refund *
                  </label>
                  <input
                    type="text"
                    required
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="e.g. Customer returned unopened item"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRefundInvoiceTarget(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={submittingRefund}
                    className="px-5 py-2 bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/25 disabled:opacity-50"
                  >
                    {submittingRefund ? 'Processing...' : 'Authorize Refund & Restock'}
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
