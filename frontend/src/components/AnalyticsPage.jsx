import { useState } from "react";
import { useTheme } from "../ThemeContext";
import { useIsMobile } from "../useIsMobile";
import { BUCKETS, agingColor, assignBuckets } from "../constants";

// ── SVG Donut Chart
function DonutChart({ data, size = 180, label, sublabel }) {
  const [hovered, setHovered] = useState(null);
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38, ir = size * 0.24;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;
  let cur = -Math.PI / 2;
  const segments = data.map(d => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const sa = cur; cur += sweep; const ea = cur;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    const ix1 = cx + ir * Math.cos(sa), iy1 = cy + ir * Math.sin(sa);
    const ix2 = cx + ir * Math.cos(ea), iy2 = cy + ir * Math.sin(ea);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...d, path: `M${x1} ${y1}A${r} ${r} 0 ${large} 1 ${x2} ${y2}L${ix2} ${iy2}A${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1}Z` };
  });

  const displayLabel = hovered !== null ? data[hovered]?.label : label;
  const displaySub   = hovered !== null ? `${data[hovered]?.value} (${Math.round((data[hovered]?.value / total) * 100)}%)` : sublabel;

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {segments.map((s, i) => (
        <path key={i} d={s.path} fill={s.color}
          opacity={hovered === null || hovered === i ? 1 : 0.4}
          style={{ cursor: "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
          transform={hovered === i ? `translate(${Math.cos((segments[i] ? (segments[i].sa + (segments[i].sa + (data[i].value / total) * 2 * Math.PI)) / 2 : 0)) * 4}, ${Math.sin(0) * 4})` : ""} />
      ))}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={hovered !== null ? 11 : 20} fontWeight={700} fill={hovered !== null ? "#888" : (data[hovered]?.color || "#14B8A6")} fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif">{displayLabel}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#888" fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif">{displaySub}</text>
    </svg>
  );
}

