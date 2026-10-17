import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  X,
  QrCode,
  Camera,
  ScanLine,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportToExcel } from '../utils/exportUtils';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { BarcodeCameraModal } from '../components/common/BarcodeCameraModal';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';

export const PurchasesPage: React.FC = () => {
  const { formatCurrency, addToast } = useApp();

  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Barcode Scanning state for Purchase Orders
  const [poBarcodeInput, setPoBarcodeInput] = useState<string>('');
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState<string>('');
  const [quickNewProduct, setQuickNewProduct] = useState({
    name: '',
    category: 'Electronics & Phones',
    purchaseCost: '',
    sellingPrice: '',
    quantity: '5',
    image: '',
  });
  const [registeringQuickProduct, setRegisteringQuickProduct] = useState<boolean>(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Form
  const [supplierId, setSupplierId] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [receiveStockNow, setReceiveStockNow] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  // Global USB laser barcode gun listener when Purchase Order Modal is open
  useBarcodeScanner({
    enabled: showCreateModal && !showCameraScanner && !unrecognizedBarcode,
    captureInInputs: false,
    onScan: (code) => {
      handleScanBarcodeForPO(code);
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [poRes, suppRes, prodRes] = await Promise.all([
        api.getPurchases(),
        api.getSuppliers(),
        api.getProducts(),
      ]);
      if (poRes.success) setPurchases(poRes.purchases);
      if (suppRes.success) {
        setSuppliers(suppRes.suppliers);
        if (suppRes.suppliers.length > 0 && !supplierId) setSupplierId(suppRes.suppliers[0].id);
      }
      if (prodRes.success) setProducts(prodRes.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemToOrder = (productId: string, incrementBy = 1, initialQty = 1) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setPurchaseItems((prev) => {
      const exists = prev.find((it) => it.productId === productId);
      if (exists) {
        const nextQty = exists.quantity + incrementBy;
        return prev.map((it) =>
          it.productId === productId
            ? { ...it, quantity: nextQty, total: nextQty * it.unitCost }
            : it
        );
      } else {
        return [
          ...prev,
          {
            productId: prod.id,
            name: prod.name,
            sku: prod.sku,
            image: prod.image || DEFAULT_FALLBACK_IMAGE,
            unitCost: prod.purchaseCost,
            quantity: initialQty,
            total: initialQty * prod.purchaseCost,
          },
        ];
      }
    });
  };

  const handleScanBarcodeForPO = async (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;

    // 1. Check local products list first
    const localMatch = products.find(
      (p) =>
        p.sku?.toLowerCase() === clean.toLowerCase() ||
        p.qrCode?.toLowerCase() === clean.toLowerCase() ||
        p.productId?.toLowerCase() === clean.toLowerCase()
    );

    if (localMatch) {
      handleAddItemToOrder(localMatch.id, 1, 1);
      addToast(`Scanned & Added to PO: ${localMatch.name} (+1)`, 'success');
      setPoBarcodeInput('');
      setUnrecognizedBarcode('');
      return;
    }

    // 2. Fallback API lookup
    try {
      const res = await api.scanQRCode(clean);
      if (res.success && res.product) {
        const p = res.product;
        setPurchaseItems((prev) => {
          const exists = prev.find((it) => it.productId === p.id);
          if (exists) {
            return prev.map((it) =>
              it.productId === p.id
                ? { ...it, quantity: it.quantity + 1, total: (it.quantity + 1) * it.unitCost }
                : it
            );
          }
          return [
            ...prev,
            {
              productId: p.id,
              name: p.name,
              sku: p.sku,
              image: p.image || DEFAULT_FALLBACK_IMAGE,
              unitCost: p.purchaseCost,
              quantity: 1,
              total: p.purchaseCost,
            },
          ];
        });
        addToast(`Scanned & Added to PO: ${p.name} (+1)`, 'success');
        setPoBarcodeInput('');
        setUnrecognizedBarcode('');
        return;
      }
    } catch (e) {
      // Product does not exist yet — offer instant Quick Registration with this barcode!
      setUnrecognizedBarcode(clean);
      setPoBarcodeInput('');
      addToast(
        `New barcode "${clean}" detected! Quick-register below to add to catalog & PO.`,
        'info'
      );
    }
  };

  const handleQuickRegisterAndAddToPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unrecognizedBarcode || !quickNewProduct.name || !quickNewProduct.purchaseCost) {
      addToast('Please enter product name and purchase cost', 'error');
      return;
    }

    setRegisteringQuickProduct(true);
    try {
      const cost = parseFloat(quickNewProduct.purchaseCost) || 0;
      const price = parseFloat(quickNewProduct.sellingPrice) || parseFloat((cost * 1.25).toFixed(2));
      const qty = Math.max(1, parseInt(quickNewProduct.quantity) || 1);

      const res = await api.createProduct({
        name: quickNewProduct.name,
        sku: unrecognizedBarcode,
        qrCode: unrecognizedBarcode,
        category: quickNewProduct.category,
        brand: 'Generic',
        purchaseCost: cost,
        sellingPrice: price,
        stock: 0, // Will be received via PO
        minStock: 5,
        unit: 'pcs',
        image: quickNewProduct.image || DEFAULT_FALLBACK_IMAGE,
        supplierId,
      });

      if (res.success && res.product) {
        const created = res.product;
        setProducts((prev) => [created, ...prev]);
        setPurchaseItems((prev) => [
          ...prev,
          {
            productId: created.id,
            name: created.name,
            sku: created.sku,
            image: created.image || DEFAULT_FALLBACK_IMAGE,
            unitCost: cost,
            quantity: qty,
            total: qty * cost,
          },
        ]);
        addToast(
          `Registered "${created.name}" (${created.sku}) & added ${qty} units to Purchase Order!`,
          'success'
        );
        setUnrecognizedBarcode('');
        setQuickNewProduct({
          name: '',
          category: 'Electronics & Phones',
          purchaseCost: '',
          sellingPrice: '',
          quantity: '5',
          image: '',
        });
      }
    } catch (err: any) {
      addToast(err.message || 'Quick product registration failed', 'error');
    } finally {
      setRegisteringQuickProduct(false);
    }
  };

  const handleUpdateItem = (productId: string, field: 'quantity' | 'unitCost', val: number) => {
    setPurchaseItems((prev) =>
      prev.map((it) => {
        if (it.productId === productId) {
          const qty = field === 'quantity' ? Math.max(1, val) : it.quantity;
          const cost = field === 'unitCost' ? Math.max(0, val) : it.unitCost;
          return {
            ...it,
            quantity: qty,
            unitCost: cost,
            total: qty * cost,
          };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setPurchaseItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  const totalCost = purchaseItems.reduce((sum, item) => sum + item.total, 0);

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      addToast('Please add at least one product to purchase order.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createPurchase({
        supplierId,
        items: purchaseItems,
        amountPaid: parseFloat(amountPaid) || 0,
        receiveStockNow,
        notes,
      });

      if (res.success) {
        addToast(res.message, 'success');
        setShowCreateModal(false);
        setPurchaseItems([]);
        setAmountPaid('0');
        setNotes('');
        setUnrecognizedBarcode('');
        loadData();
      }
    } catch (err: any) {
      addToast(err.message || 'Purchase creation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveStock = async (id: string) => {
    try {
      const res = await api.receivePurchaseStock(id);
      if (res.success) {
        addToast(res.message, 'success');
        loadData();
      }
    } catch (err: any) {
      addToast(err.message || 'Stock receive failed', 'error');
    }
  };

  const handleExportExcel = () => {
    const rows = purchases.map((p) => ({
      'PO Number': p.purchaseNumber,
      Date: new Date(p.date).toLocaleDateString(),
      Supplier: p.supplierName,
      'Total Cost': p.totalCost,
      'Amount Paid': p.amountPaid,
      'Balance Due': p.balanceDue,
      'Goods Status': p.status,
      'Payment Status': p.paymentStatus,
    }));
    exportToExcel(rows, 'Maqsuud_Purchases_Ledger');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Purchase Orders &amp; Procurement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Scan incoming product barcodes in real time, receive inventory shipments, and track supplier accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Order</span>
          </motion.button>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-emerald-950/8 dark:border-white/8 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">PO Number</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-center">Items</th>
                <th className="py-3.5 px-4 text-right">Total Cost</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-right">Balance Due</th>
                <th className="py-3.5 px-4 text-center">Stock Status</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading purchases...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No purchase orders on record. Click "New Purchase Order" to restock.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-emerald-500/4 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {po.purchaseNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(po.date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {po.supplierName}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {po.items.length} lines
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(po.totalCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(po.amountPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                      {po.balanceDue > 0 ? formatCurrency(po.balanceDue) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === 'RECEIVED'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {po.status !== 'RECEIVED' ? (
                        <button
                          onClick={() => handleReceiveStock(po.id)}
                          className="px-3 py-1 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-lg text-xs font-extrabold shadow-xs cursor-pointer"
                        >
                          Receive Stock
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">In Inventory</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
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
              className="w-full max-w-3xl bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-950/10 dark:border-white/10 max-h-[92vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/8 dark:border-white/8">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Create Purchase Invoice (Restock &amp; Barcode Intake)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Scan incoming product barcodes with USB laser gun or camera to add to purchase order
                  </p>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {/* PROMINENT REAL-TIME BARCODE SCANNER INPUT BAR */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/8 dark:bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      <ScanLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Real-Time Barcode / QR Scanner Intake</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
                      USB Laser Gun Active
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                      <input
                        ref={barcodeInputRef}
                        type="text"
                        value={poBarcodeInput}
                        onChange={(e) => setPoBarcodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (poBarcodeInput.trim()) {
                              handleScanBarcodeForPO(poBarcodeInput);
                            }
                          }
                        }}
                        placeholder="Scan product barcode to add to purchase order..."
                        className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0b110e] border border-emerald-500/40 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (poBarcodeInput.trim()) {
                            handleScanBarcodeForPO(poBarcodeInput);
                          }
                        }}
                        className="px-4 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-xs cursor-pointer"
                      >
                        Add Barcode
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCameraScanner(true)}
                        className="px-3 py-2 bg-white dark:bg-[#141e19] border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Camera Scan</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick-Register New Product when an unrecognized barcode is scanned */}
                  <AnimatePresence>
                    {unrecognizedBarcode && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleQuickRegisterAndAddToPO}
                        className="mt-2 p-3.5 rounded-xl bg-white dark:bg-[#141e19] border border-emerald-500/40 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>
                              Quick-Register New Barcode:{' '}
                              <strong className="font-mono underline">{unrecognizedBarcode}</strong>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUnrecognizedBarcode('')}
                            className="text-[11px] font-bold text-slate-400 hover:text-rose-500"
                          >
                            Dismiss
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              New Product Name *
                            </label>
                            <input
                              type="text"
                              required
                              value={quickNewProduct.name}
                              onChange={(e) =>
                                setQuickNewProduct({ ...quickNewProduct, name: e.target.value })
                              }
                              placeholder="e.g. Tecno Spark 20 Pro"
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/40 border border-emerald-950/15 dark:border-white/15 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Unit Cost ($) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={quickNewProduct.purchaseCost}
                              onChange={(e) =>
                                setQuickNewProduct({
                                  ...quickNewProduct,
                                  purchaseCost: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/40 border border-emerald-950/15 dark:border-white/15 rounded-lg text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                              Selling Price ($) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={quickNewProduct.sellingPrice}
                              onChange={(e) =>
                                setQuickNewProduct({
                                  ...quickNewProduct,
                                  sellingPrice: e.target.value,
                                })
                              }
                              placeholder="0.00"
                              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-black/40 border border-emerald-950/15 dark:border-white/15 rounded-lg text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500">PO Qty:</span>
                            <input
                              type="number"
                              min="1"
                              value={quickNewProduct.quantity}
                              onChange={(e) =>
                                setQuickNewProduct({ ...quickNewProduct, quantity: e.target.value })
                              }
                              className="w-16 px-2 py-1 bg-slate-50 dark:bg-black/40 border border-emerald-950/15 dark:border-white/15 rounded-lg text-xs font-mono font-bold text-center"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={registeringQuickProduct}
                            className="px-3.5 py-1.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>
                              {registeringQuickProduct
                                ? 'Registering...'
                                : 'Register Barcode & Add to PO'}
                            </span>
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                <form id="po-create-form" onSubmit={handleCreatePurchase} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Select Supplier *
                      </label>
                      <select
                        value={supplierId}
                        onChange={(e) => setSupplierId(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold"
                      >
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Debt: {formatCurrency(s.currentBalance)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Or Select Product from Catalog
                      </label>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddItemToOrder(e.target.value, 1, 5);
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-semibold"
                      >
                        <option value="">+ Click to choose product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-2">
                      Order Line Items ({purchaseItems.length})
                    </h4>
                    {purchaseItems.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-emerald-950/15 dark:border-white/15 rounded-xl">
                        Scan a product barcode above or select items from the dropdown to build your Purchase Order.
                      </div>
                    ) : (
                      <div className="border border-emerald-950/10 dark:border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-white/4 text-[10px] text-slate-400 uppercase font-extrabold">
                              <th className="p-2.5">Product &amp; Barcode</th>
                              <th className="p-2.5 text-center">Qty</th>
                              <th className="p-2.5 text-right">Cost Per Unit</th>
                              <th className="p-2.5 text-right">Total</th>
                              <th className="p-2.5 text-center">Remove</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
                            {purchaseItems.map((item) => (
                              <tr key={item.productId}>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={item.image || DEFAULT_FALLBACK_IMAGE}
                                      alt={item.name}
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src =
                                          DEFAULT_FALLBACK_IMAGE;
                                      }}
                                      className="w-9 h-9 rounded-lg object-cover border border-emerald-950/10 dark:border-white/10 flex-shrink-0"
                                    />
                                    <div>
                                      <div className="font-bold text-slate-900 dark:text-white">
                                        {item.name}
                                      </div>
                                      <div className="text-[10px] font-mono text-slate-400">
                                        {item.sku}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleUpdateItem(
                                        item.productId,
                                        'quantity',
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="w-16 px-1.5 py-1 text-center bg-slate-100 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-lg font-mono font-bold"
                                  />
                                </td>
                                <td className="p-2.5 text-right">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.unitCost}
                                    onChange={(e) =>
                                      handleUpdateItem(
                                        item.productId,
                                        'unitCost',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-20 px-1.5 py-1 text-right bg-slate-100 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-lg font-mono font-bold"
                                  />
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(item.total)}
                                </td>
                                <td className="p-2.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.productId)}
                                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Totals & Down payment */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-emerald-950/8 dark:border-white/8 space-y-2 text-xs">
                    <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                      <span>Total Purchase Cost:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalCost)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-950/10 dark:border-white/10">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        Down-Payment Paid Now:
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0.00"
                        className="w-28 px-2.5 py-1 bg-white dark:bg-[#111915] border border-emerald-950/15 dark:border-white/15 rounded-lg text-right font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={receiveStockNow}
                          onChange={(e) => setReceiveStockNow(e.target.checked)}
                          className="rounded text-emerald-600"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Receive Stock into Inventory Immediately
                        </span>
                      </label>
                      <p className="text-[10px] text-slate-400 pl-6 mt-0.5">
                        Automatically updates product stock and recalculates weighted average purchase costs.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="submit"
                      disabled={submitting || purchaseItems.length === 0}
                      className="px-5 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Creating...' : 'Submit Purchase Order'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CAMERA / USB BARCODE MODAL FOR PURCHASE ORDER */}
      <BarcodeCameraModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onDetected={handleScanBarcodeForPO}
        title="Scan Product Barcode to Add to Purchase Order"
      />
    </div>
  );
};
