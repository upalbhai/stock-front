"use client";

import * as React from "react";

export type AppSettings = {
  taxEnabled: boolean;
  gstEnabled: boolean;
  offlineMode: boolean;
};

const SETTINGS_KEY = "outlet-settings";

const defaultSettings: AppSettings = {
  taxEnabled: true,
  gstEnabled: false,
  offlineMode: true
};

type SettingsContextValue = {
  settings: AppSettings;
  updateSettings: (changes: Partial<AppSettings>) => void;
};

const SettingsContext = React.createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(defaultSettings);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(raw) });
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  const updateSettings = React.useCallback((changes: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...changes };
      if (typeof window !== "undefined") {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = React.useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
}
