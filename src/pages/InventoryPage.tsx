import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportToExcel } from '../utils/exportUtils';

export const InventoryPage: React.FC = () => {
  const { formatCurrency, addToast } = useApp();

  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'status' | 'movements'>('status');

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustProductId, setAdjustProductId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<string>('ADJUSTMENT');
  const [adjustQty, setAdjustQty] = useState<string>('0');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [submittingAdjust, setSubmittingAdjust] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, movRes] = await Promise.all([
        api.getProducts(),
        api.getStockMovements(),
      ]);
      if (prodRes.success) {
        setProducts(prodRes.products);
        if (prodRes.products.length > 0) setAdjustProductId(prodRes.products[0].id);
      }
      if (movRes.success) setMovements(movRes.movements);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustQty);
    if (isNaN(qty) || qty === 0) {
      addToast('Please enter a non-zero quantity change.', 'error');
      return;
    }

    setSubmittingAdjust(true);
    try {
      const res = await api.adjustStock({
        productId: adjustProductId,
        type: adjustType,
        quantityChange: qty,
        reason: adjustReason || `${adjustType} stock correction`,
      });

      if (res.success) {
        addToast(res.message, 'success');
        setShowAdjustModal(false);
        setAdjustQty('0');
        setAdjustReason('');
        loadData();
      }
    } catch (err: any) {
      addToast(err.message || 'Stock adjustment failed', 'error');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const totalCostValuation = products.reduce((s, p) => s + p.stock * p.purchaseCost, 0);
  const totalRetailValuation = products.reduce((s, p) => s + p.stock * p.sellingPrice, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const handleExportMovements = () => {
    const rows = movements.map((m) => ({
      Date: new Date(m.date).toLocaleString(),
      'Product Name': m.productName,
      SKU: m.sku,
      'Movement Type': m.type,
      'Qty Change': m.quantityChange,
      'Previous Stock': m.previousStock,
      'New Stock': m.newStock,
      'Unit Cost': m.unitCost,
      Reason: m.reason,
      'Recorded By': m.createdBy,
    }));
    exportToExcel(rows, 'Maqsuud_Stock_Movements_Ledger');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time warehouse valuation, audit logs, damage write-offs, and physical stock count
          </p>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdjustModal(true)}
            className="px-4 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Stock Adjustment</span>
          </motion.button>
        </div>
      </div>

      {/* Valuation & Alerts Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valuation (Cost)</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
            {formatCurrency(totalCostValuation)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Total invested capital in goods</div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#111915] border border-emerald-950/8 dark:border-white/8 shadow-xs">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Valuation (Retail)</div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatCurrency(totalRetailValuation)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Expected revenue upon full sale</div>
        </div>

        <div className="p-5 rounded-2xl bg-amber-500/8 border border-amber-500/20">
          <div className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            Low Stock Alerts
          </div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono mt-1">
            {lowStockCount} Items
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">Below minimum threshold</div>
        </div>

        <div className="p-5 rounded-2xl bg-rose-500/8 border border-rose-500/20">
          <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            Out of Stock
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mt-1">
            {outOfStockCount} Items
          </div>
          <div className="text-xs text-rose-500 mt-1">Urgent purchase replenishment needed</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-emerald-950/10 dark:border-white/10">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Inventory Stock Levels ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition-colors ${
              activeTab === 'movements'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Stock Movement Ledger ({movements.length})
          </button>
        </div>

        {activeTab === 'movements' && (
          <button
            onClick={handleExportMovements}
            className="mb-2 px-3.5 py-1.5 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Movements</span>
          </button>
        )}
      </div>

      {/* TAB 1: Stock Levels */}
      {activeTab === 'status' ? (
        <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-emerald-950/8 dark:border-white/8 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4 text-center">Available Stock</th>
                  <th className="py-3.5 px-4 text-center">Min Threshold</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Total Stock Value</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                {products.map((p) => {
                  const isOut = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;

                  return (
                    <tr key={p.id} className="hover:bg-emerald-500/4 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.image ||
                              'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80'
                            }
                            alt={p.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';
                            }}
                            className="w-11 h-11 rounded-xl object-cover border border-emerald-950/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOut
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {p.minStock} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        {formatCurrency(p.purchaseCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(p.stock * p.purchaseCost)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setAdjustProductId(p.id);
                            setShowAdjustModal(true);
                          }}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-extrabold transition-colors"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: Stock Movements Audit Ledger */
        <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-emerald-950/8 dark:border-white/8 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Item Name</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4 text-center">Change</th>
                  <th className="py-3.5 px-4 text-center">Prev &rarr; New</th>
                  <th className="py-3.5 px-4">Reason / Reference</th>
                  <th className="py-3.5 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-emerald-500/4 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(m.date).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {m.productName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-extrabold">
                      <span className={m.quantityChange > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                      {m.previousStock} &rarr; <span className="font-bold text-slate-900 dark:text-white">{m.newStock}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {m.reason}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-semibold">{m.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      <AnimatePresence>
        {showAdjustModal && (
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
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Record Stock Adjustment
                </h3>
                <button onClick={() => setShowAdjustModal(false)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Product *
                  </label>
                  <select
                    value={adjustProductId}
                    onChange={(e) => setAdjustProductId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current: {p.stock} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Adjustment Type
                  </label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    <option value="ADJUSTMENT">Physical Stock Count Correction</option>
                    <option value="DAMAGED">Damaged / Broken Goods Write-off</option>
                    <option value="EXPIRED">Expired Shelf Stock</option>
                    <option value="CUSTOMER_RETURN">Customer Returned Goods</option>
                    <option value="SUPPLIER_RETURN">Return to Supplier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity Change (+ to add, - to subtract) *
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    placeholder="-2 or 5"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reason / Audit Memo
                  </label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="e.g. Water damage during transport, physical inventory audit"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAdjustModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={submittingAdjust}
                    className="px-5 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50"
                  >
                    {submittingAdjust ? 'Updating...' : 'Commit Adjustment'}
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
