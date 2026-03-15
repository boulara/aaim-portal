import { useState } from "react";
import { TEAM_COLORS, FONT_SANS } from "../constants";
import { GLOBAL_STYLES } from "./Shared";
import { api } from "../api";
import { APP_VERSION } from "../version";

function ConduitMark({ height = 80, color = "#14B8A6" }) {
  return (
    <svg viewBox="-128 -52 256 100" height={height} style={{ display: "block" }}>
      <path d="M-108,14 C-80,14 -68,-28 -36,-28 C-4,-28 4,28 36,28 C68,28 80,-10 108,-10"
            stroke={color} strokeWidth="2.5" fill="none" opacity="0.45"/>
      <circle cx="-108" cy="14"  r="20" fill={color} fillOpacity="0.14" stroke={color} strokeWidth="2.5" strokeOpacity="1.0"/>
      <circle cx="-36"  cy="-28" r="20" fill={color} fillOpacity="0.10" stroke={color} strokeWidth="2.0" strokeOpacity="0.78"/>
      <circle cx="36"   cy="28"  r="20" fill={color} fillOpacity="0.07" stroke={color} strokeWidth="2.0" strokeOpacity="0.55"/>
      <circle cx="108"  cy="-10" r="20" fill={color} fillOpacity="0.04" stroke={color} strokeWidth="2.0" strokeOpacity="0.35"/>
      <circle cx="-72" cy="-8" r="2.5" fill={color} opacity="0.3"/>
      <circle cx="-14" cy="10"  r="2.5" fill={color} opacity="0.3"/>
      <circle cx="32"  cy="24"  r="2.5" fill={color} opacity="0.3"/>
      <circle cx="76"  cy="4"   r="2.5" fill={color} opacity="0.3"/>
    </svg>
  );
}

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [shake, setShake]       = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setLoading(true);
    try {
      const user = await api.login(username, password);
      localStorage.setItem("conduit_user", JSON.stringify(user));
      onLogin(user);
    } catch {
      setError("Invalid username or password.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid #1E3A4A",
    borderRadius: 8, color: "#F1F5F9", fontSize: 14, outline: "none",
    fontFamily: FONT_SANS,
  };

  const labelStyle = {
    fontSize: 10, letterSpacing: 2, color: "#475569",
    textTransform: "uppercase", display: "block", marginBottom: 8,
    fontFamily: FONT_SANS,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B1829", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, rgba(20,184,166,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, rgba(14,165,233,0.05) 0%, transparent 50%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", width: 420 }}>

        {/* Stacked logomark lockup */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <ConduitMark height={72} color="#14B8A6" />
          </div>
          <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1 }}>
            <span style={{ color: "#14B8A6" }}>C</span>
            <span style={{ color: "#F1F5F9" }}>onduit</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: "3px", color: "#334155", textTransform: "uppercase", marginTop: 8 }}>
            Every Team. One Channel.
          </div>
        </div>

        <div style={{
          position: "relative", width: "100%", padding: "40px 40px",
          background: "rgba(20,184,166,0.03)", border: "1px solid #1E3A4A",
          borderRadius: 16, boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          animation: shake ? "shake 0.4s ease" : "fadeIn 0.6s ease",
        }}>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={inputStyle} placeholder="Enter username" autoFocus />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
              style={inputStyle} placeholder="Enter password" />
          </div>

          {error && <div style={{ fontSize: 13, color: "#e74c3c", marginBottom: 16, textAlign: "center" }}>{error}</div>}

          <button onClick={handleLogin} disabled={loading}
            style={{ width: "100%", padding: "14px", background: loading ? "#0d7a70" : "#14B8A6", border: "none", borderRadius: 8, color: "#0B1829", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: FONT_SANS }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>

        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#334155", letterSpacing: 1 }}>
          Conduit — Every Team. One Channel.
          <span style={{ marginLeft: 10, fontFamily: "monospace", fontSize: 10, color: "#1E3A4A" }}>v{APP_VERSION}</span>
        </div>
      </div>
      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}
