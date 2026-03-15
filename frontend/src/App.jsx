import { useState, useEffect, useRef } from "react";
import { BUCKETS, TEAM_COLORS, assignBuckets, initials, agingColor } from "./constants";
import { AgingBadge, TeamBadge, GLOBAL_STYLES } from "./components/Shared";
import { ThemeContext, dark, light } from "./ThemeContext";
import { WalkthroughProvider, useWalkthrough } from "./WalkthroughContext.jsx";
import { useIsMobile } from "./useIsMobile";
import LoginScreen from "./components/LoginScreen";
import PatientDetailPanel from "./components/PatientDetailPanel";
import NotificationCard from "./components/NotificationCard";
import SettingsPage from "./components/SettingsPage";
import AnalyticsPage from "./components/AnalyticsPage";
import FollowUpCalendar from "./components/FollowUpCalendar";
import TourOverlay from "./components/TourOverlay";
import { api } from "./api";
import { APP_VERSION } from "./version";

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

// Pick 2 different random logos once per session
function pickTwo() {
  const a = Math.floor(Math.random() * ALL_LOGOS.length);
  let b = Math.floor(Math.random() * (ALL_LOGOS.length - 1));
  if (b >= a) b++;
  return [a, b];
}
const [LOGO_A, LOGO_B] = pickTwo();

function NavLogo() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % 2), 4000);
    return () => clearInterval(t);
  }, []);
  const src = idx === 0 ? ALL_LOGOS[LOGO_A] : ALL_LOGOS[LOGO_B];
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", height: 38, flexShrink: 0 }}>
      <img key={src} src={src} alt="logo"
        style={{ height: "100%", width: "auto", display: "block", animation: "logoFadeIn 0.5s ease" }} />
    </div>
  );
}

function TourToggle() {
  const { active, start, stop } = useWalkthrough();
  return (
    <button data-tour="tour-toggle" onClick={active ? stop : start}
      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 20,
        background: active ? "rgba(79,142,247,0.18)" : "#4f8ef711",
        border: `1.5px solid ${active ? "#4f8ef7" : "#4f8ef755"}`,
        color: active ? "#4f8ef7" : "#4f8ef7", fontSize: 12, fontWeight: 700, cursor: "pointer",
        transition: "all 0.2s", boxShadow: active ? "0 0 14px rgba(79,142,247,0.4)" : "none",
        animation: active ? "pulse 1.8s infinite" : "none" }}>
      <span style={{ fontSize: 13 }}>🗺</span>
      {active ? "Exit Tour" : "Guide"}
    </button>
  );
}

