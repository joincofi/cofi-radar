"use client";

import { useState } from "react";

const CORAL  = "#C96442";
const T1     = "#1C1714";
const T2     = "#6B5E56";
const T3     = "#9B8E85";
const BORDER = "#EDE7E0";
const WHITE  = "#FFFFFF";
const BG     = "#FAF7F4";
const SHADOW = "0 1px 3px rgba(28,23,20,0.05), 0 8px 24px rgba(28,23,20,0.04)";

// SVG icon: envelope (report sent)
function IconEnvelope() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="24" height="16" rx="2.5" stroke={CORAL} strokeWidth="1.75" />
      <path d="M4 11l12 8 12-8" stroke={CORAL} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FreeScanForm() {
  const [domain,  setDomain]  = useState("");
  const [email,   setEmail]   = useState("");
  const [state,   setState]   = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res  = await fetch("/api/scan/free", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ domain, email }),
      });
      const data = await res.json() as { message?: string; error?: string };
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
      } else {
        setState("sent");
        setMessage(data.message ?? "Your report is on the way.");
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (state === "sent") {
    return (
      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "32px 28px", maxWidth: 520, boxShadow: SHADOW, textAlign: "center" }}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <IconEnvelope />
        </div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: T1 }}>Your report is running</h3>
        <p style={{ margin: 0, fontSize: 14, color: T2, lineHeight: 1.65 }}>{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "28px 24px", maxWidth: 520, boxShadow: SHADOW }}
    >
      <p style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: T1 }}>Get your free AI Visibility Report</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="text"
          required
          placeholder="yourdomain.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          style={{ width: "100%", padding: "11px 14px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: T1, background: BG, boxSizing: "border-box", outline: "none" }}
        />
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "11px 14px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 14, color: T1, background: BG, boxSizing: "border-box", outline: "none" }}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          style={{ width: "100%", padding: "13px 0", background: state === "loading" ? "#D4A090" : CORAL, color: WHITE, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: state === "loading" ? "default" : "pointer" }}
        >
          {state === "loading" ? "Scanning..." : "Get free report"}
        </button>
      </div>
      {state === "error" && (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: "#dc2626" }}>{message}</p>
      )}
      <p style={{ margin: "12px 0 0", fontSize: 12, color: T3 }}>Free forever. No credit card. Report delivered in about 2 minutes.</p>
    </form>
  );
}
