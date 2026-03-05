interface ScoreCardProps {
  score: number;
  previousScore: number | null;
  brandName: string;
}

function delta(current: number, prev: number | null) {
  if (prev === null) return null;
  return current - prev;
}

function scoreColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 45) return "text-amber-500";
  return "text-red-500";
}

function trendLabel(d: number | null) {
  if (d === null) return null;
  const sign = d >= 0 ? "+" : "";
  return `${sign}${d} vs last week`;
}

export function ScoreCard({ score, previousScore, brandName }: ScoreCardProps) {
  const d = delta(score, previousScore);
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
      <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
        AI Visibility Score — {brandName}
      </p>
      <div className={`text-8xl font-extrabold ${scoreColor(score)}`}>{score}</div>
      <div className="text-lg text-gray-400 mt-1">/ 100</div>
      {d !== null && (
        <div
          className={`mt-3 text-sm font-semibold ${
            d > 0 ? "text-green-600" : d < 0 ? "text-red-500" : "text-gray-400"
          }`}
        >
          {d > 0 ? "↑" : d < 0 ? "↓" : "→"} {trendLabel(d)}
        </div>
      )}
    </div>
  );
}
