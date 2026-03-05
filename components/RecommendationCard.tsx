import type { Recommendation } from "@prisma/client";

const priorityConfig = {
  p0: {
    label: "P0 · Fix this week",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
  },
  p1: {
    label: "P1 · Fix soon",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
  },
  p2: {
    label: "P2 · Longer-term",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg =
    priorityConfig[rec.priority as keyof typeof priorityConfig] ??
    priorityConfig.p2;
  const actions = rec.exactActions as string[];

  return (
    <div className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start gap-3">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${cfg.badge}`}
        >
          {cfg.label}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 mt-3 mb-1">{rec.title}</h3>
      <p className="text-sm text-gray-600 mb-3">{rec.rationale}</p>
      {actions.length > 0 && (
        <ul className="space-y-1 mb-3">
          {actions.map((action, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-700">
              <span className="text-gray-400 flex-shrink-0">→</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-gray-500 italic">
        Expected impact: {rec.expectedImpact}
      </p>
    </div>
  );
}
