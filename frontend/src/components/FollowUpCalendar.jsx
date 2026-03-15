import { useState } from "react";
import { useTheme } from "../ThemeContext";
import { useIsMobile } from "../useIsMobile";

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toLocalDate(isoStr) {
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function FollowUpCalendar({ patients, notes = [], onNoteChange }) {
  const theme    = useTheme();
  const isMobile = useIsMobile();

  const today      = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selected, setSelected] = useState(null);

  // Only active (non-completed) notes with a follow_up_date
  const followUps = notes.filter(n => n.follow_up_date && !n.completed_at);

  // Group by date string
  const byDate = {};
  followUps.forEach(n => {
    byDate[n.follow_up_date] = byDate[n.follow_up_date] || [];
    byDate[n.follow_up_date].push(n);
  });

  // Calendar grid
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pad  = n => String(n).padStart(2, "0");
  const key  = d => `${year}-${pad(month + 1)}-${pad(d)}`;
  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  // Upcoming follow-ups (today and future), sorted
  const upcoming = followUps
    .filter(n => n.follow_up_date >= todayKey)
    .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date));

  const overdue = followUps
    .filter(n => n.follow_up_date < todayKey)
    .sort((a, b) => b.follow_up_date.localeCompare(a.follow_up_date));

  const completed = notes.filter(n => n.follow_up_date && n.completed_at);

  const selectedNotes = selected ? (byDate[selected] || []) : [];
  const patientMap = Object.fromEntries((patients || []).map(p => [p.id, p]));

  function NoteCard({ n, color = "#4f8ef7" }) {
    const pat = patientMap[n.patient_id];
    return (
      <div style={{ background: theme.surfaceBg, border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{pat?.prescriber || `Patient #${n.patient_id}`}</div>
            {pat && <div style={{ fontSize: 11, color: theme.textFaint }}>{pat.territory} · {pat.region}</div>}
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: color + "18", color, border: `1px solid ${color}33`, whiteSpace: "nowrap", flexShrink: 0 }}>
            {new Date(n.follow_up_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
        <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.5 }}>{n.text}</div>
        <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 6 }}>— {n.user_name} · {n.user_team}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Follow-Up Calendar</div>
      <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 24 }}>
        {upcoming.length} upcoming · {overdue.length > 0 && <span style={{ color: "#e74c3c" }}>{overdue.length} overdue</span>}
        {overdue.length === 0 && "0 overdue"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 20, alignItems: "start" }}>
          {/* ── Calendar grid ── */}
          <div>
            {/* Overdue banner */}
            {overdue.length > 0 && (
              <div style={{ background: "#e74c3c12", border: "1px solid #e74c3c33", borderRadius: 12, padding: "14px 18px", marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e74c3c", marginBottom: 10 }}>⚠ Overdue Follow-Ups ({overdue.length})</div>
                {overdue.map(n => <NoteCard key={n.id} n={n} color="#e74c3c" />)}
              </div>
            )}

            <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Month header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${theme.border}` }}>
                <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textMuted, cursor: "pointer", padding: "6px 12px", fontSize: 16 }}>‹</button>
                <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{MONTHS[month]} {year}</div>
                <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textMuted, cursor: "pointer", padding: "6px 12px", fontSize: 16 }}>›</button>
              </div>

              {/* Day headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: theme.surfaceBg }}>
                {DAYS.map(d => (
                  <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: theme.textFaint, textTransform: "uppercase" }}>{d}</div>
                ))}
              </div>

              {/* Date cells */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: theme.border }}>
                {cells.map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} style={{ background: theme.surfaceBg, minHeight: 70 }} />;
                  const k         = key(d);
                  const hasNotes  = byDate[k]?.length > 0;
                  const isToday   = k === todayKey;
                  const isSelected = k === selected;
                  const isPast    = k < todayKey;
                  return (
                    <div key={k} onClick={() => setSelected(isSelected ? null : k)}
                      style={{ background: isSelected ? "rgba(79,142,247,0.15)" : theme.surfaceBg, minHeight: 70, padding: "8px 10px", cursor: hasNotes ? "pointer" : "default", position: "relative",
                        border: isSelected ? "2px solid #4f8ef7" : "2px solid transparent" }}>
                      <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? "#4f8ef7" : isPast ? theme.textFaint : theme.text,
                        width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: isToday ? "rgba(79,142,247,0.15)" : "none" }}>
                        {d}
                      </div>
                      {hasNotes && (
                        <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                          {byDate[k].slice(0, 3).map((n, ni) => (
                            <div key={ni} style={{ height: 4, borderRadius: 2, background: isPast ? "#e74c3c" : "#4f8ef7", opacity: 0.85 }} />
                          ))}
                          {byDate[k].length > 3 && (
                            <div style={{ fontSize: 9, color: theme.textFaint }}>+{byDate[k].length - 3}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected date notes */}
            {selected && (
              <div style={{ marginTop: 16, background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 12 }}>
                  {new Date(selected + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  <span style={{ marginLeft: 8, fontSize: 11, color: theme.textFaint }}>({selectedNotes.length} note{selectedNotes.length !== 1 ? "s" : ""})</span>
                </div>
                {selectedNotes.length === 0
                  ? <div style={{ color: theme.textFaint, fontSize: 13 }}>No follow-ups on this date</div>
                  : selectedNotes.map(n => <NoteCard key={n.id} n={n} color={selected < todayKey ? "#e74c3c" : "#4f8ef7"} />)
                }
              </div>
            )}
          </div>

          {/* ── Upcoming sidebar ── */}
          <div>
            <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${theme.border}`, fontSize: 11, letterSpacing: 2, color: "#4f8ef7", textTransform: "uppercase", fontWeight: 700 }}>
                Upcoming Follow-Ups
              </div>
              <div style={{ padding: 14, maxHeight: isMobile ? "none" : 600, overflowY: "auto" }}>
                {upcoming.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 0", color: theme.textFaint, fontSize: 13 }}>
                    No upcoming follow-ups scheduled
                  </div>
                ) : (
                  upcoming.map(n => {
                    const pat = patientMap[n.patient_id];
                    const dueDate = toLocalDate(n.follow_up_date);
                    const diffDays = Math.round((dueDate - today) / 86400000);
                    const dueLabel = diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `In ${diffDays} days`;
                    const dueColor = diffDays === 0 ? "#f0a500" : diffDays < 0 ? "#e74c3c" : "#4f8ef7";
                    return (
                      <div key={n.id} onClick={() => { setYear(dueDate.getFullYear()); setMonth(dueDate.getMonth()); setSelected(n.follow_up_date); }}
                        style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#4f8ef7"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, flex: 1, marginRight: 8 }}>{pat?.prescriber || `Patient #${n.patient_id}`}</div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: dueColor, background: dueColor + "18", border: `1px solid ${dueColor}33`, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap" }}>{dueLabel}</span>
                        </div>
                        <div style={{ fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: theme.textFaint }}>{n.user_name}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                { label: "Total Notes",    value: notes.length,       color: "#4f8ef7" },
                { label: "With Follow-Up", value: notes.filter(n => n.follow_up_date).length, color: "#2ecc71" },
                { label: "Upcoming",       value: upcoming.length,    color: "#4f8ef7" },
                { label: "Overdue",        value: overdue.length,     color: overdue.length > 0 ? "#e74c3c" : "#2ecc71" },
                { label: "Completed",      value: completed.length,   color: "#2ecc71" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}
