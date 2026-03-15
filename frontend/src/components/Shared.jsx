import { TEAM_COLORS, STATUS_COLORS, agingColor } from "../constants";
import { useTheme } from "../ThemeContext";

export function TeamBadge({ team, size = "sm" }) {
  const theme = useTheme();
  const c = TEAM_COLORS[team] || { accent: "#888", light: "#eee", lightText: "#555" };
  const pad = size === "sm" ? "3px 8px" : "5px 12px";
  const fs  = size === "sm" ? 11 : 13;
  return (
    <span style={{ padding: pad, background: c.light, color: theme.isDark ? c.accent : c.lightText, borderRadius: 20, fontSize: fs, fontWeight: 700, letterSpacing: 1 }}>
      {team}
    </span>
  );
}

export function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || "#888";
  const labels = { pending: "Pending", acknowledged: "Acknowledged", replied: "Reply Sent", dismissed: "Dismissed" };
  return (
    <span style={{ padding: "3px 10px", background: color + "22", color, borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, border: `1px solid ${color}44` }}>
      {labels[status] || status}
    </span>
  );
}

export function AgingBadge({ days }) {
  const color = agingColor(days);
  return (
    <span style={{ padding: "3px 8px", background: color + "22", color, borderRadius: 6, fontSize: 12, fontWeight: 700, border: `1px solid ${color}44` }}>
      {days}d
    </span>
  );
}

export const GLOBAL_STYLES = `
  @keyframes fadeIn  { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: none } }
  @keyframes shake   { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-8px) } 75% { transform: translateX(8px) } }
  @keyframes pulse   { 0% { box-shadow: 0 0 0 0 currentColor } 70% { box-shadow: 0 0 0 6px transparent } 100% { box-shadow: 0 0 0 0 transparent } }
  @keyframes slideIn    { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: none } }
  @keyframes logoFadeIn { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
  * { box-sizing: border-box; }
  select option { background: #1a2030; color: #fff; }
`;
