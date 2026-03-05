// CoFi Radar — Changelog page
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const CORAL  = "#C96442";
const BG     = "#FAF7F4";
const WHITE  = "#FFFFFF";
const T1     = "#1C1714";
const T2     = "#6B5E56";
const T3     = "#9B8E85";
const BORDER = "#EDE7E0";

export const metadata = {
  title: "Changelog — CoFi Radar",
  description: "What's new in CoFi Radar.",
};

type EntryType = "new" | "improved" | "fix";

function TypeBadge({ type }: { type: EntryType }) {
  const config: Record<EntryType, { label: string; bg: string; color: string }> = {
    new:      { label: "New",      bg: "#EFF6FF", color: "#1D4ED8" },
    improved: { label: "Improved", bg: "#FBF0EB", color: CORAL      },
    fix:      { label: "Fix",      bg: "#F0FDF4", color: "#16A34A"  },
  };
  const c = config[type];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 4, background: c.bg, color: c.color, flexShrink: 0 }}>
      {c.label.toUpperCase()}
    </span>
  );
}

interface ChangelogEntry { type: EntryType; text: string; }
interface Release { version: string; date: string; summary: string; entries: ChangelogEntry[]; }

const releases: Release[] = [
  {
    version: "1.3",
    date:    "February 2026",
    summary: "Support agent and automated billing lifecycle.",
    entries: [
      { type: "new",      text: "Automated support agent: classifies inbound emails and replies within seconds for refund, cancellation, billing, and technical queries." },
      { type: "new",      text: "48-hour grace period auto-refund: monthly subscribers can get a full refund automatically within 48 hours of signup." },
      { type: "new",      text: "Stripe Customer Portal integration: subscribers can upgrade, downgrade, cancel, and update payment methods without contacting support." },
      { type: "new",      text: "Monday ops digest: weekly summary email to the admin with subscription health, funnel metrics, and run success rates." },
      { type: "improved", text: "Weekly run now processes all active brands in parallel for faster delivery." },
    ],
  },
  {
    version: "1.2",
    date:    "January 2026",
    summary: "Free scan and onboarding agent.",
    entries: [
      { type: "new",      text: "Free scan endpoint: any brand can get a free AI Visibility Report in under 2 minutes with no account required." },
      { type: "new",      text: "Onboarding agent: scrapes homepage, generates 30 brand-specific queries, and runs the first full monitoring cycle immediately after payment." },
      { type: "new",      text: "Free report email: HTML email with score breakdown, sample findings, and upgrade CTA." },
      { type: "improved", text: "Query generation now uses brand homepage content for higher relevance." },
      { type: "improved", text: "Rate limiting on free scan: one scan per email per 7 days, one per domain per 30 days." },
    ],
  },
  {
    version: "1.1",
    date:    "December 2025",
    summary: "Dashboard, magic link auth, and Evidence Explorer.",
    entries: [
      { type: "new",      text: "Brand dashboard with AI Visibility Score, subscore grid, 12-week sparkline, and trend indicators." },
      { type: "new",      text: "Evidence Explorer: searchable table of all 120 AI answers, filterable by model, intent, and risk severity." },
      { type: "new",      text: "Alerts page: all detected alert conditions sorted by severity." },
      { type: "new",      text: "Fix plan page: P0/P1/P2 recommendations with full reasoning." },
      { type: "new",      text: "Magic link authentication: no passwords, one-click login from weekly email reports." },
      { type: "improved", text: "Weekly email now includes a pre-signed magic link that signs the user in directly." },
    ],
  },
  {
    version: "1.0",
    date:    "November 2025",
    summary: "Initial release.",
    entries: [
      { type: "new", text: "Weekly automated testing across ChatGPT (GPT-4o), Claude (Sonnet), Gemini (1.5 Pro), and Perplexity (Sonar)." },
      { type: "new", text: "AI Visibility Score algorithm: Visibility (35%), Accuracy (30%), Competitive (20%), Sentiment (15%)." },
      { type: "new", text: "Seven alert types: fabricated pricing, wrong compliance, competitor displacement, brand absence, negative sentiment, score drop, and risk flag spike." },
      { type: "new", text: "Fix plan: Claude-generated P0/P1/P2 action recommendations after each run." },
      { type: "new", text: "Weekly email report with score, alerts, and fix plan summary." },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: T1, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Nav />

      {/* Header */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "88px 24px 64px" }}>
        <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Changelog</p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16, color: T1 }}>
          What&apos;s new in CoFi Radar
        </h1>
        <p style={{ fontSize: 17, color: T2, lineHeight: 1.7 }}>
          We ship improvements continuously. Here is a record of significant releases.
        </p>
      </section>

      {/* Entries */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 100px" }}>
        {releases.map((release, ri) => (
          <div key={release.version} style={{ marginBottom: ri < releases.length - 1 ? 72 : 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: T1, letterSpacing: "-0.02em" }}>Version {release.version}</h2>
              <span style={{ fontSize: 13, color: T3, fontFamily: "monospace" }}>{release.date}</span>
            </div>
            <p style={{ fontSize: 15, color: T2, marginBottom: 24 }}>{release.summary}</p>
            <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
              {release.entries.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 20px",
                    borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  <TypeBadge type={entry.type} />
                  <p style={{ fontSize: 14, color: T2, lineHeight: 1.65, margin: 0 }}>{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
}
