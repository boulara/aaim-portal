import { useState, useEffect, useRef } from "react";
import { BUCKETS, TEAM_COLORS, assignBuckets, initials, agingColor } from "./constants";
import { AgingBadge, TeamBadge, GLOBAL_STYLES } from "./components/Shared";
import { ThemeContext, dark, light } from "./ThemeContext";
import LoginScreen from "./components/LoginScreen";
import PatientDetailPanel from "./components/PatientDetailPanel";
import NotificationCard from "./components/NotificationCard";
import SettingsPage from "./components/SettingsPage";
import { api } from "./api";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aaim_user")); } catch { return null; }
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem("aaim_theme") !== "light");
  const theme = isDark ? dark : light;

  const toggleTheme = () => {
    setIsDark(d => {
      const next = !d;
      localStorage.setItem("aaim_theme", next ? "dark" : "light");
      return next;
    });
  };

  const [patients, setPatients]               = useState([]);
  const [notifications, setNotifications]     = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch]                   = useState("");
  const [filterRegion, setFilterRegion]       = useState("All");
  const [filterChannel, setFilterChannel]     = useState("All");
  const [view, setView]                       = useState("dashboard");
  const [activeBucket, setActiveBucket]       = useState("all");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [toasts, setToasts]                   = useState([]);

  const knownIdsRef = useRef(new Set());
  const userRef     = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    api.getPatients().then(setPatients).catch(console.error);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const fresh = await api.getNotifications();
        const currentUser = userRef.current;
        if (!currentUser) {
          setNotifications(fresh);
          fresh.forEach(n => knownIdsRef.current.add(n.id));
          return;
        }
        const incoming = fresh.filter(n => !knownIdsRef.current.has(n.id) && n.to_team === currentUser.team);
        if (incoming.length > 0) {
          incoming.forEach(n => {
            const patient = patients.find(p => p.id === n.patient_id);
            const toast = {
              id:      n.id + "_toast_" + Date.now(),
              message: `New notification from ${n.from_team}`,
              detail:  `${patient?.prescriber || "Unknown patient"} · ${n.priority !== "normal" ? n.priority.toUpperCase() + " · " : ""}${n.comment.slice(0, 60)}${n.comment.length > 60 ? "…" : ""}`,
              color:   TEAM_COLORS[n.from_team]?.accent || "#4f8ef7",
            };
            setToasts(prev => [...prev, toast]);
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 6000);
          });
        }
        fresh.forEach(n => knownIdsRef.current.add(n.id));
        setNotifications(fresh);
      } catch { /* ignore polling errors */ }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [patients]);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem("aaim_user", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("aaim_user");
    setView("dashboard");
  };

  const handleNotificationUpdate = (updated) => {
    knownIdsRef.current.add(updated.id);
    setNotifications(prev => {
      const idx = prev.findIndex(n => n.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev]; next[idx] = updated; return next;
    });
  };

  if (!user) return <ThemeContext.Provider value={theme}><LoginScreen onLogin={handleLogin} /></ThemeContext.Provider>;

  const tc = TEAM_COLORS[user.team] || TEAM_COLORS["Home Office"];

  const patientBuckets  = new Map(patients.map(p => [p.id, assignBuckets(p)]));
  const filtered        = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      (!search || p.prescriber?.toLowerCase().includes(q) || p.territory?.toLowerCase().includes(q) || p.primary_payer?.toLowerCase().includes(q)) &&
      (filterRegion  === "All" || p.region          === filterRegion) &&
      (filterChannel === "All" || p.primary_channel === filterChannel) &&
      patientBuckets.get(p.id)?.has(activeBucket)
    );
  });

  const myInbox     = notifications.filter(n => (n.to_team === user.team && n.status === "pending") || (n.from_team === user.team && n.status === "replied"));
  const myAllNotifs = notifications.filter(n => n.to_team === user.team || n.from_team === user.team);
  const regions     = ["All", ...Array.from(new Set(patients.map(p => p.region).filter(Boolean))).sort()];
  const channels    = ["All", ...Array.from(new Set(patients.map(p => p.primary_channel).filter(Boolean))).sort()];
  const avgAging    = patients.length ? Math.round(patients.reduce((a, p) => a + p.aging_of_status, 0) / patients.length) : 0;

  const navItems = ["dashboard", "inbox", "settings"];

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ minHeight: "100vh", background: theme.pageBg, fontFamily: "'Georgia', serif", color: theme.text }}>
        <style>{GLOBAL_STYLES}</style>

        {/* Toasts */}
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
          {toasts.map(t => (
            <div key={t.id} style={{ pointerEvents: "all", minWidth: 320, maxWidth: 400, background: theme.panelBg, border: `1px solid ${t.color}55`, borderLeft: `4px solid ${t.color}`, borderRadius: 10, padding: "14px 16px", boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${t.color}22`, animation: "slideIn 0.3s ease", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.color + "22", border: `1px solid ${t.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 3 }}>{t.message}</div>
                <div style={{ fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.detail}</div>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: theme.textFaint, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav style={{ background: theme.navBg, borderBottom: `1px solid ${theme.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: theme.text, letterSpacing: -0.3 }}>
              <span style={{ color: tc.accent }}>AAIM</span> Portal
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {navItems.map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding: "8px 18px", background: view === v ? (theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "none", border: "none", borderRadius: 6, color: view === v ? theme.text : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", position: "relative" }}>
                  {v === "inbox" ? "Inbox" : v.charAt(0).toUpperCase() + v.slice(1)}
                  {v === "inbox" && myInbox.length > 0 && (
                    <>
                      <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: tc.accent, animation: "pulse 1.8s infinite", color: tc.accent }} />
                      <span style={{ marginLeft: 6, background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{myInbox.length}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TeamBadge team={user.team} size="md" />
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{initials(user.name)}</div>
            <div style={{ fontSize: 13, color: theme.textMuted }}>{user.name}</div>
            <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.textMuted, fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>Sign Out</button>
          </div>
        </nav>

        <div style={{ padding: "28px 32px" }}>

          {/* ── SETTINGS ── */}
          {view === "settings" && <SettingsPage isDark={isDark} onToggleTheme={toggleTheme} />}

          {/* ── DASHBOARD ── */}
          {view === "dashboard" && (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: theme.textFaint, textTransform: "uppercase", marginBottom: 12 }}>Case Stage / Bucket</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {BUCKETS.map(b => {
                    const count    = patients.filter(p => patientBuckets.get(p.id)?.has(b.id)).length;
                    const isActive = activeBucket === b.id;
                    return (
                      <button key={b.id} onClick={() => setActiveBucket(b.id)}
                        style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${isActive ? b.color : theme.border}`, background: isActive ? b.color + "22" : theme.surfaceBg, color: isActive ? b.color : theme.textMuted, fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", boxShadow: isActive ? `0 0 12px ${b.color}33` : "none" }}>
                        {b.label}
                        <span style={{ background: isActive ? b.color : theme.inputBg, color: isActive ? "#fff" : theme.textMuted, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
                {[
                  ["Showing",              filtered.length,                                           "#4f8ef7"],
                  ["Active Notifications", notifications.filter(n => n.status === "pending").length,  "#f0a500"],
                  ["My Inbox",             myInbox.length,                                            tc.accent],
                  ["Avg Aging",            avgAging + "d",                                            agingColor(avgAging)],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderTop: `2px solid ${color}`, borderRadius: 10, padding: "16px 20px" }}>
                    <div style={{ fontSize: 26, fontWeight: 700, color }}>{val}</div>
                    <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, letterSpacing: 0.5 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prescriber, territory, payer…"
                  style={{ flex: "1 1 240px", padding: "10px 16px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none" }} />
                <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
                  style={{ padding: "10px 14px", background: theme.selectBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none" }}>
                  {regions.map(r => <option key={r} value={r}>{r === "All" ? "All Regions" : r}</option>)}
                </select>
                <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
                  style={{ padding: "10px 14px", background: theme.selectBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none" }}>
                  {channels.map(c => <option key={c} value={c}>{c === "All" ? "All Channels" : c}</option>)}
                </select>
              </div>

              <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: theme.surfaceBg2 }}>
                      {["Prescriber", "Territory / Region", "SP Partner", "HUB Substatus", "Payer", "Channel", "Aging", "Notifications", ""].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: 1.5, color: theme.textFaint, textTransform: "uppercase", fontWeight: 600, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const pNotifs      = notifications.filter(n => n.patient_id === p.id);
                      const pendingCount = pNotifs.filter(n => (n.to_team === user.team && n.status === "pending") || (n.from_team === user.team && n.status === "replied")).length;
                      return (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${theme.border}`, cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.background = theme.rowHover}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          onClick={() => setSelectedPatient(p)}>
                          <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: theme.text }}>{p.prescriber}</td>
                          <td style={{ padding: "13px 16px", fontSize: 12, color: theme.textMuted }}>{p.territory}<br /><span style={{ fontSize: 11, color: theme.textFaint }}>{p.region}</span></td>
                          <td style={{ padding: "13px 16px", fontSize: 12, color: theme.textMuted }}>{p.latest_sp_partner || "—"}</td>
                          <td style={{ padding: "13px 16px", fontSize: 12, color: theme.textMuted, maxWidth: 160 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.latest_hub_sub_status || "—"}</div></td>
                          <td style={{ padding: "13px 16px", fontSize: 12, color: theme.textMuted, maxWidth: 140 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.primary_payer || "—"}</div></td>
                          <td style={{ padding: "13px 16px", fontSize: 12, color: theme.textMuted }}>{p.primary_channel || "—"}</td>
                          <td style={{ padding: "13px 16px" }}><AgingBadge days={p.aging_of_status} /></td>
                          <td style={{ padding: "13px 16px" }}>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {pendingCount > 0 && <span style={{ background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "2px 7px" }}>{pendingCount} new</span>}
                              {pNotifs.length > 0 && <span style={{ color: theme.textFaint, fontSize: 11 }}>{pNotifs.length} total</span>}
                            </div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <button onClick={e => { e.stopPropagation(); setSelectedPatient(p); }}
                              style={{ padding: "5px 14px", background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.3)", borderRadius: 6, color: "#4f8ef7", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              Open →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: "40px 16px", textAlign: "center", color: theme.textFaint, fontSize: 14 }}>No patients match the current filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── INBOX ── */}
          {view === "inbox" && (
            <div style={{ maxWidth: 760 }}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Team Inbox</div>
                <div style={{ fontSize: 13, color: theme.textMuted }}>
                  Active notifications for <TeamBadge team={user.team} /> — acknowledge to clear, reply to continue the thread
                </div>
              </div>

              {myInbox.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", background: theme.surfaceBg2, border: `1px solid ${theme.border}`, borderRadius: 12, marginBottom: 28 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
                  <div style={{ fontSize: 15, color: theme.textMuted, fontWeight: 600 }}>All caught up</div>
                  <div style={{ fontSize: 13, color: theme.textFaint, marginTop: 4 }}>No notifications need your attention right now</div>
                </div>
              ) : (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: tc.accent, textTransform: "uppercase", fontWeight: 700 }}>Needs Your Action</div>
                    <span style={{ background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>{myInbox.length}</span>
                  </div>
                  {myInbox.map(n => {
                    const patient = patients.find(p => p.id === n.patient_id);
                    const isReply = n.from_team === user.team && n.status === "replied";
                    return (
                      <div key={n.id} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>{patient?.prescriber || n.patient_name}</span>
                          <span style={{ fontSize: 11, color: theme.textFaint }}>·</span>
                          <span style={{ fontSize: 11, color: theme.textMuted }}>{patient?.territory}</span>
                          {isReply && <span style={{ fontSize: 10, color: "#4f8ef7", background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.25)", borderRadius: 4, padding: "1px 7px", fontWeight: 700 }}>REPLY RECEIVED</span>}
                        </div>
                        <NotificationCard notification={n} currentUser={user} onUpdate={handleNotificationUpdate} />
                      </div>
                    );
                  })}
                </div>
              )}

              {myAllNotifs.length > 0 && (
                <div>
                  <button onClick={() => setShowAllActivity(v => !v)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: showAllActivity ? "10px 10px 0 0" : 10, padding: "13px 18px", cursor: "pointer", color: theme.text }}>
                    <span style={{ fontSize: 11, color: theme.textMuted, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>All Activity</span>
                    <span style={{ background: theme.inputBg, color: theme.textMuted, borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{myAllNotifs.length}</span>
                    <span style={{ marginLeft: "auto", color: theme.textFaint, fontSize: 12 }}>{showAllActivity ? "▲" : "▼"}</span>
                  </button>
                  {showAllActivity && (
                    <div style={{ border: `1px solid ${theme.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "16px 18px", background: theme.surfaceBg }}>
                      {myAllNotifs.map(n => {
                        const patient = patients.find(p => p.id === n.patient_id);
                        return (
                          <div key={n.id} style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>{patient?.prescriber || n.patient_name} · {patient?.territory}</div>
                            <NotificationCard notification={n} currentUser={user} onUpdate={handleNotificationUpdate} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedPatient && (
          <PatientDetailPanel
            patient={selectedPatient}
            currentUser={user}
            notifications={notifications}
            onNewNotification={handleNotificationUpdate}
            onClose={() => setSelectedPatient(null)}
          />
        )}
      </div>
    </ThemeContext.Provider>
  );
}
