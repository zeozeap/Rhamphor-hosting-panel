import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface PanelSettings {
  panelName: string;
  panelTagline: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  faviconUrl: string;
  loginBg: string;
  loginTitle: string;
  loginSubtitle: string;
  loginLogoUrl: string;
  recaptchaEnabled: string;
  recaptchaSiteKey: string;
  customCss: string;
}

const DEFAULTS: PanelSettings = {
  panelName: "VortexPanel",
  panelTagline: "Minecraft Hosting Platform",
  primaryColor: "#00BCD4",
  accentColor: "#0097A7",
  logoUrl: "",
  faviconUrl: "",
  loginBg: "",
  loginTitle: "Welcome Back",
  loginSubtitle: "Sign in to your hosting account",
  loginLogoUrl: "",
  recaptchaEnabled: "false",
  recaptchaSiteKey: "",
  customCss: "",
};

interface PanelSettingsContextValue {
  settings: PanelSettings;
  reload: () => void;
}

const PanelSettingsContext = createContext<PanelSettingsContextValue>({
  settings: DEFAULTS,
  reload: () => {},
});

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyTheme(settings: PanelSettings) {
  const root = document.documentElement;
  if (settings.primaryColor && /^#[0-9a-fA-F]{6}$/.test(settings.primaryColor)) {
    const hsl = hexToHsl(settings.primaryColor);
    root.style.setProperty("--primary-hsl", hsl);
    root.style.setProperty("--primary", hsl);
  }
  if (settings.customCss) {
    let style = document.getElementById("panel-custom-css");
    if (!style) { style = document.createElement("style"); style.id = "panel-custom-css"; document.head.appendChild(style); }
    style.textContent = settings.customCss;
  }
  if (settings.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = settings.faviconUrl;
  }
  if (settings.panelName) {
    document.title = settings.panelName;
  }
}

export function PanelSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PanelSettings>(DEFAULTS);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/public");
      if (res.ok) {
        const data = await res.json();
        const merged = { ...DEFAULTS, ...data };
        setSettings(merged);
        applyTheme(merged);
      }
    } catch (_) {}
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <PanelSettingsContext.Provider value={{ settings, reload }}>
      {children}
    </PanelSettingsContext.Provider>
  );
}

export function usePanelSettings() {
  return useContext(PanelSettingsContext);
}
