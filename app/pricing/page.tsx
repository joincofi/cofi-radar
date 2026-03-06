// CoFi Radar — Pricing page
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
  title: "Pricing — CoFi Radar",
  description: "Simple per-brand pricing. Start free. Upgrade when you see the value.",
};

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M2.5 7.5l3 3 6-6" stroke={CORAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ padding: "28px 0", borderTop: `1px solid ${BORDER}` }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T1, marginBottom: 10 }}>{q}</h3>
      <p style={{ fontSize: 14, color: T2, lineHeight: 1.75 }}>{a}</p>
    </div>
  );
}

export default function PricingPage() {
  const monitoringFeatures = [
    "100 AI queries x 4 models weekly — 400 answers",
    "Full dashboard + evidence explorer",
    "Competitor share-of-voice in every run",
    "Alerts — 7 types, all severities",
    "Fix plan (P0/P1/P2) generated every week",
    "Magic link login, no passwords",
    "Weekly email report with one-click dashboard access",
    "Works for any brand in any industry",
  ];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: T1, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Nav />

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 24px 80px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Pricing</p>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 16, color: T1 }}>
          Simple. Per brand. No surprises.
        </h1>
        <p style={{ fontSize: 18, color: T2, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
          Start with a free report. Upgrade to full weekly monitoring when you&apos;re ready to track and fix your AI presence.
        </p>
      </section>

      {/* Pricing cards */}
      <section style={{ padding: "0 24px 88px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Free */}
          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: "36px 28px", boxShadow: "0 1px 4px rgba(28,23,20,0.05)" }}>
            <p style={{ fontSize: 12, color: T3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Free</p>
            <div style={{ fontSize: 48, fontWeight: 800, color: T1, letterSpacing: "-0.035em", lineHeight: 1, marginBottom: 6 }}>$0</div>
            <p style={{ fontSize: 13, color: T3, marginBottom: 28 }}>One-time scan, no account</p>
            <ul style={{ margin: "0 0 32px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "One-time brand scan",
                "10 AI queries (ChatGPT + Claude)",
                "AI Visibility Score snapshot",
                "Top findings and risk flags",
                "No credit card required",
              ].map((f) => (
                <li key={f} style={{ fontSize: 14, color: T2, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <IconCheck />{f}
                </li>
              ))}
            </ul>
            <a href="/#scan" style={{ display: "block", textAlign: "center", padding: "13px 0", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", color: CORAL, border: `1.5px solid #E8C4B0`, background: "transparent" }}>
              Get free report
            </a>
          </div>

          {/* Monthly $199 */}
          <div style={{ background: WHITE, border: "1.5px solid #E8C4B0", borderRadius: 16, padding: "36px 28px", boxShadow: "0 0 0 1px #E8C4B0, 0 8px 32px rgba(201,100,66,0.10)" }}>
            <p style={{ fontSize: 12, color: T3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Monthly</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 48, fontWeight: 800, color: CORAL, letterSpacing: "-0.035em", lineHeight: 1 }}>$199</span>
              <span style={{ fontSize: 15, color: T3 }}>/ month</span>
            </div>
            <p style={{ fontSize: 13, color: T3, marginBottom: 28 }}>Billed monthly, cancel anytime</p>
            <ul style={{ margin: "0 0 32px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
              {monitoringFeatures.map((f) => (
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

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: T3 }}>
          Need multiple brands?{" "}
          <a href="mailto:hello@cofiradar.com" style={{ color: CORAL, textDecoration: "none", fontWeight: 600 }}>Get in touch</a>
          {" "}for volume pricing.
        </p>
      </section>

      {/* FAQ */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>FAQ</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 8, color: T1 }}>Common questions</h2>

          <FaqItem
            q="What counts as one brand?"
            a="One brand is one domain. If you have multiple products on different domains, each domain is a separate brand. Contact us for volume pricing if you need to monitor more than three."
          />
          <FaqItem
            q="Does it work for any type of brand?"
            a="Yes. CoFi Radar works for any brand that has competition and customers who research online. This includes B2B SaaS, consumer apps, e-commerce brands, professional services, hospitality, retail, and more. The query generation is fully tailored to your brand, industry, and competitors."
          />
          <FaqItem
            q="How often does monitoring run?"
            a="Your brand is tested every week. You receive a weekly email report with your score, alerts, and fix plan. The dashboard is updated after each run with the latest 400 AI answers."
          />
          <FaqItem
            q="What is the refund policy?"
            a="Monthly plans do not include refunds for the current billing period, but you can cancel anytime. Your subscription stays active until the end of the period you paid for, then stops. There is a 48-hour grace period after initial signup where a full refund is issued automatically if requested."
          />
          <FaqItem
            q="Which AI models are tested?"
            a="Every weekly run tests ChatGPT (GPT-4o), Claude (Sonnet), Google Gemini (1.5 Pro), and Perplexity (Sonar). These are the four AI models that buyers use most for brand and product research."
          />
          <FaqItem
            q="How do I access my dashboard?"
            a="Your weekly email includes a one-click login link. You can also sign in at any time from the Sign in page using your email address — we send a magic link, no password needed."
          />
          <FaqItem
            q="Can I cancel anytime?"
            a="Yes. You can cancel your subscription at any time from your billing portal, accessible from your dashboard. Cancellation stops the next billing cycle. You keep access until the current period ends."
          />
          <FaqItem
            q="What does 'competitor share of voice' mean?"
            a="Every week, some of your 100 queries are comparison and discovery queries that mention competitors. We track how often your brand appears vs your competitors across those answers and calculate your share of voice — the percentage of relevant AI answers where you're mentioned."
          />
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: "80px 24px", background: WHITE, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, color: T1 }}>
            Not sure yet? Start free.
          </h2>
          <p style={{ fontSize: 16, color: T2, lineHeight: 1.7, marginBottom: 32 }}>
            Get your AI Visibility Score in 2 minutes. No credit card, no account. See your results first, then decide.
          </p>
          <a href="/#scan" style={{ display: "inline-block", fontSize: 15, fontWeight: 700, color: WHITE, background: CORAL, padding: "14px 36px", borderRadius: 8, textDecoration: "none" }}>
            Get free report
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
