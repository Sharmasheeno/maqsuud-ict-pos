import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Upload,
  QrCode,
  Edit,
  Trash2,
  X,
  Download,
  Camera,
  Sparkles,
  Image as ImageIcon,
  CheckCircle,
  ScanLine,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportToExcel } from '../utils/exportUtils';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { BarcodeCameraModal } from '../components/common/BarcodeCameraModal';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';

export const ProductsPage: React.FC = () => {
  const { formatCurrency, addToast } = useApp();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Barcode Registration state inside Add/Edit Modal
  const [barcodeRegisteredBadge, setBarcodeRegisteredBadge] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);

  // QR Modal
  const [qrModalProduct, setQrModalProduct] = useState<any | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');

  // Form
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    qrCode: '',
    category: 'Electronics & Phones',
    brand: 'Generic',
    purchaseCost: '',
    sellingPrice: '',
    stock: '',
    minStock: '5',
    unit: 'pcs',
    image: '',
    description: '',
    supplierId: '',
  });

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  // Real-time USB barcode scanner gun capture when Add/Edit Product Modal is open
  useBarcodeScanner({
    enabled: showAddModal && !showCameraModal,
    captureInInputs: true,
    onScan: (code) => {
      handleRegisterBarcode(code);
    },
  });

  const handleRegisterBarcode = (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;
    setFormData((prev) => ({
      ...prev,
      sku: clean,
      qrCode: clean,
    }));
    setBarcodeRegisteredBadge(true);
    addToast(`Barcode Registered: ${clean}`, 'success');
  };

  const handleAutoGenerateBarcode = () => {
    const prefix = formData.name
      ? formData.name
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 4) || 'MAQ'
      : 'MAQ';
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const generated = `${prefix}-${randomDigits}`;
    setFormData((prev) => ({
      ...prev,
      sku: generated,
      qrCode: `QR-${generated}`,
    }));
    setBarcodeRegisteredBadge(true);
    addToast(`Auto-generated barcode: ${generated}`, 'info');
  };

  const handleProductPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      addToast('Image size should be under 8MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        setFormData((prev) => ({ ...prev, image: base64 }));
        addToast('Product photo uploaded!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, suppRes] = await Promise.all([
        api.getProducts(search, selectedCategory),
        api.getCategories(),
        api.getSuppliers(),
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(catRes.categories);
      if (suppRes.success) setSuppliers(suppRes.suppliers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      qrCode: '',
      category: 'Electronics & Phones',
      brand: 'Generic',
      purchaseCost: '',
      sellingPrice: '',
      stock: '',
      minStock: '5',
      unit: 'pcs',
      image: '',
      description: '',
      supplierId: '',
    });
    setBarcodeRegisteredBadge(false);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        qrCode: formData.qrCode || formData.sku,
        image: formData.image || DEFAULT_FALLBACK_IMAGE,
      };
      if (selectedProduct) {
        const res = await api.updateProduct(selectedProduct.id, payload);
        if (res.success) {
          addToast('Product updated successfully', 'success');
        }
      } else {
        const res = await api.createProduct(payload);
        if (res.success) {
          addToast('Product added to catalog', 'success');
        }
      }
      setShowAddModal(false);
      setSelectedProduct(null);
      resetForm();
      loadData();
    } catch (err: any) {
      addToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleOpenEdit = (p: any) => {
    setSelectedProduct(p);
    setBarcodeRegisteredBadge(Boolean(p.sku || p.qrCode));
    setFormData({
      name: p.name,
      sku: p.sku || '',
      qrCode: p.qrCode || p.sku || '',
      category: p.category,
      brand: p.brand,
      purchaseCost: String(p.purchaseCost),
      sellingPrice: String(p.sellingPrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      unit: p.unit,
      image: p.image || '',
      description: p.description || '',
      supplierId: p.supplierId || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to archive this product?')) {
      try {
        await api.deleteProduct(id);
        addToast('Product archived', 'info');
        loadData();
      } catch (err: any) {
        addToast(err.message || 'Failed to archive', 'error');
      }
    }
  };

  const handleShowQR = async (p: any) => {
    setQrModalProduct(p);
    try {
      const url = await QRCode.toDataURL(p.qrCode || p.sku, { width: 300, margin: 2 });
      setQrModalDataUrl(url);
    } catch (e) {}
  };

  const handleExportExcel = () => {
    const rows = products.map((p) => ({
      'Product ID': p.productId,
      'Product Name': p.name,
      SKU: p.sku,
      'QR Code': p.qrCode,
      Category: p.category,
      Brand: p.brand,
      'Purchase Cost': p.purchaseCost,
      'Selling Price': p.sellingPrice,
      'Stock Quantity': p.stock,
      'Min Stock': p.minStock,
      Unit: p.unit,
      'Stock Valuation': p.stock * p.purchaseCost,
    }));
    exportToExcel(rows, 'Maqsuud_Products_Catalog');
  };

  // CSV/JSON File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        let items: any[] = [];
        if (file.name.endsWith('.json')) {
          items = JSON.parse(text);
        } else {
          // Parse CSV lines
          const lines = text.split('\n').filter((l) => l.trim().length > 0);
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          items = lines.slice(1).map((line) => {
            const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
            const obj: any = {};
            headers.forEach((h, i) => {
              if (h.includes('name')) obj.name = cols[i];
              else if (h.includes('cost')) obj.purchaseCost = cols[i];
              else if (h.includes('price')) obj.sellingPrice = cols[i];
              else if (h.includes('stock') || h.includes('qty')) obj.stock = cols[i];
              else if (h.includes('sku')) obj.sku = cols[i];
              else if (h.includes('cat')) obj.category = cols[i];
            });
            return obj;
          });
        }

        const res = await api.importProducts(items);
        if (res.success) {
          addToast(res.message, 'success');
          loadData();
        }
      } catch (err) {
        addToast('Invalid file format. Please upload valid JSON or CSV.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Products &amp; Hardware Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage product photos, real-time barcode/QR registration, pricing, and stock thresholds
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Import File Button */}
          <label className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 cursor-pointer flex items-center gap-1.5 transition-all shadow-xs">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Import CSV</span>
            <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:border-emerald-500/40 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelectedProduct(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </motion.button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111915] p-4 rounded-2xl border border-emerald-950/8 dark:border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, QR..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-bold"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-[#111915] rounded-2xl border border-emerald-950/8 dark:border-white/8 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-white/3 border-b border-emerald-950/8 dark:border-white/8 text-slate-400 uppercase font-extrabold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Product Photo &amp; Details</th>
                <th className="py-3.5 px-4">SKU / Barcode &amp; QR</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Cost</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Stock</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/6 dark:divide-white/6">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;

                  return (
                    <tr key={p.id} className="hover:bg-emerald-500/4 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || DEFAULT_FALLBACK_IMAGE}
                            alt={p.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                            }}
                            className="w-11 h-11 rounded-xl object-cover border border-emerald-950/10 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{p.sku}</div>
                        <div className="text-[10px] text-slate-400">{p.qrCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {p.category}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {formatCurrency(p.purchaseCost)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(p.sellingPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        {p.stock} {p.unit}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isOutOfStock
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleShowQR(p)}
                            title="Generate QR Code"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title="Archive"
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ADD / EDIT PRODUCT MODAL */}
      <AnimatePresence>
        {showAddModal && (
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
              className="w-full max-w-2xl bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-950/10 dark:border-white/10 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/8 dark:border-white/8">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedProduct ? 'Edit Catalog Product' : 'Add New Product'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Upload product photo &amp; scan physical barcode or QR code in real time
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
                {/* 1. PRODUCT PHOTO UPLOAD & URL SECTION */}
                <div className="p-3.5 rounded-2xl bg-[#f8faf9] dark:bg-[#0b110e] border border-emerald-950/10 dark:border-white/10">
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2">
                    Product Photo (Sawirka Badeecada)
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-3.5">
                    <div className="w-20 h-20 rounded-2xl border border-emerald-500/30 bg-white dark:bg-[#141e19] overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt="Preview"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-emerald-500/40" />
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductPhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {formData.image && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-500/20 cursor-pointer"
                          >
                            Remove Photo
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="Or paste direct Product Image URL (https://...)"
                        className="w-full px-3 py-1.5 bg-white dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. PRODUCT NAME & CATEGORY */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Samsung Galaxy A55 5G 128GB"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. REAL-TIME BARCODE / QR REGISTRATION */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/6 dark:bg-emerald-950/20 border border-emerald-500/25 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ScanLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Real-Time Barcode &amp; QR Registration
                      </span>
                      {barcodeRegisteredBadge && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-extrabold">
                          <CheckCircle className="w-3 h-3" />
                          <span>Barcode Registered!</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowCameraModal(true)}
                        className="px-2.5 py-1 rounded-xl bg-linear-to-r from-[#059669] to-[#16a34a] text-white text-[11px] font-extrabold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Scan Barcode Now</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoGenerateBarcode}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#141e19] border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Generate Barcode</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        SKU / Barcode Number
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, sku: val, qrCode: formData.qrCode || val });
                          if (val.trim()) setBarcodeRegisteredBadge(true);
                        }}
                        placeholder="Scan with USB gun or type SKU..."
                        className="w-full px-3 py-2 bg-white dark:bg-black/40 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        QR / Label Code
                      </label>
                      <input
                        type="text"
                        value={formData.qrCode}
                        onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                        placeholder="Auto-synced with barcode"
                        className="w-full px-3 py-2 bg-white dark:bg-black/40 border border-emerald-500/30 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. PRICING & STOCK */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Purchase Cost *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.purchaseCost}
                      onChange={(e) => setFormData({ ...formData, purchaseCost: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Selling Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Current Quantity in Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="0"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">How many of this product you have on hand right now.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Low Stock Alert At
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono"
                    />
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Show a low-stock warning when quantity reaches this number.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      list="product-unit-options"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="Choose or type a unit"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                    />
                    <datalist id="product-unit-options">
                      {['pcs', 'unit', 'box', 'pack', 'set', 'pair', 'bottle', 'can', 'bag', 'carton', 'dozen', 'kg', 'g', 'litre', 'ml', 'metre', 'cm', 'roll'].map((unit) => (
                        <option key={unit} value={unit} />
                      ))}
                    </datalist>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Pick a suggestion or type your own unit.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Supplier
                    </label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm"
                    >
                      <option value="">None / General</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product specs, features..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-black/40 border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="px-5 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/25 cursor-pointer"
                  >
                    Save Product
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CAMERA / USB BARCODE SCANNER MODAL */}
      <BarcodeCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onDetected={handleRegisterBarcode}
        title="Scan Product Barcode to Register SKU"
      />

      {/* SINGLE QR MODAL */}
      <AnimatePresence>
        {qrModalProduct && (
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
              className="w-full max-w-xs bg-white dark:bg-[#111915] rounded-3xl p-6 shadow-2xl border border-emerald-950/10 dark:border-white/10 text-center"
            >
              <div className="flex items-center justify-between pb-2 border-b border-emerald-950/8 dark:border-white/8">
                <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  {qrModalProduct.name}
                </h4>
                <button onClick={() => setQrModalProduct(null)} className="p-1 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="my-4 p-3 bg-white rounded-2xl shadow-sm border border-emerald-500/20 inline-block">
                <img src={qrModalDataUrl} alt="QR" className="w-44 h-44 mx-auto" />
              </div>

              <div className="font-mono text-xs text-slate-500">{qrModalProduct.sku}</div>
              <div className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(qrModalProduct.sellingPrice)}
              </div>

              <div className="mt-4 flex gap-2">
                <a
                  href={qrModalDataUrl}
                  download={`QR_${qrModalProduct.sku}.png`}
                  className="flex-1 py-2 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-white/6 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Print
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
