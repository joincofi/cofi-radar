interface Subscore {
  label: string;
  value: number;
  prev: number | null;
  weight: string;
  description: string;
}

function Trend({ value, prev }: { value: number; prev: number | null }) {
  if (prev === null) return null;
  const d = value - prev;
  if (d === 0) return <span className="text-gray-400 text-xs">→</span>;
  return (
    <span className={d > 0 ? "text-green-600 text-xs" : "text-red-500 text-xs"}>
      {d > 0 ? "↑" : "↓"} {Math.abs(d)}
    </span>
  );
}

export function SubscoreGrid({
  visibility,
  accuracy,
  competitive,
  sentiment,
  prevVisibility,
  prevAccuracy,
  prevCompetitive,
  prevSentiment,
}: {
  visibility: number;
  accuracy: number;
  competitive: number;
  sentiment: number;
  prevVisibility: number | null;
  prevAccuracy: number | null;
  prevCompetitive: number | null;
  prevSentiment: number | null;
}) {
  const subscores: Subscore[] = [
    {
      label: "Visibility",
      value: visibility,
      prev: prevVisibility,
      weight: "35%",
      description: "How often & prominently brand appears",
    },
    {
      label: "Accuracy",
      value: accuracy,
      prev: prevAccuracy,
      weight: "30%",
      description: "Risk flags weighted by severity",
    },
    {
      label: "Competitive",
      value: competitive,
      prev: prevCompetitive,
      weight: "20%",
      description: "Presence when competitors are mentioned",
    },
    {
      label: "Sentiment",
      value: sentiment,
      prev: prevSentiment,
      weight: "15%",
      description: "Tone of brand mentions",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {subscores.map((s) => (
        <div
          key={s.label}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {s.label}
            </p>
            <span className="text-xs text-gray-400">{s.weight}</span>
          </div>
          <div className="flex items-end gap-2 mt-2">
            <span className="text-3xl font-bold text-gray-900">{s.value}</span>
            <Trend value={s.value} prev={s.prev} />
          </div>
          <p className="text-xs text-gray-400 mt-2">{s.description}</p>
        </div>
      ))}
    </div>
  );
}
