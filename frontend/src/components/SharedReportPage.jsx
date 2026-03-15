import { useState, useEffect } from "react";
import { ThemeContext, conduit } from "../ThemeContext";
import { api } from "../api";
import AnalyticsPage from "./AnalyticsPage";

function ExpiredMessage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: conduit.pageBg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      padding: 32,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: conduit.text, marginBottom: 8 }}>
        This report has expired
      </div>
      <div style={{ fontSize: 14, color: conduit.textMuted, maxWidth: 420 }}>
        Shareable report links are valid for 7 days. This one is no longer active.
        Contact the person who sent it to request a new link.
      </div>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: conduit.pageBg,
      color: conduit.textMuted,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      fontSize: 14,
    }}>
      Loading report…
    </div>
  );
}

export default function SharedReportPage({ token }) {
  const [state, setState] = useState("loading"); // loading | ok | expired | error
  const [data, setData] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    api.getSharedReport(token)
      .then(d => {
        setData(d);
        setExpiresAt(d.expires_at);
        setState("ok");
      })
      .catch(err => {
        if (err.status === 410) setState("expired");
        else setState("error");
      });
  }, [token]);

  if (state === "loading") return <LoadingMessage />;
  if (state === "expired") return <ExpiredMessage />;
  if (state === "error") return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: conduit.pageBg,
      color: conduit.textMuted,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      fontSize: 14,
    }}>
      Report not found.
    </div>
  );

  const expires = expiresAt ? new Date(expiresAt + "Z") : null;
  const expiryLabel = expires
    ? expires.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <ThemeContext.Provider value={conduit}>
      <div style={{
        minHeight: "100vh",
        background: conduit.pageBg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
      }}>
        {/* Shared report banner */}
        <div style={{
          background: conduit.panelBg,
          borderBottom: `1px solid ${conduit.border}`,
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              background: "#14B8A618",
              border: "1px solid #14B8A655",
              borderRadius: 6,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 700,
              color: "#14B8A6",
              letterSpacing: "0.5px",
            }}>
              READ-ONLY REPORT
            </div>
            <span style={{ fontSize: 12, color: conduit.textMuted }}>
              Conduit · Case Analytics
            </span>
          </div>
          {expiryLabel && (
            <span style={{ fontSize: 11, color: conduit.textFaint }}>
              Link expires {expiryLabel}
            </span>
          )}
        </div>

        {/* Analytics content */}
        <div style={{ padding: "24px 24px 48px" }}>
          <AnalyticsPage
            patients={data.patients}
            notifications={data.notifications}
            currentUser={null}
            readOnly
          />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
