"use client";

import * as React from "react";
import {
  loadPrinterConfig,
  savePrinterConfig,
  type PrinterConfig,
} from "@/lib/printer-storage";
import { buildReceiptBytes, type ReceiptData } from "@/lib/pos-receipt";
import { apiFetch } from "@/lib/api-client";

// ── Printer status ────────────────────────────────────────────────────────────
export type PrinterStatus = "idle" | "connecting" | "connected" | "printing" | "error";

// ── Known Bluetooth service / characteristic UUID pairs ───────────────────────
// Covers the most common OEM thermal printer chipsets.
const BT_PROFILES = [
  // Standard POS printer service (Epson, Star, Bixolon, etc.)
  {
    service:        "000018f0-0000-1000-8000-00805f9b34fb",
    characteristic: "00002af1-0000-1000-8000-00805f9b34fb",
  },
  // Xprinter / GOOJPRT / ZJ-5805 / ZJ-5808
  {
    service:        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    characteristic: "bef8d6c9-9c21-4c9e-b632-bd58c1009f9f",
  },
  // Generic SPP-over-BLE bridge
  {
    service:        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    characteristic: "49535343-1e4d-4bd9-ba61-23c647249616",
  },
];

// All service UUIDs passed as optionalServices so the browser grants access.
const BT_SERVICE_UUIDS = BT_PROFILES.map((p) => p.service);

// BLE MTU-safe chunk size (200 bytes works with all BLE 4.2+ devices)
const BLE_CHUNK = 200;

// ── Hook return type ──────────────────────────────────────────────────────────
export interface POSPrinterHook {
  status: PrinterStatus;
  error: string | null;
  config: PrinterConfig;
  isConnected: boolean;
  isBluetoothSupported: boolean;
  pairBluetooth: () => Promise<void>;
  reconnectBluetooth: () => Promise<void>;
  disconnectBluetooth: () => void;
  print: (data: ReceiptData) => Promise<void>;
  updateConfig: (patch: Partial<PrinterConfig>) => void;
}

