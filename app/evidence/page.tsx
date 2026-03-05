import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EvidenceExplorer } from "@/components/EvidenceExplorer";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const session = await getServerSession(authOptions);
  if (!session?.brandId) redirect("/auth/signin");

  // Get responses from the most recent completed run
  const latestRun = await prisma.run.findFirst({
    where: { brandId: session.brandId, status: "done" },
    orderBy: { createdAt: "desc" },
  });

  const responses = latestRun
    ? await prisma.response.findMany({
        where: { runId: latestRun.id },
        include: {
          extraction: true,
          query: true,
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Evidence Explorer</h1>
        <p className="text-sm text-gray-500">
          Every question asked, every AI answer, full extracted data.
          {latestRun && (
            <span className="ml-2 text-gray-400">
              Run from{" "}
              {new Date(latestRun.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </p>
      </div>

      {responses.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">
            No evidence yet — trigger a run via{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              POST /api/run
            </code>
          </p>
        </div>
      ) : (
        <EvidenceExplorer responses={responses} />
      )}
    </div>
  );
}
