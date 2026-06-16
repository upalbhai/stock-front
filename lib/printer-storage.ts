/**
 * printer-storage.ts
 * Persists POS printer configuration in localStorage.
 */

export type PrinterType = "bluetooth" | "network" | null;
export type PaperWidth = 58 | 80;

export interface PrinterConfig {
  printerType: PrinterType;
  btDeviceId: string | null;
  btDeviceName: string | null;
  networkIp: string;
  networkPort: number;
  paperWidth: PaperWidth;
  autoPrint: boolean;
}

const K = {
  TYPE:    "pos_printer_type",
  BT_ID:   "pos_printer_bt_id",
  BT_NAME: "pos_printer_bt_name",
  IP:      "pos_printer_ip",
  PORT:    "pos_printer_port",
  PAPER:   "pos_printer_paper",
  AUTO:    "pos_printer_auto",
} as const;

const DEFAULTS: PrinterConfig = {
  printerType:  null,
  btDeviceId:   null,
  btDeviceName: null,
  networkIp:    "",
  networkPort:  9100,
  paperWidth:   80,
  autoPrint:    false,
};

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadPrinterConfig(): PrinterConfig {
  const s = storage();
  if (!s) return { ...DEFAULTS };
  return {
    printerType:  (s.getItem(K.TYPE) as PrinterType) || null,
    btDeviceId:   s.getItem(K.BT_ID),
    btDeviceName: s.getItem(K.BT_NAME),
    networkIp:    s.getItem(K.IP) ?? "",
    networkPort:  Number(s.getItem(K.PORT) ?? 9100),
    paperWidth:   (Number(s.getItem(K.PAPER) ?? 80) as PaperWidth),
    autoPrint:    s.getItem(K.AUTO) === "true",
  };
}

export function savePrinterConfig(patch: Partial<PrinterConfig>): void {
  const s = storage();
  if (!s) return;
  if ("printerType"  in patch) s.setItem(K.TYPE,    patch.printerType  ?? "");
  if ("btDeviceId"   in patch) s.setItem(K.BT_ID,   patch.btDeviceId   ?? "");
  if ("btDeviceName" in patch) s.setItem(K.BT_NAME, patch.btDeviceName ?? "");
  if ("networkIp"    in patch) s.setItem(K.IP,       patch.networkIp    ?? "");
  if ("networkPort"  in patch) s.setItem(K.PORT,     String(patch.networkPort ?? 9100));
  if ("paperWidth"   in patch) s.setItem(K.PAPER,    String(patch.paperWidth ?? 80));
  if ("autoPrint"    in patch) s.setItem(K.AUTO,     patch.autoPrint ? "true" : "false");
}

export function clearPrinterConfig(): void {
  const s = storage();
  if (!s) return;
  Object.values(K).forEach((k) => s.removeItem(k));
}
