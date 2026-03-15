import { useState, useEffect } from "react";
import { TEAM_COLORS } from "../constants";
import { GLOBAL_STYLES } from "./Shared";
import { api } from "../api";

const ALL_LOGOS = [
  "/img/relayrx_option_A.svg",
  "/img/relayrx_option_B.svg",
  "/img/relayrx_option_C.svg",
  "/img/relayrx_option_D.svg",
  "/img/conduit_option_E.svg",
  "/img/conduit_option_F.svg",
  "/img/conduit_option_G.svg",
  "/img/conduit_option_H.svg",
];

export default function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [shake, setShake]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [logoIdx, setLogoIdx]   = useState(() => Math.floor(Math.random() * ALL_LOGOS.length));

  useEffect(() => {
    const t = setInterval(() => setLogoIdx(i => (i + 1) % ALL_LOGOS.length), 3500);
    return () => clearInterval(t);
  }, []);

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
      <div style={{ position: "relative", width: 420 }}>
        {/* Cycling logo banner */}
        <div style={{ marginBottom: 20, borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <img key={logoIdx} src={ALL_LOGOS[logoIdx]} alt="logo"
            style={{ width: "100%", display: "block", animation: "logoFadeIn 0.6s ease" }} />
        </div>

      <div style={{
        position: "relative", width: "100%", padding: "48px 44px",
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
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 10, letterSpacing: 1 }}>DEMO — CLICK TO SIGN IN</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[["Home Office", "sarah.johnson"], ["NCM", "lisa.torres"], ["SP", "amy.patel"], ["Sales", "diana.reyes"]].map(([team, u]) => {
              const accent = TEAM_COLORS[team]?.accent || "#fff";
              return (
                <button key={team} onClick={async () => {
                    setLoading(true);
                    try { const user = await api.login(u, "pass123"); localStorage.setItem("aaim_user", JSON.stringify(user)); onLogin(user); }
                    catch { setError("Login failed."); }
                    finally { setLoading(false); }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: accent + "12", border: `1px solid ${accent}33`, borderRadius: 8, cursor: "pointer", textAlign: "left", width: "100%" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {u.split(".").map(w => w[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{team}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{u}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>tap →</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>
      <style>{GLOBAL_STYLES}</style>
    </div>
  );
}
