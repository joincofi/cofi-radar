// CoFi Radar — About page
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
  title: "About — CoFi Radar",
  description: "Why we built CoFi Radar, what we believe, and how it works.",
};

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "28px 24px" }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: T1, marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 14, color: T2, lineHeight: 1.75 }}>{body}</p>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", background: BG, color: T1, fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <Nav />

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "88px 24px 80px" }}>
        <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>About</p>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 24, color: T1 }}>
          We built the tool we needed ourselves.
        </h1>
        <p style={{ fontSize: 19, color: T2, lineHeight: 1.75 }}>
          CoFi Radar exists because AI models became the first stop for B2B software research, and brands had no visibility into what was being said about them.
        </p>
      </section>

      {/* Origin story */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 24px", background: WHITE }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>The origin</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 32, color: T1 }}>
            AI changed how buyers research software. Nobody noticed in time.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, fontSize: 16, color: T2, lineHeight: 1.8 }}>
            <p>
              A few years ago, getting your brand into the conversation meant SEO and review sites. You could audit your ranking, track your mentions, and measure your share of voice. The tools were mature. The playbook was known.
            </p>
            <p>
              Then buyers started asking ChatGPT. Then Claude. Then Perplexity. And suddenly the question &ldquo;what is the best project management tool for a remote team?&rdquo; was being answered by a language model, not a search engine, and the answer often had nothing to do with who had the best SEO.
            </p>
            <p>
              We watched AI models state wrong pricing, describe deprecated features as current, recommend competitors in categories where the brand clearly led, and in some cases fabricate compliance certifications entirely. And the brands had no idea.
            </p>
            <p>
              CoFi Radar was built to close that gap. Automated. Weekly. With a score you can track, alerts that fire the moment something goes wrong, and a specific action plan to fix it.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Mission</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 24, color: T1 }}>
            Give every B2B brand complete visibility into how AI represents them.
          </h2>
          <p style={{ fontSize: 16, color: T2, lineHeight: 1.8, marginBottom: 32 }}>
            We believe that accuracy in AI-generated content is not just a marketing problem. It is a buyer trust problem. When AI tells a buyer your product costs twice what it does, or is missing a compliance certification you actually have, that buyer may never reach your website. You never know the sale was lost.
          </p>
          <p style={{ fontSize: 16, color: T2, lineHeight: 1.8 }}>
            Our mission is to make AI brand visibility as measurable, trackable, and improvable as any other marketing channel.
          </p>
        </div>
      </section>

      {/* Values */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 24px", background: WHITE }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Values</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 40, color: T1 }}>
            How we operate.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <ValueCard
              title="Accuracy over volume"
              body="We would rather surface five genuinely important findings per week than flood you with noise. Every alert is tested against a ruleset designed to minimize false positives."
            />
            <ValueCard
              title="Automation over configuration"
              body="CoFi Radar runs without manual input. You set it up once with your domain and email. It handles everything else, every week, without reminders or logins."
            />
            <ValueCard
              title="Specificity over generality"
              body="Vague advice is worse than no advice. Every fix plan recommendation includes the specific query, the specific AI answer that triggered it, and the specific action to take."
            />
            <ValueCard
              title="Transparency in our own product"
              body="We use AI to generate recommendations and run your tests. We document exactly which models we use, how we score, and what every number means. No black boxes."
            />
          </div>
        </div>
      </section>

      {/* How it is built */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <p style={{ fontSize: 11, color: CORAL, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>How it is built</p>
          <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.2, marginBottom: 32, color: T1 }}>
            AI infrastructure, tested on itself.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32, fontSize: 14, color: T2 }}>
            <div>
              <p style={{ fontWeight: 700, color: T1, marginBottom: 10 }}>Models we test</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, lineHeight: 1.65 }}>
                <li>OpenAI GPT-4o</li>
                <li>Anthropic Claude Sonnet</li>
                <li>Google Gemini 1.5 Pro</li>
                <li>Perplexity Sonar</li>
              </ul>
            </div>
            <div>
              <p style={{ fontWeight: 700, color: T1, marginBottom: 10 }}>Models we use to analyze</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, lineHeight: 1.65 }}>
                <li>Claude Haiku for intent classification</li>
                <li>Claude Sonnet for answer extraction and fix plans</li>
                <li>Deterministic algorithm for scoring</li>
                <li>Rule-based engine for alert detection</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section style={{ borderTop: `1px solid ${BORDER}`, padding: "80px 24px", background: WHITE }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 16, color: T1 }}>
            Questions or feedback?
          </h2>
          <p style={{ fontSize: 16, color: T2, lineHeight: 1.7, marginBottom: 32 }}>
            We read every email. If you have a question about CoFi Radar, a feature request, or feedback on your report, reach out directly.
          </p>
          <a
            href="mailto:support@cofiradar.com"
            style={{ display: "inline-block", fontSize: 15, fontWeight: 700, color: WHITE, background: CORAL, padding: "14px 32px", borderRadius: 8, textDecoration: "none", marginBottom: 16 }}
          >
            Get in touch
          </a>
          <p style={{ fontSize: 14, color: T3 }}>
            Or{" "}
            <Link href="/#scan" style={{ color: CORAL, textDecoration: "none", fontWeight: 600 }}>get a free report</Link>
            {" "}to see what AI says about your brand today.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
