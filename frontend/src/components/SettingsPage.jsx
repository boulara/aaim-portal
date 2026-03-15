import { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext";
import { useIsMobile } from "../useIsMobile";
import { TEAM_COLORS } from "../constants";
import { api } from "../api";

const TEAMS = ["Home Office", "NCM", "SP", "Sales"];
const ROLES = ["admin", "partner"];

// ── FireFly SVG Logo ──────────────────────────────────────────────────────────
function FireflyLogo({ size = 80 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="glowGrad" cx="50%" cy="60%" r="40%">
          <stop offset="0%" stopColor="#aaff44" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#88ee00" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#44aa00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bodyGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#3a6fd8" />
          <stop offset="100%" stopColor="#0d1f5c" />
        </radialGradient>
        <radialGradient id="abdomenGrad" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ccff44" />
          <stop offset="100%" stopColor="#88cc00" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Glow halo around abdomen */}
      <ellipse cx="50" cy="72" rx="22" ry="18" fill="url(#glowGrad)" opacity="0.7" />
      <ellipse cx="50" cy="72" rx="14" ry="11" fill="#aaff44" opacity="0.15" />
      {/* Left wing */}
      <ellipse cx="28" cy="46" rx="18" ry="9" fill="#a8c8ff" opacity="0.35" transform="rotate(-25 28 46)" />
      <ellipse cx="24" cy="52" rx="14" ry="7" fill="#c0d8ff" opacity="0.2" transform="rotate(-30 24 52)" />
      {/* Right wing */}
      <ellipse cx="72" cy="46" rx="18" ry="9" fill="#a8c8ff" opacity="0.35" transform="rotate(25 72 46)" />
      <ellipse cx="76" cy="52" rx="14" ry="7" fill="#c0d8ff" opacity="0.2" transform="rotate(30 76 52)" />
      {/* Body */}
      <ellipse cx="50" cy="52" rx="13" ry="22" fill="url(#bodyGrad)" />
      {/* Abdomen (glowing) */}
      <ellipse cx="50" cy="70" rx="10" ry="10" fill="url(#abdomenGrad)" filter="url(#glow)" />
      {/* Body segmentation lines */}
      <line x1="38" y1="58" x2="62" y2="58" stroke="#1a3a8a" strokeWidth="1" opacity="0.5" />
      <line x1="39" y1="64" x2="61" y2="64" stroke="#1a3a8a" strokeWidth="1" opacity="0.4" />
      {/* Head */}
      <ellipse cx="50" cy="30" rx="9" ry="8" fill="#1a3a8a" />
      {/* Eyes */}
      <circle cx="46" cy="28" r="2" fill="#88ccff" />
      <circle cx="54" cy="28" r="2" fill="#88ccff" />
      {/* Left antenna */}
      <path d="M 45 23 Q 36 14 32 8" stroke="#1a3a8a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="8" r="2" fill="#3a6fd8" />
      {/* Right antenna */}
      <path d="M 55 23 Q 64 14 68 8" stroke="#1a3a8a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="68" cy="8" r="2" fill="#3a6fd8" />
      {/* Abdomen glow core */}
      <ellipse cx="50" cy="70" rx="5" ry="5" fill="#deff88" opacity="0.9" filter="url(#glow)" />
    </svg>
  );
}

// ── Generic field row ────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", options }) {
  const theme = useTheme();
  const style = { width: "100%", padding: "9px 12px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 7, color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit" };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 10, letterSpacing: 1.5, color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
      {options
        ? <select value={value || ""} onChange={e => onChange(e.target.value)} style={style}>
            <option value="">—</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} style={style} />
      }
    </div>
  );
}

