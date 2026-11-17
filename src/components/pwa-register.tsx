"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    // Production only — a dev-mode SW caches Turbopack chunks and serves
    // stale CSS/JS after edits (breaks hot reload).
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    } else if ("serviceWorker" in navigator) {
      // Dev: unregister any previously-registered worker + clear its caches
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
    }
  }, []);
  return null;
}
