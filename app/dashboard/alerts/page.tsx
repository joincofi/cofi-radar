import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AlertList } from "@/components/AlertList";
import type { Alert } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  const brandId = (session as { brandId?: string } | null)?.brandId;
  if (!brandId && process.env.NODE_ENV !== "development") redirect("/auth/signin");

  let alerts: Alert[] = [];
  try {
    const resolvedId = brandId ?? (await prisma.brand.findFirst({ select: { id: true } }))?.id;
    if (resolvedId) {
      alerts = await prisma.alert.findMany({
        where: { brandId: resolvedId },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch { /* no DB */ }

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...alerts].sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );
  const counts = {
    critical: alerts.filter((a) => a.severity === "critical").length,
    high: alerts.filter((a) => a.severity === "high").length,
    medium: alerts.filter((a) => a.severity === "medium").length,
    low: alerts.filter((a) => a.severity === "low").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Alerts</h1>
        <p className="text-sm text-gray-500">All detected issues sorted by severity.</p>
      </div>
      <div className="flex gap-3 flex-wrap">
        {Object.entries(counts).map(([severity, count]) =>
          count > 0 ? (
            <div key={severity} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              severity === "critical" ? "bg-red-50 text-red-700 border-red-200"
              : severity === "high" ? "bg-orange-50 text-orange-700 border-orange-200"
              : severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-gray-50 text-gray-600 border-gray-200"
            }`}>
              <span className="uppercase tracking-wider">{severity}</span>
              <span className="font-bold">{count}</span>
            </div>
          ) : null
        )}
        {alerts.length === 0 && <p className="text-sm text-gray-400">No alerts detected yet.</p>}
      </div>
      <AlertList alerts={sorted} />
    </div>
  );
}
