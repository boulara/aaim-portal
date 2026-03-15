import { createContext, useContext } from "react";

export const conduit = {
  pageBg:      "#0B1829",
  navBg:       "rgba(11,24,41,0.97)",
  surfaceBg:   "rgba(20,184,166,0.04)",
  surfaceBg2:  "rgba(20,184,166,0.02)",
  inputBg:     "rgba(255,255,255,0.06)",
  selectBg:    "#0d1e2e",
  panelBg:     "#0d1e2e",
  border:      "#1E3A4A",
  borderInput: "#2a4a5a",
  borderStrong:"#2a5a6a",
  rowHover:    "rgba(20,184,166,0.07)",
  text:        "#F1F5F9",
  textMuted:   "#94A3B8",
  textFaint:   "#475569",
  textFaintest:"#334155",
  isDark: true,
  isConduit: true,
};

export const dark = {
  pageBg:      "#0d1117",
  navBg:       "rgba(255,255,255,0.03)",
  surfaceBg:   "rgba(255,255,255,0.04)",
  surfaceBg2:  "rgba(255,255,255,0.02)",
  inputBg:     "rgba(255,255,255,0.06)",
  selectBg:    "#1a2030",
  panelBg:     "#0f1923",
  border:      "rgba(255,255,255,0.08)",
  borderInput: "rgba(255,255,255,0.12)",
  borderStrong:"rgba(255,255,255,0.15)",
  rowHover:    "rgba(255,255,255,0.04)",
  text:        "#ffffff",
  textMuted:   "rgba(255,255,255,0.5)",
  textFaint:   "rgba(255,255,255,0.3)",
  textFaintest:"rgba(255,255,255,0.2)",
  isDark: true,
};

export const light = {
  pageBg:      "#f0f2f5",
  navBg:       "rgba(255,255,255,0.9)",
  surfaceBg:   "#ffffff",
  surfaceBg2:  "#f8f9fb",
  inputBg:     "rgba(0,0,0,0.04)",
  selectBg:    "#e8ecf2",
  panelBg:     "#ffffff",
  border:      "rgba(0,0,0,0.08)",
  borderInput: "rgba(0,0,0,0.15)",
  borderStrong:"rgba(0,0,0,0.2)",
  rowHover:    "rgba(0,0,0,0.03)",
  text:        "#111827",
  textMuted:   "rgba(0,0,0,0.5)",
  textFaint:   "rgba(0,0,0,0.35)",
  textFaintest:"rgba(0,0,0,0.2)",
  isDark: false,
};

export const ThemeContext = createContext(conduit);
export const useTheme = () => useContext(ThemeContext);
