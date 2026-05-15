"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface ScoreBreakdownChartProps {
  humanScores: {
    presentation: number;
    confidence: number;
    styling: number;
    profileQuality: number;
    professionalism: number;
  } | null;
  systemScores: {
    presentation: number;
    confidence: number;
    styling: number;
    profileQuality: number;
    professionalism: number;
  } | null;
}

export function ScoreBreakdownChart({
  humanScores,
  systemScores,
}: ScoreBreakdownChartProps) {
  const categories = [
    "Presentation",
    "Confidence",
    "Styling",
    "Profile Quality",
    "Professionalism",
  ];

  const humanVals = humanScores
    ? [
        humanScores.presentation,
        humanScores.confidence,
        humanScores.styling,
        humanScores.profileQuality,
        humanScores.professionalism,
      ]
    : null;

  const systemVals = systemScores
    ? [
        systemScores.presentation,
        systemScores.confidence,
        systemScores.styling,
        systemScores.profileQuality,
        systemScores.professionalism,
      ]
    : null;

  const data = categories.map((cat, i) => ({
    category: cat,
    ...(humanVals ? { "Human Jury": humanVals[i] } : {}),
    ...(systemVals ? { "AI System": systemVals[i] } : {}),
  }));

  return (
    <div className="w-full h-[300px] sm:h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tickCount={6}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
          />
          {humanVals && (
            <Radar
              name="Human Jury"
              dataKey="Human Jury"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
          {systemVals && (
            <Radar
              name="AI System"
              dataKey="AI System"
              stroke="#a855f7"
              fill="#a855f7"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          <Legend
            wrapperStyle={{ fontSize: 12, color: "hsl(var(--foreground))" }}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
