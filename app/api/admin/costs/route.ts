/**
 * GET /api/admin/costs
 *
 * Returns per-scan cost data aggregated from Lead records.
 * Auth: Authorization: Bearer <ADMIN_SECRET>
 *
 * Response:
 * {
 *   scans: number,
 *   totalCostUsd: number,
 *   avgCostUsd: number,
 *   minCostUsd: number,
 *   maxCostUsd: number,
 *   recent: Lead[]   // last 50 with cost data
 * }
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "ADMIN_SECRET not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Query ─────────────────────────────────────────────────────────────────
  const leads = await prisma.lead.findMany({
    where:   { costUsd: { not: null } },
    orderBy: { scannedAt: "desc" },
    take:    50,
    select: {
      domain:     true,
      email:      true,
      score:      true,
      costUsd:    true,
      tokenUsage: true,
      scannedAt:  true,
    },
  });

  // ── Aggregate ─────────────────────────────────────────────────────────────
  const costs = leads.map((l) => l.costUsd as number);
  const scans        = costs.length;
  const totalCostUsd = costs.reduce((s, c) => s + c, 0);
  const avgCostUsd   = scans > 0 ? totalCostUsd / scans : 0;
  const minCostUsd   = scans > 0 ? Math.min(...costs) : 0;
  const maxCostUsd   = scans > 0 ? Math.max(...costs) : 0;

  // Total across ALL leads (not just last 50)
  const allLeads = await prisma.lead.aggregate({
    where: { costUsd: { not: null } },
    _sum:   { costUsd: true },
    _count: { costUsd: true },
  });

  return NextResponse.json({
    allTime: {
      scans:        allLeads._count.costUsd,
      totalCostUsd: +(allLeads._sum.costUsd ?? 0).toFixed(4),
    },
    last50: {
      scans,
      totalCostUsd: +totalCostUsd.toFixed(4),
      avgCostUsd:   +avgCostUsd.toFixed(4),
      minCostUsd:   +minCostUsd.toFixed(4),
      maxCostUsd:   +maxCostUsd.toFixed(4),
    },
    recent: leads.map((l) => ({
      domain:     l.domain,
      email:      l.email,
      score:      l.score,
      costUsd:    +(l.costUsd as number).toFixed(4),
      tokenUsage: l.tokenUsage,
      scannedAt:  l.scannedAt,
    })),
  });
}
