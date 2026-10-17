import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, QrCode, X, CheckCircle, Keyboard } from 'lucide-react';

interface BarcodeCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
}

export const BarcodeCameraModal: React.FC<BarcodeCameraModalProps> = ({
  isOpen,
  onClose,
  onDetected,
  title = 'Scan Barcode / QR Code',
}) => {
  const [cameraError, setCameraError] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setManualInput('');
    setCameraError('');
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      startScanner();
    }, 150);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const el = document.getElementById('modal-barcode-reader');
      if (!el) return;
      const scanner = new Html5Qrcode('modal-barcode-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 230, height: 170 } },
        (decodedText) => {
          const clean = decodedText.trim();
          if (clean) {
            stopScanner();
            onDetected(clean);
            onClose();
          }
        },
        () => {}
      );
      isRunningRef.current = true;
    } catch (err) {
      setCameraError(
        'Camera permission not granted or no camera found. Use your USB barcode scanner gun or type below.'
      );
      isRunningRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {}
      isRunningRef.current = false;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualInput.trim();
    if (!clean) return;
    stopScanner();
    onDetected(clean);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[70] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            className="w-full max-w-md bg-white dark:bg-[#111915] rounded-3xl p-5 shadow-2xl border border-emerald-500/30 space-y-4"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-950/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display font-extrabold text-sm text-slate-900 dark:text-white">
                  {title}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Laser Reader Box */}
            <div className="relative w-full h-56 bg-[#070b09] rounded-2xl overflow-hidden border border-emerald-500/30 flex items-center justify-center">
              <div id="modal-barcode-reader" className="w-full h-full" />
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-5 text-center bg-[#070b09]/95 text-slate-300 text-xs space-y-2">
                  <Camera className="w-8 h-8 text-emerald-500/60" />
                  <p>{cameraError}</p>
                </div>
              )}
            </div>

            {/* USB Barcode Gun / Manual Input */}
            <form onSubmit={handleManualSubmit} className="space-y-2">
              <label className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                <Keyboard className="w-3.5 h-3.5" />
                <span>USB Laser Gun Active — Scan or Type Barcode:</span>
              </label>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Trigger USB scanner gun or type barcode..."
                  className="flex-1 px-3.5 py-2 bg-[#f8faf9] dark:bg-black/40 border border-emerald-500/40 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-linear-to-r from-[#059669] to-[#16a34a] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Use Code</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
