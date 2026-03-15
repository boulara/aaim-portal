import { useState } from "react";
import { TEAM_COLORS, initials } from "../constants";
import { TeamBadge } from "./Shared";
import { useTheme } from "../ThemeContext";
import { api } from "../api";

export default function NotificationCard({ notification: n, currentUser, onUpdate }) {
  const theme = useTheme();
  const [reply, setReply]         = useState("");
  const [showReply, setShowReply] = useState(false);
  const [ackAnim, setAckAnim]     = useState(false);
  const [busy, setBusy]           = useState(false);

  const isRecipient    = currentUser.team === n.to_team;
  const canAcknowledge = isRecipient && n.status === "pending";
  const canReply       = n.status === "pending" || n.status === "replied";

  const handleAcknowledge = async () => {
    setAckAnim(true);
    setBusy(true);
    try {
      const updated = await api.updateNotification(n.id, {
        status: "acknowledged",
        acknowledged_by: currentUser.name,
      });
      setTimeout(() => onUpdate(updated), 350);
    } finally {
      setBusy(false);
    }
  };

  const submitReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const updated = await api.addReply(n.id, {
        text: reply.trim(),
        from_user: currentUser.name,
        from_team: currentUser.team,
      });
      onUpdate(updated);
      setReply("");
      setShowReply(false);
    } finally {
      setBusy(false);
    }
  };

  const priorityColors = { urgent: "#e74c3c", high: "#f0a500", normal: "#14B8A6" };
  const pc = priorityColors[n.priority] || "#14B8A6";

  const statusConfig = {
    pending:      { label: "Pending",      color: "#f0a500" },
    replied:      { label: "Reply Sent",   color: "#14B8A6" },
    acknowledged: { label: "Acknowledged", color: "#2ecc71" },
  };
  const sc = statusConfig[n.status] || statusConfig.pending;

  const thread = [
    { id: "orig", text: n.comment, from_user: n.from_user, from_team: n.from_team, created_at: n.created_at, isOriginal: true },
    ...(n.replies || []).map(r => ({ ...r, isOriginal: false })),
  ];

  return (
    <div style={{
      background: ackAnim ? "rgba(46,204,113,0.08)" : theme.surfaceBg,
      border: `1px solid ${ackAnim ? "rgba(46,204,113,0.3)" : theme.border}`,
      borderLeft: `3px solid ${n.status === "acknowledged" ? "#2ecc71" : pc}`,
      borderRadius: 10, marginBottom: 12, transition: "all 0.35s ease", overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "14px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TeamBadge team={n.from_team} />
          <span style={{ color: theme.textFaint, fontSize: 12 }}>→</span>
          <TeamBadge team={n.to_team} />
          {n.priority !== "normal" && (
            <span style={{ fontSize: 10, color: pc, fontWeight: 700, letterSpacing: 1, padding: "2px 7px", background: pc + "18", borderRadius: 4 }}>
              {n.priority.toUpperCase()}
            </span>
          )}
        </div>
        <span style={{ padding: "3px 10px", background: sc.color + "18", color: sc.color, borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, border: `1px solid ${sc.color}33` }}>
          {sc.label}
        </span>
      </div>

      {/* Thread */}
      <div style={{ padding: "0 18px 14px" }}>
        {thread.map((entry, i) => {
          const entryColor = TEAM_COLORS[entry.from_team]?.accent || "#888";
          const isMe = entry.from_user === currentUser.name;
          return (
            <div key={entry.id} style={{ display: "flex", gap: 10, marginBottom: i < thread.length - 1 ? 10 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: entryColor + "22", border: `1.5px solid ${entryColor}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: entryColor }}>
                  {initials(entry.from_user)}
                </div>
                {i < thread.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 8, background: theme.border, marginTop: 3 }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: 2 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: entryColor }}>{entry.from_user}</span>
                  <span style={{ fontSize: 10, color: theme.textFaint }}>
                    {new Date(entry.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                  {entry.isOriginal && <span style={{ fontSize: 10, color: theme.textFaintest, fontStyle: "italic" }}>original</span>}
                </div>
                <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.55, background: isMe ? "rgba(20,184,166,0.08)" : theme.surfaceBg2, border: `1px solid ${isMe ? "rgba(20,184,166,0.15)" : theme.border}`, borderRadius: 8, padding: "8px 12px" }}>
                  {entry.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acknowledged receipt */}
      {n.status === "acknowledged" && n.acknowledged_by && (
        <div style={{ padding: "8px 18px", borderTop: "1px solid rgba(46,204,113,0.15)", background: "rgba(46,204,113,0.06)", fontSize: 11, color: "rgba(46,204,113,0.7)" }}>
          ✓ Acknowledged by {n.acknowledged_by} · {new Date(n.acknowledged_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </div>
      )}

      {/* Actions */}
      {n.status !== "acknowledged" && (
        <div style={{ padding: "10px 18px 14px", borderTop: `1px solid ${theme.border}` }}>
          {!showReply ? (
            <div style={{ display: "flex", gap: 8 }}>
              {canAcknowledge && (
                <button onClick={handleAcknowledge} disabled={busy}
                  style={{ padding: "7px 18px", background: "rgba(46,204,113,0.12)", border: "1px solid rgba(46,204,113,0.35)", borderRadius: 7, color: "#2ecc71", fontSize: 12, fontWeight: 700, cursor: busy ? "wait" : "pointer" }}>
                  ✓ Acknowledge
                </button>
              )}
              {canReply && (
                <button onClick={() => setShowReply(true)}
                  style={{ padding: "7px 18px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 7, color: theme.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  ↩ Reply
                </button>
              )}
            </div>
          ) : (
            <div>
              <textarea value={reply} onChange={e => setReply(e.target.value)} autoFocus rows={3}
                placeholder="Write your reply…"
                style={{ width: "100%", padding: "10px 14px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 7, color: theme.text, fontSize: 13, resize: "none", outline: "none", lineHeight: 1.55, fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={submitReply} disabled={!reply.trim() || busy}
                  style={{ padding: "7px 18px", background: reply.trim() ? "rgba(20,184,166,0.2)" : theme.inputBg, border: `1px solid ${reply.trim() ? "rgba(20,184,166,0.4)" : theme.border}`, borderRadius: 7, color: reply.trim() ? "#14B8A6" : theme.textFaint, fontSize: 12, fontWeight: 700, cursor: reply.trim() ? "pointer" : "not-allowed" }}>
                  {busy ? "Sending…" : "Send Reply"}
                </button>
                <button onClick={() => { setShowReply(false); setReply(""); }}
                  style={{ padding: "7px 14px", background: "none", border: `1px solid ${theme.border}`, borderRadius: 7, color: theme.textFaint, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
