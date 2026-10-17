import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode';
import {
  Camera,
  CameraOff,
  QrCode,
  Search,
  ShoppingCart,
  Download,
  Printer,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Boxes,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/apiService';

export const QRScannerPage: React.FC = () => {
  const { formatCurrency, addToast, setActivePage } = useApp();

  const [activeTab, setActiveTab] = useState<'scanner' | 'generator'>('scanner');
  const [products, setProducts] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [selectedProductForQR, setSelectedProductForQR] = useState<any | null>(null);
  const [generatedQRUrl, setGeneratedQRUrl] = useState<string>('');
  const [batchQRList, setBatchQRList] = useState<{ product: any; qrDataUrl: string }[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimestamp = useRef<number>(0);
  const cooldownMs = 1500;

  useEffect(() => {
    loadProducts();
    return () => {
      stopCamera();
    };
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      if (res.success && res.products) {
        setProducts(res.products);
        if (res.products.length > 0) {
          handleSelectProductForQR(res.products[0]);
        }
      }
    } catch (err) {
      console.error('Error loading products for QR scanner:', err);
    }
  };

  const startCamera = async () => {
    setCameraError('');
    try {
      const scanner = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        onScanFailure
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error('Camera start error:', err);
      setCameraError(
        'Unable to access camera. Please check browser permissions, or enter the code manually below.'
      );
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // Already stopped
      }
      setIsScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTimestamp.current < cooldownMs) {
      return;
    }
    lastScanTimestamp.current = now;
    validateAndLookupProduct(decodedText);
  };

  const onScanFailure = () => {};

  const validateAndLookupProduct = async (code: string) => {
    const trimmed = code.trim();
    try {
      const res = await api.scanQRCode(trimmed);
      if (res.success && res.product) {
        setScannedProduct(res.product);
        setRecentScans((prev) => [res.product, ...prev.filter((p) => p.id !== res.product.id)].slice(0, 8));
        addToast(`Found: ${res.product.name} (${res.product.sku})`, 'success');
      }
    } catch (err: any) {
      addToast(err.message || `No item matches barcode "${trimmed}"`, 'error');
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      validateAndLookupProduct(manualCode.trim());
      setManualCode('');
    }
  };

  const handleSelectProductForQR = async (product: any) => {
    setSelectedProductForQR(product);
    try {
      const url = await QRCode.toDataURL(product.qrCode || product.sku, {
        width: 320,
        margin: 2,
        color: {
          dark: '#070b09',
          light: '#ffffff',
        },
      });
      setGeneratedQRUrl(url);
    } catch (err) {
      console.error('QR Gen error:', err);
    }
  };

  const handleGenerateBatchQRs = async () => {
    const list: { product: any; qrDataUrl: string }[] = [];
    for (const prod of products.slice(0, 12)) {
      try {
        const dataUrl = await QRCode.toDataURL(prod.qrCode || prod.sku, {
          width: 200,
          margin: 1,
        });
        list.push({ product: prod, qrDataUrl: dataUrl });
      } catch (e) {}
    }
    setBatchQRList(list);
    addToast(`Generated ${list.length} batch QR labels ready for printing`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Page Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Optical QR Scanner &amp; Label Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Scan physical tags via camera, USB laser barcode readers, or print Maqsuud ICT shelf labels
          </p>
        </div>

        <div className="bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 p-1 rounded-xl flex items-center text-xs font-extrabold">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Laser Camera Scanner</span>
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('generator');
            }}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'bg-linear-to-r from-[#059669] to-[#16a34a] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Generate Labels</span>
          </button>
        </div>
      </div>

      {activeTab === 'scanner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Viewport (7 Cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#111915] rounded-3xl border border-emerald-950/10 dark:border-white/10 shadow-xs p-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                  Optical Laser Reader Viewport
                </h3>
              </div>

              {isScanning ? (
                <button
                  onClick={stopCamera}
                  className="px-3.5 py-1.5 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-rose-500/25"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  <span>Stop Camera</span>
                </button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm shadow-emerald-600/25"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </motion.button>
              )}
            </div>

            {/* Video Viewport Box with Glowing Emerald/Crimson Corner Brackets & Animated Laser Line */}
            <div className="relative w-full max-w-md aspect-square bg-[#f1f6f3] dark:bg-[#050807] rounded-2xl overflow-hidden border border-emerald-500/30 flex items-center justify-center">
              <div id="qr-reader-container" className="w-full h-full" />

              {/* Glowing Corner Targeting Brackets */}
              <div className="pointer-events-none absolute inset-6 z-20">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 dark:border-emerald-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-rose-500 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-rose-500 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 dark:border-emerald-400 rounded-br-xl" />

                {/* Oscillating Laser Scan-Line */}
                <motion.div
                  animate={{ top: ['8%', '88%', '8%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-2 right-2 h-0.5 bg-linear-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#e11d48]"
                />
              </div>

              {!isScanning && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center text-slate-600 dark:text-slate-400 bg-white/90 dark:bg-[#060a08]/90 backdrop-blur-xs">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/12 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Optical Sensor Standby</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Click &ldquo;Activate Camera&rdquo; to scan QR codes or barcodes, or use the manual SKU input below.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={startCamera}
                    className="mt-4 px-5 py-2.5 bg-linear-to-r from-[#059669] via-[#16a34a] to-[#65a30d] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/30"
                  >
                    Activate Camera
                  </motion.button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="mt-3 p-3 w-full bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Manual Product Search Bar */}
            <div className="mt-5 w-full pt-4 border-t border-emerald-950/8 dark:border-white/8">
              <div className="text-xs font-bold text-slate-500 mb-2">
                Manual SKU Lookup / USB Barcode Gun Input:
              </div>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Type SKU or QR (e.g. SAM-A55-128, QR-ANK-20K)..."
                    className="w-full pl-9 pr-3 py-2 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold shadow-sm"
                >
                  Lookup
                </button>
              </form>
            </div>
          </div>

          {/* Scanned Result Card & History (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {scannedProduct ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-3xl bg-white dark:bg-[#111915] border-2 border-emerald-500 shadow-lg"
              >
                <div className="flex items-center justify-between pb-3 border-b border-emerald-950/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Scanned SKU Verified</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                    {scannedProduct.sku}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {scannedProduct.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Category: {scannedProduct.category}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/8 dark:border-white/8">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Selling Price</div>
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(scannedProduct.sellingPrice)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/8 dark:border-white/8">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Available Stock</div>
                    <div
                      className={`text-lg font-black font-mono ${
                        scannedProduct.stock > 0 ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {scannedProduct.stock} {scannedProduct.unit}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActivePage('pos')}
                  className="w-full py-2.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Open in POS Terminal</span>
                </button>
              </motion.div>
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#111915] border border-emerald-950/10 dark:border-white/10 text-center text-slate-400">
                <Boxes className="w-10 h-10 mx-auto stroke-1 text-emerald-500/50 mb-2" />
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ready to Detect Product
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Point camera at QR label or enter SKU code manually
                </p>
              </div>
            )}

            {/* Recent Scans Session */}
            <div className="p-4 bg-white dark:bg-[#111915] rounded-3xl border border-emerald-950/10 dark:border-white/10">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-3">
                Recent Scanned Session
              </h4>
              {recentScans.length === 0 ? (
                <div className="text-[11px] text-slate-400 py-3 text-center">No scans yet</div>
              ) : (
                <div className="space-y-2">
                  {recentScans.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setScannedProduct(p)}
                      className="p-2.5 rounded-xl bg-[#f8faf9] dark:bg-[#141e19] flex items-center justify-between text-xs hover:border-emerald-500 cursor-pointer border border-transparent transition-all"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </div>
                      <div className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(p.sellingPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: QR CODE GENERATOR & PRINT LABELS */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Select Product & Preview (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#111915] rounded-3xl border border-emerald-950/10 dark:border-white/10 p-5 space-y-4">
            <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
              Maqsuud ICT Product QR Label Generator
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">
                Select Catalog Product:
              </label>
              <select
                value={selectedProductForQR?.id || ''}
                onChange={(e) => {
                  const p = products.find((item) => item.id === e.target.value);
                  if (p) handleSelectProductForQR(p);
                }}
                className="w-full p-2.5 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-xs font-bold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {selectedProductForQR && generatedQRUrl && (
              <div className="p-4 bg-[#f8faf9] dark:bg-[#141e19] rounded-2xl border border-emerald-950/10 dark:border-white/10 flex flex-col items-center text-center">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-500/20">
                  <img src={generatedQRUrl} alt="Product QR" className="w-48 h-48" />
                </div>
                <div className="mt-3 font-extrabold text-xs text-slate-900 dark:text-white">
                  {selectedProductForQR.name}
                </div>
                <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {selectedProductForQR.sku} • {formatCurrency(selectedProductForQR.sellingPrice)}
                </div>

                <div className="flex gap-2 mt-4 w-full">
                  <a
                    href={generatedQRUrl}
                    download={`Maqsuud_QR_${selectedProductForQR.sku}.png`}
                    className="flex-1 py-2.5 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
                  >
                    Print
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Batch Print Shelf Labels (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-[#111915] rounded-3xl border border-emerald-950/10 dark:border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                  Batch Print QR Shelf Labels
                </h3>
                <p className="text-xs text-slate-500">Print multiple sticky shelf price tags at once</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateBatchQRs}
                  className="px-3.5 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Generate All</span>
                </button>
                {batchQRList.length > 0 && (
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-[#070b09] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Sheet</span>
                  </button>
                )}
              </div>
            </div>

            {batchQRList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Click &ldquo;Generate All&rdquo; to prepare a batch sheet of printable Maqsuud ICT QR price tags
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {batchQRList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f8faf9] dark:bg-[#141e19] border border-emerald-950/10 dark:border-white/10 rounded-xl text-center space-y-1"
                  >
                    <img src={item.qrDataUrl} alt="QR" className="w-24 h-24 mx-auto rounded-lg" />
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">{item.product.sku}</div>
                    <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(item.product.sellingPrice)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
