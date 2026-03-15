import { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { TEAM_COLORS } from "../constants";
import { api } from "../api";

const TEAMS = ["Home Office", "NCM", "SP", "Sales"];
const ROLES = ["admin", "partner"];

function UserModal({ user, onSave, onClose, theme }) {
  const isNew = !user.id;
  const [form, setForm] = useState({
    username: user.username || "",
    name:     user.name     || "",
    team:     user.team     || "NCM",
    role:     user.role     || "partner",
    password: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.username || !form.name) { setError("Username and name are required."); return; }
    if (isNew && !form.password)      { setError("Password is required for new users."); return; }
    setSaving(true);
    try {
      const payload = { username: form.username, name: form.name, team: form.team, role: form.role };
      if (form.password) payload.password = form.password;
      const saved = isNew
        ? await api.createUser(payload)
        : await api.updateUser(user.id, payload);
      onSave(saved);
    } catch (e) {
      setError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, type = "text", opts = null) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 11, letterSpacing: 1.5, color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
      {opts ? (
        <select value={form[key]} onChange={e => set(key, e.target.value)}
          style={{ width: "100%", padding: "10px 12px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 14, outline: "none" }}>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
          placeholder={key === "password" && !isNew ? "Leave blank to keep current" : ""}
          style={{ width: "100%", padding: "10px 12px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 14, outline: "none" }} />
      )}
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 440, background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 32, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, marginBottom: 24 }}>{isNew ? "Add User" : "Edit User"}</div>
        {field("Full Name",  "name")}
        {field("Username",   "username")}
        {field("Password",   "password", "password")}
        {field("Team",       "team",     "text", TEAMS)}
        {field("Role",       "role",     "text", ROLES)}
        {error && <div style={{ fontSize: 13, color: "#e74c3c", marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "11px", background: "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose}
            style={{ padding: "11px 20px", background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textMuted, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage({ isDark, onToggleTheme }) {
  const theme = useTheme();
  const [users, setUsers]         = useState([]);
  const [editingUser, setEditing] = useState(null);
  const [deletingId, setDeleting] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.getUsers().then(u => { setUsers(u); setLoading(false); });
  }, []);

  const handleSave = (saved) => {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const next = [...prev]; next[idx] = saved; return next;
    });
    setEditing(null);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const sectionLabel = (text) => (
    <div style={{ fontSize: 10, letterSpacing: 2.5, color: theme.textFaint, textTransform: "uppercase", fontWeight: 700, marginBottom: 16, marginTop: 32 }}>{text}</div>
  );

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginBottom: 4 }}>Settings</div>
      <div style={{ fontSize: 14, color: theme.textMuted, marginBottom: 8 }}>Manage appearance and user accounts</div>

      {/* Appearance */}
      {sectionLabel("Appearance")}
      <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Theme</div>
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 3 }}>Switch between dark and light mode</div>
        </div>
        <button onClick={onToggleTheme}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", background: isDark ? "rgba(79,142,247,0.15)" : "rgba(0,0,0,0.06)", border: `1px solid ${isDark ? "rgba(79,142,247,0.4)" : "rgba(0,0,0,0.15)"}`, borderRadius: 10, color: theme.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          <span style={{ fontSize: 18 }}>{isDark ? "🌙" : "☀️"}</span>
          {isDark ? "Dark Mode" : "Light Mode"}
        </button>
      </div>

      {/* User Management */}
      {sectionLabel("User Management")}
      <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Users <span style={{ fontSize: 13, color: theme.textFaint, fontWeight: 400 }}>({users.length})</span></div>
          <button onClick={() => setEditing({})}
            style={{ padding: "8px 18px", background: "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Add User
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "32px", textAlign: "center", color: theme.textFaint }}>Loading…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: theme.surfaceBg2 }}>
                {["Name", "Username", "Team", "Role", ""].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 10, letterSpacing: 1.5, color: theme.textFaint, textTransform: "uppercase", fontWeight: 600, borderBottom: `1px solid ${theme.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const tc = TEAM_COLORS[u.team] || { accent: "#888", light: "#eee", lightText: "#555" };
                return (
                  <tr key={u.id} style={{ borderBottom: `1px solid ${theme.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: theme.textMuted, fontFamily: "monospace" }}>{u.username}</td>
                    <td style={{ padding: "13px 20px" }}>
                      <span style={{ padding: "3px 10px", background: theme.isDark ? tc.light + "22" : tc.light, color: theme.isDark ? tc.accent : tc.lightText, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{u.team}</span>
                    </td>
                    <td style={{ padding: "13px 20px", fontSize: 13, color: theme.textMuted, textTransform: "capitalize" }}>{u.role}</td>
                    <td style={{ padding: "13px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditing(u)}
                          style={{ padding: "5px 14px", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 6, color: "#4f8ef7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}
                          style={{ padding: "5px 14px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6, color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {deletingId === u.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editingUser !== null && (
        <UserModal user={editingUser} onSave={handleSave} onClose={() => setEditing(null)} theme={theme} />
      )}
    </div>
  );
}
