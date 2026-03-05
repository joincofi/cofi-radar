import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

const navLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/alerts", label: "Alerts" },
  { href: "/dashboard/recommendations", label: "Fix Plan" },
  { href: "/dashboard/evidence", label: "Evidence" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions).catch(() => null);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 h-14">
          <Link href="/" className="font-bold text-gray-900 text-sm mr-2 hover:text-brand-600 transition-colors">
            CoFi Radar
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-3">
            {session?.user?.email && (
              <span className="text-xs text-gray-400">{session.user.email}</span>
            )}
            <Link
              href="/api/auth/signout"
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
