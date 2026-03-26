import { createRoot } from "react-dom/client";
import App from "./App";
import { PanelSettingsProvider } from "./contexts/PanelSettingsContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <PanelSettingsProvider>
    <App />
  </PanelSettingsProvider>
);
