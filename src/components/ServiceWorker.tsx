"use client";

import { useEffect } from "react";

// Registra o service worker para permitir instalar o app e abrir offline.
export default function ServiceWorker() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Falha ao registrar o SW não deve quebrar o app.
    });
  }, []);

  return null;
}
