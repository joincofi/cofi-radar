"use client";

export default function RadarDisk() {
  const S = 400; // SVG canvas size
  const C = S / 2; // center = 200
  const R = 185; // main radius

  // 60-degree sweep arc endpoint (clockwise from 12-o'clock)
  const sweepRad = Math.PI / 3; // 60 deg
  const ex = C + R * Math.sin(sweepRad);
  const ey = C - R * Math.cos(sweepRad);

  const dots = [
    { cx: C + 80,  cy: C - 70  },
    { cx: C - 90,  cy: C + 55  },
    { cx: C + 60,  cy: C + 90  },
    { cx: C - 45,  cy: C - 105 },
    { cx: C + 125, cy: C + 25  },
  ];

  return (
    <>
      <style>{`
        @keyframes rdrFloat1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes rdrFloat2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      <div style={{ position: "relative", width: S, height: S, flexShrink: 0 }}>

        <svg
          width={S} height={S}
          viewBox={`0 0 ${S} ${S}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
        >
          <defs>
            <radialGradient id="rdrBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#1E1915" />
              <stop offset="100%" stopColor="#0C0A09" />
            </radialGradient>
            <clipPath id="rdrClip">
              <circle cx={C} cy={C} r={R} />
            </clipPath>
          </defs>

          {/* Disc */}
          <circle cx={C} cy={C} r={R} fill="url(#rdrBg)" />
          <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(201,100,66,0.2)" strokeWidth="1" />

          {/* Concentric rings */}
          {[R * 0.25, R * 0.5, R * 0.75].map((r) => (
            <circle key={r} cx={C} cy={C} r={r}
              fill="none" stroke="rgba(201,100,66,0.08)" strokeWidth="1" />
          ))}

          {/* Crosshairs */}
          <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="rgba(201,100,66,0.07)" strokeWidth="1" />
          <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="rgba(201,100,66,0.07)" strokeWidth="1" />

          {/* Rotating sweep (SMIL — no JS, works everywhere) */}
          <g clipPath="url(#rdrClip)">
            <g>
              {/* Filled sector: 12-o'clock to +60° */}
              <path
                d={`M ${C} ${C} L ${C} ${C - R} A ${R} ${R} 0 0 1 ${ex} ${ey} Z`}
                fill="rgba(201,100,66,0.10)"
              />
              {/* Bright leading edge */}
              <line
                x1={C} y1={C} x2={ex} y2={ey}
                stroke="rgba(201,100,66,0.7)" strokeWidth="1.5"
              />
              {/* Trailing edge (dimmer) */}
              <line
                x1={C} y1={C} x2={C} y2={C - R}
                stroke="rgba(201,100,66,0.15)" strokeWidth="1"
              />
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${C} ${C}`}
                to={`360 ${C} ${C}`}
                dur="5s"
                repeatCount="indefinite"
              />
            </g>
          </g>

          {/* Outward ping rings — 3 staggered */}
          {(["0s", "1.67s", "3.33s"] as const).map((begin) => (
            <circle key={begin} cx={C} cy={C} r="2"
              fill="none" stroke="rgba(201,100,66,0.5)" strokeWidth="1.5">
              <animate attributeName="r"       from="2" to={`${R}`} dur="5s" begin={begin} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.5" to="0"   dur="5s" begin={begin} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Brand dots with pulse rings */}
          {dots.map((d, i) => {
            const delay = `${(i * 0.5).toFixed(1)}s`;
            return (
              <g key={i}>
                <circle cx={d.cx} cy={d.cy} r="4" fill="#C96442">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur={`${1.8 + i * 0.25}s`} begin={delay} repeatCount="indefinite" />
                </circle>
                <circle cx={d.cx} cy={d.cy} r="4" fill="none" stroke="#C96442" strokeWidth="1">
                  <animate attributeName="r"       from="4" to="13" dur={`${1.8 + i * 0.25}s`} begin={delay} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.7" to="0" dur={`${1.8 + i * 0.25}s`} begin={delay} repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}

          {/* Center beacon */}
          <circle cx={C} cy={C} r="5" fill="#C96442" />
          <circle cx={C} cy={C} r="5" fill="none" stroke="#C96442" strokeWidth="1">
            <animate attributeName="r"       from="5" to="18" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.9" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Floating score cards */}
        <div style={{
          position: "absolute", top: 16, right: -12,
          background: "#fff", borderRadius: 10,
          padding: "10px 16px", minWidth: 148,
          boxShadow: "0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #EDE7E0",
          animation: "rdrFloat1 4s ease-in-out infinite",
        }}>
          <div style={{ fontSize: 10, color: "#9B8E85", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>AI Visibility</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#C96442", letterSpacing: "-0.025em", lineHeight: 1 }}>
            61<span style={{ fontSize: 14, fontWeight: 500, color: "#9B8E85" }}>/100</span>
          </div>
          <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 3 }}>↑ +13 this week</div>
        </div>

        <div style={{
          position: "absolute", bottom: 36, left: -12,
          background: "#fff", borderRadius: 10,
          padding: "10px 16px", minWidth: 148,
          boxShadow: "0 4px 20px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
          border: "1px solid #EDE7E0",
          animation: "rdrFloat2 4s ease-in-out 2s infinite",
        }}>
          <div style={{ fontSize: 10, color: "#9B8E85", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 3 }}>Brands tracked</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#1C1714", letterSpacing: "-0.025em", lineHeight: 1 }}>847</div>
          <div style={{ fontSize: 11, color: "#9B8E85", fontWeight: 500, marginTop: 3 }}>Across 4 AI models</div>
        </div>
      </div>
    </>
  );
}