// ── SVG Arc Gauge
function ArcGauge({ value, max, color, size = 140 }) {
  const cx = size / 2, cy = size * 0.62;
  const r = size * 0.42;
  const startAngle = Math.PI, endAngle = 2 * Math.PI;
  const pct = Math.min(value / max, 1);
  const fillAngle = startAngle + pct * Math.PI;

  const toXY = (angle) => ({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  const start = toXY(startAngle), end = toXY(endAngle), fill = toXY(fillAngle);

  const bgPath  = `M${start.x} ${start.y} A${r} ${r} 0 1 1 ${end.x} ${end.y}`;
  const fgPath  = `M${start.x} ${start.y} A${r} ${r} 0 ${pct > 0.5 ? 1 : 0} 1 ${fill.x} ${fill.y}`;

  return (
    <svg width={size} height={size * 0.7} style={{ overflow: "visible" }}>
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={14} strokeLinecap="round" />
      <path d={fgPath} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}88)` }} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={26} fontWeight={700} fill={color} fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif">{value}d</text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="#888" fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif">avg aging</text>
    </svg>
  );
}

// ── Horizontal gradient bar
function GBar({ label, value, max, color, sublabel, height = 28 }) {
  const theme = useTheme();
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: theme.text, fontWeight: 500, maxWidth: "55%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {sublabel && <span style={{ fontSize: 11, color: theme.textFaint }}>{sublabel}</span>}
          <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
        </div>
      </div>
      <div style={{ height: 6, background: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ── Card wrapper
function Card({ title, children, accent, style = {} }) {
  const theme = useTheme();
  return (
    <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "20px 22px", ...style }}>
      {title && (
        <div style={{ fontSize: 10, letterSpacing: 2.5, color: accent || theme.textFaint, textTransform: "uppercase", fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
          {accent && <span style={{ width: 3, height: 14, background: accent, borderRadius: 2, display: "inline-block" }} />}
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Inline spark bar used in tables
function Spark({ value, max, color }) {
  const theme = useTheme();
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 32, textAlign: "right" }}>{value}d</span>
    </div>
  );
}

// ── Pill badge
function Pill({ label, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, padding: "2px 8px", borderRadius: 20, background: color + "22", color, border: `1px solid ${color}44` }}>{label}</span>;
}

export default function AnalyticsPage({ patients, notifications, currentUser }) {
  const theme    = useTheme();
  const isMobile = useIsMobile();
  const [agingTab, setAgingTab] = useState("distribution"); // distribution | critical | by-region

  if (!patients.length) {
    return <div style={{ textAlign: "center", padding: "60px 0", color: theme.textFaint }}>Loading analytics…</div>;
  }

  const total = patients.length;

  // ── Aging
  const agingGreen  = patients.filter(p => p.aging_of_status < 10).length;
  const agingYellow = patients.filter(p => p.aging_of_status >= 10 && p.aging_of_status < 20).length;
  const agingRed    = patients.filter(p => p.aging_of_status >= 20).length;
  const avgAging    = Math.round(patients.reduce((a, p) => a + p.aging_of_status, 0) / total);
  const maxAging    = Math.max(...patients.map(p => p.aging_of_status));
  const criticalCases = patients.filter(p => p.aging_of_status >= 20).sort((a, b) => b.aging_of_status - a.aging_of_status);

  // Aging buckets for bar chart
  const agingBuckets = [
    { label: "0–5d",  range: [0, 5],   color: "#2ecc71" },
    { label: "6–10d", range: [6, 10],  color: "#27ae60" },
    { label: "11–15d",range: [11, 15], color: "#f0a500" },
    { label: "16–20d",range: [16, 20], color: "#e67e22" },
    { label: "21–30d",range: [21, 30], color: "#e74c3c" },
    { label: "30+d",  range: [31, 999],color: "#c0392b" },
  ].map(b => ({ ...b, count: patients.filter(p => p.aging_of_status >= b.range[0] && p.aging_of_status <= b.range[1]).length }));
  const maxAgingBucket = Math.max(...agingBuckets.map(b => b.count), 1);

  // Avg aging by region
  const regionAgingMap = {};
  patients.forEach(p => {
    if (!p.region) return;
    if (!regionAgingMap[p.region]) regionAgingMap[p.region] = { total: 0, count: 0 };
    regionAgingMap[p.region].total += p.aging_of_status;
    regionAgingMap[p.region].count++;
  });
  const regionAging = Object.entries(regionAgingMap)
    .map(([r, v]) => ({ region: r, avg: Math.round(v.total / v.count), count: v.count }))
    .sort((a, b) => b.avg - a.avg);

  // ── Buckets
  const bucketCounts = {};
  patients.forEach(p => { const bs = assignBuckets(p); bs.forEach(b => { if (b !== "all") bucketCounts[b] = (bucketCounts[b] || 0) + 1; }); });
  const bucketRows = BUCKETS.filter(b => b.id !== "all").map(b => ({ ...b, count: bucketCounts[b.id] || 0 })).sort((a, b) => b.count - a.count);
  const maxBucket = Math.max(...bucketRows.map(b => b.count), 1);

  // ── Channel
  const channelMap = {};
  patients.forEach(p => { if (p.primary_channel) channelMap[p.primary_channel] = (channelMap[p.primary_channel] || 0) + 1; });
  const channels = Object.entries(channelMap).sort((a, b) => b[1] - a[1]);
  const CHAN_COLORS = ["#14B8A6", "#2ecc71", "#f0a500", "#e056b0", "#a78bfa", "#fb923c", "#2dd4bf", "#f87171"];
  const channelDonut = channels.map(([label, value], i) => ({ label, value, color: CHAN_COLORS[i % CHAN_COLORS.length] }));

  // ── Region
  const regionMap = {};
  patients.forEach(p => { if (p.region) regionMap[p.region] = (regionMap[p.region] || 0) + 1; });
  const regions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
  const REG_COLORS = ["#14B8A6", "#34d399", "#a78bfa", "#f472b6", "#fb923c", "#2dd4bf"];
  const regionDonut = regions.map(([label, value], i) => ({ label, value, color: REG_COLORS[i % REG_COLORS.length] }));

  // ── SP Partner with avg aging
  const spMap = {};
  patients.forEach(p => {
    if (!p.latest_sp_partner) return;
    if (!spMap[p.latest_sp_partner]) spMap[p.latest_sp_partner] = { count: 0, totalAging: 0 };
    spMap[p.latest_sp_partner].count++;
    spMap[p.latest_sp_partner].totalAging += p.aging_of_status;
  });
  const spPartners = Object.entries(spMap)
    .map(([sp, v]) => ({ sp, count: v.count, avgAging: Math.round(v.totalAging / v.count) }))
    .sort((a, b) => b.count - a.count);

  // ── Payer
  const payerMap = {};
  patients.forEach(p => { if (p.primary_payer) payerMap[p.primary_payer] = (payerMap[p.primary_payer] || 0) + 1; });
  const payers = Object.entries(payerMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const PAYER_COLORS = ["#14B8A6", "#34d399", "#f0a500", "#e056b0", "#a78bfa", "#fb923c", "#2dd4bf", "#f87171", "#818cf8", "#6b7280"];

  // ── Language
  const langMap = {};
  patients.forEach(p => { if (p.language) langMap[p.language] = (langMap[p.language] || 0) + 1; });
  const languages = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
  const LANG_COLORS = ["#14B8A6", "#f0a500", "#e056b0", "#34d399", "#a78bfa", "#fb923c"];
  const langDonut = languages.map(([label, value], i) => ({ label, value, color: LANG_COLORS[i % LANG_COLORS.length] }));

  // ── Program Type
  const progMap = {};
  patients.forEach(p => { const k = p.program_type || "Unknown"; progMap[k] = (progMap[k] || 0) + 1; });
  const programs = Object.entries(progMap).sort((a, b) => b[1] - a[1]);

  // ── Consent
  const withConsent    = patients.filter(p => p.hippa_consent).length;
  const consentRate    = Math.round((withConsent / total) * 100);
  const written        = patients.filter(p => p.hippa_consent === "Written").length;
  const electronic     = patients.filter(p => p.hippa_consent === "Electronic").length;
  const noConsent      = total - withConsent;

  // ── Active bridge (has last_ship_date and not closed/cancelled)
  const activeBridge = patients.filter(p => p.last_ship_date && !p.latest_hub_sub_status?.toLowerCase().includes("closed") && !p.latest_hub_sub_status?.toLowerCase().includes("cancel")).length;

  // ── Days to first ship
  const daysToFirst = patients
    .filter(p => p.referral_date && p.first_ship_date)
    .map(p => Math.max(0, Math.floor((new Date(p.first_ship_date) - new Date(p.referral_date)) / 86400000)));
  const avgDaysToFirst = daysToFirst.length ? Math.round(daysToFirst.reduce((a, b) => a + b, 0) / daysToFirst.length) : null;

  // ── Notifications
  const pending      = notifications.filter(n => n.status === "pending").length;
  const acknowledged = notifications.filter(n => n.status === "acknowledged").length;
  const replied      = notifications.filter(n => n.status === "replied").length;
  const totalNotifs  = notifications.length;
  const resolutionRate = totalNotifs > 0 ? Math.round(((acknowledged + replied) / totalNotifs) * 100) : 0;
  const myNotifs     = notifications.filter(n => n.to_team === currentUser.team || n.from_team === currentUser.team);

  // Notifications by team
  const teamNotifMap = {};
  notifications.forEach(n => {
    if (!teamNotifMap[n.to_team]) teamNotifMap[n.to_team] = { received: 0, pending: 0 };
    teamNotifMap[n.to_team].received++;
    if (n.status === "pending") teamNotifMap[n.to_team].pending++;
  });
  const teamNotifs = Object.entries(teamNotifMap).sort((a, b) => b[1].received - a[1].received);

  const col2 = isMobile ? "1fr" : "1fr 1fr";
  const col3 = isMobile ? "1fr" : "1fr 1fr 1fr";

  // ── SVG bar chart (vertical) for aging distribution
  const chartW = isMobile ? 280 : 360, chartH = 120;
  const barW = Math.floor(chartW / agingBuckets.length) - 6;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: theme.text }}>Case Analytics</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>{total} patients across {regions.length} regions · Live data</div>
        </div>
        <div style={{ fontSize: 11, color: theme.textFaint, background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 12px" }}>
          As of today
        </div>
      </div>

      {/* ── KPI HERO ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total Cases",     value: total,                                                     color: "#14B8A6", sub: `${regions.length} regions` },
          { label: "Active Bridge",   value: activeBridge,                                              color: "#2ecc71", sub: `${Math.round((activeBridge/total)*100)}% of cases` },
          { label: "Avg Aging",       value: `${avgAging}d`,                                            color: agingColor(avgAging), sub: `max ${maxAging}d` },
          { label: "Critical (20+d)", value: agingRed,                                                  color: "#e74c3c", sub: `${Math.round((agingRed/total)*100)}% of cases` },
          { label: "Consent Rate",    value: `${consentRate}%`,                                         color: consentRate >= 80 ? "#2ecc71" : "#f0a500", sub: `${withConsent} / ${total}` },
          { label: "Notif Resolution",value: `${resolutionRate}%`,                                      color: resolutionRate >= 60 ? "#2ecc71" : "#f0a500", sub: `${totalNotifs} total` },
        ].map(({ label, value, color, sub }) => (
          <div key={label} style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderLeft: `4px solid ${color}`, borderRadius: 12, padding: isMobile ? "14px 12px" : "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -10, top: -10, width: 60, height: 60, borderRadius: "50%", background: color + "10" }} />
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color, fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif" }}>{value}</div>
            <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3, letterSpacing: 0.3 }}>{label}</div>
            <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── AGING DEEP DIVE ── */}
      <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "22px 24px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 2.5, color: "#e74c3c", textTransform: "uppercase", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 3, height: 14, background: "#e74c3c", borderRadius: 2, display: "inline-block" }} />
              Aging Analysis
            </div>
            <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Track case velocity and identify at-risk patients</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["distribution", "Distribution"], ["critical", `Critical (${criticalCases.length})`], ["by-region", "By Region"]].map(([id, label]) => (
              <button key={id} onClick={() => setAgingTab(id)}
                style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${agingTab === id ? "#e74c3c" : theme.border}`, background: agingTab === id ? "#e74c3c18" : "none", color: agingTab === id ? "#e74c3c" : theme.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {agingTab === "distribution" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "auto 1fr", gap: 32, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ArcGauge value={avgAging} max={40} color={agingColor(avgAging)} size={160} />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {[["< 10d", agingGreen, "#2ecc71"], ["10–20d", agingYellow, "#f0a500"], ["20+d", agingRed, "#e74c3c"]].map(([label, v, c]) => (
                  <div key={label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
                    <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>Cases by aging range</div>
              {/* SVG vertical bar chart */}
              <svg width={isMobile ? "100%" : chartW} height={chartH + 30} viewBox={`0 0 ${chartW} ${chartH + 30}`} style={{ overflow: "visible" }}>
                {agingBuckets.map((b, i) => {
                  const x = i * (chartW / agingBuckets.length) + 4;
                  const barH = b.count > 0 ? Math.max(6, (b.count / maxAgingBucket) * chartH) : 0;
                  const y = chartH - barH;
                  return (
                    <g key={b.label}>
                      <rect x={x} y={y} width={barW} height={barH} rx={4} fill={b.color} opacity={0.9} style={{ filter: `drop-shadow(0 2px 4px ${b.color}44)` }} />
                      {b.count > 0 && <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={11} fontWeight={700} fill={b.color}>{b.count}</text>}
                      <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize={10} fill={theme.textFaint}>{b.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {agingTab === "critical" && (
          <div>
            <div style={{ fontSize: 11, color: theme.textFaint, marginBottom: 12 }}>
              {criticalCases.length} cases with aging ≥ 20 days — requires immediate attention
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {criticalCases.length === 0
                ? <div style={{ textAlign: "center", padding: 32, color: "#2ecc71", fontSize: 15 }}>✓ No critical cases</div>
                : criticalCases.map(p => (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr 1.6fr", gap: isMobile ? 4 : 12, alignItems: "center", padding: "12px 16px", background: "#e74c3c08", border: "1px solid #e74c3c22", borderLeft: "4px solid #e74c3c", borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{p.prescriber}</div>
                      <div style={{ fontSize: 11, color: theme.textMuted }}>{p.territory} · {p.region}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: theme.textFaint, marginBottom: 3 }}>SP Partner</div>
                      <div style={{ fontSize: 12, color: theme.textMuted }}>{p.latest_sp_partner || "—"}</div>
                    </div>
                    <div>
                      <Spark value={p.aging_of_status} max={maxAging} color={agingColor(p.aging_of_status)} />
                    </div>
                    <div style={{ fontSize: 11, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.latest_hub_sub_status || "—"}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {agingTab === "by-region" && (
          <div style={{ display: "grid", gridTemplateColumns: col2, gap: 10 }}>
            {regionAging.map(({ region, avg, count }) => (
              <div key={region} style={{ padding: "14px 16px", background: avg >= 20 ? "#e74c3c08" : avg >= 10 ? "#f0a50008" : "#2ecc7108", border: `1px solid ${agingColor(avg)}33`, borderRadius: 10, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", border: `3px solid ${agingColor(avg)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: agingColor(avg) }}>{avg}d</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{region}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{count} cases</div>
                  <div style={{ height: 4, background: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(avg / maxAging) * 100}%`, background: agingColor(avg), borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CASE PIPELINE ── */}
      <Card title="Case Pipeline — Stage Breakdown" accent="#a78bfa" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
          {bucketRows.filter(b => b.count > 0).map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: b.color + "0d", border: `1px solid ${b.color}28`, borderRadius: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: b.color, flexShrink: 0, boxShadow: `0 0 6px ${b.color}88` }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{b.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: b.color }}>{b.count}</span>
                </div>
                <div style={{ height: 4, background: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(b.count / maxBucket) * 100}%`, background: b.color, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── SP PARTNER ANALYSIS ── */}
      <Card title="Specialty Pharmacy Performance" accent="#14B8A6" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : `repeat(${spPartners.length}, 1fr)`, gap: 12 }}>
          {spPartners.map((sp, i) => {
            const c = CHAN_COLORS[i % CHAN_COLORS.length];
            return (
              <div key={sp.sp} style={{ padding: "16px 18px", background: c + "0d", border: `1px solid ${c}28`, borderRadius: 12, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: c, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sp.sp}</div>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{sp.count}</div>
                    <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>cases</div>
                  </div>
                  <div style={{ width: 1, background: theme.border }} />
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: agingColor(sp.avgAging) }}>{sp.avgAging}d</div>
                    <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>avg aging</div>
                  </div>
                </div>
                <div style={{ height: 3, background: theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)", borderRadius: 2, marginTop: 14, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(sp.count / total) * 100}%`, background: c, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 4 }}>{Math.round((sp.count / total) * 100)}% of cases</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── INSURANCE & GEOGRAPHY ── */}
      <div style={{ display: "grid", gridTemplateColumns: col3, gap: 16, marginBottom: 16 }}>
        {/* Channel donut */}
        <Card title="Insurance Channel Mix" accent="#2ecc71">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <DonutChart data={channelDonut} size={isMobile ? 160 : 180} label={total} sublabel="total" />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
              {channelDonut.map((d, i) => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Region donut */}
        <Card title="Cases by Region" accent="#14B8A6">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <DonutChart data={regionDonut} size={isMobile ? 160 : 180} label={regions.length} sublabel="regions" />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
              {regionDonut.map((d) => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Language donut */}
        <Card title="Patient Language" accent="#e056b0">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <DonutChart data={langDonut} size={isMobile ? 160 : 180} label={languages.length} sublabel="languages" />
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
              {langDonut.map((d) => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{d.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ── PAYER BREAKDOWN ── */}
      <Card title="Top Payers" accent="#f0a500" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: col2, gap: "2px 24px" }}>
          {payers.map(([payer, count], i) => (
            <GBar key={payer} label={payer} value={count} max={payers[0][1]} color={PAYER_COLORS[i % PAYER_COLORS.length]} sublabel={`${Math.round((count / total) * 100)}%`} />
          ))}
        </div>
      </Card>

      {/* ── PROGRAM & CONSENT ── */}
      <div style={{ display: "grid", gridTemplateColumns: col2, gap: 16, marginBottom: 16 }}>
        {/* Program type */}
        <Card title="Program Type Distribution" accent="#fb923c">
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {programs.map(([prog, count], i) => {
              const colors = ["#14B8A6", "#f0a500", "#94a3b8"];
              const c = colors[i] || "#888";
              return (
                <div key={prog} style={{ flex: 1, background: c + "14", border: `1px solid ${c}30`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c }}>{count}</div>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>{prog}</div>
                  <div style={{ fontSize: 10, color: theme.textFaint }}>{Math.round((count / total) * 100)}%</div>
                </div>
              );
            })}
          </div>
          {avgDaysToFirst !== null && (
            <div style={{ padding: "12px 14px", background: "#14B8A612", border: "1px solid #14B8A622", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, color: theme.textFaint }}>Avg days referral → first ship</div>
                <div style={{ fontSize: 10, color: theme.textFaint, marginTop: 2 }}>based on {daysToFirst.length} cases</div>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#14B8A6" }}>{avgDaysToFirst}d</div>
            </div>
          )}
        </Card>

        {/* Consent */}
        <Card title="HIPAA Consent Status" accent="#2ecc71">
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Written",    value: written,    color: "#2ecc71" },
              { label: "Electronic", value: electronic, color: "#14B8A6" },
              { label: "Missing",    value: noConsent,  color: "#e74c3c" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: color + "14", border: `1px solid ${color}30`, borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          {/* consent rate radial */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 14px", background: consentRate >= 80 ? "#2ecc7112" : "#e74c3c12", border: `1px solid ${consentRate >= 80 ? "#2ecc7122" : "#e74c3c22"}`, borderRadius: 10 }}>
            <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
              <svg width={56} height={56} viewBox="0 0 56 56">
                <circle cx={28} cy={28} r={22} fill="none" stroke={theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth={6} />
                <circle cx={28} cy={28} r={22} fill="none" stroke={consentRate >= 80 ? "#2ecc71" : "#e74c3c"} strokeWidth={6}
                  strokeDasharray={`${(consentRate / 100) * 138.2} 138.2`} strokeLinecap="round" transform="rotate(-90 28 28)" />
                <text x={28} y={33} textAnchor="middle" fontSize={13} fontWeight={700} fill={consentRate >= 80 ? "#2ecc71" : "#e74c3c"} fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif">{consentRate}%</text>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>Consent rate</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{withConsent} of {total} patients have consent on file</div>
              {noConsent > 0 && <Pill label={`${noConsent} missing`} color="#e74c3c" />}
            </div>
          </div>
        </Card>
      </div>

      {/* ── COMMUNICATIONS ── */}
      <Card title="Team Communication Activity" accent="#818cf8" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                { label: "Pending",      value: pending,      color: "#f0a500" },
                { label: "Replied",      value: replied,      color: "#14B8A6" },
                { label: "Acknowledged", value: acknowledged, color: "#2ecc71" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ flex: 1, background: color + "14", border: `1px solid ${color}30`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 2, letterSpacing: 0.3 }}>{label}</div>
                </div>
              ))}
            </div>
            {/* Resolution ring */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 16px", background: theme.surfaceBg2 || theme.inputBg, borderRadius: 10 }}>
              <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                <svg width={64} height={64} viewBox="0 0 64 64">
                  <circle cx={32} cy={32} r={26} fill="none" stroke={theme.isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"} strokeWidth={7} />
                  <circle cx={32} cy={32} r={26} fill="none" stroke={resolutionRate >= 60 ? "#2ecc71" : "#f0a500"} strokeWidth={7}
                    strokeDasharray={`${(resolutionRate / 100) * 163.4} 163.4`} strokeLinecap="round" transform="rotate(-90 32 32)" />
                  <text x={32} y={37} textAnchor="middle" fontSize={14} fontWeight={700} fill={resolutionRate >= 60 ? "#2ecc71" : "#f0a500"} fontFamily="-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif">{resolutionRate}%</text>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>Resolution Rate</div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{acknowledged + replied} of {totalNotifs} resolved</div>
                <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 1 }}>My team: {myNotifs.length} total</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: theme.textFaint, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12 }}>Notifications by team</div>
            {teamNotifs.length === 0
              ? <div style={{ color: theme.textFaint, fontSize: 12 }}>No notifications yet</div>
              : teamNotifs.map(([team, stats]) => (
                <div key={team} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>{team}</span>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {stats.pending > 0 && <Pill label={`${stats.pending} pending`} color="#f0a500" />}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#14B8A6" }}>{stats.received}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
