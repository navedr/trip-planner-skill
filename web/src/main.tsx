import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KonstaProvider } from "konsta/react";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { App } from "@/App";
import "./globals.css";

// In dev, proactively unregister any SW left over from a previous `devOptions.enabled: true`
// build so it can't serve stale JS while iterating.
if (import.meta.env.DEV && "serviceWorker" in navigator) {
  (async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    const hadSw = regs.length > 0;
    await Promise.all(regs.map((r) => r.unregister()));
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    // If we just tore down a stale SW, reload so the next request bypasses it.
    if (hadSw) window.location.reload();
  })();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <KonstaProvider theme="ios" dark>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </BrowserRouter>
      </KonstaProvider>
    </QueryClientProvider>
  </StrictMode>,
);
