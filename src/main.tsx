import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";

// Redirect any non-production domain to kloversegy.com
const CANONICAL = "kloversegy.com";
if (
  typeof window !== "undefined" &&
  window.location.hostname !== CANONICAL &&
  window.location.hostname !== "localhost" &&
  !window.location.hostname.includes("127.0.0.1")
) {
  window.location.replace(
    `https://${CANONICAL}${window.location.pathname}${window.location.search}${window.location.hash}`
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
