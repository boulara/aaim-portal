import { useEffect, useState, useLayoutEffect } from "react";
import { useWalkthrough, TOUR_STEPS } from "../WalkthroughContext.jsx";

const PAD = 12; // padding around spotlight

function getRect(selector) {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function TooltipBox({ step, rect, total, next, prev, stop, goTo }) {
  const s = TOUR_STEPS[step];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const tipW = Math.min(320, vw - 32);
  const tipH = 220; // approx

  let left, top, arrowDir = null;

  if (!rect) {
    // Centered
    left = (vw - tipW) / 2;
    top  = (vh - tipH) / 2;
  } else {
    const placement = s.placement || "bottom";
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    if (placement === "bottom" || (rect.top + rect.height + tipH + PAD + 20 < vh)) {
      left = Math.max(8, Math.min(cx - tipW / 2, vw - tipW - 8));
      top  = rect.top + rect.height + PAD + 10;
      arrowDir = "up";
    } else {
      left = Math.max(8, Math.min(cx - tipW / 2, vw - tipW - 8));
      top  = rect.top - tipH - PAD - 10;
      arrowDir = "down";
    }
    // clamp vertical
    top = Math.max(8, Math.min(top, vh - tipH - 8));
  }

  const isFirst = step === 0;
  const isLast  = step === total - 1;

  return (
    <div style={{
      position: "fixed", left, top, width: tipW, zIndex: 9100,
      background: "linear-gradient(135deg, #0f1923 0%, #16263a 100%)",
      border: "1px solid rgba(79,142,247,0.4)",
      borderRadius: 16,
      boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(79,142,247,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
      padding: "22px 22px 18px",
      fontFamily: "'Georgia', serif",
      animation: "tourFadeIn 0.25s ease",
    }}>
      {/* Arrow */}
      {arrowDir === "up" && (
        <div style={{ position: "absolute", top: -8, left: tipW / 2 - 8, width: 0, height: 0,
          borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
          borderBottom: "8px solid rgba(79,142,247,0.4)" }} />
      )}
      {arrowDir === "down" && (
        <div style={{ position: "absolute", bottom: -8, left: tipW / 2 - 8, width: 0, height: 0,
          borderLeft: "8px solid transparent", borderRight: "8px solid transparent",
          borderTop: "8px solid rgba(79,142,247,0.4)" }} />
      )}

      {/* Step counter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {TOUR_STEPS.map((_, i) => (
            <div key={i} onClick={() => goTo(i)} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 3,
              background: i === step ? "#4f8ef7" : i < step ? "#4f8ef755" : "rgba(255,255,255,0.15)",
              cursor: "pointer", transition: "all 0.3s ease",
            }} />
          ))}
        </div>
        <button onClick={stop} style={{
          background: "none", border: "none", color: "rgba(255,255,255,0.3)",
          fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1,
        }}>✕</button>
      </div>

      {/* Emoji + Title */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{s.emoji}</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.3, paddingTop: 2 }}>{s.title}</div>
      </div>

      {/* Body */}
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, marginBottom: 20 }}>{s.body}</div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!isFirst && (
          <button onClick={prev} style={{
            padding: "8px 16px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>← Back</button>
        )}
        <button onClick={isLast ? stop : next} style={{
          flex: 1, padding: "9px 20px",
          background: isLast ? "linear-gradient(135deg, #2ecc71, #27ae60)" : "linear-gradient(135deg, #4f8ef7, #3a7ad9)",
          border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          boxShadow: isLast ? "0 4px 12px rgba(46,204,113,0.35)" : "0 4px 12px rgba(79,142,247,0.35)",
        }}>
          {isLast ? "🎉 Done" : `Next →`}
        </button>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>{step + 1} / {total}</div>
      </div>

      <div style={{ marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
        ← → keyboard · Esc to exit
      </div>
    </div>
  );
}

export default function TourOverlay() {
  const { active, step, total, next, prev, stop, goTo } = useWalkthrough();
  const [rect, setRect] = useState(null);
  const [, forceRender] = useState(0);

  useLayoutEffect(() => {
    if (!active) return;
    const s = TOUR_STEPS[step];
    const r = s.target ? getRect(s.target) : null;
    setRect(r);
  }, [active, step]);

  // Re-measure on resize/scroll
  useEffect(() => {
    if (!active) return;
    const refresh = () => {
      const s = TOUR_STEPS[step];
      setRect(s.target ? getRect(s.target) : null);
    };
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    return () => { window.removeEventListener("resize", refresh); window.removeEventListener("scroll", refresh, true); };
  }, [active, step]);

  if (!active) return null;

  const spotL = rect ? rect.left  - PAD : 0;
  const spotT = rect ? rect.top   - PAD : 0;
  const spotW = rect ? rect.width  + PAD * 2 : 0;
  const spotH = rect ? rect.height + PAD * 2 : 0;

  return (
    <>
      <style>{`
        @keyframes tourFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tourPulse  { 0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px rgba(79,142,247,0.5); } 50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 5px rgba(79,142,247,0.8); } }
      `}</style>

      {/* Dim overlay — if no rect, full-screen dim only */}
      {rect ? (
        <div style={{
          position: "fixed", zIndex: 9000, pointerEvents: "none",
          left: spotL, top: spotT, width: spotW, height: spotH,
          borderRadius: 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 3px rgba(79,142,247,0.6)",
          animation: "tourPulse 2.5s ease infinite",
        }} />
      ) : (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.72)",
          pointerEvents: "none",
        }} />
      )}

      {/* Transparent click-blocker (allows only the tooltip to be interactive) */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9050, pointerEvents: "all" }}
        onClick={(e) => { if (e.target === e.currentTarget) stop(); }} />

      {/* Tooltip */}
      <TooltipBox step={step} rect={rect} total={total} next={next} prev={prev} stop={stop} goTo={goTo} />
    </>
  );
}
