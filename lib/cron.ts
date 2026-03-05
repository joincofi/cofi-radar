import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import { weeklyRun } from "@/lib/jobs/weeklyRun";
import { sendOpsDigest } from "@/lib/email/opsDigest";

let initialized = false;

export function initCron(): void {
  if (initialized) return;
  initialized = true;

  // ── Sunday 3:00 AM — all brands in parallel ────────────────────────────────
  cron.schedule(
    "0 3 * * 0",
    async () => {
      console.log("[cron] Weekly run triggered —", new Date().toISOString());

      const brands = await prisma.brand.findMany({
        where: { status: "active" },  // skip cancelled / past_due
        select: { id: true, name: true },
      });

      console.log(`[cron] Running ${brands.length} brands in parallel`);

      // Fire all runs concurrently — each brand is independent
      const results = await Promise.allSettled(
        brands.map((brand) =>
          weeklyRun(brand.id).then(() => ({ brand: brand.name, status: "ok" as const }))
        )
      );

      const successes = results.filter((r) => r.status === "fulfilled").length;
      const failures  = results.filter((r) => r.status === "rejected").length;

      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(`[cron] Run failed for ${brands[i].name}:`, r.reason);
        }
      });

      console.log(`[cron] Weekly runs complete: ${successes} ok, ${failures} failed`);
    },
    { timezone: "America/Toronto" }
  );

  // ── Monday 7:00 AM — ops digest to owner ──────────────────────────────────
  cron.schedule(
    "0 7 * * 1",
    async () => {
      console.log("[cron] Sending ops digest");
      sendOpsDigest().catch((err) => console.error("[cron] Ops digest failed:", err));
    },
    { timezone: "America/Toronto" }
  );

  console.log("[cron] Scheduled: Sunday 3am weekly runs (parallel) + Monday 7am ops digest");
}