function AppInner() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aaim_user")); } catch { return null; }
  });
  const [isDark, setIsDark] = useState(() => localStorage.getItem("aaim_theme") !== "light");
  const theme    = isDark ? dark : light;
  const isMobile = useIsMobile();

  const toggleTheme = () => {
    setIsDark(d => {
      const next = !d;
      localStorage.setItem("aaim_theme", next ? "dark" : "light");
      return next;
    });
  };

  const [patients, setPatients]               = useState([]);
  const [notifications, setNotifications]     = useState([]);
  const [myNotes, setMyNotes]                 = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch]                   = useState("");
  const [filterRegion, setFilterRegion]       = useState("All");
  const [filterChannel, setFilterChannel]     = useState("All");
  const [filterSP, setFilterSP]               = useState("All");
  const [filterPayer, setFilterPayer]         = useState("All");
  const [filterAging, setFilterAging]         = useState("All");
  const [view, setView]                       = useState("dashboard");
  const [activeBucket, setActiveBucket]       = useState("all");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [toasts, setToasts]                   = useState([]);
  const [mobileNavOpen, setMobileNavOpen]     = useState(false);
  const [overdueAlert, setOverdueAlert]       = useState(false);

  const knownIdsRef       = useRef(new Set());
  const userRef           = useRef(user);
  const overdueShownRef   = useRef(false);
  useEffect(() => { userRef.current = user; }, [user]);

  const todayKey = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();

  // Load current user's notes
  useEffect(() => {
    if (!user) return;
    api.getNotes(null, user.id).then(setMyNotes).catch(() => {});
  }, [user?.id]);

  const myFollowUps = myNotes.filter(n => n.follow_up_date && !n.completed_at);
  const overdueNotes = myFollowUps.filter(n => n.follow_up_date < todayKey);

  // Show overdue alert once per session on first dashboard view
  useEffect(() => {
    if (view === "dashboard" && !overdueShownRef.current && overdueNotes.length > 0) {
      overdueShownRef.current = true;
      setOverdueAlert(true);
    }
  }, [view, overdueNotes.length]);

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
              detail:  `${patient?.prescriber || "Unknown"} · ${n.priority !== "normal" ? n.priority.toUpperCase() + " · " : ""}${n.comment.slice(0, 60)}${n.comment.length > 60 ? "…" : ""}`,
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

  const handleLogin = (u) => { setUser(u); localStorage.setItem("aaim_user", JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem("aaim_user"); setView("dashboard"); };

  const handleNotificationUpdate = (updated) => {
    knownIdsRef.current.add(updated.id);
    setNotifications(prev => {
      const idx = prev.findIndex(n => n.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev]; next[idx] = updated; return next;
    });
  };

  const navigateTo = (v) => { setView(v); setMobileNavOpen(false); };

  const handleNoteChange = (note, deleted = false) => {
    setMyNotes(prev => {
      if (deleted) return prev.filter(n => n.id !== note.id);
      const idx = prev.findIndex(n => n.id === note.id);
      if (idx === -1) return [note, ...prev];
      const next = [...prev]; next[idx] = note; return next;
    });
  };

  if (!user) return (
    <ThemeContext.Provider value={theme}>
      <LoginScreen onLogin={handleLogin} />
    </ThemeContext.Provider>
  );

  const tc             = TEAM_COLORS[user.team] || TEAM_COLORS["Home Office"];
  const patientBuckets = new Map(patients.map(p => [p.id, assignBuckets(p)]));
  const filtered       = patients.filter(p => {
    const q = search.toLowerCase();
    const agingDays = p.aging_of_status;
    return (
      (!search || p.prescriber?.toLowerCase().includes(q) || p.territory?.toLowerCase().includes(q) || p.primary_payer?.toLowerCase().includes(q) || p.latest_sp_partner?.toLowerCase().includes(q)) &&
      (filterRegion  === "All" || p.region               === filterRegion) &&
      (filterChannel === "All" || p.primary_channel      === filterChannel) &&
      (filterSP      === "All" || p.latest_sp_partner    === filterSP) &&
      (filterPayer   === "All" || p.primary_payer        === filterPayer) &&
      (filterAging   === "All" || (filterAging === "green" ? agingDays < 10 : filterAging === "yellow" ? agingDays >= 10 && agingDays < 20 : agingDays >= 20)) &&
      patientBuckets.get(p.id)?.has(activeBucket)
    );
  });

  const myInbox     = notifications.filter(n => (n.to_team === user.team && n.status === "pending") || (n.from_team === user.team && n.status === "replied"));
  const myAllNotifs = notifications.filter(n => n.to_team === user.team || n.from_team === user.team);
  const regions     = ["All", ...Array.from(new Set(patients.map(p => p.region).filter(Boolean))).sort()];
  const channels    = ["All", ...Array.from(new Set(patients.map(p => p.primary_channel).filter(Boolean))).sort()];
  const spPartners  = ["All", ...Array.from(new Set(patients.map(p => p.latest_sp_partner).filter(Boolean))).sort()];
  const payers      = ["All", ...Array.from(new Set(patients.map(p => p.primary_payer).filter(Boolean))).sort()];
  const avgAging    = patients.length ? Math.round(patients.reduce((a, p) => a + p.aging_of_status, 0) / patients.length) : 0;

  const navItems = [
    { id: "dashboard", label: "Dashboard",  icon: "⊞" },
    { id: "analytics", label: "Analytics",  icon: "◎" },
    { id: "followups", label: "Follow-Ups", icon: "📅" },
    { id: "inbox",     label: "Inbox",      icon: "✉" },
    { id: "settings",  label: "Settings",   icon: "⚙" },
  ];

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ minHeight: "100vh", background: theme.pageBg, fontFamily: "'Georgia', serif", color: theme.text }}>
        <style>{GLOBAL_STYLES}</style>

        {/* ── OVERDUE FOLLOW-UP ALERT ── */}
        {overdueAlert && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div style={{ width: "min(480px,100%)", background: theme.panelBg, border: "1px solid #e74c3c55", borderTop: "4px solid #e74c3c", borderRadius: 16, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(231,76,60,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⚠️</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: theme.text }}>Overdue Follow-Ups</div>
                  <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>You have {overdueNotes.length} past-due follow-up{overdueNotes.length !== 1 ? "s" : ""} that need attention</div>
                </div>
              </div>
              <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {overdueNotes.map(n => {
                  const pat = patients.find(p => p.id === n.patient_id);
                  const daysOverdue = Math.round((new Date(todayKey) - new Date(n.follow_up_date + "T12:00:00")) / 86400000);
                  return (
                    <div key={n.id} style={{ background: "rgba(231,76,60,0.07)", border: "1px solid rgba(231,76,60,0.25)", borderLeft: "4px solid #e74c3c", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{pat?.prescriber || `Patient #${n.patient_id}`}</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#e74c3c", background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 20, padding: "2px 9px", whiteSpace: "nowrap", flexShrink: 0 }}>{daysOverdue}d overdue</span>
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.text}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setOverdueAlert(false); navigateTo("followups"); }}
                  style={{ flex: 1, padding: "11px", background: "#e74c3c", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  📅 View Calendar
                </button>
                <button onClick={() => setOverdueAlert(false)}
                  style={{ padding: "11px 20px", background: theme.inputBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textMuted, fontSize: 14, cursor: "pointer" }}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div style={{ position: "fixed", bottom: isMobile ? 80 : 24, right: isMobile ? 12 : 24, left: isMobile ? 12 : "auto", zIndex: 999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
          {toasts.map(t => (
            <div key={t.id} style={{ pointerEvents: "all", background: theme.panelBg, border: `1px solid ${t.color}55`, borderLeft: `4px solid ${t.color}`, borderRadius: 10, padding: "12px 14px", boxShadow: `0 8px 32px rgba(0,0,0,0.4)`, animation: "slideIn 0.3s ease", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ fontSize: 16, flexShrink: 0 }}>🔔</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 2 }}>{t.message}</div>
                <div style={{ fontSize: 12, color: theme.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.detail}</div>
              </div>
              <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} style={{ background: "none", border: "none", color: theme.textFaint, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>

        {/* ── DESKTOP NAV ── */}
        {!isMobile && (
          <nav style={{ background: theme.navBg, borderBottom: `1px solid ${theme.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <NavLogo />
                <span style={{ fontSize: 10, color: theme.textFaint, background: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", border: `1px solid ${theme.border}`, borderRadius: 4, padding: "1px 6px", letterSpacing: 0.5, fontFamily: "monospace" }}>v{APP_VERSION}</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {navItems.map(({ id, label }) => (
                  <button key={id} onClick={() => navigateTo(id)}
                    data-tour={`nav-${id}`}
                    style={{ padding: "8px 18px", background: view === id ? (theme.isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)") : "none", border: "none", borderRadius: 6, color: view === id ? theme.text : theme.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", position: "relative" }}>
                    {label}
                    {id === "inbox" && myInbox.length > 0 && (
                      <>
                        <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, borderRadius: "50%", background: tc.accent, animation: "pulse 1.8s infinite" }} />
                        <span style={{ marginLeft: 6, background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{myInbox.length}</span>
                      </>
                    )}
                    {id === "followups" && overdueNotes.length > 0 && (
                      <span style={{ marginLeft: 6, background: "#e74c3c", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{overdueNotes.length}</span>
                    )}
                    {id === "followups" && overdueNotes.length === 0 && myFollowUps.length > 0 && (
                      <span style={{ marginLeft: 6, background: "#4f8ef7", color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{myFollowUps.length}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <TourToggle />
              <TeamBadge team={user.team} size="md" />
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{initials(user.name)}</div>
              <div style={{ fontSize: 13, color: theme.textMuted }}>{user.name}</div>
              <button onClick={handleLogout} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: 6, color: theme.textMuted, fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>Sign Out</button>
            </div>
          </nav>
        )}

        {/* ── MOBILE TOP BAR ── */}
        {isMobile && (
          <nav style={{ background: theme.navBg, borderBottom: `1px solid ${theme.border}`, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 50 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <NavLogo />
              <span style={{ fontSize: 9, color: theme.textFaint, background: "rgba(255,255,255,0.06)", border: `1px solid ${theme.border}`, borderRadius: 4, padding: "1px 5px", letterSpacing: 0.5, fontFamily: "monospace" }}>v{APP_VERSION}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TourToggle />
              {myInbox.length > 0 && (
                <span style={{ background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "2px 8px" }}>{myInbox.length}</span>
              )}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: tc.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>{initials(user.name)}</div>
            </div>
          </nav>
        )}

        {/* Page content */}
        <div style={{ padding: isMobile ? "16px 12px 80px" : "28px 32px" }}>

          {/* ── SETTINGS ── */}
          {view === "settings" && <SettingsPage isDark={isDark} onToggleTheme={toggleTheme} />}

          {/* ── ANALYTICS ── */}
          {view === "analytics" && <AnalyticsPage patients={patients} notifications={notifications} currentUser={user} />}

          {/* ── FOLLOW-UPS ── */}
          {view === "followups" && <FollowUpCalendar patients={patients} notes={myNotes} onNoteChange={handleNoteChange} />}

          {/* ── DASHBOARD ── */}
          {view === "dashboard" && (
            <>
              {/* Bucket bar — horizontal scroll on mobile */}
              <div data-tour="bucket-bar" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: theme.textFaint, textTransform: "uppercase", marginBottom: 10 }}>Case Stage</div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {BUCKETS.map(b => {
                    const count    = patients.filter(p => patientBuckets.get(p.id)?.has(b.id)).length;
                    const isActive = activeBucket === b.id;
                    return (
                      <button key={b.id} onClick={() => setActiveBucket(b.id)}
                        style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${isActive ? b.color : theme.border}`, background: isActive ? b.color + "22" : theme.surfaceBg, color: isActive ? b.color : theme.textMuted, fontSize: 12, fontWeight: isActive ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", flexShrink: 0, boxShadow: isActive ? `0 0 10px ${b.color}33` : "none" }}>
                        {b.label}
                        <span style={{ background: isActive ? b.color : theme.inputBg, color: isActive ? "#fff" : theme.textMuted, borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 6px" }}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary cards — 2 cols on mobile, 4 on desktop */}
              <div data-tour="summary-cards" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  ["Showing",              filtered.length,                                           "#4f8ef7",          null],
                  ["Active Notifications", notifications.filter(n => n.status === "pending").length,  "#f0a500",          null],
                  ["My Inbox",             myInbox.length,                                            tc.accent,          "inbox"],
                  ["Avg Aging",            avgAging + "d",                                            agingColor(avgAging),"analytics"],
                ].map(([label, val, color, nav]) => (
                  <div key={label} onClick={() => nav && navigateTo(nav)}
                    style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderTop: `2px solid ${color}`, borderRadius: 10, padding: isMobile ? "12px 14px" : "16px 20px", cursor: nav ? "pointer" : "default", position: "relative", overflow: "hidden" }}>
                    {nav && <div style={{ position: "absolute", top: 8, right: 10, fontSize: 10, color, opacity: 0.6 }}>→</div>}
                    <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color }}>{val}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 3, letterSpacing: 0.5 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div data-tour="filters" style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: isMobile ? "column" : "row", flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prescriber, territory, payer, SP…"
                  style={{ flex: "1 1 220px", padding: "10px 14px", background: theme.inputBg, border: `1px solid ${theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { value: filterRegion,  onChange: setFilterRegion,  options: regions,    all: "All Regions"  },
                    { value: filterChannel, onChange: setFilterChannel, options: channels,   all: "All Channels" },
                    { value: filterSP,      onChange: setFilterSP,      options: spPartners, all: "All SP"       },
                    { value: filterPayer,   onChange: setFilterPayer,   options: payers,     all: "All Payers"   },
                  ].map(({ value, onChange, options, all }) => (
                    <select key={all} value={value} onChange={e => onChange(e.target.value)}
                      style={{ padding: "10px 12px", background: value !== "All" ? theme.inputBg : theme.selectBg, border: `1px solid ${value !== "All" ? "#4f8ef7" : theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none" }}>
                      {options.map(o => <option key={o} value={o}>{o === "All" ? all : o}</option>)}
                    </select>
                  ))}
                  <select value={filterAging} onChange={e => setFilterAging(e.target.value)}
                    style={{ padding: "10px 12px", background: filterAging !== "All" ? theme.inputBg : theme.selectBg, border: `1px solid ${filterAging !== "All" ? "#4f8ef7" : theme.borderInput}`, borderRadius: 8, color: theme.text, fontSize: 13, outline: "none" }}>
                    <option value="All">All Aging</option>
                    <option value="green">{"< 10 days"}</option>
                    <option value="yellow">10–20 days</option>
                    <option value="red">{"20+ days"}</option>
                  </select>
                  {(filterRegion !== "All" || filterChannel !== "All" || filterSP !== "All" || filterPayer !== "All" || filterAging !== "All" || search) && (
                    <button onClick={() => { setFilterRegion("All"); setFilterChannel("All"); setFilterSP("All"); setFilterPayer("All"); setFilterAging("All"); setSearch(""); }}
                      style={{ padding: "10px 14px", background: "rgba(231,76,60,0.12)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 8, color: "#e74c3c", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                      Clear ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Patient list — table on desktop, cards on mobile */}
              {isMobile ? (
                <div data-tour="patient-list" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filtered.map(p => {
                    const pNotifs      = notifications.filter(n => n.patient_id === p.id);
                    const pendingCount = pNotifs.filter(n => (n.to_team === user.team && n.status === "pending") || (n.from_team === user.team && n.status === "replied")).length;
                    return (
                      <div key={p.id} onClick={() => setSelectedPatient(p)}
                        style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text, flex: 1, marginRight: 10 }}>{p.prescriber}</div>
                          <AgingBadge days={p.aging_of_status} />
                        </div>
                        <div style={{ fontSize: 12, color: theme.textMuted, marginBottom: 6 }}>{p.territory} · {p.region}</div>
                        <div style={{ fontSize: 12, color: theme.textFaint, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.latest_hub_sub_status || "—"}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: theme.textFaint }}>{p.primary_channel || "—"} · {p.latest_sp_partner || "—"}</span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {pendingCount > 0 && <span style={{ background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "2px 7px" }}>{pendingCount} new</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: theme.textFaint, fontSize: 14 }}>No patients match the current filters</div>
                  )}
                </div>
              ) : (
                <div data-tour="patient-list" style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: "hidden" }}>
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
              )}
            </>
          )}

          {/* ── INBOX ── */}
          {view === "inbox" && (
            <div style={{ maxWidth: isMobile ? "100%" : 760 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, marginBottom: 4 }}>Team Inbox</div>
                <div style={{ fontSize: 13, color: theme.textMuted }}>
                  Notifications for <TeamBadge team={user.team} /> — acknowledge or reply
                </div>
              </div>

              {myInbox.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", background: theme.surfaceBg2, border: `1px solid ${theme.border}`, borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
                  <div style={{ fontSize: 15, color: theme.textMuted, fontWeight: 600 }}>All caught up</div>
                  <div style={{ fontSize: 13, color: theme.textFaint, marginTop: 4 }}>No notifications need your attention</div>
                </div>
              ) : (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: tc.accent, textTransform: "uppercase", fontWeight: 700 }}>Needs Action</div>
                    <span style={{ background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 10, fontWeight: 700, padding: "2px 8px" }}>{myInbox.length}</span>
                  </div>
                  {myInbox.map(n => {
                    const patient = patients.find(p => p.id === n.patient_id);
                    const isReply = n.from_team === user.team && n.status === "replied";
                    return (
                      <div key={n.id} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
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
                    <div style={{ border: `1px solid ${theme.border}`, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "16px", background: theme.surfaceBg }}>
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

        {/* ── MOBILE BOTTOM NAV ── */}
        {isMobile && (
          <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: theme.navBg, borderTop: `1px solid ${theme.border}`, display: "flex", zIndex: 50, backdropFilter: "blur(8px)" }}>
            {navItems.map(({ id, label, icon }) => (
              <button key={id} onClick={() => navigateTo(id)}
                style={{ flex: 1, padding: "10px 0 12px", background: "none", border: "none", color: view === id ? tc.accent : theme.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                {label}
                {id === "inbox" && myInbox.length > 0 && (
                  <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", background: tc.accent, color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "1px 5px" }}>{myInbox.length}</span>
                )}
                {id === "followups" && overdueNotes.length > 0 && (
                  <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", background: "#e74c3c", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "1px 5px" }}>{overdueNotes.length}</span>
                )}
                {id === "followups" && overdueNotes.length === 0 && myFollowUps.length > 0 && (
                  <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", background: "#4f8ef7", color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 700, padding: "1px 5px" }}>{myFollowUps.length}</span>
                )}
              </button>
            ))}
            <button onClick={handleLogout}
              style={{ flex: 1, padding: "10px 0 12px", background: "none", border: "none", color: theme.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 20 }}>↪</span>
              Sign Out
            </button>
          </nav>
        )}

        {/* Patient detail modal */}
        {selectedPatient && (
          <PatientDetailPanel
            patient={selectedPatient}
            currentUser={user}
            notifications={notifications}
            onNewNotification={handleNotificationUpdate}
            onNoteChange={handleNoteChange}
            onClose={() => setSelectedPatient(null)}
          />
        )}

        <TourOverlay />
      </div>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <WalkthroughProvider>
      <AppInner />
    </WalkthroughProvider>
  );
}
