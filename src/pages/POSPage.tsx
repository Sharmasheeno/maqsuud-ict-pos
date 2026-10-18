import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  QrCode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  User,
  Receipt,
  Printer,
  X,
  Check,
  Camera,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';
import { exportInvoicePDF } from '../utils/exportUtils';
import { Logo } from '../components/common/Logo';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { BarcodeCameraModal } from '../components/common/BarcodeCameraModal';

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80';

export const POSPage: React.FC = () => {
  const { formatCurrency, business, addToast, setActivePage } = useApp();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Cart & Simplified Tax / Discount / Payment State
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [saleType, setSaleType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState<boolean>(false);
  const [customTaxRate, setCustomTaxRate] = useState<number>(business?.taxRate || 5);
  const [recordedAmountInput, setRecordedAmountInput] = useState<string>('');
  const [isCustomRecordedAmount, setIsCustomRecordedAmount] = useState<boolean>(false);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [mobilePane, setMobilePane] = useState<'products' | 'cart'>('products');

  // Barcode / QR hardware scanner buffer
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (business?.taxRate !== undefined) {
      setCustomTaxRate(business.taxRate);
    }
  }, [business?.taxRate]);

  // Global physical USB/Bluetooth barcode gun listener on POS page
  useBarcodeScanner({
    enabled: !showReceiptModal && !showCameraModal,
    captureInInputs: false,
    onScan: (code) => {
      lookupAndAddBarcode(code);
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, custRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getCustomers(),
      ]);
      if (prodRes.success) setProducts(prodRes.products);
      if (catRes.success) setCategories(catRes.categories);
      if (custRes.success) setCustomers(custRes.customers);
    } catch (err) {
      console.error('Error loading POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add Product to Cart
  const addToCart = (product: any) => {
    if (product.stock <= 0) {
      addToast(`"${product.name}" is currently out of stock.`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          addToast(`Maximum available stock reached for ${product.name} (${product.stock})`, 'error');
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            qrCode: product.qrCode,
            image: product.image || DEFAULT_FALLBACK_IMAGE,
            unitCost: product.purchaseCost,
            unitPrice: product.sellingPrice,
            stock: product.stock,
            quantity: 1,
            discount: 0,
            total: product.sellingPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stock) {
              addToast(`Cannot exceed current stock (${item.stock})`, 'error');
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter(Boolean) as any[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const lookupAndAddBarcode = async (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean) return;

    // Fast local match first
    const localMatch = products.find(
      (p) =>
        p.sku?.toLowerCase() === clean.toLowerCase() ||
        p.qrCode?.toLowerCase() === clean.toLowerCase() ||
        p.productId?.toLowerCase() === clean.toLowerCase()
    );
    if (localMatch) {
      addToCart(localMatch);
      addToast(`Scanned: ${localMatch.name}`, 'success');
      setBarcodeInput('');
      return;
    }

    try {
      const res = await api.scanQRCode(clean);
      if (res.success && res.product) {
        addToCart(res.product);
        addToast(`Scanned: ${res.product.name}`, 'success');
        setBarcodeInput('');
      }
    } catch (err: any) {
      addToast(err.message || 'Product not recognized', 'error');
    }
  };

  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    await lookupAndAddBarcode(barcodeInput);
  };

  // Clear Financial Summary & Exact Balance Math
  // 1. Products Amount (Subtotal): Sum of (unitPrice × quantity)
  const subtotal = parseFloat(
    cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
  );
  // 2. Discount: - $X.XX
  const validDiscount = Math.min(subtotal, Math.max(0, discountAmount || 0));
  const taxableAmount = Math.max(0, subtotal - validDiscount);
  // 3. Tax Amount: (Subtotal - Discount) × (taxRate / 100) (only when Tax is enabled)
  const effectiveTaxRatePct = taxEnabled ? Math.max(0, customTaxRate || 0) : 0;
  const taxTotal = taxEnabled
    ? parseFloat((taxableAmount * (effectiveTaxRatePct / 100)).toFixed(2))
    : 0;
  // 4. Total Amount (Wadarta Guud): Subtotal - Discount + Tax Amount
  const grandTotal = parseFloat((taxableAmount + taxTotal).toFixed(2));

  // Auto-sync Recorded Amount to match Total Amount in Cash Sale mode unless the cashier types a custom partial amount
  useEffect(() => {
    if (!isCustomRecordedAmount) {
      if (saleType === 'CASH') {
        setRecordedAmountInput(grandTotal > 0 ? grandTotal.toFixed(2) : '');
      } else {
        setRecordedAmountInput('0.00');
      }
    }
  }, [grandTotal, saleType, isCustomRecordedAmount]);

  const recordedAmount =
    recordedAmountInput.trim() === ''
      ? saleType === 'CASH'
        ? grandTotal
        : 0
      : Math.max(0, parseFloat(recordedAmountInput) || 0);

  const isPartialOrCreditDue = recordedAmount < grandTotal - 0.009;
  const dueBalanceRemaining = isPartialOrCreditDue
    ? parseFloat(Math.max(0, grandTotal - recordedAmount).toFixed(2))
    : 0;
  const changeToReturn = !isPartialOrCreditDue
    ? parseFloat(Math.max(0, recordedAmount - grandTotal).toFixed(2))
    : 0;

  // Checkout Execution
  const handleCheckout = async () => {
    if (cart.length === 0) {
      addToast('Cart is empty. Add products to proceed.', 'error');
      return;
    }

    if ((saleType === 'CREDIT' || isPartialOrCreditDue) && !selectedCustomer) {
      addToast(
        'Please select a customer when recording Credit / Balance Remaining (Deyn).',
        'error'
      );
      return;
    }

    setCheckoutLoading(true);

    try {
      const payload = {
        items: cart,
        customerId: selectedCustomer?.id || undefined,
        customerName: selectedCustomer?.name || 'Walk-in Retail Customer',
        customerPhone: selectedCustomer?.phone || undefined,
        paymentMethod: saleType === 'CREDIT' && recordedAmount === 0 ? 'Credit (Deyn)' : paymentMethod,
        saleType: isPartialOrCreditDue ? 'CREDIT' : saleType,
        cashReceived: recordedAmount,
        discountTotal: validDiscount,
        taxEnabled,
        customTaxRate: effectiveTaxRatePct,
        insuranceEnabled: false,
        notes: `POS Checkout completed via ${paymentMethod}`,
      };

      const res = await api.checkoutPOS(payload);

      if (res.success && res.invoice) {
        setCompletedInvoice(res.invoice);
        setShowReceiptModal(true);
        setCart([]);
        setDiscountAmount(0);
        setIsCustomRecordedAmount(false);
        setRecordedAmountInput('');
        addToast(`Sale ${res.invoice.invoiceNumber} recorded successfully!`, 'success');
        loadData();
      }
    } catch (err: any) {
      addToast(err.message || 'Checkout failed. Please retry.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.qrCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const somaliPaymentMethods = [
    { id: 'Cash', label: 'Cash' },
    { id: 'EVC Plus', label: 'EVC Plus' },
    { id: 'Zaad / Sahal', label: 'Zaad / Sahal' },
    { id: 'Salaam / Premier Bank', label: 'Salaam / Premier Bank' },
  ];

  return (
    <div className="min-w-0 flex flex-col gap-3 lg:h-[calc(100vh-6.5rem)] lg:flex-row lg:gap-4 lg:overflow-hidden">
      <div className="grid grid-cols-2 gap-2 lg:hidden" role="group" aria-label="Point of sale sections">
        <button
          type="button"
          aria-pressed={mobilePane === 'products'}
          onClick={() => setMobilePane('products')}
          className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${mobilePane === 'products' ? 'bg-emerald-600 text-white' : 'border border-emerald-950/10 bg-white text-slate-700 dark:border-white/10 dark:bg-[#111915] dark:text-slate-200'}`}
        >
          Products
        </button>
        <button
          type="button"
          aria-pressed={mobilePane === 'cart'}
          onClick={() => setMobilePane('cart')}
          className={`min-h-11 rounded-xl px-3 py-2 text-sm font-bold transition-colors ${mobilePane === 'cart' ? 'bg-emerald-600 text-white' : 'border border-emerald-950/10 bg-white text-slate-700 dark:border-white/10 dark:bg-[#111915] dark:text-slate-200'}`}
        >
          Cart · {cart.reduce((s, i) => s + i.quantity, 0)}
        </button>
      </div>
      {/* LEFT SECTION: Hardware POS Shelf & Product Catalog with Photos */}
      <div className={`${mobilePane === 'products' ? 'flex' : 'hidden'} h-[min(68dvh,42rem)] min-h-[22rem] min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-xs dark:border-white/10 dark:bg-[#111915] lg:flex lg:h-auto`}>
        {/* Shelf Header & Barcode / Search bar */}
        <div className="p-3.5 border-b border-emerald-950/8 dark:border-white/8 space-y-3 bg-[#f8faf9] dark:bg-[#0b110e]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, QR..."
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Quick Barcode Scanner Input */}
            <form onSubmit={handleBarcodeScan} className="flex items-center gap-1.5">
              <div className="relative w-44 sm:w-52">
                <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode / QR..."
                  className="w-full pl-9 pr-3 py-2 bg-emerald-500/8 dark:bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs sm:text-sm font-mono text-emerald-950 dark:text-emerald-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="px-3.5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-sm shadow-emerald-600/25 cursor-pointer"
              >
                Scan
              </motion.button>
              <button
                type="button"
                onClick={() => setShowCameraModal(true)}
                title="Open Camera Barcode Scanner"
                className="p-2 bg-white dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:border-emerald-500/40 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Horizontal Category Pills Shelf */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-sm shadow-emerald-600/25'
                  : 'bg-white dark:bg-[#141e19] text-slate-600 dark:text-slate-300 border border-emerald-950/8 dark:border-white/10 hover:border-emerald-500/40'
              }`}
            >
              All SKUs ({products.length})
            </motion.button>
            {categories.map((cat) => (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-sm shadow-emerald-600/25'
                    : 'bg-white dark:bg-[#141e19] text-slate-600 dark:text-slate-300 border border-emerald-950/8 dark:border-white/10 hover:border-emerald-500/40'
                }`}
              >
                {cat.name}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Product Hardware Tiles Grid with Photos (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3.5">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
              <ShoppingCart className="w-10 h-10 stroke-1 mb-2 text-slate-300" />
              <span>No products match the selected filter</span>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.03 } },
              }}
              className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3"
            >
              {filteredProducts.map((prod) => {
                const isOutOfStock = prod.stock <= 0;
                const isLow = prod.stock > 0 && prod.stock <= prod.minStock;

                return (
                  <motion.div
                    key={prod.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0 },
                    }}
                    whileHover={!isOutOfStock ? { y: -2, scale: 1.01 } : undefined}
                    whileTap={!isOutOfStock ? { scale: 0.97 } : undefined}
                    onClick={() => !isOutOfStock && addToCart(prod)}
                    className={`group relative p-3 rounded-2xl border transition-all text-left flex flex-col justify-between select-none ${
                      isOutOfStock
                        ? 'opacity-60 bg-slate-50 dark:bg-[#0b110e] border-dashed border-rose-500/30 cursor-not-allowed'
                        : 'bg-white dark:bg-[#141e19] border-emerald-950/10 dark:border-white/10 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-600/10 cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Product Photo Thumbnail */}
                      <div className="relative mb-2.5 overflow-hidden rounded-xl bg-slate-100 dark:bg-black/40 border border-emerald-950/6 dark:border-white/6">
                        <img
                          src={prod.image || DEFAULT_FALLBACK_IMAGE}
                          alt={prod.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                          }}
                          className="h-28 w-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                        />
                        <span
                          className={`absolute top-2 right-2 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-lg backdrop-blur-md shadow-xs ${
                            isOutOfStock
                              ? 'bg-rose-600/90 text-white'
                              : isLow
                              ? 'bg-amber-500/90 text-white'
                              : 'bg-black/65 text-emerald-300'
                          }`}
                        >
                          {isOutOfStock ? 'OUT' : `${prod.stock} ${prod.unit}`}
                        </span>
                      </div>

                      <div className="text-[10px] font-mono font-bold text-slate-400 truncate mb-0.5">
                        {prod.sku}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-emerald-950/8 dark:border-white/8 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatCurrency(prod.sellingPrice)}
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-emerald-500/12 group-hover:bg-linear-to-r group-hover:from-[#059669] group-hover:to-[#16a34a] text-emerald-600 dark:text-emerald-400 group-hover:text-white flex items-center justify-center font-extrabold text-sm transition-all">
                        +
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Simplified Somali Retail POS Cart & Checkout */}
      <div className={`${mobilePane === 'cart' ? 'flex' : 'hidden'} min-h-[min(72dvh,48rem)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-md dark:border-white/10 dark:bg-[#111915] lg:flex lg:h-auto lg:min-h-0 lg:w-[445px] lg:flex-shrink-0`}>
        {/* Cart Header */}
        <div className="p-3 border-b border-emerald-950/8 dark:border-white/8 flex items-center justify-between bg-[#f8faf9] dark:bg-[#0b110e]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h3 className="font-display text-sm font-extrabold text-slate-900 dark:text-white">
              POS Active Cart
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => {
                setCart([]);
                setDiscountAmount(0);
                setIsCustomRecordedAmount(false);
              }}
              className="text-xs font-extrabold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Customer Selector & Sale Mode Selector: Cash Sale (Kaash) vs Credit / Debt (Deyn) */}
        <div className="p-3 border-b border-emerald-950/8 dark:border-white/8 space-y-2 bg-[#f8faf9]/60 dark:bg-[#0b110e]/50">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <User className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-600" />
              <select
                value={selectedCustomer?.id || ''}
                onChange={(e) => {
                  const cust = customers.find((c) => c.id === e.target.value);
                  setSelectedCustomer(cust || null);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Walk-in Retail Customer (Macmiil)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerId}) • Deyn: {formatCurrency(c.currentBalance)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setActivePage('customers')}
              className="px-2.5 py-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-extrabold hover:bg-emerald-500/25 cursor-pointer"
              title="Add New Customer"
            >
              + New
            </button>
          </div>

          {/* Clean Toggle: Cash Sale (Kaash) vs Credit / Debt (Deyn) */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#eef2f0] dark:bg-[#090d0b] p-1 rounded-xl text-xs font-extrabold">
            <button
              type="button"
              onClick={() => {
                setSaleType('CASH');
                setIsCustomRecordedAmount(false);
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                saleType === 'CASH'
                  ? 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>Cash Sale (Kaash)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSaleType('CREDIT');
                setIsCustomRecordedAmount(false);
              }}
              className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                saleType === 'CREDIT'
                  ? 'bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <span>Credit / Debt (Deyn)</span>
            </button>
          </div>
        </div>

        {/* Animated Cart Items List with Product Photo Thumbnails */}
        <div className="max-h-[32dvh] min-h-24 flex-1 overflow-y-auto p-2.5 space-y-2 scrollbar-thin lg:max-h-none">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs">
              <ShoppingCart className="w-8 h-8 text-emerald-500/40 stroke-1.5 mb-2" />
              <span className="font-bold text-slate-500">Cart is Empty</span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Tap products on the left or scan a barcode
              </span>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {cart.map((item) => {
                const itemAmount = item.unitPrice * item.quantity;
                return (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: 16, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -16, scale: 0.95 }}
                    transition={{ duration: 0.16 }}
                    className="p-2 rounded-xl bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/8 dark:border-white/8 flex items-center justify-between gap-2.5"
                  >
                    {/* Product Photo Thumbnail + Name + Unit Price × Quantity */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={item.image || DEFAULT_FALLBACK_IMAGE}
                        alt={item.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_FALLBACK_IMAGE;
                        }}
                        className="w-10 h-10 rounded-lg object-cover border border-emerald-950/10 dark:border-white/10 flex-shrink-0 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {formatCurrency(item.unitPrice)} × {item.quantity} ={' '}
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(itemAmount)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity (+ / -) & Delete */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex items-center bg-white dark:bg-[#0b110e] border border-emerald-950/10 dark:border-white/10 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="p-1 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-extrabold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="p-1 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Simplified Tax, Discount, Clear Financial Summary & Somali Payment Methods */}
        <div className="p-3 border-t border-emerald-950/10 dark:border-white/10 bg-[#f8faf9] dark:bg-[#0b110e] space-y-2.5">
          {/* Single Tax Toggle (Tax / Canshuur) & Discount (Qiimo Dhimis) */}
          <div className="flex flex-col items-stretch justify-between gap-2 text-xs sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-1.5 sm:justify-start">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={(e) => setTaxEnabled(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Tax / Canshuur
                </span>
              </label>
              {taxEnabled && (
                <div className="flex items-center gap-0.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={customTaxRate}
                    onChange={(e) => setCustomTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-12 px-1.5 py-0.5 bg-white dark:bg-[#141e19] border border-emerald-500/40 rounded text-center font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300"
                  />
                  <span className="text-[11px] font-mono font-bold text-slate-500">%</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="pos-discount" className="text-slate-500 font-bold text-[11px]">Discount (Qiimo Dhimis):</label>
              <input
                id="pos-discount"
                type="number"
                min="0"
                step="0.01"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-18 px-2 py-0.5 bg-white dark:bg-[#141e19] border border-emerald-950/15 dark:border-white/15 rounded-lg text-right font-mono text-xs font-bold"
              />
            </div>
          </div>

          {/* Clear Financial Summary Breakdown */}
          <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1.5 border-t border-emerald-950/8 dark:border-white/8">
            <div className="flex justify-between">
              <span>Products Amount (Wadarta Badeecada):</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {formatCurrency(subtotal)}
              </span>
            </div>

            {validDiscount > 0 && (
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Discount (Qiimo Dhimis):</span>
                <span className="font-mono font-bold">-{formatCurrency(validDiscount)}</span>
              </div>
            )}

            {taxEnabled && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Tax Amount ({effectiveTaxRatePct}%):</span>
                <span className="font-mono font-bold">+{formatCurrency(taxTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 dark:text-white pt-1.5 border-t border-emerald-950/10 dark:border-white/10">
              <span>Total Amount (Wadarta Guud):</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono text-base sm:text-lg">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {/* Somali Retail Payment Methods */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] font-extrabold">
            {somaliPaymentMethods.map((method) => {
              const active = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-1.5 px-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-white dark:bg-[#141e19] text-slate-700 dark:text-slate-300 border-emerald-950/10 dark:border-white/10 hover:border-emerald-500/40'
                  }`}
                >
                  {active && <Check className="w-3 h-3 stroke-[3] flex-shrink-0" />}
                  <span className="truncate">{method.label}</span>
                </button>
              );
            })}
          </div>

          {/* Recorded Amount (Lacagta La Qabtay) & Due / Balance Remaining (Haraaga) vs Change to Return (Baaqiga) */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase mb-0.5">
                Recorded Amount (Lacagta La Qabtay)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={recordedAmountInput}
                onChange={(e) => {
                  setIsCustomRecordedAmount(true);
                  setRecordedAmountInput(e.target.value);
                }}
                placeholder={grandTotal.toFixed(2)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#141e19] border border-emerald-500/35 rounded-xl text-xs font-mono font-extrabold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              {isPartialOrCreditDue ? (
                <>
                  <label className="block text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase mb-0.5">
                    Due / Balance (Haraaga / Deyn)
                  </label>
                  <div className="px-2.5 py-1.5 bg-rose-500/12 border border-rose-500/35 rounded-xl text-xs font-mono font-extrabold text-rose-600 dark:text-rose-400">
                    {formatCurrency(dueBalanceRemaining)}
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase mb-0.5">
                    Change to Return (Baaqiga)
                  </label>
                  <div className="px-2.5 py-1.5 bg-emerald-500/12 border border-emerald-500/30 rounded-xl text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(changeToReturn)}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Checkout Submit Button */}
          <motion.button
            whileHover={{ y: -1, scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCheckout}
            disabled={checkoutLoading || cart.length === 0}
            className={`w-full py-2.5 rounded-xl font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              saleType === 'CREDIT' || isPartialOrCreditDue
                ? 'bg-linear-to-r from-[#e11d48] to-[#dc2626] text-white shadow-rose-600/25'
                : 'bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white shadow-emerald-600/25'
            }`}
          >
            {checkoutLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>
                  {saleType === 'CREDIT' || isPartialOrCreditDue
                    ? `Record Credit (Deyn: ${formatCurrency(dueBalanceRemaining)}) • Total ${formatCurrency(grandTotal)}`
                    : `Complete Cash Sale • ${formatCurrency(grandTotal)}`}
                </span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* CAMERA / USB BARCODE MODAL FOR POS */}
      <BarcodeCameraModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onDetected={lookupAndAddBarcode}
        title="Scan Product Barcode to Add to POS Cart"
      />

      {/* THERMAL RECEIPT / INVOICE MODAL */}
      <AnimatePresence>
        {showReceiptModal && completedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="w-full max-w-md bg-white dark:bg-[#111915] rounded-3xl shadow-2xl border border-emerald-500/30 p-6 flex flex-col max-h-[90vh] overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-[#059669] via-[#84cc16] to-[#e11d48]" />

              <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display font-extrabold text-slate-900 dark:text-white">
                    Thermal Receipt — {completedInvoice.invoiceNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Perforated Thermal Receipt Paper Body */}
              <div
                id="printable-pos-receipt"
                className="flex-1 overflow-y-auto py-4 px-3 space-y-3 font-mono text-xs border-dashed border-y-2 border-emerald-600/30 my-3 bg-[#fcfdfc] dark:bg-[#0a0f0d] rounded-xl"
              >
                <div className="text-center space-y-1">
                  <Logo size="sm" variant="full" className="justify-center mb-1" />
                  <div className="font-extrabold text-slate-900 dark:text-white">
                    {business?.name || 'Maqsuud ICT — Smart POS & Enterprise Management'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {business?.address || 'KM4 Business Hub, Mogadishu'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    EVC/WaafiPay: 0611688269 • Somtel/WaafiPay: 0621688269
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Salaam Somali Bank AccN: 38524624
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-white/15 space-y-0.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Invoice #:</span>
                    <span className="font-bold">{completedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{completedInvoice.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{completedInvoice.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(completedInvoice.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {completedInvoice.paymentMethod} ({completedInvoice.saleType})
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-white/15">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] text-slate-400">
                        <th>Item</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {completedInvoice.items.map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-1.5 font-sans text-xs font-medium">{it.name}</td>
                          <td className="py-1.5 text-center">{it.quantity}</td>
                          <td className="py-1.5 text-right">{formatCurrency(it.unitPrice)}</td>
                          <td className="py-1.5 text-right font-bold">{formatCurrency(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="pt-2 border-t border-dashed border-slate-300 dark:border-white/15 space-y-1">
                  <div className="flex justify-between">
                    <span>Products Amount (Subtotal):</span>
                    <span>{formatCurrency(completedInvoice.subtotal)}</span>
                  </div>
                  {completedInvoice.discountTotal > 0 && (
                    <div className="flex justify-between text-rose-500">
                      <span>Discount (Qiimo Dhimis):</span>
                      <span>-{formatCurrency(completedInvoice.discountTotal)}</span>
                    </div>
                  )}
                  {completedInvoice.taxTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Tax (Canshuur):</span>
                      <span>+{formatCurrency(completedInvoice.taxTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-white/10">
                    <span>TOTAL AMOUNT (WADARTA):</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(completedInvoice.grandTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Recorded Amount (La Qabtay):</span>
                    <span className="font-bold">{formatCurrency(completedInvoice.amountPaid)}</span>
                  </div>
                  {completedInvoice.balanceDue > 0 ? (
                    <div className="flex justify-between text-[11px] text-rose-600 font-bold">
                      <span>Due / Balance Remaining (Haraaga):</span>
                      <span>{formatCurrency(completedInvoice.balanceDue)}</span>
                    </div>
                  ) : (
                    completedInvoice.cashChange > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-600 font-bold">
                        <span>Change to Return (Baaqiga):</span>
                        <span>{formatCurrency(completedInvoice.cashChange)}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="pt-3 border-t border-dashed border-slate-300 dark:border-white/15 text-center text-[10px] text-slate-400">
                  {business?.receiptFooter ||
                    'Mahadsanid! EVC/WaafiPay: 0611688269 | Somtel/WaafiPay: 0621688269 | Salaam Bank AccN: 38524624'}
                </div>
              </div>

              {/* Receipt Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => exportInvoicePDF(completedInvoice, business)}
                  className="flex-1 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/25 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Download PDF</span>
                </button>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  New Sale
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
