"use client";

import * as React from "react";
import {
  Bluetooth,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  Printer,
  RotateCcw,
  Unplug,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { POSPrinterHook, PrinterStatus } from "@/hooks/use-pos-printer";
import type { PaperWidth } from "@/lib/printer-storage";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, error }: { status: PrinterStatus; error: string | null }) {
  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Connecting…
      </span>
    );
  }
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Connected
      </span>
    );
  }
  if (status === "printing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400">
        <Loader2 className="h-3 w-3 animate-spin" /> Printing…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
        <XCircle className="h-3 w-3" /> {error ?? "Error"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Not connected
    </span>
  );
}

// ── Paper width selector ──────────────────────────────────────────────────────
function PaperWidthSelector({
  value,
  onChange,
}: {
  value: PaperWidth;
  onChange: (w: PaperWidth) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Paper width</p>
      <div className="flex gap-2">
        {([58, 80] as PaperWidth[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => onChange(w)}
            className={cn(
              "flex-1 rounded-lg border py-2 text-sm font-medium transition",
              value === w
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
            )}
          >
            {w} mm
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
interface PrinterSettingsModalProps {
  open: boolean;
  onClose: () => void;
  printer: POSPrinterHook;
}

export function PrinterSettingsModal({
  open,
  onClose,
  printer,
}: PrinterSettingsModalProps) {
  const { status, error, config, isBluetoothSupported } = printer;

  // Local network form state (committed on Save)
  const [networkIp, setNetworkIp] = React.useState(config.networkIp);
  const [networkPort, setNetworkPort] = React.useState(
    String(config.networkPort || 9100)
  );
  const [testPending, setTestPending] = React.useState(false);

  // Sync local state when config changes externally (e.g. on open)
  React.useEffect(() => {
    if (open) {
      setNetworkIp(config.networkIp);
      setNetworkPort(String(config.networkPort || 9100));
    }
  }, [open, config.networkIp, config.networkPort]);

  function saveNetwork() {
    printer.updateConfig({
      printerType: "network",
      networkIp: networkIp.trim(),
      networkPort: Number(networkPort) || 9100,
    });
  }

  async function testPrint() {
    setTestPending(true);
    try {
      saveNetwork();
      // Wait a tick so config updates propagate
      await new Promise((r) => setTimeout(r, 50));
      await printer.print({
        businessName: "Test Print",
        orderNumber: "TEST-001",
        createdAt: new Date().toISOString(),
        items: [{ name: "Test Item", qty: 1, price: 10, lineTotal: 10 }],
        subtotal: 10,
        discount: 0,
        tax: 0,
        total: 10,
        paymentMethod: "cash",
        amountPaid: 10,
        amountDue: 0,
        isWholesale: false,
        paperWidth: config.paperWidth,
      });
    } catch {
      // error is already set in printer.error state
    } finally {
      setTestPending(false);
    }
  }

  const activeTab =
    config.printerType === "bluetooth" ? "bluetooth" : "network";

  return (
    <Modal open={open} onClose={onClose} title="Printer Settings" size="sm">
      <div className="space-y-4">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <StatusBadge status={status} error={error} />
          {config.printerType === "bluetooth" && config.btDeviceName && (
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">
              {config.btDeviceName}
            </span>
          )}
          {config.printerType === "network" && config.networkIp && (
            <span className="text-xs text-muted-foreground">
              {config.networkIp}:{config.networkPort}
            </span>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue={activeTab}>
          <TabsList className="w-full">
            <TabsTrigger value="bluetooth" className="flex-1 gap-1.5">
              <Bluetooth className="h-3.5 w-3.5" /> Bluetooth
            </TabsTrigger>
            <TabsTrigger value="network" className="flex-1 gap-1.5">
              <Wifi className="h-3.5 w-3.5" /> Network (LAN)
            </TabsTrigger>
          </TabsList>

          {/* ── Bluetooth tab ── */}
          <TabsContent value="bluetooth" className="mt-4 space-y-3">
            {!isBluetoothSupported && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                Web Bluetooth is not available in this browser. Use Chrome or
                Edge on desktop/Android.
              </p>
            )}

            {config.btDeviceId ? (
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {config.btDeviceName ?? "Bluetooth Printer"}
                    </p>
                    <p className="text-xs text-muted-foreground">Paired device</p>
                  </div>
                  <Printer className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => printer.reconnectBluetooth()}
                    disabled={status === "connecting" || status === "printing"}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reconnect
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs text-destructive hover:text-destructive"
                    onClick={() => {
                      printer.disconnectBluetooth();
                      printer.updateConfig({
                        printerType: null,
                        btDeviceId: null,
                        btDeviceName: null,
                      });
                    }}
                  >
                    <Unplug className="h-3.5 w-3.5" /> Unpair
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={() => printer.pairBluetooth()}
                disabled={!isBluetoothSupported || status === "connecting"}
              >
                {status === "connecting" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bluetooth className="h-4 w-4" />
                )}
                {status === "connecting" ? "Pairing…" : "Pair Bluetooth Printer"}
              </Button>
            )}

            {error && config.printerType === "bluetooth" && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </TabsContent>

          {/* ── Network tab ── */}
          <TabsContent value="network" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Connect to a thermal printer on your local network or WiFi. Most
              printers use port 9100.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Printer IP address
              </label>
              <Input
                placeholder="e.g. 192.168.1.50"
                value={networkIp}
                onChange={(e) => setNetworkIp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Port
              </label>
              <Input
                type="number"
                placeholder="9100"
                value={networkPort}
                onChange={(e) => setNetworkPort(e.target.value)}
                className="w-28"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveNetwork}>
                Save
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={testPrint}
                disabled={!networkIp.trim() || testPending || status === "printing"}
              >
                {testPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Test Print
              </Button>
            </div>

            {error && config.printerType === "network" && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
          </TabsContent>
        </Tabs>

        {/* ── Common settings ── */}
        <div className="space-y-3 border-t border-border pt-3">
          <PaperWidthSelector
            value={config.paperWidth}
            onChange={(w) => printer.updateConfig({ paperWidth: w })}
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-print after billing</p>
              <p className="text-xs text-muted-foreground">
                Automatically print receipt when bill is placed
              </p>
            </div>
            <Switch
              checked={config.autoPrint}
              onCheckedChange={(v) => printer.updateConfig({ autoPrint: v })}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
