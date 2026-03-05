import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EvidenceExplorer } from "@/components/EvidenceExplorer";
import type { Prisma } from "@prisma/client";

type ResponseWithData = Prisma.ResponseGetPayload<{
  include: { extraction: true; query: true };
}>;

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const session = await getServerSession(authOptions).catch(() => null);
  const brandId = (session as { brandId?: string } | null)?.brandId;
  if (!brandId && process.env.NODE_ENV !== "development") redirect("/auth/signin");

  let latestRun = null;
  let responses: ResponseWithData[] = [];

  try {
    const resolvedId = brandId ?? (await prisma.brand.findFirst({ select: { id: true } }))?.id;
    if (resolvedId) {
      latestRun = await prisma.run.findFirst({
        where: { brandId: resolvedId, status: "done" },
        orderBy: { createdAt: "desc" },
      });
      if (latestRun) {
        responses = await prisma.response.findMany({
          where: { runId: latestRun.id },
          include: { extraction: true, query: true },
          orderBy: { createdAt: "asc" },
        });
      }
    }
  } catch { /* no DB */ }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Evidence Explorer</h1>
        <p className="text-sm text-gray-500">
          Every question asked, every AI answer, full extracted data.
          {latestRun && (
            <span className="ml-2 text-gray-400">
              Run from {new Date(latestRun.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}
        </p>
      </div>
      {responses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            No evidence yet — trigger a run via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">POST /api/run</code>
          </p>
        </div>
      ) : (
        <EvidenceExplorer responses={responses} />
      )}
    </div>
  );
}
