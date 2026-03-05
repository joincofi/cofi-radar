import { NextRequest, NextResponse } from "next/server";
import { weeklyRun } from "@/lib/jobs/weeklyRun";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let brandId = searchParams.get("brandId");

  // If no brandId, use the first brand in the database
  if (!brandId) {
    const first = await prisma.brand.findFirst({ select: { id: true } });
    if (!first) {
      return NextResponse.json({ error: "No brands found. Run prisma db seed first." }, { status: 404 });
    }
    brandId = first.id;
  }

  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Run asynchronously so the request doesn't hang
  weeklyRun(brandId).catch((err) =>
    console.error("[api/run] weeklyRun failed:", err)
  );

  return NextResponse.json({
    message: `Run started for ${brand.name} (${brandId})`,
    brandId,
  });
}
