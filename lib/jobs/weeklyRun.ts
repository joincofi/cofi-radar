import { prisma } from "@/lib/prisma";
import { callModel, type ModelName } from "@/lib/agents/testModel";
import { extractAnswer } from "@/lib/agents/extractAnswer";
import { computeScore } from "@/lib/scoring/computeScore";
import { detectAlerts } from "@/lib/alerts/detectAlerts";
import { generateRecommendations } from "@/lib/agents/generateRecs";
import { sendWeeklyEmail } from "@/lib/email/weeklyReport";
import type { Extraction } from "@prisma/client";

const MODELS: ModelName[] = ["ChatGPT", "Claude", "Gemini", "Perplexity"];

function hydrateQuery(
  text: string,
  brand: { name: string; competitorDomains: string[]; industry: string }
): string {
  const competitor = brand.competitorDomains[0] ?? "a competitor";
  return text
    .replace(/\{brand\}/g, brand.name)
    .replace(/\{competitor\}/g, competitor)
    .replace(/\{industry\}/g, brand.industry);
}

async function getPreviousScore(brandId: string, currentRunId: string) {
  const score = await prisma.score.findFirst({
    where: {
      brandId,
      run: { id: { not: currentRunId }, status: "done" },
    },
    orderBy: { createdAt: "desc" },
  });
  return score;
}

export async function weeklyRun(brandId: string): Promise<void> {
  console.log(`[weeklyRun] Starting run for brand ${brandId}`);

  // Step 1: Create run row
  const run = await prisma.run.create({
    data: { brandId, status: "running", startedAt: new Date() },
  });

  try {
    // Step 2: Load brand + queries
    const brand = await prisma.brand.findUniqueOrThrow({
      where: { id: brandId },
    });
    const queries = await prisma.query.findMany({ where: { active: true } });

    console.log(
      `[weeklyRun] Testing ${queries.length} queries × ${MODELS.length} models = ${queries.length * MODELS.length} API calls`
    );

    // Step 3 + 4: Query each model and extract
    for (const query of queries) {
      for (const modelName of MODELS) {
        const hydratedText = hydrateQuery(query.text, brand);

        let answer = "";
        try {
          answer = await callModel(modelName, hydratedText);
        } catch (err) {
          console.error(`[weeklyRun] callModel failed (${modelName}): ${err}`);
          answer = "[Model call failed]";
        }

        const response = await prisma.response.create({
          data: {
            runId: run.id,
            brandId,
            queryId: query.id,
            modelName,
            prompt: hydratedText,
            rawAnswer: answer,
          },
        });

        let extractionData;
        try {
          extractionData = await extractAnswer(response, brand);
        } catch {
          extractionData = {
            brandMentioned: false,
            mentionRank: null,
            sentiment: "neutral" as const,
            competitorMentions: [],
            claims: [],
            riskFlags: [],
            confidence: 0,
          };
        }

        await prisma.extraction.create({
          data: { responseId: response.id, ...extractionData },
        });
      }
    }

    // Step 5: Compute score (deterministic)
    const extractions = await prisma.extraction.findMany({
      where: { response: { runId: run.id } },
      include: { response: { select: { prompt: true, modelName: true, rawAnswer: true } } },
    });
    const score = computeScore(extractions as Extraction[]);
    await prisma.score.create({
      data: { runId: run.id, brandId, ...score },
    });

    // Step 6: Detect alerts
    const previousScore = await getPreviousScore(brandId, run.id);
    const alerts = detectAlerts(score, previousScore, extractions as Extraction[], brand);
    if (alerts.length > 0) {
      await prisma.alert.createMany({
        data: alerts.map((a) => ({ ...a, brandId })),
      });
    }

    // Step 7: Generate recommendations
    const dbAlerts = await prisma.alert.findMany({ where: { brandId, status: "queued" } });
    const recs = await generateRecommendations(brand, score, extractions as Extraction[]);
    if (recs.length > 0) {
      await prisma.recommendation.createMany({
        data: recs.map((r) => ({
          runId: run.id,
          brandId,
          priority: r.priority,
          title: r.title,
          rationale: r.rationale,
          exactActions: r.exactActions,
          expectedImpact: r.expectedImpact,
        })),
      });
    }

    // Step 8: Send email
    const dbRecs = await prisma.recommendation.findMany({
      where: { runId: run.id },
    });
    await sendWeeklyEmail(brand, score, previousScore, dbAlerts, dbRecs);

    // Step 9: Mark done
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "done", finishedAt: new Date() },
    });

    console.log(`[weeklyRun] Completed run ${run.id} for ${brand.name}`);
  } catch (err) {
    console.error(`[weeklyRun] Run ${run.id} failed:`, err);
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "failed", finishedAt: new Date() },
    });
    throw err;
  }
}
