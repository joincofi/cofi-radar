import type { Alert } from "@prisma/client";

const severityConfig: Record<
  string,
  { color: string; bg: string; border: string; dot: string }
> = {
  critical: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  high: {
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  medium: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    color: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
};

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
        <p className="text-sm text-gray-400">No alerts — everything looks good.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const cfg = severityConfig[alert.severity] ?? severityConfig.low;
        const ev = alert.evidence as Record<string, string>;
        return (
          <div
            key={alert.id}
            className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${cfg.dot}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500 capitalize">
                    {alert.type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  {alert.message}
                </p>
                {ev.query && (
                  <p className="text-xs text-gray-500 mb-0.5">
                    <span className="font-medium">Query:</span> {ev.query}
                  </p>
                )}
                {ev.model && (
                  <p className="text-xs text-gray-500 mb-0.5">
                    <span className="font-medium">Model:</span> {ev.model}
                  </p>
                )}
                {ev.answerSnippet && (
                  <p className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                    &ldquo;{ev.answerSnippet}&rdquo;
                  </p>
                )}
                {ev.detail && !ev.answerSnippet && (
                  <p className="text-xs text-gray-500 mt-1">{ev.detail}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(alert.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
