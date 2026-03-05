import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { Recommendation } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  const brandId = (session as { brandId?: string } | null)?.brandId;
  if (!brandId && process.env.NODE_ENV !== "development") redirect("/auth/signin");

  let recs: Recommendation[] = [];
  try {
    const resolvedId = brandId ?? (await prisma.brand.findFirst({ select: { id: true } }))?.id;
    if (resolvedId) {
      recs = await prisma.recommendation.findMany({
        where: { brandId: resolvedId },
        orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      });
    }
  } catch { /* no DB */ }

  const p0 = recs.filter((r) => r.priority === "p0");
  const p1 = recs.filter((r) => r.priority === "p1");
  const p2 = recs.filter((r) => r.priority === "p2");

  const Group = ({ title, description, items }: { title: string; description: string; items: typeof recs }) =>
    items.length > 0 ? (
      <section>
        <div className="mb-3">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="space-y-3">
          {items.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)}
        </div>
      </section>
    ) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Fix Plan</h1>
        <p className="text-sm text-gray-500">AI-generated recommendations prioritized by business impact.</p>
      </div>
      {recs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Recommendations appear after the first weekly run completes.</p>
      ) : (
        <>
          <Group title="🔴 P0 — Fix This Week" description="Wrong or fabricated claims about pricing, policy, or security." items={p0} />
          <Group title="🟠 P1 — Fix Soon" description="Missing content causing you to lose comparison and discovery queries." items={p1} />
          <Group title="🟡 P2 — Longer-Term" description="Visibility improvements that compound over time." items={p2} />
        </>
      )}
    </div>
  );
}
