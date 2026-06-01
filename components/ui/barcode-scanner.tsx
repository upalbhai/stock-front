"use client";

import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Modal } from "./modal";

export function BarcodeScannerModal({ open, onClose, onScan }: { open: boolean; onClose: () => void; onScan: (code: string) => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (open) {
      // Create scanner instance only when open
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 150 } },
        /* verbose= */ false
      );
      scannerRef.current.render(
        (decodedText) => {
          // Play a small beep if possible, then call onScan
          try {
             const audio = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU");
             audio.play().catch(() => {});
          } catch(e) {}

          onScan(decodedText);
          onClose(); // Auto close on successful scan
        },
        (error) => {
          // Ignore general scan errors (happens constantly until a barcode is found)
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        scannerRef.current = null;
      }
    };
  }, [open, onScan, onClose]);

  return (
    <Modal open={open} onClose={onClose} title="Scan Barcode" size="md">
      <div id="qr-reader" className="w-full"></div>
    </Modal>
  );
}
