import { useState } from "react";
import { useTheme } from "../ThemeContext";
import { FONT_SANS } from "../constants";

const TEAL = "#14B8A6";
const NAVY = "#0B1829";

function Section({ title, children, accent = TEAL }) {
  const theme = useTheme();
  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{ width: 4, height: 28, background: accent, borderRadius: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 20, fontWeight: 700, color: theme.text, letterSpacing: "-0.3px" }}>{title}</div>
      </div>
      {children}
    </div>
  );
}

function SubSection({ title, children }) {
  const theme = useTheme();
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function P({ children, style = {} }) {
  const theme = useTheme();
  return <p style={{ fontSize: 14, color: theme.textMuted, lineHeight: 1.75, marginBottom: 12, ...style }}>{children}</p>;
}

function Stat({ label, value, sub }) {
  const theme = useTheme();
  return (
    <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderTop: `3px solid ${TEAL}`, borderRadius: 10, padding: "18px 20px" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: TEAL, letterSpacing: "-0.5px" }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Table({ headers, rows }) {
  const theme = useTheme();
  return (
    <div style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 10, overflow: "auto", marginBottom: 16 }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
        <thead>
          <tr style={{ background: theme.surfaceBg2 }}>
            {headers.map(h => (
              <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, letterSpacing: 1.5, color: theme.textFaint, textTransform: "uppercase", fontWeight: 700, borderBottom: `1px solid ${theme.border}`, whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? `1px solid ${theme.border}` : "none" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "10px 14px", fontSize: 13, color: j === 0 ? theme.text : theme.textMuted, fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ children, color = TEAL }) {
  const theme = useTheme();
  return (
    <div style={{ background: color + "0d", border: `1px solid ${color}33`, borderLeft: `4px solid ${color}`, borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  const theme = useTheme();
  return (
    <ul style={{ margin: "0 0 16px 0", padding: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 14, color: theme.textMuted, lineHeight: 1.6 }}>
          <span style={{ color: TEAL, flexShrink: 0, marginTop: 2 }}>›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const SECTIONS = [
  "Executive Summary",
  "Company Overview",
  "Problem",
  "Solution",
  "Market Analysis",
  "Business Model",
  "Go-to-Market",
  "Competitive Landscape",
  "Team",
  "Financial Projections",
  "Funding Ask",
  "Milestones & Roadmap",
  "Risk & Mitigation",
  "Appendix",
];

export default function AdminPortal({ currentUser }) {
  const theme = useTheme();
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div style={{ fontFamily: FONT_SANS }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0d2035 100%)`, border: `1px solid #1E3A4A`, borderRadius: 16, padding: "32px 36px", marginBottom: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `${TEAL}08` }} />
        <div style={{ fontSize: 10, letterSpacing: 3, color: TEAL, textTransform: "uppercase", marginBottom: 10 }}>Confidential — Internal Use Only</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.5px", marginBottom: 6 }}>Conduit Business Plan</div>
        <div style={{ fontSize: 14, color: "#94A3B8" }}>Patient Access Communications Platform · v1.0 · March 2026</div>
        <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Seed Stage", "Healthcare IT", "SaaS", "Specialty Pharma"].map(t => (
            <span key={t} style={{ fontSize: 11, fontWeight: 600, color: TEAL, background: `${TEAL}15`, border: `1px solid ${TEAL}30`, borderRadius: 20, padding: "3px 10px" }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* TOC sidebar */}
        <div style={{ width: 200, flexShrink: 0, position: "sticky", top: 80 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: theme.textFaint, textTransform: "uppercase", marginBottom: 10 }}>Contents</div>
          {SECTIONS.map((s, i) => (
            <button key={s} onClick={() => setActiveSection(i)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", marginBottom: 2, background: activeSection === i ? `${TEAL}12` : "none", border: activeSection === i ? `1px solid ${TEAL}30` : "1px solid transparent", borderRadius: 6, color: activeSection === i ? TEAL : theme.textFaint, fontSize: 12, fontWeight: activeSection === i ? 700 : 400, cursor: "pointer", lineHeight: 1.4 }}>
              {i + 1}. {s}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* 1 — EXECUTIVE SUMMARY */}
          {activeSection === 0 && (
            <Section title="1. Executive Summary">
              <Callout>
                Conduit is a SaaS platform purpose-built for specialty pharmaceutical patient access teams. We replace fragmented email chains, spreadsheets, and Power BI dashboards with a unified real-time communication hub — enabling Home Office, NCM, SP, and Sales teams to coordinate on patient cases instantly, from any device.
              </Callout>

              <SubSection title="The Opportunity">
                <P>There are over 700 FDA-approved specialty drugs in the US, each requiring a dedicated patient support program staffed by nurses, case managers, specialty pharmacies, and sales representatives. These teams today operate on email, Excel, and stitched-together Power Platform tools — creating dangerous delays in patient therapy access.</P>
                <P>The US patient access software market is a <strong style={{ color: theme.text }}>$3.5B TAM</strong> growing at 12% annually, driven by record specialty drug approvals, payer complexity, and rising demand for hub services.</P>
              </SubSection>

              <SubSection title="Our Solution">
                <P>Conduit delivers a real-time, role-based patient case dashboard with instant cross-team notifications, private case notes, follow-up calendars, and deep analytics — deployable in under one hour, with no IT integration required at launch.</P>
              </SubSection>

              <SubSection title="Business Model">
                <P>SaaS subscription at <strong style={{ color: theme.text }}>$499–$3,999/month</strong> per organization. Annual contracts are standard. We target program directors and VP-level buyers at specialty pharma manufacturers and hub service operators.</P>
              </SubSection>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
                <Stat label="Target Market (SAM)" value="$800M" sub="US hub services software" />
                <Stat label="Avg Contract Value" value="$18K" sub="Annual, Professional tier" />
                <Stat label="Year 3 ARR Target" value="$4M" sub="~150 active organizations" />
                <Stat label="Funding Ask" value="$1.5M" sub="Seed round, 18-month runway" />
              </div>

              <SubSection title="The Team">
                <P><strong style={{ color: theme.text }}>Nick Milero, CEO & Co-Founder</strong> — 15+ years specialty pharma and rare disease market access. Led patient access programs at multiple Top-10 pharma companies. Knows every buyer persona personally.</P>
                <P><strong style={{ color: theme.text }}>Rick Boulanger, CTO & Co-Founder</strong> — Full-stack enterprise SaaS engineer. Built the entire Conduit platform from concept to production-ready in under 30 days. Deep experience in real-time systems and healthcare IT.</P>
              </SubSection>

              <SubSection title="The Ask">
                <P>We are raising <strong style={{ color: theme.text }}>$1.5M in Seed funding</strong> to hire three enterprise sales reps, two engineers, close our first 25 paying customers, and reach <strong style={{ color: theme.text }}>$37,500 MRR</strong> within 18 months.</P>
              </SubSection>
            </Section>
          )}

          {/* 2 — COMPANY OVERVIEW */}
          {activeSection === 1 && (
            <Section title="2. Company Overview">
              <SubSection title="Mission">
                <P style={{ fontSize: 16, color: theme.text, fontStyle: "italic" }}>"Eliminate communication friction so every specialty patient gets faster access to the therapy they need."</P>
              </SubSection>

              <SubSection title="Vision">
                <P>A world where patient access teams operate with the same real-time coordination as air traffic control — every team member seeing the same information, acting on the same signals, with zero communication lag between them and the patient.</P>
              </SubSection>

              <SubSection title="Company Details">
                <Table
                  headers={["Field", "Details"]}
                  rows={[
                    ["Legal Name", "Conduit, Inc."],
                    ["Entity Type", "Delaware C-Corporation"],
                    ["Founded", "2026"],
                    ["Headquarters", "United States (Remote-first)"],
                    ["Product", "Conduit — Patient Access Communications Platform"],
                    ["Website", "conduit.health (target)"],
                    ["Stage", "Pre-Seed / MVP with pilot customers"],
                  ]}
                />
              </SubSection>

              <SubSection title="Core Values">
                <BulletList items={[
                  "Patient First — every product decision is evaluated by its impact on time-to-therapy",
                  "Radical Simplicity — enterprise power with consumer-grade ease of use",
                  "Trust Through Transparency — HIPAA-aware by design; no hidden data movement",
                  "Speed as a Feature — deploy in an hour, not six months",
                ]} />
              </SubSection>
            </Section>
          )}

          {/* 3 — PROBLEM */}
          {activeSection === 2 && (
            <Section title="3. The Problem">
              <Callout color="#e74c3c">
                <strong>30% of specialty patients abandon therapy before their first fill</strong> — not because they don't want it, but because the access process breaks down somewhere between prescriber, hub, specialty pharmacy, and payer. Communication failure is the #1 operational root cause.
              </Callout>

              <SubSection title="The Specialty Drug Access Gauntlet">
                <P>When a physician prescribes a specialty drug, a complex multi-party process begins: the hub receives the referral, a case manager initiates benefit verification, prior authorization is submitted, the specialty pharmacy is engaged, and a nurse coordinator manages the patient through each step. At every handoff, information must flow accurately and instantly across four or more teams.</P>
                <P>Today, that information flow looks like this:</P>
                <BulletList items={[
                  "Referrals and case updates tracked in Excel spreadsheets, manually updated",
                  "Status reports built weekly in Power BI — already 72 hours stale when read",
                  "Team-to-team communication via email chains with no acknowledgment tracking",
                  "Follow-up reminders managed in personal Outlook calendars or sticky notes",
                  "Critical escalations buried in group email threads with no priority flagging",
                  "New team members spend 3–6 months learning which spreadsheet to trust",
                ]} />
              </SubSection>

              <SubSection title="The Consequences">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <Stat label="Avg days for specialty PA" value="14" sub="Industry benchmark" />
                  <Stat label="Patient abandonment rate" value="30%" sub="Before first fill" />
                  <Stat label="Cost per missed patient" value="$40K+" sub="Lost lifetime drug revenue" />
                  <Stat label="FTE hours lost to status updates" value="8 hrs/wk" sub="Per case manager" />
                </div>
                <P>Beyond patient impact, these inefficiencies cost pharmaceutical manufacturers millions annually in delayed revenue recognition, increased case management overhead, and compliance exposure from undocumented communications.</P>
              </SubSection>

              <SubSection title="Why Existing Solutions Fail">
                <BulletList items={[
                  "Power BI / Power Apps — built for reporting, not real-time team communication; no notification layer; requires IT to maintain",
                  "Salesforce Health Cloud — 6–18 month implementation, $200K+ setup cost, built for CRM not hub coordination",
                  "Generic project tools (Asana, Monday) — not HIPAA-aware, no healthcare workflow logic, no case-specific analytics",
                  "Enterprise hub platforms (AssistRx, ConnectiveRx) — months to deploy, designed for large operators, unaffordable for emerging programs",
                ]} />
              </SubSection>
            </Section>
          )}

          {/* 4 — SOLUTION */}
          {activeSection === 3 && (
            <Section title="4. The Solution — Conduit">
              <Callout>
                Conduit is the first patient access communications platform designed specifically for the day-to-day operational reality of specialty hub teams — built by people who have lived inside those programs.
              </Callout>

              <SubSection title="Core Platform Capabilities">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    ["◎ Real-Time Case Dashboard", "Live patient case table with 11-stage bucket classification, regional and payer filters, aging analysis. Every team sees the same data simultaneously."],
                    ["✉ Priority Notifications", "Cross-team notifications with Normal / High / Urgent priority levels. Reply threading, acknowledgment tracking, escalation to email for critical alerts."],
                    ["📅 Follow-Up Calendar", "Case-level follow-up scheduling with overdue alerts, color-coded calendar view, and per-user privacy. Nurses never miss a callback."],
                    ["◎ Analytics Suite", "SP partner performance, aging distribution, payer mix, HIPAA consent rates, notification resolution — actionable insights without a BI team."],
                    ["📥 Bulk Import", "Onboard an existing case load in minutes via CSV upload. Templated import with per-row error reporting. No IT required."],
                    ["🔒 Admin Control", "Full user management, audit log of every login with IP and device, raw database inspection. Compliance-ready from day one."],
                  ].map(([title, desc]) => (
                    <div key={title} style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "16px 18px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 6 }}>{title}</div>
                      <div style={{ fontSize: 12, color: theme.textMuted, lineHeight: 1.6 }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </SubSection>

              <SubSection title="Key Differentiators">
                <BulletList items={[
                  "Deploy in under 60 minutes — connect to Railway, add a PostgreSQL plugin, done. No IT department, no 6-month implementation, no professional services invoice.",
                  "Built for hub team workflows out of the box — case stages, SP partner tracking, HUB substatus fields, and team roles (Home Office, NCM, SP, Sales) are native, not configured.",
                  "Mobile-first design — field-based nurses and sales reps access the full platform on any phone with no app download required.",
                  "Role-based access with real audit trails — every login is logged with IP and device; notification history is immutable; admin-only DB inspection built in.",
                  "Priced for emerging programs — a manufacturer launching their second or third specialty product can afford Conduit. They cannot afford Salesforce.",
                ]} />
              </SubSection>

              <SubSection title="Product Roadmap (Next 18 Months)">
                <Table
                  headers={["Quarter", "Capability"]}
                  rows={[
                    ["Q2 2026", "SSO / SAML integration, Webhooks API for EHR push notifications"],
                    ["Q3 2026", "HIPAA BAA, SOC 2 Type I audit initiated, Two-factor authentication"],
                    ["Q4 2026", "White-label mode for hub operators, Custom case field builder"],
                    ["Q1 2027", "Native Salesforce CRM connector, Automated PA status tracking"],
                    ["Q2 2027", "AI-assisted case prioritization, predictive abandonment scoring"],
                    ["Q3 2027", "Patient-facing portal (opt-in), Bi-directional SP data feeds"],
                  ]}
                />
              </SubSection>
            </Section>
          )}

          {/* 5 — MARKET */}
          {activeSection === 4 && (
            <Section title="5. Market Analysis">
              <SubSection title="Market Sizing">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  <Stat label="Total Addressable Market" value="$3.5B" sub="Global patient access software" />
                  <Stat label="Serviceable Addressable Market" value="$800M" sub="US specialty hub coordination" />
                  <Stat label="Serviceable Obtainable Market" value="$50M" sub="Year 3 realistic capture" />
                </div>
                <P>The TAM encompasses all software used in specialty pharmaceutical patient services — from benefits investigation tools to hub management systems, specialty pharmacy portals, and patient engagement platforms. The SAM narrows to the coordination and communication layer specifically: the software that orchestrates the people doing the work.</P>
              </SubSection>

              <SubSection title="Market Drivers">
                <BulletList items={[
                  "FDA approval pace — 50+ new specialty drugs approved annually; each requires a new patient support program within 12–18 months of launch",
                  "Rising payer complexity — specialty drugs face PA denial rates of 25–40%; more appeals means more case management workflow",
                  "Growth of hub services — the US hub services market is $8B+ and growing 9% annually as manufacturers outsource patient support",
                  "Workforce efficiency pressure — specialty pharma manufacturers face headcount freezes but must maintain or improve patient access KPIs",
                  "Compliance expectations — FDA and state attorneys general are increasing scrutiny of patient support programs, driving demand for documented communication",
                ]} />
              </SubSection>

              <SubSection title="Target Customer Profiles">
                <Table
                  headers={["Segment", "Description", "Est. # of Orgs", "Avg ACV"]}
                  rows={[
                    ["Emerging Pharma", "Manufacturers with 1–3 specialty products, in-house hub teams of 5–30 people", "300+", "$12,000"],
                    ["Mid-Size Pharma", "4–10 products, dedicated patient access VP, 30–150 FTEs in access", "150+", "$24,000"],
                    ["Hub Operators", "Third-party hub service companies managing programs for multiple manufacturers", "50+", "$48,000"],
                    ["Specialty Pharmacies", "Dispensing pharmacies with embedded case management teams", "200+", "$18,000"],
                  ]}
                />
              </SubSection>

              <SubSection title="Buyer Personas">
                <BulletList items={[
                  "VP / Director of Patient Access — economic buyer; KPIs tied to days-to-therapy and patient abandonment rates; budget authority $25K–$100K",
                  "Director of Hub Operations — operational buyer; owns the day-to-day workflow; will champion the product internally if it solves their pain",
                  "IT / Compliance — gate-keeper on HIPAA, SSO, and vendor security review; secondary decision maker",
                  "Specialty Pharmacy Operations Lead — at hub operator accounts; manages 20–200 case managers; focused on throughput and SLA compliance",
                ]} />
              </SubSection>
            </Section>
          )}

          {/* 6 — BUSINESS MODEL */}
          {activeSection === 5 && (
            <Section title="6. Business Model">
              <SubSection title="Pricing Tiers">
                <Table
                  headers={["Tier", "Price / Month", "Users", "Key Features", "Target"]}
                  rows={[
                    ["Starter", "$499", "Up to 10", "Dashboard, notifications, basic analytics, 1 program", "Small emerging programs"],
                    ["Professional", "$1,499", "Up to 50", "Full analytics, follow-up calendar, bulk import, admin panel", "Mid-size pharma teams"],
                    ["Enterprise", "$3,999", "Unlimited", "SSO, white-label, custom fields, SLA, dedicated CSM", "Hub operators, large pharma"],
                  ]}
                />
                <P>Annual contracts standard with a 20% discount for annual prepay. Monthly billing available at list price. All tiers include onboarding and email support. Enterprise includes a named Customer Success Manager and quarterly business reviews.</P>
              </SubSection>

              <SubSection title="Revenue Streams">
                <BulletList items={[
                  "Subscription MRR — the primary and recurring revenue engine; 90%+ of total revenue at scale",
                  "Implementation Fee — $2,500 (Starter), $5,000 (Professional), $10,000 (Enterprise) one-time setup and data migration",
                  "Professional Services — custom integrations, training workshops, and compliance documentation packages ($200/hr)",
                  "Future: Data & Benchmarking — anonymized aggregate benchmarks on PA timelines, SP performance, and payer trends sold back to the industry",
                ]} />
              </SubSection>

              <SubSection title="Unit Economics (Target State, Year 2)">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                  <Stat label="Avg Contract Value (ACV)" value="$18K" sub="Blended annual" />
                  <Stat label="Gross Margin" value="82%" sub="SaaS benchmark" />
                  <Stat label="CAC (Year 2)" value="$8,000" sub="Fully-loaded" />
                  <Stat label="LTV / CAC Ratio" value="6.8x" sub="At 3yr avg retention" />
                </div>
              </SubSection>

              <SubSection title="Retention Strategy">
                <BulletList items={[
                  "High switching cost — case history, notes, and notifications are deeply embedded in operations within 60 days",
                  "Expansion revenue — customers grow from Starter to Professional as team size increases; 120%+ Net Revenue Retention target",
                  "Quarterly Business Reviews — proactive CSM engagement on KPIs (days-to-therapy, abandonment rates, notification SLAs)",
                  "Product-led stickiness — follow-up calendars and audit trails create individual user habits; platform becomes infrastructure",
                ]} />
              </SubSection>
            </Section>
          )}

          {/* 7 — GTM */}
          {activeSection === 6 && (
            <Section title="7. Go-to-Market Strategy">
              <Callout>
                Nick Milero's 15 years inside specialty pharma patient access programs is our single most valuable GTM asset. We are not selling into a market we discovered — we are selling to colleagues we have worked alongside.
              </Callout>

              <SubSection title="Phase 1: Founder-Led Sales (Months 1–6)">
                <BulletList items={[
                  "Direct outreach to Nick's network of VP Patient Access, Director Hub Operations, and Program Directors at specialty pharma manufacturers",
                  "Target initial 10 pilot customers — 60-day free pilots with white-glove onboarding, then convert to paid",
                  "Focus on programs running on Power BI + Power Apps or Excel — the most painful incumbent and easiest displacement",
                  "Pricing: enter at Professional tier ($1,499/mo) with annual prepay incentive; no freemium to protect ASP",
                  "Success metric: 10 paying customers, $15,000 MRR, 3 referenceable case studies",
                ]} />
              </SubSection>

              <SubSection title="Phase 2: Scaled Direct Sales (Months 7–18)">
                <BulletList items={[
                  "Hire 3 enterprise sales reps with specialty pharma or health IT backgrounds — seed funding enables this",
                  "Build a library of ROI case studies: days-to-therapy improvement, case manager hours saved, patient abandonment reduction",
                  "Target hub operators as multiplier accounts — one Enterprise contract covers 5–20 manufacturer programs",
                  "Partner with specialty pharmacy networks (e.g., NASP members) who co-manage patient access programs",
                ]} />
              </SubSection>

              <SubSection title="Phase 3: Market Presence (Month 18+)">
                <BulletList items={[
                  "Conference sponsorship and speaking: Hub Summit, NACDS Annual, ISPOR, Asembia Specialty Pharmacy Summit",
                  "Content marketing: publish the annual 'State of Specialty Drug Access' benchmarking report using anonymized platform data",
                  "Channel partnerships with market access consulting firms who implement patient support programs",
                  "Inbound via SEO content targeting: 'specialty pharmacy hub software', 'patient access case management platform'",
                ]} />
              </SubSection>

              <SubSection title="Sales Motion">
                <Table
                  headers={["Stage", "Activity", "Duration", "Owner"]}
                  rows={[
                    ["Prospect", "Warm intro or conference meeting, 15-min discovery call", "1–2 weeks", "Nick / Sales Rep"],
                    ["Demo", "Live Conduit demo on prospect's use case, ROI estimate", "1 week", "Sales Rep"],
                    ["Pilot", "60-day free pilot, data import, onboarding, check-ins", "60 days", "Sales + CSM"],
                    ["Close", "Annual contract proposal, legal/security review, signature", "2–4 weeks", "Sales Rep"],
                    ["Expand", "QBR at 90 days, upsell to next tier or additional programs", "Ongoing", "CSM"],
                  ]}
                />
              </SubSection>
            </Section>
          )}

          {/* 8 — COMPETITIVE */}
          {activeSection === 7 && (
            <Section title="8. Competitive Landscape">
              <SubSection title="Competitive Matrix">
                <Table
                  headers={["", "Conduit", "AssistRx iAssist", "ConnectiveRx", "Salesforce Health Cloud", "Power BI / Excel"]}
                  rows={[
                    ["Purpose-built for hub workflows", "✓", "✓", "✓", "No", "No"],
                    ["Real-time cross-team notifications", "✓", "Partial", "No", "With config", "No"],
                    ["Deploy in < 1 hour", "✓", "No", "No", "No", "No"],
                    ["Mobile-first", "✓", "No", "No", "Partial", "No"],
                    ["Starting price / month", "$499", "$5,000+", "$10,000+", "$15,000+", "~$0 (high labor cost)"],
                    ["Implementation time", "< 1 day", "3–6 months", "3–6 months", "6–18 months", "Ongoing"],
                    ["Built-in audit log", "✓", "Partial", "Partial", "✓", "No"],
                    ["Analytics out of the box", "✓", "Limited", "Limited", "With BI licenses", "Manual"],
                  ]}
                />
              </SubSection>

              <SubSection title="Competitive Positioning">
                <P><strong style={{ color: theme.text }}>vs. AssistRx & ConnectiveRx:</strong> These are the dominant incumbents in hub services IT, but they are designed for large, mature programs with dedicated IT teams and 6-month implementation budgets. They are infrastructure, not communication tools. Conduit wins on speed, price, and the communication layer they lack.</P>
                <P><strong style={{ color: theme.text }}>vs. Salesforce Health Cloud:</strong> The default enterprise answer when budget is not a constraint. But health cloud requires Salesforce admins, heavy configuration, and months of professional services. A 20-person patient access team at an emerging biotech cannot operationalize it. Conduit is live before their next all-hands.</P>
                <P><strong style={{ color: theme.text }}>vs. Power BI / Excel:</strong> Our real incumbent. 70%+ of our target market runs on this stack today. The displacement pitch is simple: "You're spending 8 hours a week maintaining a dashboard that's 3 days out of date. Conduit is real-time, and your team is already messaging each other about it."</P>
              </SubSection>

              <SubSection title="Sustainable Moat">
                <BulletList items={[
                  "Domain expertise — the product is built by people who ran these programs; every feature maps to a real workflow pain",
                  "Data network effect — anonymized benchmark data becomes more valuable as customer count grows, creating a proprietary industry dataset",
                  "Switching costs — after 90 days of case notes, notification history, and follow-up calendars, migration is operationally painful",
                  "Speed advantage — we can ship features in days that take enterprise competitors quarters; we will stay ahead on the communication layer",
                ]} />
              </SubSection>
            </Section>
          )}

          {/* 9 — TEAM */}
          {activeSection === 8 && (
            <Section title="9. Team">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                {[
                  {
                    name: "Nick Milero",
                    title: "CEO & Co-Founder",
                    bio: "15+ years in specialty pharmaceutical market access and rare disease patient support. Led patient access programs at multiple Top-10 global pharma companies, managing hub service operations, specialty pharmacy relationships, and cross-functional team coordination at scale. Nick has personally experienced every pain point Conduit solves — and knows every buyer by name.",
                    skills: ["Market Access Strategy", "Hub Operations", "Specialty Pharma", "Enterprise Sales", "Payer Relations"],
                  },
                  {
                    name: "Rick Boulanger",
                    title: "CTO & Co-Founder",
                    bio: "Full-stack software engineer with deep experience building enterprise SaaS platforms. Architected Conduit end-to-end — real-time notification engine, analytics pipeline, mobile-first interface, and scalable cloud deployment — in under 30 days. Prior experience in healthcare IT and high-throughput data systems. Rick's philosophy: software should disappear into the workflow.",
                    skills: ["Full-Stack Engineering", "System Architecture", "Healthcare IT", "Real-Time Systems", "Cloud Infrastructure"],
                  },
                ].map(p => (
                  <div key={p.name} style={{ background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 12, padding: "22px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: NAVY, flexShrink: 0 }}>
                        {p.name.split(" ").map(w => w[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: theme.text }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>{p.title}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: theme.textMuted, lineHeight: 1.7, marginBottom: 14 }}>{p.bio}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {p.skills.map(s => <span key={s} style={{ fontSize: 10, fontWeight: 600, color: TEAL, background: `${TEAL}12`, border: `1px solid ${TEAL}25`, borderRadius: 4, padding: "2px 7px" }}>{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>

              <SubSection title="Hiring Plan (Post-Funding)">
                <Table
                  headers={["Role", "Quarter", "Rationale"]}
                  rows={[
                    ["Enterprise Sales Rep #1", "Q3 2026", "Nick can no longer personally close every deal; first hire extends founder-led GTM"],
                    ["Enterprise Sales Rep #2", "Q4 2026", "Build pipeline to hit Year 2 targets"],
                    ["Customer Success Manager", "Q4 2026", "Protect retention; drive expansion revenue from pilot-to-paid converts"],
                    ["Full-Stack Engineer #1", "Q3 2026", "SSO, API integrations, SOC 2 readiness; Rick cannot be the only engineer past 20 customers"],
                    ["Full-Stack Engineer #2", "Q1 2027", "Accelerate product roadmap; mobile app, custom fields"],
                    ["Enterprise Sales Rep #3", "Q1 2027", "Build toward $100K MRR milestone"],
                  ]}
                />
              </SubSection>

              <SubSection title="Advisory Board (Target)">
                <BulletList items={[
                  "Former SVP Market Access at a Top-5 specialty pharma company — buyer credibility and enterprise introductions",
                  "Managing Partner at a healthcare IT venture fund — Series A preparation and investor network",
                  "Chief Compliance Officer from a major hub service operator — HIPAA and SOC 2 guidance",
                ]} />
              </SubSection>
            </Section>
          )}

          {/* 10 — FINANCIALS */}
          {activeSection === 9 && (
            <Section title="10. Financial Projections">
              <Callout>
                Conservative projections based on 60-day pilot-to-paid conversion at 70%, 12-month average contract length, and 90% gross retention. All figures assume seed round closes Q3 2026.
              </Callout>

              <SubSection title="Revenue Model">
                <Table
                  headers={["Metric", "Year 1 (2026)", "Year 2 (2027)", "Year 3 (2028)"]}
                  rows={[
                    ["Paying Customers (EOY)", "15", "60", "150"],
                    ["Avg Contract Value (Annual)", "$12,000", "$18,000", "$22,000"],
                    ["Annual Recurring Revenue", "$180,000", "$1,080,000", "$3,300,000"],
                    ["MRR (December)", "$15,000", "$90,000", "$275,000"],
                    ["Gross Margin", "80%", "82%", "84%"],
                    ["Net Revenue Retention", "105%", "115%", "120%"],
                  ]}
                />
              </SubSection>

              <SubSection title="Operating Expenses">
                <Table
                  headers={["Category", "Year 1", "Year 2", "Year 3"]}
                  rows={[
                    ["Salaries & Contractors", "$280,000", "$920,000", "$2,100,000"],
                    ["Infrastructure (Cloud)", "$12,000", "$36,000", "$90,000"],
                    ["Sales & Marketing", "$80,000", "$240,000", "$480,000"],
                    ["G&A, Legal, Compliance", "$60,000", "$100,000", "$160,000"],
                    ["Total OpEx", "$432,000", "$1,296,000", "$2,830,000"],
                  ]}
                />
              </SubSection>

              <SubSection title="Path to Profitability">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  <Stat label="Breakeven MRR" value="$108K" sub="~72 Professional customers" />
                  <Stat label="Breakeven Timeline" value="Month 26" sub="Conservative model" />
                  <Stat label="Cash Required to BE" value="~$2.1M" sub="Seed + Series A" />
                </div>
              </SubSection>
            </Section>
          )}

          {/* 11 — FUNDING */}
          {activeSection === 10 && (
            <Section title="11. Funding Ask">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                <Stat label="Raise Amount" value="$1.5M" sub="Seed round" />
                <Stat label="Instrument" value="SAFE" sub="Post-money, $8M cap" />
                <Stat label="Runway" value="18 months" sub="To Series A trigger" />
              </div>

              <SubSection title="Use of Funds">
                <Table
                  headers={["Category", "Amount", "% of Raise", "Purpose"]}
                  rows={[
                    ["Sales & GTM", "$600,000", "40%", "3 enterprise sales reps, conference presence, content marketing"],
                    ["Engineering", "$525,000", "35%", "2 full-stack engineers, SSO, SOC 2, API integrations"],
                    ["Operations & Legal", "$225,000", "15%", "Finance, legal, HIPAA/compliance, IP protection"],
                    ["Working Capital", "$150,000", "10%", "Operating reserve and contingency"],
                  ]}
                />
              </SubSection>

              <SubSection title="Series A Trigger Conditions">
                <BulletList items={[
                  "$100,000+ MRR (~60 paying customers)",
                  "3 referenceable Enterprise-tier accounts",
                  "SOC 2 Type II certification complete",
                  "Net Revenue Retention > 110%",
                  "Clear path to hub operator channel (multiplier accounts)",
                ]} />
                <P>We expect to reach these milestones in Q3–Q4 2027 and raise a $6–8M Series A to accelerate enterprise sales, fund the patient-facing portal, and build the data benchmarking product.</P>
              </SubSection>

              <SubSection title="Target Investor Profile">
                <BulletList items={[
                  "Healthcare IT focused seed funds: Rock Health, Redesign Health, a16z Bio, GV (Google Ventures)",
                  "Strategic angels from specialty pharma market access, hub services, or specialty pharmacy leadership",
                  "Generalist seed funds with strong SaaS portfolios who value the defensibility of domain expertise",
                ]} />
              </SubSection>
            </Section>
          )}

          {/* 12 — MILESTONES */}
          {activeSection === 11 && (
            <Section title="12. Milestones & Roadmap">
              <SubSection title="18-Month Milestone Plan">
                <Table
                  headers={["Milestone", "Target Date", "Success Metric"]}
                  rows={[
                    ["5 paying pilot converts", "Q2 2026", "$7,500 MRR; 3 referenceable customers"],
                    ["Seed round close", "Q3 2026", "$1.5M at $8M post-money SAFE cap"],
                    ["First sales hire on-board", "Q3 2026", "Sales rep with specialty pharma background"],
                    ["SOC 2 Type I initiated", "Q3 2026", "Audit firm engaged; controls documented"],
                    ["First hub operator pilot", "Q4 2026", "Enterprise-tier contract signed"],
                    ["25 paying customers", "Q4 2026", "$37,500 MRR"],
                    ["SSO / SAML live", "Q4 2026", "Required for 3 Enterprise accounts in pipeline"],
                    ["60 paying customers", "Q3 2027", "$90,000 MRR; Series A ready"],
                    ["SOC 2 Type II certified", "Q3 2027", "Required for large pharma procurement"],
                    ["$100K MRR", "Q4 2027", "Series A trigger; ~75 customers"],
                    ["150 customers", "Q4 2028", "$3.3M ARR; approaching profitability"],
                  ]}
                />
              </SubSection>

              <SubSection title="Product Milestones">
                <Table
                  headers={["Feature", "Quarter", "Business Impact"]}
                  rows={[
                    ["SSO / SAML", "Q3 2026", "Unlocks Enterprise deals requiring IT security review"],
                    ["HIPAA BAA + SOC 2 Type I", "Q3 2026", "Removes compliance objection from VP/IT buyers"],
                    ["White-label mode", "Q4 2026", "Hub operators can brand for their pharma clients"],
                    ["Salesforce connector", "Q1 2027", "Integrates into existing CRM workflows; reduces switching cost objection"],
                    ["Custom case fields", "Q1 2027", "Handles edge-case workflows without professional services"],
                    ["AI case prioritization", "Q2 2027", "Differentiates at Enterprise tier; justifies price premium"],
                    ["Patient-facing portal", "Q3 2027", "New product tier; expands TAM into patient engagement"],
                  ]}
                />
              </SubSection>
            </Section>
          )}

          {/* 13 — RISK */}
          {activeSection === 12 && (
            <Section title="13. Risk & Mitigation">
              <Table
                headers={["Risk", "Likelihood", "Impact", "Mitigation"]}
                rows={[
                  ["Sales cycle longer than expected", "Medium", "High", "Pilot program reduces friction; Nick's network shortens discovery to weeks, not months"],
                  ["Enterprise requires SOC 2 before signing", "High", "Medium", "Initiating SOC 2 Type I in Q3 2026 from seed funds; have interim HIPAA documentation ready"],
                  ["Incumbent (Salesforce/AssistRx) builds competing feature", "Low", "Medium", "They will not move fast enough; our moat is speed and domain expertise, not features alone"],
                  ["Key person risk (Nick or Rick departs)", "Low", "Very High", "ESOP cliff vest at 12 months; roles documented; advisory board provides coverage"],
                  ["HIPAA compliance failure", "Low", "Very High", "BAA in place with all cloud vendors; no PHI stored beyond minimum necessary; legal review Q2 2026"],
                  ["Price competition from offshore alternatives", "Medium", "Low", "Buyers in specialty pharma do not purchase access management software on price; they buy on trust and domain fit"],
                  ["Customer concentration", "Medium", "Medium", "No single customer > 15% of ARR by Year 2; diversify across Starter and Professional tiers early"],
                ]}
              />
            </Section>
          )}

          {/* 14 — APPENDIX */}
          {activeSection === 13 && (
            <Section title="14. Appendix">
              <SubSection title="Glossary">
                <Table
                  headers={["Term", "Definition"]}
                  rows={[
                    ["Hub Services", "Third-party patient support programs that manage benefit verification, PA, appeals, and SP coordination on behalf of pharma manufacturers"],
                    ["NCM", "Nurse Case Manager — clinical team member managing patient onboarding and therapy adherence"],
                    ["SP", "Specialty Pharmacy — specialized dispenser for high-cost, complex medications"],
                    ["PA", "Prior Authorization — payer requirement to approve coverage before dispensing"],
                    ["HUB Substatus", "Operational case status within the hub workflow (e.g. 'PA Submitted', 'Appeal in Progress')"],
                    ["ACV", "Annual Contract Value — total annual recurring revenue from a single customer"],
                    ["ARR", "Annual Recurring Revenue — total annualized subscription revenue"],
                    ["MRR", "Monthly Recurring Revenue"],
                    ["NRR", "Net Revenue Retention — measures expansion and contraction within existing customer base"],
                    ["SAFE", "Simple Agreement for Future Equity — common seed-stage investment instrument"],
                    ["CAC", "Customer Acquisition Cost — fully-loaded cost to acquire one paying customer"],
                    ["LTV", "Lifetime Value — total gross profit expected from a customer over their contract lifetime"],
                  ]}
                />
              </SubSection>

              <SubSection title="Key Assumptions">
                <BulletList items={[
                  "60-day free pilot converts at 70% — based on Nick's read of the market and the high switching cost of not converting",
                  "Average contract starts at Professional ($1,499/mo) and grows to $1,800/mo blended by Year 2 as Enterprise accounts are added",
                  "90% gross retention — specialty pharma programs are multi-year; case history makes switching painful",
                  "Sales rep productivity: $500K ARR closed per rep per year by Year 2 (industry benchmark for SMB SaaS is $400–700K)",
                  "Cloud infrastructure scales linearly at ~$80/customer/month at current architecture",
                ]} />
              </SubSection>

              <SubSection title="Contact">
                <P>Nick Milero — nick.milero@conduit.health — CEO & Co-Founder</P>
                <P>Rick Boulanger — rick.boulanger@conduit.health — CTO & Co-Founder</P>
              </SubSection>

              <div style={{ marginTop: 32, padding: "16px 20px", background: theme.surfaceBg2, border: `1px solid ${theme.border}`, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: theme.textFaint, letterSpacing: 1 }}>CONFIDENTIAL — This document contains proprietary and confidential information. Distribution restricted to authorized recipients only.</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEAL, marginTop: 8 }}>Conduit — Every Team. One Channel. · v1.0 · March 2026</div>
              </div>
            </Section>
          )}

          {/* Prev/Next nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 24, borderTop: `1px solid ${theme.border}` }}>
            <button onClick={() => setActiveSection(s => Math.max(0, s - 1))} disabled={activeSection === 0}
              style={{ padding: "10px 20px", background: theme.surfaceBg, border: `1px solid ${theme.border}`, borderRadius: 8, color: activeSection === 0 ? theme.textFaint : theme.text, fontSize: 13, fontWeight: 600, cursor: activeSection === 0 ? "not-allowed" : "pointer", fontFamily: FONT_SANS }}>
              ← Previous
            </button>
            <span style={{ fontSize: 12, color: theme.textFaint, alignSelf: "center" }}>{activeSection + 1} / {SECTIONS.length}</span>
            <button onClick={() => setActiveSection(s => Math.min(SECTIONS.length - 1, s + 1))} disabled={activeSection === SECTIONS.length - 1}
              style={{ padding: "10px 20px", background: activeSection === SECTIONS.length - 1 ? theme.surfaceBg : TEAL, border: "none", borderRadius: 8, color: activeSection === SECTIONS.length - 1 ? theme.textFaint : NAVY, fontSize: 13, fontWeight: 700, cursor: activeSection === SECTIONS.length - 1 ? "not-allowed" : "pointer", fontFamily: FONT_SANS }}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
