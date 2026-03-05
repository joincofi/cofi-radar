import Link from "next/link";

const CORAL = "#C96442";
const T1    = "#1C1714";

export default function Footer() {
  return (
    <>
      {/* Final CTA band */}
      <section style={{ padding: "100px 24px", background: T1 }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 20, color: "#FAF7F4" }}>
            Your buyers are asking AI<br />about your brand <span style={{ color: CORAL }}>right now.</span>
          </h2>
          <p style={{ fontSize: 18, color: "#9B8E85", marginBottom: 44, lineHeight: 1.65 }}>
            Find out what they&apos;re hearing. Free in 2 minutes.
          </p>
          <Link href="/#scan" style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", background: CORAL, padding: "16px 40px", borderRadius: 8, textDecoration: "none", display: "inline-block" }}>
            Get your free report
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "40px 24px", background: "#0F0D0C" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#FAF7F4", marginBottom: 12 }}>
                CoFi<span style={{ color: CORAL }}>Radar</span>
              </div>
              <p style={{ fontSize: 13, color: "#5C534B", lineHeight: 1.7, maxWidth: 260 }}>
                AI visibility intelligence for B2B brands. Know what AI says about your company. Fix what&apos;s broken.
              </p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#3D3530", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Product</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link href="/features" style={{ fontSize: 13, color: "#5C534B", textDecoration: "none" }}>Features</Link>
                <Link href="/pricing"  style={{ fontSize: 13, color: "#5C534B", textDecoration: "none" }}>Pricing</Link>
                <Link href="/#scan"    style={{ fontSize: 13, color: "#5C534B", textDecoration: "none" }}>Free report</Link>
                <Link href="/auth/signin" style={{ fontSize: 13, color: "#5C534B", textDecoration: "none" }}>Sign in</Link>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#3D3530", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Company</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link href="/about"     style={{ fontSize: 13, color: "#5C534B", textDecoration: "none" }}>About</Link>
                <Link href="/changelog" style={{ fontSize: 13, color: "#5C534B", textDecoration: "none" }}>Changelog</Link>
              </div>
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#3D3530", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Support</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a href={`mailto:${process.env.RESEND_FROM_EMAIL ?? "support@cofi-radar.com"}`} style={{ fontSize: 13, color: "#5C534B", textDecoration: "none" }}>Contact</a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #1A1715", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#3D3530" }}>© {new Date().getFullYear()} CoFi Radar. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
