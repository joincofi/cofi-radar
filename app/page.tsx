export default function ComingSoon() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#FAF7F4",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "24px",
      textAlign: "center",
    }}>
      <div style={{ marginBottom: 32 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "#1C1714", letterSpacing: "-0.03em" }}>
          CoFi<span style={{ color: "#C96442" }}>Radar</span>
        </span>
      </div>

      <h1 style={{
        fontSize: "clamp(36px, 6vw, 64px)",
        fontWeight: 800,
        color: "#1C1714",
        letterSpacing: "-0.03em",
        lineHeight: 1.1,
        marginBottom: 20,
        maxWidth: 560,
      }}>
        Something new<br />is coming.
      </h1>

      <p style={{
        fontSize: 18,
        color: "#6B5E56",
        lineHeight: 1.7,
        maxWidth: 420,
        marginBottom: 0,
      }}>
        We&apos;re working on it. Check back soon.
      </p>
    </div>
  );
}
