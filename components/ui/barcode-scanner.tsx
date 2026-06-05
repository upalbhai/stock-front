"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, X, RefreshCcw } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const regionId = "html5qr-code-full-region";

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [open]);

  const startScanner = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        setHasPermission(true);
        // Default to the back camera if available
        const backCamera = devices.find((d) => d.label.toLowerCase().includes("back"));
        const cameraId = activeCameraId || (backCamera ? backCamera.id : devices[0].id);
        setActiveCameraId(cameraId);

        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode(regionId, {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_128,
            ],
            verbose: false,
          });
        }

        await scannerRef.current.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Stop scanning and call the callback
            stopScanner();
            onScan(decodedText);
          },
          (errorMessage) => {
            // Ignore scan errors, as they happen continuously until a barcode is found
          }
        );
        setIsScanning(true);
      } else {
        setHasPermission(false);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current
        .stop()
        .then(() => {
          setIsScanning(false);
          scannerRef.current?.clear();
        })
        .catch((err) => console.error("Failed to stop scanner", err));
    }
  };

  const switchCamera = () => {
    if (cameras.length > 1 && activeCameraId) {
      const currentIndex = cameras.findIndex((c) => c.id === activeCameraId);
      const nextIndex = (currentIndex + 1) % cameras.length;
      stopScanner();
      setActiveCameraId(cameras[nextIndex].id);
      setTimeout(() => startScanner(), 300);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Scan Barcode" size="md">
      <div className="flex flex-col items-center justify-center space-y-4 py-4">
        {hasPermission === false ? (
          <div className="text-center text-danger p-4 bg-danger/10 rounded-lg">
            <Camera className="mx-auto h-8 w-8 mb-2 opacity-80" />
            <p className="font-medium">Camera access denied</p>
            <p className="text-sm mt-1">Please allow camera access in your browser settings to use the scanner.</p>
          </div>
        ) : (
          <div className="w-full relative overflow-hidden rounded-xl bg-black border border-border">
            <div id={regionId} className="w-full min-h-[300px]"></div>
            
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-all z-10"
                title="Switch Camera"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
            )}
            
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              {/* Target overlay */}
              <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex w-full justify-between mt-4 gap-3">
          <p className="text-xs text-muted flex-1">Point your camera at a barcode or QR code.</p>
          <Button variant="outline" onClick={onClose} size="sm">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
