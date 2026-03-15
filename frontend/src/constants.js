export const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Inter', 'Helvetica Neue', sans-serif";

export const BUCKETS = [
  { id: "all",       label: "All Cases",       color: "#14B8A6" },
  { id: "new",       label: "New Referral",     color: "#a78bfa" },
  { id: "ttrp",      label: "TTRP",             color: "#f472b6" },
  { id: "pa",        label: "Prior Auth (PA)",  color: "#34d399" },
  { id: "appeal",    label: "Appeal",           color: "#f0a500" },
  { id: "onhold",    label: "On Hold",          color: "#94a3b8" },
  { id: "reopen",    label: "Reopen",           color: "#fb923c" },
  { id: "freegoods", label: "Free Goods",       color: "#2dd4bf" },
  { id: "wo",        label: "W/O Shipment",     color: "#818cf8" },
  { id: "denials",   label: "Denials",          color: "#f87171" },
  { id: "cancelled", label: "Cancelled / DC",   color: "#6b7280" },
];

export const TEAM_COLORS = {
  "Home Office": { bg: "#0d2a28", accent: "#14B8A6", light: "#e6faf8", lightText: "#0a7a70" },
  NCM:           { bg: "#1a3a2a", accent: "#2ecc71", light: "#e6f9f0", lightText: "#1a7a45" },
  SP:            { bg: "#3a1a2a", accent: "#e056b0", light: "#fce8f5", lightText: "#a0208a" },
  Sales:         { bg: "#2a2a1a", accent: "#f0a500", light: "#fff8e1", lightText: "#a06800" },
};

export const STATUS_COLORS = {
  pending:      "#f0a500",
  acknowledged: "#2ecc71",
  replied:      "#14B8A6",
  dismissed:    "#888",
};

export function assignBuckets(p) {
  const sub  = (p.latest_sp_substatus    || "").toLowerCase();
  const hub  = (p.latest_hub_sub_status  || "").toLowerCase();
  const prog = (p.program_type           || "").toLowerCase();
  const buckets = new Set(["all"]);

  const daysSinceReferral = p.referral_date
    ? Math.floor((new Date("2026-03-08") - new Date(p.referral_date)) / 86400000)
    : 9999;
  if (daysSinceReferral <= 30 && !p.first_ship_date) buckets.add("new");
  if (hub === "new script received") buckets.add("new");

  if (hub.includes("trying to reach") || hub.includes("no md response") || hub.includes("no hcp response") || hub.includes("hcp follow-up") || hub.includes("prescriber decision")) buckets.add("ttrp");
  if (sub.includes("pa") || sub.includes("prior auth") || hub.includes("pa") || hub.includes("prior auth") || sub.includes("clinicals")) buckets.add("pa");
  if (sub.includes("appeal") || hub.includes("appeal")) buckets.add("appeal");
  if (hub.includes("hold") || sub.includes("hold")) buckets.add("onhold");
  if (hub.includes("reopen") || sub.includes("reopen")) buckets.add("reopen");
  if (prog === "bridge" || hub.includes("bridge") || sub.includes("free")) buckets.add("freegoods");
  if (p.last_ship_date && !hub.includes("closed") && !hub.includes("cancelled")) buckets.add("wo");
  if (sub.includes("denial") || sub.includes("denied") || hub.includes("denial") || hub.includes("denied")) buckets.add("denials");
  if (hub.includes("closed") || hub.includes("cancel") || hub.includes("dc") || sub.includes("cancel")) buckets.add("cancelled");

  return buckets;
}

export function initials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function agingColor(days) {
  if (days >= 20) return "#e74c3c";
  if (days >= 10) return "#f0a500";
  return "#2ecc71";
}
