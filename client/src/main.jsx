import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Fonts are bundled with the app (no Google Fonts request): faster first paint, and the phone app
// opens the same with a slow or no connection.
import "@fontsource-variable/figtree";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/fraunces/opsz-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./styles/index.css";
import App from "./app/App.jsx";
import { initNativeShell } from "./lib/native.js";

initNativeShell();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
