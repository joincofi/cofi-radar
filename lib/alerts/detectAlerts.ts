import type { Extraction, Brand } from "@prisma/client";
import type { ScoreData } from "@/lib/scoring/computeScore";

export interface AlertData {
  severity: "low" | "medium" | "high" | "critical";
  type:
    | "misinformation"
    | "competitor_displacement"
    | "negative_sentiment_spike"
    | "missing_in_category"
    | "score_drop";
  message: string;
  evidence: {
    query?: string;
    model?: string;
    answerSnippet?: string;
    detail?: string;
  };
}

interface RiskFlag {
  type: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface ExtractWithMeta extends Extraction {
  response?: {
    prompt: string;
    modelName: string;
    rawAnswer: string;
  };
}

export function detectAlerts(
  score: ScoreData,
  previousScore: ScoreData | null,
  extractions: ExtractWithMeta[],
  _brand: Brand
): AlertData[] {
  const alerts: AlertData[] = [];

  // 1. Critical risk flags → critical misinformation
  for (const ext of extractions) {
    const flags = (ext.riskFlags as unknown as RiskFlag[]) ?? [];
    const critical = flags.find((f) => f.severity === "critical");
    if (critical) {
      alerts.push({
        severity: "critical",
        type: "misinformation",
        message: `Critical misinformation detected: ${critical.detail}`,
        evidence: {
          query: ext.response?.prompt,
          model: ext.response?.modelName,
          answerSnippet: ext.response?.rawAnswer?.slice(0, 300),
          detail: critical.detail,
        },
      });
    }
  }

  // 2. High risk flags → high misinformation
  for (const ext of extractions) {
    const flags = (ext.riskFlags as unknown as RiskFlag[]) ?? [];
    const high = flags.find((f) => f.severity === "high");
    if (high) {
      alerts.push({
        severity: "high",
        type: "misinformation",
        message: `High-risk claim detected: ${high.detail}`,
        evidence: {
          query: ext.response?.prompt,
          model: ext.response?.modelName,
          answerSnippet: ext.response?.rawAnswer?.slice(0, 300),
          detail: high.detail,
        },
      });
    }
  }

  // 3. Score drops more than 15 points
  if (previousScore && previousScore.scoreTotal - score.scoreTotal > 15) {
    alerts.push({
      severity: "high",
      type: "score_drop",
      message: `AI Visibility Score dropped ${previousScore.scoreTotal - score.scoreTotal} points (${previousScore.scoreTotal} → ${score.scoreTotal})`,
      evidence: {
        detail: `Previous: ${previousScore.scoreTotal}, Current: ${score.scoreTotal}`,
      },
    });
  }

  // 4. Visibility subscore drops more than 20 points
  if (
    previousScore &&
    previousScore.scoreVisibility - score.scoreVisibility > 20
  ) {
    alerts.push({
      severity: "high",
      type: "missing_in_category",
      message: `Visibility score dropped ${previousScore.scoreVisibility - score.scoreVisibility} points — brand appearing less in AI answers`,
      evidence: {
        detail: `Previous visibility: ${previousScore.scoreVisibility}, Current: ${score.scoreVisibility}`,
      },
    });
  }

  // 5. Competitor mentioned in >50% of queries where brand not mentioned
  const brandNotMentioned = extractions.filter((e) => !e.brandMentioned);
  const displaced = brandNotMentioned.filter(
    (e) => (e.competitorMentions as string[]).length > 0
  );
  if (
    brandNotMentioned.length > 0 &&
    displaced.length / brandNotMentioned.length > 0.5
  ) {
    alerts.push({
      severity: "high",
      type: "competitor_displacement",
      message: `Competitors mentioned in ${Math.round((displaced.length / brandNotMentioned.length) * 100)}% of queries where brand is absent`,
      evidence: {
        detail: `${displaced.length} of ${brandNotMentioned.length} brand-absent queries mention a competitor`,
      },
    });
  }

  // 6. Sentiment spike negative
  const prevSentiment = previousScore ? previousScore.scoreSentiment : null;
  if (prevSentiment !== null && prevSentiment >= 60 && score.scoreSentiment < 40) {
    alerts.push({
      severity: "medium",
      type: "negative_sentiment_spike",
      message: `Sentiment shifted from neutral/positive to negative (${Math.round(prevSentiment)} → ${score.scoreSentiment})`,
      evidence: {
        detail: `Sentiment score dropped from ${Math.round(prevSentiment)} to ${score.scoreSentiment}`,
      },
    });
  }

  // 7. Brand mentioned in less than 30% of queries
  const mentionRate =
    extractions.filter((e) => e.brandMentioned).length / extractions.length;
  if (mentionRate < 0.3) {
    alerts.push({
      severity: "medium",
      type: "missing_in_category",
      message: `Brand mentioned in only ${Math.round(mentionRate * 100)}% of queries — low AI visibility`,
      evidence: {
        detail: `Brand appeared in ${extractions.filter((e) => e.brandMentioned).length} of ${extractions.length} AI answers`,
      },
    });
  }

  return alerts;
}
