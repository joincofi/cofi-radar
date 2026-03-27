import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoFi Radar — Coming Soon",
  description: "Something new is coming.",
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
