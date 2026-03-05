import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ScoreCard } from "@/components/ScoreCard";
import { SubscoreGrid } from "@/components/SubscoreGrid";
import { SparklineChart } from "@/components/SparklineChart";
import { AlertList } from "@/components/AlertList";
import { RecommendationCard } from "@/components/RecommendationCard";
import Link from "next/link";
import type { Alert, Recommendation } from "@prisma/client";

export const dynamic = "force-dynamic";

// ─── Mock data for dev preview (no DB required) ───────────────────────────────
const MOCK_SCORE = {
  scoreTotal: 61, scoreVisibility: 54, scoreAccuracy: 78,
  scoreCompetitive: 67, scoreSentiment: 60, createdAt: new Date("2025-01-05"),
};
const MOCK_PREV = {
  scoreTotal: 48, scoreVisibility: 40, scoreAccuracy: 82,
  scoreCompetitive: 55, scoreSentiment: 52,
};
const MOCK_SPARKLINE = [
  { week: "Oct 6",  score: 34 }, { week: "Oct 13", score: 39 },
  { week: "Oct 20", score: 37 }, { week: "Oct 27", score: 42 },
  { week: "Nov 3",  score: 45 }, { week: "Nov 10", score: 41 },
  { week: "Nov 17", score: 44 }, { week: "Nov 24", score: 50 },
  { week: "Dec 1",  score: 47 }, { week: "Dec 8",  score: 53 },
  { week: "Dec 15", score: 48 }, { week: "Jan 5",  score: 61 },
];
const MOCK_ALERTS = [
  { id: "a1", brandId: "mock", severity: "critical", type: "misinformation",
    message: 'ChatGPT states Acme costs "$29/user/month" — actual pricing starts at $49',
    evidence: { query: "How much does Acme cost?", model: "ChatGPT",
      answerSnippet: "Acme offers pricing starting at $29 per user per month with a 14-day free trial." },
    status: "queued", createdAt: new Date() },
  { id: "a2", brandId: "mock", severity: "high", type: "competitor_displacement",
    message: "Competitors mentioned in 68% of queries where brand is absent",
    evidence: { detail: "34 of 50 brand-absent queries mention Asana or Monday.com" },
    status: "queued", createdAt: new Date() },
  { id: "a3", brandId: "mock", severity: "medium", type: "missing_in_category",
    message: "Brand mentioned in only 27% of discovery queries",
    evidence: { detail: "Acme appeared in 8 of 30 discovery-intent AI answers" },
    status: "queued", createdAt: new Date() },
] as unknown as Alert[];
const MOCK_RECS = [
  { id: "r1", runId: "mock", brandId: "mock", priority: "p0",
    title: "Fix incorrect pricing claim across all AI models",
    rationale: 'ChatGPT stated "$29/user/month" in response to "How much does Acme cost?" — actual pricing is $49/user/month.',
    exactActions: ["Publish a dedicated /pricing page with exact per-seat cost", "Add JSON-LD PriceSpecification schema markup", "Create an FAQ addressing pricing directly"],
    expectedImpact: "Correct pricing surfaced within 4–6 weeks of indexing", createdAt: new Date() },
  { id: "r2", runId: "mock", brandId: "mock", priority: "p1",
    title: "Create comparison pages to win displacement queries",
    rationale: "Acme absent in 68% of queries where Asana or Monday.com appear — no comparison content exists.",
    exactActions: ["Build /acme-vs-asana and /acme-vs-monday landing pages", "Include feature-by-feature table with verifiable claims", "Add customer quotes addressing the switch"],
    expectedImpact: "15–25 point improvement in Competitive subscore over 8 weeks", createdAt: new Date() },
  { id: "r3", runId: "mock", brandId: "mock", priority: "p2",
    title: "Publish authoritative industry overview content",
    rationale: "Acme appears in only 27% of category-level discovery queries.",
    exactActions: ["Write a 2,000-word 'State of Project Management Software' guide", "Cite third-party research and include Acme's perspective", "Distribute via LinkedIn and press for inbound links"],
    expectedImpact: "Compound visibility gains over 3–4 months", createdAt: new Date() },
] as unknown as Recommendation[];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions).catch(() => null);
  const brandId = (session as { brandId?: string } | null)?.brandId;

  let useMock = false;
  let brandName = "Acme";
  let latestScore: typeof MOCK_SCORE | null = null;
  let previousScore: typeof MOCK_PREV | null = null;
  let alerts: Alert[] = MOCK_ALERTS;
  let recommendations: Recommendation[] = MOCK_RECS;
  let sparklineData = MOCK_SPARKLINE;

  try {
    const resolvedBrandId = brandId ?? (await prisma.brand.findFirst({ select: { id: true } }))?.id;
    if (!resolvedBrandId) throw new Error("no brand");
    const [liveBrand, liveLatest, livePrevList, liveAlerts, liveRecs, liveHistory] =
      await Promise.all([
        prisma.brand.findUniqueOrThrow({ where: { id: resolvedBrandId } }),
        prisma.score.findFirst({ where: { brandId: resolvedBrandId }, orderBy: { createdAt: "desc" } }),
        prisma.score.findMany({ where: { brandId: resolvedBrandId }, orderBy: { createdAt: "desc" }, skip: 1, take: 1 }),
        prisma.alert.findMany({ where: { brandId: resolvedBrandId, status: "queued" }, orderBy: { createdAt: "desc" }, take: 3 }),
        prisma.recommendation.findMany({ where: { brandId: resolvedBrandId }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }], take: 3 }),
        prisma.score.findMany({ where: { brandId: resolvedBrandId }, orderBy: { createdAt: "asc" }, take: 12 }),
      ]);
    brandName = liveBrand.name;
    latestScore = liveLatest;
    previousScore = livePrevList[0] ?? null;
    alerts = liveAlerts;
    recommendations = liveRecs;
    sparklineData = liveHistory.map((s) => ({
      week: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: s.scoreTotal,
    }));
  } catch {
    useMock = true;
    latestScore = MOCK_SCORE;
    previousScore = MOCK_PREV as typeof MOCK_PREV;
  }

  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedAlerts = [...alerts].sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  if (!latestScore) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{brandName}</h1>
        <p className="text-gray-500 mb-4">No runs completed yet.</p>
        <p className="text-sm text-gray-400">
          Trigger a run via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">POST /api/run</code>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {useMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>Preview mode — showing sample data. Connect a database and run <code className="bg-amber-100 px-1 rounded text-xs">npm run db:seed</code> to see live data.</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{brandName} · AI Visibility Dashboard</h1>
        <span className="text-xs text-gray-400">
          Last updated {new Date(latestScore.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
      <ScoreCard score={latestScore.scoreTotal} previousScore={previousScore?.scoreTotal ?? null} brandName={brandName} />
      <SubscoreGrid
        visibility={latestScore.scoreVisibility} accuracy={latestScore.scoreAccuracy}
        competitive={latestScore.scoreCompetitive} sentiment={latestScore.scoreSentiment}
        prevVisibility={previousScore?.scoreVisibility ?? null} prevAccuracy={previousScore?.scoreAccuracy ?? null}
        prevCompetitive={previousScore?.scoreCompetitive ?? null} prevSentiment={previousScore?.scoreSentiment ?? null}
      />
      <SparklineChart data={sparklineData} />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Active Alerts</h2>
          <Link href="/dashboard/alerts" className="text-xs text-brand-500 hover:underline">View all →</Link>
        </div>
        <AlertList alerts={sortedAlerts} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Top Fixes</h2>
          <Link href="/dashboard/recommendations" className="text-xs text-brand-500 hover:underline">View all →</Link>
        </div>
        <div className="space-y-3">
          {recommendations.map((rec) => <RecommendationCard key={rec.id} rec={rec} />)}
        </div>
      </div>
    </div>
  );
}