// ── User modal ───────────────────────────────────────────────────────────────
function UserModal({ user, onSave, onClose }) {
  const theme  = useTheme();
  const isNew  = !user.id;
  const [form, setForm]     = useState({ username: user.username || "", name: user.name || "", team: user.team || "NCM", role: user.role || "partner", password: "" });
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
      const saved = isNew ? await api.createUser(payload) : await api.updateUser(user.id, payload);
      onSave(saved);
    } catch (e) { setError(e.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "min(440px,100%)", background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 16, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: theme.text, marginBottom: 20 }}>{isNew ? "Add User" : "Edit User"}</div>
        <Field label="Full Name"  value={form.name}     onChange={v => set("name", v)} />
        <Field label="Username"   value={form.username} onChange={v => set("username", v)} />
        <Field label="Password"   value={form.password} onChange={v => set("password", v)} type="password" />
        <Field label="Team"       value={form.team}     onChange={v => set("team", v)} options={TEAMS} />
        <Field label="Role"       value={form.role}     onChange={v => set("role", v)} options={ROLES} />
        {error && <div style={{ fontSize: 12, color: "#e74c3c", marginBottom: 10 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "11px", background: "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onClose}
            style={{ padding: "11px 18px", background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textMuted, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Patient modal ────────────────────────────────────────────────────────────
function PatientModal({ patient, onSave, onClose }) {
  const theme  = useTheme();
  const [form, setForm]     = useState({ ...patient });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await api.updatePatient(patient.id, form);
      onSave(saved);
    } finally { setSaving(false); }
  };

  const fields = [
    ["Prescriber",       "prescriber"],
    ["SP Partner",       "latest_sp_partner"],
    ["SP Status",        "latest_sp_status"],
    ["SP Substatus",     "latest_sp_substatus"],
    ["HUB Substatus",    "latest_hub_sub_status"],
    ["Primary Channel",  "primary_channel"],
    ["Primary Payer",    "primary_payer"],
    ["Primary PBM",      "primary_pbm"],
    ["Secondary Channel","secondary_channel"],
    ["Territory",        "territory"],
    ["Region",           "region"],
    ["Language",         "language"],
    ["Program Type",     "program_type"],
    ["HIPAA Consent",    "hippa_consent"],
    ["Referral Date",    "referral_date"],
    ["First Ship Date",  "first_ship_date"],
    ["Last Ship Date",   "last_ship_date"],
    ["Aging (days)",     "aging_of_status"],
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "min(680px,100%)", maxHeight: "88vh", background: theme.panelBg, border: `1px solid ${theme.border}`, borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>Edit Patient</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {fields.map(([label, key]) => (
              <div key={key} style={{ gridColumn: key === "prescriber" ? "1/-1" : undefined }}>
                <Field label={label} value={form[key]} onChange={v => set(key, key === "aging_of_status" ? Number(v) : v)} type={key === "aging_of_status" ? "number" : "text"} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 4 }}>
            <label style={{ fontSize: 10, letterSpacing: 1.5, color: theme.textMuted, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Last Comment</label>
            <textarea value={form.last_comment || ""} onChange={e => set("last_comment", e.target.value)} rows={3}
              style={{ width: "100%", padding: "9px 12px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 7, color: theme.text, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10 }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, padding: "11px", background: "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={onClose}
            style={{ padding: "11px 18px", background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textMuted, fontSize: 14, cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Slide data ────────────────────────────────────────────────────────────────
const SLIDES = [
  { id: "title" },
  { id: "problem" },
  { id: "solution" },
  { id: "features" },
  { id: "howItWorks" },
  { id: "analytics" },
  { id: "teamComm" },
  { id: "security" },
  { id: "whyFirefly" },
  { id: "cta" },
];

// ── Individual slide renderers ────────────────────────────────────────────────
function Slide1() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 50% 40%, #0d1f5c 0%, #060d26 60%, #000 100%)", position: "relative", overflow: "hidden" }}>
      {/* Animated glow rings */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(79,142,247,0.15)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", border: "1px solid rgba(79,142,247,0.08)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", border: "1px solid rgba(79,142,247,0.04)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      {/* Glow blob */}
      <div style={{ position: "absolute", width: 280, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(170,255,68,0.18) 0%, transparent 70%)", top: "42%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <FireflyLogo size={100} />
        <div style={{ marginTop: 12, fontSize: 11, letterSpacing: 3, color: "#4f8ef7", textTransform: "uppercase", fontWeight: 600 }}>FireFly Software LLC</div>
        <div style={{ marginTop: 18, fontSize: 46, fontWeight: 800, color: "#fff", letterSpacing: -1, lineHeight: 1.1 }}>AAIM Portal</div>
        <div style={{ marginTop: 14, fontSize: 17, color: "rgba(180,210,255,0.85)", fontWeight: 400, maxWidth: 480, lineHeight: 1.55 }}>
          The Future of Specialty Pharmacy<br />Case Management
        </div>
        <div style={{ marginTop: 28, display: "inline-block", padding: "8px 24px", border: "1px solid rgba(79,142,247,0.4)", borderRadius: 40, fontSize: 12, color: "rgba(140,180,255,0.8)", letterSpacing: 1.5, textTransform: "uppercase" }}>
          Purpose-Built · Real-Time · Team-Centric
        </div>
      </div>
    </div>
  );
}

function Slide2() {
  const pains = [
    { icon: "🔴", title: "Fragmented Teams", desc: "Home Office, NCM, SP, and Sales operate in isolation with no shared visibility." },
    { icon: "🔴", title: "Cases Fall Through Cracks", desc: "Critical patient cases get lost in email threads and missed handoffs." },
    { icon: "🔴", title: "No Real-Time Visibility", desc: "Managers have no live view of case status across the full pipeline." },
    { icon: "🔴", title: "Manual Spreadsheet Tracking", desc: "Teams waste hours each week maintaining error-prone spreadsheets." },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a0505 0%, #2a0a0a 50%, #1a0505 100%)", padding: "32px 28px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#ff6b6b", textTransform: "uppercase", marginBottom: 12, fontWeight: 700 }}>The Problem</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 28, lineHeight: 1.2 }}>Specialty Pharma Is<br />Broken By Silos</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 640 }}>
        {pains.map(p => (
          <div key={p.title} style={{ background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.25)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ffaaaa", marginBottom: 6 }}>{p.title}</div>
            <div style={{ fontSize: 12, color: "rgba(255,180,180,0.7)", lineHeight: 1.5 }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide3() {
  const teams = [
    { label: "Home Office", angle: 270, color: "#4f8ef7" },
    { label: "NCM", angle: 0, color: "#2ecc71" },
    { label: "SP", angle: 90, color: "#e67e22" },
    { label: "Sales", angle: 180, color: "#9b59b6" },
  ];
  const cx = 130, cy = 130, r = 90, bubbleR = 36;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #03091f 0%, #071840 50%, #03091f 100%)", padding: "24px 20px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#4f8ef7", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>The Solution</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 6, lineHeight: 1.2 }}>One Platform. Every Team. Real Time.</div>
      <div style={{ fontSize: 13, color: "rgba(160,200,255,0.7)", marginBottom: 24, textAlign: "center" }}>Unified communication and case visibility across every stakeholder.</div>
      <svg width={260} height={260} viewBox="0 0 260 260">
        <defs>
          <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4f8ef7" />
            <stop offset="100%" stopColor="#1a3a8a" />
          </radialGradient>
        </defs>
        {teams.map(t => {
          const rad = (t.angle * Math.PI) / 180;
          const tx = cx + r * Math.cos(rad);
          const ty = cy + r * Math.sin(rad);
          return (
            <g key={t.label}>
              <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={t.color} strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="4 3" />
              <circle cx={tx} cy={ty} r={bubbleR} fill={t.color} opacity="0.15" />
              <circle cx={tx} cy={ty} r={bubbleR} fill="none" stroke={t.color} strokeWidth="1.5" />
              <text x={tx} y={ty + 5} textAnchor="middle" fill={t.color} fontSize="11" fontWeight="700">{t.label}</text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={34} fill="url(#hubGrad)" />
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700">AAIM</text>
        <text x={cx} y={cy + 9} textAnchor="middle" fill="rgba(200,220,255,0.8)" fontSize="8">Portal</text>
      </svg>
    </div>
  );
}

function Slide4() {
  const features = [
    { icon: "🔔", title: "Smart Notifications", desc: "Priority-based alerts with email escalation" },
    { icon: "📊", title: "Case Analytics", desc: "Aging, pipeline, regional breakdowns" },
    { icon: "🗂", title: "Patient Tracking", desc: "26 data fields, full history" },
    { icon: "📱", title: "Mobile First", desc: "Works on any device" },
    { icon: "🎨", title: "Branded Themes", desc: "Dark and light mode" },
    { icon: "🔐", title: "Access Control", desc: "Role-based team permissions" },
  ];
  const colors = ["#4f8ef7", "#2ecc71", "#e67e22", "#9b59b6", "#f39c12", "#1abc9c"];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #080e1f 0%, #0d1530 100%)", padding: "28px 24px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#4f8ef7", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Features</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 22 }}>Everything Your Team Needs</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 580 }}>
        {features.map((f, i) => (
          <div key={f.title} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${colors[i]}44`, borderLeft: `3px solid ${colors[i]}`, borderRadius: 10, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "rgba(180,210,255,0.65)", lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide5() {
  const steps = [
    { n: "1", title: "Case Received", desc: "Home Office hub receives and enters the case" },
    { n: "2", title: "Notify Teams", desc: "Alerts sent to SP, NCM & Sales instantly" },
    { n: "3", title: "Collaborate", desc: "Teams reply, acknowledge, and escalate" },
    { n: "4", title: "Track & Resolve", desc: "Analytics monitor resolution & outcomes" },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #050d20 0%, #0a1530 50%, #050d20 100%)", padding: "32px 24px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#4f8ef7", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Workflow</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 30 }}>How It Works</div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%", maxWidth: 680, flexWrap: "wrap", justifyContent: "center" }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ textAlign: "center", width: 140 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #1a3a8a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff", margin: "0 auto 10px" }}>{s.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#aaccff", marginBottom: 5 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: "rgba(160,190,240,0.65)", lineHeight: 1.45 }}>{s.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 32, textAlign: "center", color: "rgba(79,142,247,0.5)", fontSize: 18, flexShrink: 0 }}>→</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide6() {
  const stats = [
    { value: "26", label: "Patients Tracked" },
    { value: "5", label: "Case Stage Buckets" },
    { value: "4", label: "Team Coverage" },
    { value: "5s", label: "Real-Time Refresh" },
  ];
  // SVG bar chart: sample case stage data
  const bars = [
    { label: "New", value: 6, color: "#4f8ef7" },
    { label: "Active", value: 10, color: "#2ecc71" },
    { label: "On Hold", value: 4, color: "#f39c12" },
    { label: "Pending", value: 3, color: "#9b59b6" },
    { label: "Closed", value: 3, color: "#95a5a6" },
  ];
  const maxVal = 10;
  const barW = 30, barGap = 12, chartH = 80, startX = 30;
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #031a18 0%, #052a26 50%, #031a18 100%)", padding: "28px 24px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#1abc9c", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Analytics</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 20 }}>Data-Driven Case Management</div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {stats.map(s => (
          <div key={s.label} style={{ textAlign: "center", background: "rgba(26,188,156,0.1)", border: "1px solid rgba(26,188,156,0.3)", borderRadius: 12, padding: "14px 20px", minWidth: 100 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#1abc9c" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(150,220,210,0.7)", marginTop: 3 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <svg width={bars.length * (barW + barGap) + startX + 20} height={chartH + 30} viewBox={`0 0 ${bars.length * (barW + barGap) + startX + 20} ${chartH + 30}`}>
        {bars.map((b, i) => {
          const bh = (b.value / maxVal) * chartH;
          const x = startX + i * (barW + barGap);
          return (
            <g key={b.label}>
              <rect x={x} y={chartH - bh} width={barW} height={bh} rx={4} fill={b.color} opacity="0.85" />
              <text x={x + barW / 2} y={chartH + 14} textAnchor="middle" fill="rgba(180,230,220,0.7)" fontSize="9">{b.label}</text>
              <text x={x + barW / 2} y={chartH - bh - 4} textAnchor="middle" fill={b.color} fontSize="10" fontWeight="700">{b.value}</text>
            </g>
          );
        })}
        <line x1={startX - 4} y1={0} x2={startX - 4} y2={chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <line x1={startX - 4} y1={chartH} x2={bars.length * (barW + barGap) + startX + 10} y2={chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      </svg>
    </div>
  );
}

function Slide7() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #030c1f 0%, #061535 50%, #030c1f 100%)", padding: "32px 28px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#4f8ef7", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Communication</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 24 }}>Instant Cross-Team Collaboration</div>
      {/* Mock notification card */}
      <div style={{ background: "rgba(79,142,247,0.1)", border: "1px solid rgba(79,142,247,0.4)", borderRadius: 14, padding: "18px 22px", maxWidth: 420, width: "100%", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#aaccff", marginBottom: 3 }}>From <span style={{ fontWeight: 700, color: "#fff" }}>SP Team</span> → <span style={{ fontWeight: 700, color: "#2ecc71" }}>NCM</span></div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Patient Update: J. Smith</div>
          </div>
          <span style={{ padding: "3px 10px", background: "rgba(231,76,60,0.2)", border: "1px solid rgba(231,76,60,0.5)", borderRadius: 20, fontSize: 11, color: "#ff8888", fontWeight: 700, flexShrink: 0 }}>🔴 HIGH</span>
        </div>
        <div style={{ fontSize: 13, color: "rgba(180,210,255,0.8)", lineHeight: 1.55, marginBottom: 12 }}>
          SP status updated to <strong style={{ color: "#fff" }}>"On Hold – PA Required"</strong>. NCM review needed within 24h to prevent lapse.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ padding: "5px 14px", background: "rgba(79,142,247,0.2)", border: "1px solid rgba(79,142,247,0.4)", borderRadius: 6, fontSize: 11, color: "#7ab8ff", fontWeight: 600 }}>✓ Acknowledge</div>
          <div style={{ padding: "5px 14px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6, fontSize: 11, color: "#ff8888", fontWeight: 600 }}>⚡ Escalate</div>
        </div>
      </div>
      {/* Email escalation callout */}
      <div style={{ background: "rgba(243,156,18,0.08)", border: "1px solid rgba(243,156,18,0.3)", borderRadius: 10, padding: "12px 20px", maxWidth: 420, width: "100%", display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 22 }}>✉️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842" }}>Auto-Email Escalation</div>
          <div style={{ fontSize: 12, color: "rgba(240,210,120,0.7)", lineHeight: 1.4 }}>Critical cases automatically email the Sales team — no manual follow-up required.</div>
        </div>
      </div>
    </div>
  );
}

function Slide8() {
  const pillars = [
    { title: "HIPAA Awareness", desc: "Consent fields tracked per patient with full audit visibility." },
    { title: "Consent Tracking", desc: "HIPAA consent status captured and required for every case." },
    { title: "Audit Trail", desc: "All changes timestamped and attributed to users." },
    { title: "Role-Based Access", desc: "Admin vs. partner permissions enforced across all teams." },
  ];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(160deg, #020a18 0%, #051428 50%, #020a18 100%)", padding: "28px 24px" }}>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#2ecc71", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Compliance</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", textAlign: "center", marginBottom: 8 }}>Built For Healthcare</div>
      {/* Inline SVG shield */}
      <svg width={52} height={60} viewBox="0 0 52 60" style={{ marginBottom: 20 }}>
        <path d="M26 2 L50 12 L50 30 C50 44 38 54 26 58 C14 54 2 44 2 30 L2 12 Z" fill="rgba(46,204,113,0.12)" stroke="#2ecc71" strokeWidth="1.5" />
        <path d="M26 8 L44 16 L44 30 C44 40 36 48 26 52 C16 48 8 40 8 30 L8 16 Z" fill="rgba(46,204,113,0.07)" stroke="rgba(46,204,113,0.4)" strokeWidth="1" />
        <text x="26" y="35" textAnchor="middle" fill="#2ecc71" fontSize="16" fontWeight="800">✓</text>
      </svg>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 560 }}>
        {pillars.map(p => (
          <div key={p.title} style={{ background: "rgba(46,204,113,0.07)", border: "1px solid rgba(46,204,113,0.25)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#5eed9a", marginBottom: 5 }}>🛡️ {p.title}</div>
            <div style={{ fontSize: 12, color: "rgba(160,230,190,0.7)", lineHeight: 1.45 }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Slide9() {
  const diffs = [
    { icon: "⚡", title: "90-Day Implementation", desc: "From contract to live deployment in 90 days or less." },
    { icon: "🎯", title: "Zero Training Curve", desc: "Intuitive design means teams are productive from day one." },
    { icon: "🤝", title: "Dedicated Support", desc: "Direct access to the engineering team — no ticket queues." },
  ];
  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0c0800 0%, #1a1000 50%, #0c0800 100%)", padding: "28px 32px", gap: 36 }}>
      <div style={{ flexShrink: 0 }}>
        <FireflyLogo size={90} />
      </div>
      <div style={{ flex: 1, maxWidth: 480 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#f39c12", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>Why FireFly Software</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6, lineHeight: 1.2 }}>Purpose-Built.<br />Rapidly Deployed.</div>
        <div style={{ fontSize: 13, color: "rgba(240,200,100,0.6)", marginBottom: 24 }}>We don't adapt generic tools — we build for specialty pharma from scratch.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {diffs.map(d => (
            <div key={d.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(243,156,18,0.07)", border: "1px solid rgba(243,156,18,0.25)", borderRadius: 10, padding: "12px 16px" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{d.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#f5c842", marginBottom: 3 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: "rgba(240,210,140,0.65)", lineHeight: 1.4 }}>{d.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slide10() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 50% 30%, #1a0c00 0%, #0d0600 60%, #050300 100%)", position: "relative", overflow: "hidden", padding: "32px 24px" }}>
      {/* Warm glow */}
      <div style={{ position: "absolute", width: 320, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(243,156,18,0.18) 0%, transparent 70%)", top: "30%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <FireflyLogo size={90} />
        <div style={{ marginTop: 18, fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>Ready to Transform Your<br />Case Management?</div>
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <div style={{ padding: "14px 36px", background: "linear-gradient(135deg, #f39c12, #e67e22)", borderRadius: 50, fontSize: 16, fontWeight: 800, color: "#fff", boxShadow: "0 4px 32px rgba(243,156,18,0.45)", letterSpacing: 0.5 }}>
            Get Started Today
          </div>
        </div>
        <div style={{ marginTop: 28, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(243,156,18,0.25)", borderRadius: 12, padding: "18px 28px", display: "inline-block" }}>
          <div style={{ fontSize: 13, color: "rgba(240,200,140,0.8)", marginBottom: 6 }}>✉️ <span style={{ fontWeight: 600, color: "#f5c842" }}>nick@fireflysoftware.com</span></div>
          <div style={{ fontSize: 13, color: "rgba(240,200,140,0.6)" }}>🌐 <span style={{ color: "#f5c842" }}>fireflysoftware.com</span></div>
          <div style={{ marginTop: 10, fontSize: 11, letterSpacing: 2, color: "rgba(240,200,140,0.4)", textTransform: "uppercase" }}>FireFly Software LLC</div>
        </div>
      </div>
    </div>
  );
}

const SLIDE_COMPONENTS = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10];

// ── Demo Tab ──────────────────────────────────────────────────────────────────
function DemoTab({ activeSlide, setActiveSlide }) {
  const total = SLIDES.length;
  const SlideComp = SLIDE_COMPONENTS[activeSlide];
  const go = (dir) => setActiveSlide(s => Math.max(0, Math.min(total - 1, s + dir)));

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ fontSize: 13, color: "rgba(130,160,200,0.7)", marginBottom: 14, textAlign: "center", letterSpacing: 1 }}>AAIM Portal — Product Presentation</div>
      {/* Slide container */}
      <div style={{ borderRadius: 16, overflow: "hidden", height: 520, position: "relative", boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}>
        <SlideComp />
      </div>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 20 }}>
        <button onClick={() => go(-1)} disabled={activeSlide === 0}
          style={{ width: 40, height: 40, borderRadius: "50%", background: activeSlide === 0 ? "rgba(255,255,255,0.04)" : "rgba(79,142,247,0.18)", border: `1px solid ${activeSlide === 0 ? "rgba(255,255,255,0.08)" : "rgba(79,142,247,0.4)"}`, color: activeSlide === 0 ? "rgba(255,255,255,0.2)" : "#7ab8ff", fontSize: 18, cursor: activeSlide === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ‹
        </button>
        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setActiveSlide(i)}
              style={{ width: i === activeSlide ? 20 : 7, height: 7, borderRadius: 4, background: i === activeSlide ? "#4f8ef7" : "rgba(255,255,255,0.18)", border: "none", cursor: "pointer", transition: "width 0.2s, background 0.2s", padding: 0 }} />
          ))}
        </div>
        <button onClick={() => go(1)} disabled={activeSlide === total - 1}
          style={{ width: 40, height: 40, borderRadius: "50%", background: activeSlide === total - 1 ? "rgba(255,255,255,0.04)" : "rgba(79,142,247,0.18)", border: `1px solid ${activeSlide === total - 1 ? "rgba(255,255,255,0.08)" : "rgba(79,142,247,0.4)"}`, color: activeSlide === total - 1 ? "rgba(255,255,255,0.2)" : "#7ab8ff", fontSize: 18, cursor: activeSlide === total - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          ›
        </button>
      </div>
      {/* Slide counter */}
      <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "rgba(130,160,200,0.5)", letterSpacing: 1 }}>
        {activeSlide + 1} / {total}
      </div>
      {/* Keyboard hint */}
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, color: "rgba(130,160,200,0.35)" }}>
        Use ← → arrow keys to navigate
      </div>
    </div>
  );
}

// ── About Tab ─────────────────────────────────────────────────────────────────
function AboutTab() {
  const theme = useTheme();

  const leadershipCardStyle = {
    flex: 1,
    background: theme.surfaceBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 28,
    minWidth: 220,
  };

  const chipStyle = (color) => ({
    display: "inline-block",
    padding: "3px 12px",
    background: color + "22",
    border: `1px solid ${color}55`,
    borderRadius: 20,
    fontSize: 11,
    color: color,
    fontWeight: 600,
    marginRight: 6,
    marginBottom: 6,
  });

  const statCardStyle = {
    flex: 1,
    textAlign: "center",
    background: theme.surfaceBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: "20px 12px",
    minWidth: 100,
  };

  const pillarCardStyle = {
    flex: 1,
    background: theme.surfaceBg,
    border: `1px solid ${theme.border}`,
    borderRadius: 14,
    padding: 22,
    minWidth: 180,
  };

  return (
    <div style={{ margin: "0 -100px" }}>
      {/* Hero banner — full width dark */}
      <div style={{ background: "linear-gradient(135deg, #030c20 0%, #051830 50%, #030c20 100%)", borderRadius: 16, padding: "48px 40px", textAlign: "center", marginBottom: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 4px 40px rgba(0,0,0,0.5)" }}>
        <FireflyLogo size={80} />
        <div style={{ fontSize: 34, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>FireFly Software LLC</div>
        <div style={{ fontSize: 16, color: "rgba(160,200,255,0.75)", fontStyle: "italic" }}>Illuminating Healthcare Operations</div>
        <div style={{ width: 60, height: 2, background: "linear-gradient(90deg, transparent, #4f8ef7, transparent)", marginTop: 6 }} />
      </div>

      {/* Constrained content area */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 8px" }}>

        {/* Mission statement */}
        <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 14, padding: "28px 32px", marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#4f8ef7", textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>Our Mission</div>
          <div style={{ fontSize: 16, color: theme.text, lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
            We build purpose-built software for specialty pharmacy and rare disease patient access teams. Our mission is to eliminate operational silos and accelerate patient access to life-changing therapies.
          </div>
        </div>

        {/* Leadership */}
        <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#4f8ef7", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Leadership Team</div>
        <div style={{ display: "flex", gap: 20, marginBottom: 28, flexWrap: "wrap" }}>
          {/* CEO */}
          <div style={leadershipCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #f39c12, #e67e22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 16px rgba(243,156,18,0.35)" }}>NM</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>Nick Milero</div>
                <div style={{ fontSize: 12, color: "#f39c12", fontWeight: 600, marginTop: 2 }}>Co-Founder & CEO</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.65, marginBottom: 18 }}>
              Nick brings 15+ years of specialty pharmacy and rare disease market access expertise. He has led patient access programs at multiple top-10 pharma companies and understands the operational challenges teams face every day. Nick founded FireFly Software to turn his vision of seamless multi-team coordination into reality.
            </div>
            <div>
              {["Market Access", "Rare Disease", "Business Development"].map(s => (
                <span key={s} style={chipStyle("#f39c12")}>{s}</span>
              ))}
            </div>
          </div>
          {/* CTO */}
          <div style={leadershipCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #4f8ef7, #1a5ab8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: "0 4px 16px rgba(79,142,247,0.35)" }}>RB</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>Rick Boulanger</div>
                <div style={{ fontSize: 12, color: "#4f8ef7", fontWeight: 600, marginTop: 2 }}>Co-Founder & CTO</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.65, marginBottom: 18 }}>
              Rick is a full-stack software engineer with deep experience building enterprise SaaS platforms. He architected the AAIM Portal from the ground up — designing the real-time communication engine, analytics pipeline, and mobile-first interface. Rick believes technology should disappear into the workflow.
            </div>
            <div>
              {["Software Architecture", "Cloud Infrastructure", "Product Design"].map(s => (
                <span key={s} style={chipStyle("#4f8ef7")}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Company stats */}
        <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#4f8ef7", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Company Overview</div>
        <div style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { value: "2024", label: "Founded" },
            { value: "4", label: "Teams Served" },
            { value: "26+", label: "Cases Managed" },
            { value: "100%", label: "Uptime Goal" },
          ].map(s => (
            <div key={s.label} style={statCardStyle}>
              <div style={{ fontSize: 30, fontWeight: 800, color: theme.text }}>{s.value}</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Product philosophy */}
        <div style={{ fontSize: 11, letterSpacing: 2.5, color: "#4f8ef7", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Product Philosophy</div>
        <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
          {[
            { icon: "⚡", title: "Speed Over Complexity", desc: "Every feature ships in days, not months.", color: "#f39c12" },
            { icon: "🏥", title: "Healthcare First", desc: "Built around specialty pharma workflows, not adapted from generic tools.", color: "#2ecc71" },
            { icon: "👥", title: "Team-Centric Design", desc: "Designed for the people in the trenches — NCMs, SP partners, and access coordinators.", color: "#4f8ef7" },
          ].map(p => (
            <div key={p.title} style={pillarCardStyle}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.55 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* Contact footer */}
        <div style={{ background: "linear-gradient(135deg, #030c20 0%, #051830 100%)", borderRadius: 14, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <FireflyLogo size={44} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>FireFly Software LLC</div>
              <div style={{ fontSize: 12, color: "rgba(160,200,255,0.6)", marginTop: 2 }}>Illuminating Healthcare Operations</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "rgba(200,220,255,0.8)", marginBottom: 4 }}>✉️ <span style={{ color: "#7ab8ff" }}>nick@fireflysoftware.com</span></div>
            <div style={{ fontSize: 13, color: "rgba(200,220,255,0.6)" }}>🌐 fireflysoftware.com</div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── Main Settings page ───────────────────────────────────────────────────────
export default function SettingsPage({ isDark, onToggleTheme }) {
  const theme    = useTheme();
  const isMobile = useIsMobile();

  const [users, setUsers]           = useState([]);
  const [patients, setPatients]     = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [editingUser, setEditingUser]     = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab]   = useState("appearance");
  const [loadingUsers, setLoadingUsers]     = useState(true);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    api.getUsers().then(u => { setUsers(u); setLoadingUsers(false); });
    api.getPatients().then(p => { setPatients(p); setLoadingPatients(false); });
  }, []);

  // Keyboard navigation for demo slideshow
  useEffect(() => {
    if (activeTab !== "demo") return;
    const handler = (e) => {
      if (e.key === "ArrowRight") setActiveSlide(s => Math.min(SLIDES.length - 1, s + 1));
      if (e.key === "ArrowLeft")  setActiveSlide(s => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab]);

  const handleUserSave = (saved) => {
    setUsers(prev => { const i = prev.findIndex(u => u.id === saved.id); if (i === -1) return [...prev, saved]; const n = [...prev]; n[i] = saved; return n; });
    setEditingUser(null);
  };

  const handleUserDelete = async (id) => {
    setDeletingId(id);
    try { await api.deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)); }
    finally { setDeletingId(null); }
  };

  const handlePatientSave = (saved) => {
    setPatients(prev => { const i = prev.findIndex(p => p.id === saved.id); if (i === -1) return prev; const n = [...prev]; n[i] = saved; return n; });
    setEditingPatient(null);
  };

  const handlePatientDelete = async (id) => {
    if (!window.confirm("Delete this patient and all their notifications?")) return;
    setDeletingId(id);
    try { await api.deletePatient(id); setPatients(prev => prev.filter(p => p.id !== id)); }
    finally { setDeletingId(null); }
  };

  const filteredPatients = patients.filter(p =>
    !patientSearch || p.prescriber?.toLowerCase().includes(patientSearch.toLowerCase()) || p.territory?.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const tabs = [
    { id: "demo",       label: "🎬  Demo" },
    { id: "about",      label: "🏢  About" },
    { id: "appearance", label: "🎨  Appearance" },
    { id: "users",      label: "👥  Users" },
    { id: "patients",   label: "🗂  Patients" },
  ];

  const SectionCard = ({ children }) => (
    <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: activeTab === "about" ? "none" : 860, margin: "0 auto" }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: theme.text, marginBottom: 20 }}>Settings</div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${theme.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "10px 18px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === t.id ? "#4f8ef7" : "transparent"}`, color: activeTab === t.id ? "#4f8ef7" : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── DEMO ── */}
      {activeTab === "demo" && (
        <DemoTab activeSlide={activeSlide} setActiveSlide={setActiveSlide} />
      )}

      {/* ── ABOUT ── */}
      {activeTab === "about" && (
        <AboutTab />
      )}

      {/* ── APPEARANCE ── */}
      {activeTab === "appearance" && (
        <SectionCard>
          <div style={{ padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 6 }}>Theme</div>
            <div style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>Choose between dark and light mode</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
              {[
                { id: "dark",  label: "Dark Mode",  icon: "🌙", desc: "Easy on the eyes at night" },
                { id: "light", label: "Light Mode",  icon: "☀️", desc: "Clean and bright" },
              ].map(opt => {
                const isSelected = isDark === (opt.id === "dark");
                return (
                  <button key={opt.id} onClick={() => { if (!isSelected) onToggleTheme(); }}
                    style={{ padding: "20px 24px", background: isSelected ? "rgba(79,142,247,0.12)" : theme.surfaceBg2, border: `2px solid ${isSelected ? "#4f8ef7" : theme.border}`, borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{opt.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>{opt.desc}</div>
                    {isSelected && <div style={{ marginTop: 10, fontSize: 11, color: "#4f8ef7", fontWeight: 700 }}>✓ Active</div>}
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── USERS ── */}
      {activeTab === "users" && (
        <SectionCard>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Users <span style={{ fontSize: 13, color: theme.textFaint, fontWeight: 400 }}>({users.length})</span></div>
            <button onClick={() => setEditingUser({})}
              style={{ padding: "7px 16px", background: "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Add User</button>
          </div>
          {loadingUsers ? <div style={{ padding: 32, textAlign: "center", color: theme.textFaint }}>Loading…</div> : isMobile ? (
            <div style={{ padding: 12 }}>
              {users.map(u => {
                const tc = TEAM_COLORS[u.team] || { accent: "#888", light: "#eee", lightText: "#555" };
                return (
                  <div key={u.id} style={{ background: theme.surfaceBg2, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: theme.textFaint, fontFamily: "monospace" }}>{u.username}</div>
                      </div>
                      <span style={{ padding: "3px 10px", background: theme.isDark ? tc.light + "22" : tc.light, color: theme.isDark ? tc.accent : tc.lightText, borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{u.team}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditingUser(u)} style={{ flex: 1, padding: 8, background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 6, color: "#4f8ef7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                      <button onClick={() => handleUserDelete(u.id)} disabled={deletingId === u.id} style={{ flex: 1, padding: 8, background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6, color: "#e74c3c", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{deletingId === u.id ? "…" : "Delete"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
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
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                            {u.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 13, color: theme.textMuted, fontFamily: "monospace" }}>{u.username}</td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ padding: "3px 10px", background: theme.isDark ? tc.light + "22" : tc.light, color: theme.isDark ? tc.accent : tc.lightText, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{u.team}</span>
                      </td>
                      <td style={{ padding: "12px 20px", fontSize: 13, color: theme.textMuted, textTransform: "capitalize" }}>{u.role}</td>
                      <td style={{ padding: "12px 20px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setEditingUser(u)} style={{ padding: "5px 14px", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 6, color: "#4f8ef7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => handleUserDelete(u.id)} disabled={deletingId === u.id} style={{ padding: "5px 14px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6, color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{deletingId === u.id ? "…" : "Delete"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

      {/* ── PATIENTS ── */}
      {activeTab === "patients" && (
        <SectionCard>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: theme.text }}>Patients <span style={{ fontSize: 13, color: theme.textFaint, fontWeight: 400 }}>({patients.length})</span></div>
            <input value={patientSearch} onChange={e => setPatientSearch(e.target.value)}
              placeholder="Search by name or territory…"
              style={{ padding: "7px 12px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none", width: isMobile ? "100%" : 240 }} />
          </div>
          {loadingPatients ? <div style={{ padding: 32, textAlign: "center", color: theme.textFaint }}>Loading…</div> : isMobile ? (
            <div style={{ padding: 12 }}>
              {filteredPatients.map(p => (
                <div key={p.id} style={{ background: theme.surfaceBg2, border: `1px solid ${theme.border}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, marginBottom: 2 }}>{p.prescriber}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 10 }}>{p.territory} · {p.region} · {p.primary_channel}</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditingPatient(p)} style={{ flex: 1, padding: 8, background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 6, color: "#4f8ef7", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                    <button onClick={() => handlePatientDelete(p.id)} disabled={deletingId === p.id} style={{ flex: 1, padding: 8, background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6, color: "#e74c3c", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{deletingId === p.id ? "…" : "Delete"}</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: theme.surfaceBg2 }}>
                  {["Prescriber", "Territory", "Region", "Channel", "SP Partner", "Aging", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, letterSpacing: 1.5, color: theme.textFaint, textTransform: "uppercase", fontWeight: 600, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${theme.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: theme.text }}>{p.prescriber}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: theme.textMuted }}>{p.territory}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: theme.textMuted }}>{p.region}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: theme.textMuted }}>{p.primary_channel || "—"}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: theme.textMuted }}>{p.latest_sp_partner || "—"}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: theme.textMuted }}>{p.aging_of_status}d</td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => setEditingPatient(p)} style={{ padding: "5px 12px", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 6, color: "#4f8ef7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                        <button onClick={() => handlePatientDelete(p.id)} disabled={deletingId === p.id} style={{ padding: "5px 12px", background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 6, color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{deletingId === p.id ? "…" : "Delete"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </SectionCard>
      )}

      {editingUser   !== null && <UserModal    user={editingUser}       onSave={handleUserSave}    onClose={() => setEditingUser(null)} />}
      {editingPatient !== null && <PatientModal patient={editingPatient} onSave={handlePatientSave} onClose={() => setEditingPatient(null)} />}
    </div>
  );
}
