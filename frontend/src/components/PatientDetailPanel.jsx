import { useState, useEffect } from "react";
import { TEAM_COLORS, formatDate, agingColor } from "../constants";
import { useTheme } from "../ThemeContext";
import { useIsMobile } from "../useIsMobile";
import NotificationCard from "./NotificationCard";
import { api } from "../api";

export default function PatientDetailPanel({ patient: p, currentUser, notifications, onNewNotification, onNoteChange, onClose }) {
  const theme    = useTheme();
  const isMobile = useIsMobile();
  const [tab, setTab]               = useState("details");
  const [comment, setComment]       = useState("");
  const [targetTeam, setTargetTeam] = useState("NCM");
  const [priority, setPriority]     = useState("normal");
  const [sending, setSending]       = useState(false);

  // Notes state — loaded from parent (App owns notes scoped to current user)
  const [notes, setNotes]           = useState([]);
  const [noteText, setNoteText]     = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [updatingNoteId, setUpdatingNoteId] = useState(null);

  useEffect(() => {
    // Fetch this patient's notes for the current user
    api.getNotes(p.id, currentUser.id).then(setNotes).catch(() => {});
  }, [p.id, currentUser.id]);

  const patientNotifs = notifications
    .filter(n => n.patient_id === p.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const teams = ["NCM", "SP", "Sales", "Home Office"].filter(t => t !== currentUser.team);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      const created = await api.createNote({
        patient_id: p.id,
        user_id:    currentUser.id,
        user_name:  currentUser.name,
        user_team:  currentUser.team,
        text:       noteText.trim(),
        follow_up_date: followUpDate || null,
      });
      setNotes(prev => [created, ...prev]);
      if (onNoteChange) onNoteChange(created, false);
      setNoteText("");
      setFollowUpDate("");
    } finally { setSavingNote(false); }
  };

  const handleDeleteNote = async (id) => {
    setDeletingNoteId(id);
    try {
      await api.deleteNote(id);
      const deleted = notes.find(n => n.id === id);
      setNotes(prev => prev.filter(n => n.id !== id));
      if (onNoteChange && deleted) onNoteChange(deleted, true);
    } finally { setDeletingNoteId(null); }
  };

  const handleClearDate = async (id) => {
    setUpdatingNoteId(id);
    try {
      const updated = await api.updateNote(id, { follow_up_date: null });
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
      if (onNoteChange) onNoteChange(updated, false);
    } finally { setUpdatingNoteId(null); }
  };

  const handleMarkDone = async (id) => {
    setUpdatingNoteId(id);
    try {
      const updated = await api.updateNote(id, { completed_at: new Date().toISOString() });
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
      if (onNoteChange) onNoteChange(updated, false);
    } finally { setUpdatingNoteId(null); }
  };

  const handleUndoDone = async (id) => {
    setUpdatingNoteId(id);
    try {
      const updated = await api.updateNote(id, { completed_at: null });
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
      if (onNoteChange) onNoteChange(updated, false);
    } finally { setUpdatingNoteId(null); }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const created = await api.createNotification({
        patient_id: p.id,
        to_team:    targetTeam,
        comment:    comment.trim(),
        priority,
        from_user:  currentUser.name,
        from_team:  currentUser.team,
      });
      onNewNotification(created);
      setComment("");
      setTab("notifications");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: isMobile ? "100%" : "min(860px, 100%)", height: isMobile ? "92vh" : "auto", maxHeight: isMobile ? "92vh" : "90vh", background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: isMobile ? "16px 16px 0 0" : 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "20px 28px", background: "rgba(20,184,166,0.1)", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: theme.text }}>{p.prescriber}</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 3 }}>
              {p.territory} · {p.region} · <span style={{ color: agingColor(p.aging_of_status) }}>{p.aging_of_status} days aging</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 22, cursor: "pointer", padding: "4px 10px" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${theme.border}`, padding: "0 28px", overflowX: "auto" }}>
          {[
            ["details",       "Patient Details"],
            ["notes",         `Notes (${notes.length})`],
            ["notifications", `Activity (${patientNotifs.length})`],
            ["new",           "New Notification"],
          ].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "14px 18px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "#14B8A6" : "transparent"}`, color: tab === t ? "#14B8A6" : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 0.3 }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
          {/* Details */}
          {tab === "details" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              {[
                ["SP Partner",        p.latest_sp_partner],
                ["SP Status",         p.latest_sp_status],
                ["SP Substatus",      p.latest_sp_substatus],
                ["HUB Substatus",     p.latest_hub_sub_status],
                ["Primary Channel",   p.primary_channel],
                ["Primary Payer",     p.primary_payer],
                ["Primary PBM",       p.primary_pbm],
                ["Secondary Channel", p.secondary_channel],
                ["Program Type",      p.program_type],
                ["Referral Date",     formatDate(p.referral_date)],
                ["First Ship Date",   formatDate(p.first_ship_date)],
                ["Last Ship Date",    formatDate(p.last_ship_date)],
                ["Language",          p.language],
                ["HIPAA Consent",     p.hipaa_consent],
              ].map(([label, val]) => (
                <div key={label} style={{ background: theme.surfaceBg, padding: "12px 16px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, color: theme.textFaint, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 14, color: theme.text }}>{val || "—"}</div>
                </div>
              ))}
              {p.last_comment && (
                <div style={{ gridColumn: "1/-1", background: "rgba(20,184,166,0.08)", padding: "14px 16px", borderRadius: 8, border: "1px solid rgba(20,184,166,0.2)" }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#14B8A6", textTransform: "uppercase", marginBottom: 5 }}>Last Comment</div>
                  <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.6 }}>{p.last_comment}</div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {tab === "notes" && (
            <div>
              {/* Add note form */}
              <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 14 }}>Add a Note</div>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3}
                  placeholder="Private case note — not sent to any team…"
                  style={{ width: "100%", padding: "12px 14px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, resize: "vertical", outline: "none", lineHeight: 1.6, fontFamily: "inherit", marginBottom: 12 }} />
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <label style={{ fontSize: 10, letterSpacing: 1.5, color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: 6 }}>Follow-up Date (optional)</label>
                    <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                      style={{ width: "100%", padding: "9px 12px", background: theme.inputBg, border: `1px solid ${followUpDate ? "#14B8A6" : theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <button onClick={handleSaveNote} disabled={!noteText.trim() || savingNote}
                    style={{ padding: "10px 24px", background: noteText.trim() ? "#14B8A6" : theme.inputBg, border: "none", borderRadius: 8, color: noteText.trim() ? "#fff" : theme.textFaint, fontSize: 13, fontWeight: 600, cursor: noteText.trim() ? "pointer" : "not-allowed" }}>
                    {savingNote ? "Saving…" : "Save Note"}
                  </button>
                </div>
              </div>

              {/* Notes list */}
              {notes.length === 0
                ? <div style={{ textAlign: "center", color: theme.textFaint, padding: "32px 0", fontSize: 14 }}>No notes yet for this patient</div>
                : notes.map(n => {
                  const isDone = !!n.completed_at;
                  const accentColor = isDone ? "#2ecc71" : n.follow_up_date ? "#14B8A6" : theme.border;
                  const isBusy = updatingNoteId === n.id;
                  return (
                    <div key={n.id} style={{ background: theme.surfaceBg, border: `1px solid ${accentColor}44`, borderLeft: `4px solid ${accentColor}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, opacity: isDone ? 0.75 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6, marginBottom: 8, textDecoration: isDone ? "line-through" : "none" }}>{n.text}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: theme.textFaint }}>{n.user_name} · {n.user_team}</span>
                            <span style={{ fontSize: 11, color: theme.textFaint }}>·</span>
                            <span style={{ fontSize: 11, color: theme.textFaint }}>{new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            {isDone && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#2ecc71", background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 20, padding: "2px 10px" }}>
                                ✓ Done {new Date(n.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                            {!isDone && n.follow_up_date && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "#14B8A6", background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.25)", borderRadius: 20, padding: "2px 8px 2px 10px" }}>
                                📅 {new Date(n.follow_up_date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                <button onClick={() => handleClearDate(n.id)} disabled={isBusy} title="Clear follow-up date"
                                  style={{ background: "none", border: "none", color: "#14B8A6", cursor: "pointer", fontSize: 12, padding: "0 0 0 2px", lineHeight: 1, opacity: 0.7 }}>✕</button>
                              </span>
                            )}
                          </div>
                          {/* Action buttons */}
                          {n.follow_up_date && (
                            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                              {isDone ? (
                                <button onClick={() => handleUndoDone(n.id)} disabled={isBusy}
                                  style={{ padding: "4px 12px", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 6, color: "#2ecc71", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                  {isBusy ? "…" : "↩ Undo"}
                                </button>
                              ) : (
                                <button onClick={() => handleMarkDone(n.id)} disabled={isBusy}
                                  style={{ padding: "4px 12px", background: "rgba(46,204,113,0.1)", border: "1px solid rgba(46,204,113,0.3)", borderRadius: 6, color: "#2ecc71", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                                  {isBusy ? "…" : "✓ Mark Done"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleDeleteNote(n.id)} disabled={deletingNoteId === n.id}
                          style={{ background: "none", border: "none", color: theme.textFaint, cursor: "pointer", fontSize: 16, padding: "2px 6px", flexShrink: 0 }}>
                          {deletingNoteId === n.id ? "…" : "✕"}
                        </button>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          )}

          {/* Notifications */}
          {tab === "notifications" && (
            <div>
              {patientNotifs.length === 0
                ? <div style={{ textAlign: "center", color: theme.textFaint, padding: "40px 0", fontSize: 14 }}>No notifications yet for this patient</div>
                : patientNotifs.map(n => <NotificationCard key={n.id} notification={n} currentUser={currentUser} onUpdate={onNewNotification} />)
              }
            </div>
          )}

          {/* New notification */}
          {tab === "new" && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, letterSpacing: 2, color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Route To Team</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {teams.map(t => (
                    <button key={t} onClick={() => setTargetTeam(t)}
                      style={{ padding: "8px 20px", background: targetTeam === t ? (TEAM_COLORS[t]?.accent || "#14B8A6") : theme.inputBg, border: `1px solid ${targetTeam === t ? (TEAM_COLORS[t]?.accent || "#14B8A6") : theme.borderInput}`, borderRadius: 8, color: targetTeam === t ? "#fff" : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, letterSpacing: 2, color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Priority</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["normal","Normal","#14B8A6"],["high","High","#f0a500"],["urgent","Urgent","#e74c3c"]].map(([v, l, c]) => (
                    <button key={v} onClick={() => setPriority(v)}
                      style={{ padding: "6px 16px", background: priority === v ? c + "22" : theme.inputBg, border: `1px solid ${priority === v ? c : theme.border}`, borderRadius: 6, color: priority === v ? c : theme.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, letterSpacing: 2, color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: 10 }}>Comment / Note</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={5}
                  style={{ width: "100%", padding: "14px 16px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 14, resize: "vertical", outline: "none", lineHeight: 1.6, fontFamily: "inherit" }}
                  placeholder={`Add a note for the ${targetTeam} team…`} />
              </div>

              <button onClick={handleSubmit} disabled={!comment.trim() || sending}
                style={{ padding: "12px 32px", background: comment.trim() ? "#14B8A6" : theme.inputBg, border: "none", borderRadius: 8, color: comment.trim() ? "#fff" : theme.textFaint, fontSize: 14, fontWeight: 600, cursor: comment.trim() ? "pointer" : "not-allowed" }}>
                {sending ? "Sending…" : "Send Notification →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
