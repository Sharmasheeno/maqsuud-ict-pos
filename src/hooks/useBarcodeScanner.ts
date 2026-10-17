import { useEffect, useRef } from 'react';

interface UseBarcodeScannerOptions {
  enabled?: boolean;
  onScan: (barcode: string) => void;
  minLength?: number;
  maxIntervalMs?: number;
  captureInInputs?: boolean;
}

/**
 * Global listener for physical USB / Bluetooth laser barcode scanners.
 * Hardware barcode guns emit rapid keystrokes (< 45ms apart) followed by 'Enter'.
 */
export function useBarcodeScanner({
  enabled = true,
  onScan,
  minLength = 3,
  maxIntervalMs = 60,
  captureInInputs = false,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputTarget =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      // If user is typing in a normal input and captureInInputs is false, skip
      if (isInputTarget && !captureInInputs) {
        return;
      }

      const now = Date.now();
      const timeDiff = now - lastKeyTimeRef.current;

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength && timeDiff <= maxIntervalMs * 2.5) {
          e.preventDefault();
          e.stopPropagation();
          const scanned = bufferRef.current.trim();
          bufferRef.current = '';
          if (scanned) {
            onScanRef.current(scanned);
          }
        } else {
          bufferRef.current = '';
        }
        return;
      }

      // Printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (timeDiff > maxIntervalMs) {
          bufferRef.current = e.key;
        } else {
          bufferRef.current += e.key;
        }
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minLength, maxIntervalMs, captureInInputs]);
}
