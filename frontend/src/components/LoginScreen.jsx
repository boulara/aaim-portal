import { useState } from "react";
import { TEAM_COLORS } from "../constants";
import { GLOBAL_STYLES } from "./Shared";
import { api } from "../api";

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
      localStorage.setItem("aaim_user", JSON.stringify(user));
      onLogin(user);
    } catch {
      setError("Invalid username or password.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Georgia', serif" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, #1a2744 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, #1a3a2a 0%, transparent 50%)", pointerEvents: "none" }} />
      <div style={{
        position: "relative", width: 420, padding: "48px 44px",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16, boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        animation: shake ? "shake 0.4s ease" : "fadeIn 0.6s ease",
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#4f8ef7", textTransform: "uppercase", marginBottom: 10 }}>AAIM Portal</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>Partner Communications</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>Secure team collaboration platform</div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none" }}
            placeholder="Enter username" autoFocus />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff", fontSize: 14, outline: "none" }}
            placeholder="Enter password" />
        </div>

        {error && <div style={{ fontSize: 13, color: "#e74c3c", marginBottom: 16, textAlign: "center" }}>{error}</div>}

        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "14px", background: loading ? "#3a5cb0" : "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 600, cursor: loading ? "wait" : "pointer" }}>
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <div style={{ marginTop: 24, padding: "16px", background: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8, letterSpacing: 1 }}>DEMO CREDENTIALS</div>
          {[["Home Office", "sarah.johnson"], ["NCM", "lisa.torres"], ["SP", "amy.patel"], ["Sales", "diana.reyes"]].map(([team, user]) => (
            <div key={team} style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              <span style={{ color: TEAM_COLORS[team]?.accent || "#fff", fontWeight: 600 }}>{team}:</span>{" "}
              <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => { setUsername(user); setPassword("pass123"); }}>{user}</span> / pass123
            </div>
          ))}
        </div>
      </div>
      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}
