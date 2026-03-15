import { createContext, useContext } from "react";

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

export const ThemeContext = createContext(dark);
export const useTheme = () => useContext(ThemeContext);
