"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { store, persistor } from "@/store/store";
import { AuthProvider } from "@/components/auth/auth-provider";
import { SettingsProvider } from "@/components/settings/settings-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1
          }
        }
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <SettingsProvider>
                {children}
                <Toaster position="top-right" toastOptions={{ style: { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" } }} />
              </SettingsProvider>
            </AuthProvider>
          </QueryClientProvider>
        </PersistGate>
      </Provider>
    </ThemeProvider>
  );
}
