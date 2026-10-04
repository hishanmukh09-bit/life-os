import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import { TRPCProvider } from "@/providers/trpc";
import { AppThemeProvider } from "@/providers/theme";
import App from "./App.tsx";

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is a bonus — never block the app on it */
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <AppThemeProvider>
          <App />
        </AppThemeProvider>
      </TRPCProvider>
    </BrowserRouter>
  </StrictMode>,
);
