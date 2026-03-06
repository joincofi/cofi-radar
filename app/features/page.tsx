// CoFi Radar — Features page
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
  title: "Features — CoFi Radar",
  description: "Automated AI visibility monitoring across ChatGPT, Claude, Gemini, and Perplexity. Full feature breakdown.",
};

function Tag({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 10, color: CORAL, fontWeight: 700, letterSpacing: "0.1em", background: "#FBF0EB", padding: "4px 10px", borderRadius: 4, display: "inline-block" }}>
      {label}
    </span>
  );
}

function FeatureRow({
  tag, title, subtitle, body, bullets, reverse = false,
}: {
  tag: string; title: string; subtitle: string; body: string;
  bullets: string[]; reverse?: boolean;
}) {
  return (
    <div style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start", direction: reverse ? "rtl" : "ltr" }}>
      <div style={{ direction: "ltr" }}>
        <Tag label={tag} />
        <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, marginTop: 16, marginBottom: 10, color: T1 }}>{title}</h2>
        <p style={{ fontSize: 13, color: CORAL, fontWeight: 500, marginBottom: 20 }}>{subtitle}</p>
        <p style={{ fontSize: 16, color: T2, lineHeight: 1.75, marginBottom: 28 }}>{body}</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
          {bullets.map((b) => (
            <li key={b} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: T2, lineHeight: 1.6 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M2.5 7.5l3 3 6-6" stroke={CORAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ direction: "ltr" }}>
        {/* Visual placeholder — dark mockup card */}
        <div style={{ background: "#12100E", borderRadius: 14, padding: "32px", border: "1px solid #2A2320", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 20 }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3A3330", display: "inline-block" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3A3330", display: "inline-block" }} />
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#3A3330", display: "inline-block" }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: "#4A4540", fontFamily: "monospace" }}>cofiradar / {tag.toLowerCase().replace(/\s/g, "-")}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {bullets.slice(0, 3).map((b, i) => (
              <div key={b} style={{ background: "#1A1715", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: i === 0 ? CORAL : "#3A3330", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#7A6E68" }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: T1, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Nav />

      {/* Hero */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "88px 24px 0" }}>
        <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Features</p>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.08, marginBottom: 20, maxWidth: 700, color: T1 }}>
          Complete AI visibility intelligence, automated.
        </h1>
        <p style={{ fontSize: 18, color: T2, lineHeight: 1.7, maxWidth: 560, marginBottom: 40 }}>
          CoFi Radar runs 120 AI queries against your brand every week and delivers everything you need to understand and improve your AI presence.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Link href="/#scan" style={{ fontSize: 14, fontWeight: 700, color: WHITE, background: CORAL, padding: "12px 28px", borderRadius: 8, textDecoration: "none" }}>
            Get free report
          </Link>
          <Link href="/pricing" style={{ fontSize: 14, fontWeight: 600, color: CORAL, padding: "12px 28px", borderRadius: 8, textDecoration: "none", border: `1.5px solid #E8C4B0` }}>
            See pricing
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ borderTop: `1px solid ${BORDER}`, marginTop: 80, padding: "40px 24px", background: WHITE }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {[
            { value: "120",   label: "AI queries per brand per week"  },
            { value: "4",     label: "AI models tested every run"     },
            { value: "7",     label: "alert types tracked"            },
            { value: "P0/P1/P2", label: "action plan, every week"    },
          ].map((item) => (
            <div key={item.value} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: CORAL, letterSpacing: "-0.03em", lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: 13, color: T2, marginTop: 8 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature rows */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>

        <FeatureRow
          tag="AI TESTING"
          title="30 buyer queries. 4 AI models. Every Sunday."
          subtitle="120 API calls per brand, every week"
          body="We build 30 questions tailored to your brand: pricing queries, competitor comparisons, trust and compliance questions, and category discovery. Then we run all of them across ChatGPT (GPT-4o), Claude (Sonnet), Gemini 1.5 Pro, and Perplexity Sonar."
          bullets={[
            "30 queries across 5 intent types: pricing, trust, comparison, discovery, and compliance",
            "Tests ChatGPT, Claude, Gemini, and Perplexity in the same weekly run",
            "Queries are personalized to your brand, domain, industry, and competitors",
            "Fully automated, zero configuration required after setup",
          ]}
        />

        <FeatureRow
          tag="SCORING"
          title="AI Visibility Score. One number that tracks your presence."
          subtitle="Deterministic algorithm, 0 to 100"
          body="A single composite score built from four dimensions. Weighted to reflect what matters most for B2B pipeline impact. Compared against your previous week's score to show direction and velocity."
          reverse
          bullets={[
            "Visibility (35%) — how often your brand appears in relevant queries",
            "Accuracy (30%) — whether claims, pricing, and features are correct",
            "Competitive (20%) — your presence relative to competitor mentions",
            "Sentiment (15%) — the tone AI models use when describing you",
            "Weekly delta shows you whether you're improving or declining",
          ]}
        />

        <FeatureRow
          tag="ALERTS"
          title="Seven alert types. Automatic. No configuration."
          subtitle="Critical, High, Medium, and Low severity"
          body="Rule-based detection fires immediately when something goes wrong. Every alert is linked back to the exact query, model, and raw AI answer so you know exactly where the problem is."
          bullets={[
            "Fabricated pricing: AI states incorrect pricing for your product",
            "Wrong compliance claims: incorrect security or certification claims",
            "Competitor displacement: competitor recommended instead of you",
            "Brand not mentioned: completely absent from a high-intent query",
            "Negative sentiment: AI describes your brand negatively",
            "Score drop alert: weekly score falls more than 10 points",
            "Risk flag spike: sudden increase in high-risk answer content",
          ]}
        />

        <FeatureRow
          tag="FIX PLAN"
          title="Prioritized actions. Not just observations."
          subtitle="P0 critical, P1 high impact, P2 long term"
          body="After every run, Claude reads all 120 extracted answers and generates a prioritized action plan. P0 items are wrong things AI is telling buyers right now. P1 covers missing content. P2 covers long-term visibility strategy."
          reverse
          bullets={[
            "P0: Wrong claims that buyers are hearing now. Fix these first.",
            "P1: Missing pages, data sources, and content opportunities.",
            "P2: Strategic positioning improvements for long-term visibility.",
            "Each recommendation includes the reasoning and suggested action.",
            "New plan generated every week as your AI presence evolves.",
          ]}
        />

        <FeatureRow
          tag="EVIDENCE"
          title="Every answer. Every extraction. Fully searchable."
          subtitle="120 answers per week, filterable by model, intent, and risk"
          body="The Evidence Explorer shows you the raw data behind every score and alert. Filter by model, query intent, or risk severity. Click any row to see the full AI answer and every data point extracted from it."
          bullets={[
            "Filter by AI model: ChatGPT, Claude, Gemini, Perplexity",
            "Filter by intent: pricing, comparison, trust, discovery, compliance",
            "Filter by risk severity: critical, high, medium, low",
            "Expand any row to see the full raw AI answer",
            "Extracted fields: brand mentioned, rank, sentiment, competitor mentions, risk flags",
          ]}
        />
      </div>

      <Footer />
    </div>
  );
}
