import Link from "next/link";

const CORAL  = "#C96442";
const T1     = "#1C1714";
const T2     = "#6B5E56";
const BORDER = "#EDE7E0";
const WHITE  = "#FFFFFF";

export default function Nav() {
  return (
    <nav style={{ borderBottom: `1px solid ${BORDER}`, background: WHITE, position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", height: 64, gap: 8 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", color: T1, textDecoration: "none" }}>
          CoFi<span style={{ color: CORAL }}>Radar</span>
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/features" style={{ fontSize: 14, color: T2, textDecoration: "none" }}>Features</Link>
          <Link href="/pricing"  style={{ fontSize: 14, color: T2, textDecoration: "none" }}>Pricing</Link>
          <Link href="/about"    style={{ fontSize: 14, color: T2, textDecoration: "none" }}>About</Link>
          <Link href="/auth/signin" style={{ fontSize: 14, color: T2, textDecoration: "none" }}>Sign in</Link>
          <Link
            href="/#scan"
            style={{ fontSize: 13, fontWeight: 600, color: WHITE, background: CORAL, padding: "9px 20px", borderRadius: 8, textDecoration: "none" }}
          >
            Free report
          </Link>
        </div>
      </div>
    </nav>
  );
}
