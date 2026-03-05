// CoFi Radar — marketing landing page (server component)
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import FreeScanForm from "@/components/FreeScanForm";
import RadarDisk from "@/components/RadarDisk";

const CORAL  = "#C96442";
const BG     = "#FAF7F4";
const WHITE  = "#FFFFFF";
const T1     = "#1C1714";
const T2     = "#6B5E56";
const T3     = "#9B8E85";
const BORDER = "#EDE7E0";

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function IconBolt() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M11.5 2.5L4 11h6l-1.5 6.5 7.5-9H9.5z" stroke={CORAL} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconAnalyze() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5.5" stroke={CORAL} strokeWidth="1.6" />
      <path d="M13 13l4 4" stroke={CORAL} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.5 8.5h4M8.5 6.5v4" stroke={CORAL} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconReport() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="3" y="2.5" width="14" height="15" rx="2" stroke={CORAL} strokeWidth="1.6" />
      <path d="M6 12.5l2.5-3 2 2L14 8" stroke={CORAL} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M2.5 7.5l3 3 6-6" stroke={CORAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const steps = [
    { step: "01", icon: <IconBolt />,    title: "Test 100 buyer queries",     body: "Every week we run 100 high-intent questions across ChatGPT, Claude, Gemini, and Perplexity — 400 AI answers per brand. Covering pricing, trust, comparison, discovery, features, integrations, and use-case fit." },
    { step: "02", icon: <IconAnalyze />, title: "Extract and score",          body: "A Claude-powered extraction layer reads every answer: brand mentions, competitor mentions, risk flags, and sentiment. A deterministic algorithm computes your AI Visibility Score and tracks it week over week." },
    { step: "03", icon: <IconReport />,  title: "Deliver your fix plan",      body: "You receive a weekly report with your score, critical alerts, competitor share-of-voice, and a P0/P1/P2 fix plan. One click signs you straight into your live dashboard." },
  ] as const;

  const features = [
    { title: "AI Visibility Score",  subtitle: "0 to 100, updated weekly",          tag: "OVERVIEW",  body: "A single number capturing how well AI models represent your brand. Four subscores: Visibility (35%), Accuracy (30%), Competitive (20%), Sentiment (15%). Tracked week over week with trend direction." },
    { title: "Competitor Share of Voice", subtitle: "Your brand vs theirs, in every run", tag: "COMPETITIVE", body: "Every query that mentions a competitor also tracks your relative presence. See exactly where AI recommends competitors over you, and the specific answers driving it." },
    { title: "Alerts",               subtitle: "Critical, High, Medium, Low",         tag: "ALERTS",    body: "Rule-based detection for fabricated pricing, wrong compliance claims, competitor displacement, and score drops. Every alert links to the exact query, model, and raw answer." },
    { title: "Fix Plan",             subtitle: "P0, P1, P2 — every week",            tag: "FIX PLAN",  body: "A Claude-generated action plan ranked by urgency. P0 covers wrong claims buyers are hearing now. P1 covers missing content. P2 covers long-term visibility strategy." },
  ] as const;

  const stats = [
    { stat: "78%",  label: "of buyers use AI to research brands and products before visiting a website",  color: CORAL },
    { stat: "43%",  label: "of AI-generated brand claims contain measurable inaccuracies",                color: "#B45309" },
    { stat: "2.3x", label: "more competitor mentions in AI answers when a brand has low visibility",       color: "#DC2626" },
  ] as const;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T1, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Nav />

      {/* ── Hero — form and radar both above the fold ── */}
      <section id="scan" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 64px" }}>

        {/* Live signal pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FBF0EB", border: "1px solid #F0D9CF", borderRadius: 99, padding: "5px 14px", marginBottom: 40 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: CORAL, display: "inline-block" }} />
          <span style={{ fontSize: 12, color: CORAL, fontWeight: 600, letterSpacing: "0.04em" }}>Live monitoring across 4 AI models</span>
        </div>

        {/* Two columns: left = headline + form, right = radar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

          {/* LEFT — headline + form */}
          <div>
            <h1 style={{ fontSize: "clamp(34px, 4.5vw, 56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", marginBottom: 18, color: T1 }}>
              Know exactly what AI<br />says about your brand.<br />
              <span style={{ color: CORAL }}>Then fix it.</span>
            </h1>
            <p style={{ fontSize: 17, color: T2, lineHeight: 1.7, marginBottom: 28, maxWidth: 440 }}>
              Buyers use ChatGPT, Claude, Gemini, and Perplexity to research brands before they visit your website. CoFi Radar tests all four every week and tells you exactly what they say.
            </p>

            {/* Trust ticks */}
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
              {["Free report in 2 minutes", "No credit card", "Any brand"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <IconCheck />
                  <span style={{ fontSize: 13, color: T2 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Free scan form — above the fold */}
            <FreeScanForm />
          </div>

          {/* RIGHT — radar */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <RadarDisk />
          </div>
        </div>
      </section>

      {/* ── Social proof strip ── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "40px 24px", background: WHITE }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 48, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: T3, fontWeight: 500 }}>Tested across the AI models your buyers use every day</span>
          {["ChatGPT", "Claude", "Gemini", "Perplexity"].map((m) => (
            <span key={m} style={{ fontSize: 15, fontWeight: 700, color: "#C8BDB7", letterSpacing: "-0.01em" }}>{m}</span>
          ))}
        </div>
      </section>

      {/* ── The Problem ── */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "88px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>The problem</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 16, maxWidth: 560, color: T1 }}>
            AI models are shaping your pipeline. You can&apos;t see it happening.
          </h2>
          <p style={{ fontSize: 17, color: T2, lineHeight: 1.7, maxWidth: 520, marginBottom: 56 }}>
            When a buyer asks ChatGPT &ldquo;What&apos;s the best tool for X?&rdquo; your brand may not appear. AI models routinely get pricing wrong, recommend competitors, and fabricate compliance claims.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {stats.map((item) => (
              <div key={item.stat} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "36px 28px", boxShadow: "0 1px 3px rgba(28,23,20,0.04)" }}>
                <p style={{ fontSize: 54, fontWeight: 800, color: item.color, letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 14 }}>{item.stat}</p>
                <p style={{ fontSize: 14, color: T2, lineHeight: 1.65 }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ borderTop: `1px solid ${BORDER}`, padding: "88px 24px", background: WHITE }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>How it works</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 64, color: T1 }}>
            Fully automated. Runs every week.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>
            {steps.map((item) => (
              <div key={item.step}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FBF0EB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 12, color: T3, fontWeight: 600, fontFamily: "monospace", letterSpacing: "0.04em" }}>Step {item.step}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: T1 }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: T2, lineHeight: 1.75 }}>{item.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 56, textAlign: "center" }}>
            <Link href="/features" style={{ fontSize: 14, color: CORAL, fontWeight: 600, textDecoration: "none" }}>
              See full feature breakdown
            </Link>
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section id="what-you-get" style={{ borderTop: `1px solid ${BORDER}`, padding: "88px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>What you get</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 56, color: T1 }}>
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {features.map((item) => (
              <div key={item.title} style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 28px", position: "relative", boxShadow: "0 1px 3px rgba(28,23,20,0.04)" }}>
                <span style={{ position: "absolute", top: 24, right: 24, fontSize: 9, color: CORAL, fontWeight: 700, letterSpacing: "0.1em", background: "#FBF0EB", padding: "4px 9px", borderRadius: 4 }}>{item.tag}</span>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6, color: T1, paddingRight: 80 }}>{item.title}</h3>
                <p style={{ fontSize: 12, color: CORAL, marginBottom: 16, fontWeight: 500 }}>{item.subtitle}</p>
                <p style={{ fontSize: 14, color: T2, lineHeight: 1.75 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ borderTop: `1px solid ${BORDER}`, padding: "88px 24px", background: WHITE }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 12, color: T1 }}>Simple. Per brand.</h2>
          <p style={{ fontSize: 17, color: T2, marginBottom: 48, maxWidth: 420 }}>Start free. Upgrade when you see the value.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 680 }}>

            {/* Free */}
            <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "32px 28px" }}>
              <p style={{ fontSize: 14, color: T3, fontWeight: 500, marginBottom: 6 }}>Free</p>
              <div style={{ fontSize: 40, fontWeight: 800, color: T1, letterSpacing: "-0.03em", marginBottom: 20 }}>$0</div>
              <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {["One-time brand scan", "10 queries (ChatGPT + Claude)", "Visibility score + top findings", "No credit card required"].map((f) => (
                  <li key={f} style={{ fontSize: 14, color: T2, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <IconCheck />{f}
                  </li>
                ))}
              </ul>
              <a href="#scan" style={{ display: "block", textAlign: "center", padding: "12px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", color: CORAL, border: `1.5px solid #E8C4B0`, background: "transparent" }}>
                Get free report
              </a>
            </div>

            {/* Monthly $999 */}
            <div style={{ background: WHITE, border: "1.5px solid #E8C4B0", borderRadius: 14, padding: "32px 28px", boxShadow: "0 0 0 1px #E8C4B0, 0 8px 32px rgba(201,100,66,0.10)" }}>
              <p style={{ fontSize: 14, color: T3, fontWeight: 500, marginBottom: 6 }}>Monthly</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800, color: CORAL, letterSpacing: "-0.03em" }}>$999</span>
                <span style={{ fontSize: 14, color: T3 }}>/mo</span>
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: T3 }}>Cancel anytime</p>
              <ul style={{ margin: "0 0 28px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "100 queries x 4 models — 400 AI answers/week",
                  "Full dashboard + evidence explorer",
                  "Competitor share-of-voice",
                  "Alerts + fix plan (P0/P1/P2)",
                  "Magic link login, no passwords",
                ].map((f) => (
                  <li key={f} style={{ fontSize: 14, color: T2, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <IconCheck />{f}
                  </li>
                ))}
              </ul>
              <Link href="/api/stripe/checkout?plan=monthly" style={{ display: "block", textAlign: "center", padding: "13px 0", borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: "none", color: WHITE, background: CORAL }}>
                Start monitoring
              </Link>
            </div>
          </div>

          <p style={{ marginTop: 24, fontSize: 13, color: T3 }}>
            Questions?{" "}
            <Link href="/pricing" style={{ color: CORAL, textDecoration: "none", fontWeight: 600 }}>See full pricing details and FAQ</Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