// ── Internal GATT state ───────────────────────────────────────────────────────
interface GattHandle {
  server: BluetoothRemoteGATTServer;
  char: BluetoothRemoteGATTCharacteristic;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function usePOSPrinter(token: string | null): POSPrinterHook {
  const [config, setConfigState] = React.useState<PrinterConfig>(
    () => loadPrinterConfig()
  );
  const [status, setStatus] = React.useState<PrinterStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const gatt = React.useRef<GattHandle | null>(null);

  const isBluetoothSupported =
    typeof navigator !== "undefined" && "bluetooth" in navigator;

  // ── Auto-reconnect / mark network as ready on mount ──────────────────────
  React.useEffect(() => {
    const cfg = loadPrinterConfig();
    if (cfg.printerType === "bluetooth" && cfg.btDeviceId && isBluetoothSupported) {
      reconnectBluetooth().catch(() => {
        // Silent fail — user can manually reconnect from settings
      });
    }
    if (cfg.printerType === "network" && cfg.networkIp) {
      setStatus("connected");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Config updater ────────────────────────────────────────────────────────
  function updateConfig(patch: Partial<PrinterConfig>): void {
    savePrinterConfig(patch);
    setConfigState((prev) => ({ ...prev, ...patch }));
    // Network printers are always "connected" (stateless TCP per request)
    if (patch.printerType === "network" || (patch.networkIp && config.printerType === "network")) {
      setStatus("connected");
    }
  }

  // ── Find a working GATT characteristic across known profiles ─────────────
  async function findChar(
    server: BluetoothRemoteGATTServer
  ): Promise<BluetoothRemoteGATTCharacteristic> {
    for (const profile of BT_PROFILES) {
      try {
        const svc = await server.getPrimaryService(profile.service);
        const ch = await svc.getCharacteristic(profile.characteristic);
        return ch;
      } catch {
        // Try next profile
      }
    }
    throw new Error(
      "No compatible print service found — is this a supported ESC/POS printer?"
    );
  }

  // ── Write bytes to BLE char in MTU-safe chunks ───────────────────────────
  async function writeChunked(
    ch: BluetoothRemoteGATTCharacteristic,
    data: Uint8Array
  ): Promise<void> {
    for (let i = 0; i < data.length; i += BLE_CHUNK) {
      await ch.writeValue(data.slice(i, i + BLE_CHUNK));
    }
  }

  // ── Pair a new Bluetooth device ───────────────────────────────────────────
  async function pairBluetooth(): Promise<void> {
    if (!isBluetoothSupported) {
      throw new Error("Web Bluetooth is not supported in this browser");
    }
    setStatus("connecting");
    setError(null);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_SERVICE_UUIDS,
      });

      const server = await device.gatt!.connect();
      const ch = await findChar(server);
      gatt.current = { server, char: ch };

      const patch: Partial<PrinterConfig> = {
        printerType:  "bluetooth",
        btDeviceId:   device.id,
        btDeviceName: device.name ?? "Bluetooth Printer",
      };
      savePrinterConfig(patch);
      setConfigState((prev) => ({ ...prev, ...patch }));
      setStatus("connected");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to pair printer";
      setStatus("error");
      setError(msg);
      throw err;
    }
  }

  // ── Reconnect to the previously paired device ─────────────────────────────
  async function reconnectBluetooth(): Promise<void> {
    if (!isBluetoothSupported) return;
    const cfg = loadPrinterConfig();
    if (!cfg.btDeviceId) return;

    setStatus("connecting");
    setError(null);
    try {
      // getDevices() returns only devices the user has previously permitted
      const devices: BluetoothDevice[] = await (
        navigator.bluetooth as unknown as {
          getDevices(): Promise<BluetoothDevice[]>;
        }
      ).getDevices();

      const device = devices.find((d) => d.id === cfg.btDeviceId);
      if (!device) {
        throw new Error(
          "Paired printer not found — please re-pair in settings"
        );
      }

      const server = await device.gatt!.connect();
      const ch = await findChar(server);
      gatt.current = { server, char: ch };

      // Update display name in case it changed
      if (device.name && device.name !== cfg.btDeviceName) {
        savePrinterConfig({ btDeviceName: device.name });
        setConfigState((prev) => ({ ...prev, btDeviceName: device.name ?? prev.btDeviceName }));
      }

      setStatus("connected");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reconnect failed";
      setStatus("error");
      setError(msg);
    }
  }

  // ── Disconnect Bluetooth ──────────────────────────────────────────────────
  function disconnectBluetooth(): void {
    gatt.current?.server?.disconnect();
    gatt.current = null;
    setStatus("idle");
    setError(null);
  }

  // ── Send bytes over network via backend TCP proxy ─────────────────────────
  async function printNetwork(bytes: Uint8Array): Promise<void> {
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...Array.from(bytes)));
    await apiFetch("/print/pos", {
      method: "POST",
      token,
      body: {
        ip:   config.networkIp,
        port: config.networkPort || 9100,
        data: base64,
      },
    });
  }

  // ── Send bytes over Bluetooth GATT ────────────────────────────────────────
  async function printBluetooth(bytes: Uint8Array): Promise<void> {
    // Auto-reconnect if GATT dropped (e.g. after page refresh)
    if (!gatt.current?.server?.connected) {
      await reconnectBluetooth();
    }
    const ch = gatt.current?.char;
    if (!ch) throw new Error("Printer not connected");
    await writeChunked(ch, bytes);
  }

  // ── Unified print entry point ─────────────────────────────────────────────
  async function print(data: ReceiptData): Promise<void> {
    const cfg = loadPrinterConfig(); // always read fresh from localStorage
    if (!cfg.printerType) throw new Error("No printer configured");

    setStatus("printing");
    setError(null);
    try {
      const bytes = buildReceiptBytes({ ...data, paperWidth: cfg.paperWidth });

      if (cfg.printerType === "bluetooth") {
        await printBluetooth(bytes);
      } else {
        await printNetwork(bytes);
      }
      setStatus("connected");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Print failed";
      setStatus("error");
      setError(msg);
      throw err;
    }
  }

  return {
    status,
    error,
    config,
    isConnected: status === "connected" || status === "printing",
    isBluetoothSupported,
    pairBluetooth,
    reconnectBluetooth,
    disconnectBluetooth,
    print,
    updateConfig,
  };
}
