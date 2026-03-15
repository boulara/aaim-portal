import { createContext, useContext, useState, useEffect } from "react";

export const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to AAIM Portal",
    body: "This guided tour will walk you through every feature of the platform. Use the arrows below — or your keyboard ← → — to move between steps. Press Esc to exit at any time.",
    emoji: "👋",
    target: null,
  },
  {
    id: "bucket-bar",
    title: "Case Stage Buckets",
    body: "These filter buttons group patients by where they are in the case lifecycle — Prior Auth, Appeal, On Hold, Free Goods, and more. Click any bucket to instantly narrow the list below.",
    emoji: "🗂",
    target: "[data-tour='bucket-bar']",
    placement: "bottom",
  },
  {
    id: "summary-cards",
    title: "At-a-Glance Metrics",
    body: "Four live summary cards show how many patients match your current filters, pending notifications, your team's inbox count, and the average case aging. Click 'Avg Aging' to jump straight to the Analytics page.",
    emoji: "📊",
    target: "[data-tour='summary-cards']",
    placement: "bottom",
  },
  {
    id: "filters",
    title: "Smart Filters",
    body: "Search by prescriber name, territory, or payer. Narrow by Region, Channel, SP Partner, Payer, or Aging range. Active filters glow blue. Hit 'Clear ✕' to reset everything at once.",
    emoji: "🔍",
    target: "[data-tour='filters']",
    placement: "bottom",
  },
  {
    id: "patient-list",
    title: "Patient List",
    body: "Click any row to open the full case detail panel. Inside you'll find all 18 case fields, the notification history, a private Notes tab to add your own case notes, and follow-up date scheduling.",
    emoji: "🧑‍⚕️",
    target: "[data-tour='patient-list']",
    placement: "top",
  },
  {
    id: "nav-analytics",
    title: "Analytics Page",
    body: "Deep-dive analytics for your entire case portfolio: aging risk gauge, critical cases table, SP partner performance, insurance channel mix, payer breakdown, consent rate, and communication resolution stats — all built from live data.",
    emoji: "📈",
    target: "[data-tour='nav-analytics']",
    placement: "bottom",
  },
  {
    id: "nav-followups",
    title: "Follow-Up Calendar",
    body: "Every case note with a follow-up date appears here as a color-coded bar on the calendar. Overdue items are flagged in red. The sidebar lists upcoming follow-ups with 'Today / Tomorrow / In N days' labels.",
    emoji: "📅",
    target: "[data-tour='nav-followups']",
    placement: "bottom",
  },
  {
    id: "nav-inbox",
    title: "Team Inbox",
    body: "All notifications sent to your team land here. Acknowledge to confirm you've seen it, or reply to start a thread. Urgent notifications to the Sales team also trigger an email alert to the Sales reps.",
    emoji: "✉️",
    target: "[data-tour='nav-inbox']",
    placement: "bottom",
  },
  {
    id: "nav-settings",
    title: "Settings & Admin",
    body: "Settings has five tabs: Demo (a full 10-slide pitch deck), About FireFly Software, Appearance (dark/light mode), User Management (add/edit/delete users), and Patient Data (edit or remove case records).",
    emoji: "⚙️",
    target: "[data-tour='nav-settings']",
    placement: "bottom",
  },
  {
    id: "tour-toggle",
    title: "Restart This Tour",
    body: "You can launch this walkthrough again any time from the Guide button right here in the nav. It's always one click away whenever you or a new team member needs a refresher.",
    emoji: "🗺",
    target: "[data-tour='tour-toggle']",
    placement: "bottom",
  },
  {
    id: "done",
    title: "You're all set!",
    body: "You now know your way around AAIM Portal. Open any patient row to start exploring, or head to the Analytics page for a bird's-eye view of your case portfolio. Questions? Reach out to your FireFly Software contact.",
    emoji: "🎉",
    target: null,
  },
];

const WalkthroughContext = createContext(null);

export function WalkthroughProvider({ children }) {
  const [active, setActive] = useState(false);
  const [step,   setStep]   = useState(0);

  const start = () => { setStep(0); setActive(true); };
  const stop  = () => setActive(false);
  const next  = () => { if (step < TOUR_STEPS.length - 1) setStep(s => s + 1); else stop(); };
  const prev  = () => setStep(s => Math.max(0, s - 1));
  const goTo  = (i) => setStep(i);

  useEffect(() => {
    if (!active) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "Escape")     stop();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, step]);

  return (
    <WalkthroughContext.Provider value={{ active, step, total: TOUR_STEPS.length, start, stop, next, prev, goTo }}>
      {children}
    </WalkthroughContext.Provider>
  );
}

export const useWalkthrough = () => useContext(WalkthroughContext);
