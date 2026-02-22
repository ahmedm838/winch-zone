import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTheme } from "./lib/theme";

initTheme();


// Fix Supabase recovery links on HashRouter:
// Supabase appends tokens in a fragment (#access_token=...), which would break HashRouter paths.
// Convert the second '#' into '?' so the route stays "/reset" and tokens become query params inside the hash.
function normalizeSupabaseHash() {
  const h = window.location.hash || "";
  const idx = h.indexOf("#access_token=");
  if (idx !== -1) {
    const newHash = h.slice(0, idx) + "?" + h.slice(idx + 1);
    window.history.replaceState(null, "", window.location.pathname + window.location.search + newHash);
  }
}

normalizeSupabaseHash();


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
