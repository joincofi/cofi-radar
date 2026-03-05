import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoFi Radar — AI Visibility Intelligence",
  description: "Find out what AI says about your brand — and fix it.",
};

// Root layout is minimal — sub-sections have their own layouts.
// / (marketing) has dark styling baked in.
// /dashboard/* uses app/dashboard/layout.tsx (nav + gray bg).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
