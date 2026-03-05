"use client";

import { useState } from "react";
import type { Response, Extraction, Query } from "@prisma/client";

type ResponseWithData = Response & {
  extraction: Extraction | null;
  query: Query;
};

interface RiskFlag {
  type: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
}

function RiskDot({ flags }: { flags: RiskFlag[] }) {
  const critical = flags.find((f) => f.severity === "critical");
  const high = flags.find((f) => f.severity === "high");
  if (critical) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title="Critical flag" />;
  if (high) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" title="High flag" />;
  if (flags.length > 0) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" title="Medium/low flag" />;
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-200" />;
}

const MODELS = ["All models", "ChatGPT", "Claude", "Gemini", "Perplexity"];
const INTENTS = ["All intents", "discovery", "evaluation", "pricing", "trust", "comparison"];

export function EvidenceExplorer({ responses }: { responses: ResponseWithData[] }) {
  const [modelFilter, setModelFilter] = useState("All models");
  const [intentFilter, setIntentFilter] = useState("All intents");
  const [selected, setSelected] = useState<ResponseWithData | null>(null);

  const filtered = responses.filter((r) => {
    const modelMatch = modelFilter === "All models" || r.modelName === modelFilter;
    const intentMatch = intentFilter === "All intents" || r.query.intent === intentFilter;
    return modelMatch && intentMatch;
  });

  // Sort by highest risk flag severity first
  const sorted = [...filtered].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
    const aFlags = (a.extraction?.riskFlags as unknown as RiskFlag[]) ?? [];
    const bFlags = (b.extraction?.riskFlags as unknown as RiskFlag[]) ?? [];
    const aWorst = aFlags.reduce((worst, f) => Math.min(worst, severityOrder[f.severity] ?? 4), 4);
    const bWorst = bFlags.reduce((worst, f) => Math.min(worst, severityOrder[f.severity] ?? 4), 4);
    return aWorst - bWorst;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {MODELS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {INTENTS.map((i) => <option key={i}>{i}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">{sorted.length} responses</span>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-6"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Query</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Model</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mentioned</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sentiment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((r) => {
                const flags = (r.extraction?.riskFlags as unknown as RiskFlag[]) ?? [];
                const isSelected = selected?.id === r.id;
                return (
                  <tr
                    key={r.id}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? "bg-blue-50" : ""}`}
                    onClick={() => setSelected(isSelected ? null : r)}
                  >
                    <td className="px-4 py-3">
                      <RiskDot flags={flags} />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-gray-700">{r.prompt}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.modelName}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-gray-500 text-xs">{r.query.intent}</span>
                    </td>
                    <td className="px-4 py-3">
                      {r.extraction?.brandMentioned ? (
                        <span className="text-green-600 font-medium text-xs">Yes{r.extraction.mentionRank ? ` (#${r.extraction.mentionRank})` : ""}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs capitalize ${
                        r.extraction?.sentiment === "positive" ? "text-green-600" :
                        r.extraction?.sentiment === "negative" ? "text-red-500" :
                        r.extraction?.sentiment === "mixed" ? "text-amber-500" :
                        "text-gray-400"
                      }`}>
                        {r.extraction?.sentiment ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-96 bg-white border border-gray-200 rounded-xl p-5 overflow-y-auto max-h-[600px] flex-shrink-0">
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-gray-400 hover:text-gray-600 mb-3 flex items-center gap-1"
            >
              ← Close
            </button>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Query</p>
            <p className="text-sm text-gray-700 mb-4">{selected.prompt}</p>

            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{selected.modelName}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{selected.query.intent}</span>
            </div>

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">AI Answer</p>
            <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
              {selected.rawAnswer}
            </div>

            {selected.extraction && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Extracted data</p>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Brand mentioned</span>
                    <span className={selected.extraction.brandMentioned ? "text-green-600 font-medium" : "text-gray-400"}>
                      {selected.extraction.brandMentioned ? `Yes (rank #${selected.extraction.mentionRank ?? "?"})` : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sentiment</span>
                    <span className="capitalize">{selected.extraction.sentiment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Confidence</span>
                    <span>{Math.round(selected.extraction.confidence * 100)}%</span>
                  </div>
                  {(selected.extraction.competitorMentions as string[]).length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-1">Competitors mentioned</p>
                      <div className="flex flex-wrap gap-1">
                        {(selected.extraction.competitorMentions as string[]).map((c) => (
                          <span key={c} className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {((selected.extraction.riskFlags as unknown as RiskFlag[]) ?? []).length > 0 && (
                    <div>
                      <p className="text-gray-400 mb-1">Risk flags</p>
                      <div className="space-y-1">
                        {(selected.extraction.riskFlags as unknown as RiskFlag[]).map((f, i) => (
                          <div key={i} className={`px-2 py-1 rounded text-xs ${
                            f.severity === "critical" ? "bg-red-100 text-red-700" :
                            f.severity === "high" ? "bg-orange-100 text-orange-700" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            <span className="font-bold uppercase mr-1">{f.severity}:</span>
                            {f.detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
