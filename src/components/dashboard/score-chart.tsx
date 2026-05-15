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
import { useTheme } from "next-themes";

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

// Hardcoded theme palette — SVG elements don't inherit CSS custom properties
const THEME = {
  dark: {
    border: "#334155",          // slate-700
    gridStroke: "#1e293b",      // slate-800
    axisLabel: "#94a3b8",       // slate-400
    radiusTick: "#64748b",      // slate-500
    foreground: "#f1f5f9",      // slate-100
    card: "#0f172a",            // slate-900
    cardBorder: "#334155",
    primary: "#818cf8",         // indigo-400
    primaryFill: "#818cf8",
    ai: "#c084fc",              // purple-400
    aiFill: "#c084fc",
    tooltipText: "#f1f5f9",
  },
  light: {
    border: "#e2e8f0",          // slate-200
    gridStroke: "#e2e8f0",
    axisLabel: "#64748b",       // slate-500
    radiusTick: "#94a3b8",      // slate-400
    foreground: "#0f172a",      // slate-900
    card: "#ffffff",
    cardBorder: "#e2e8f0",
    primary: "#4f46e5",         // indigo-600
    primaryFill: "#4f46e5",
    ai: "#9333ea",              // purple-600
    aiFill: "#9333ea",
    tooltipText: "#0f172a",
  },
} as const;

export function ScoreBreakdownChart({
  humanScores,
  systemScores,
}: ScoreBreakdownChartProps) {
  const { resolvedTheme } = useTheme();
  const c = resolvedTheme === "dark" ? THEME.dark : THEME.light;

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
    <div style={{ width: "100%", height: 340 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke={c.gridStroke} />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: c.axisLabel, fontSize: 11, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tickCount={6}
            tick={{ fill: c.radiusTick, fontSize: 10 }}
            stroke={c.border}
            axisLine={false}
          />
          {humanVals && (
            <Radar
              name="Human Jury"
              dataKey="Human Jury"
              stroke={c.primary}
              fill={c.primaryFill}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
          {systemVals && (
            <Radar
              name="AI System"
              dataKey="AI System"
              stroke={c.ai}
              fill={c.aiFill}
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          )}
          <Legend
            wrapperStyle={{
              fontSize: 12,
              color: c.foreground,
              paddingTop: 8,
            }}
          />
          <Tooltip
            contentStyle={{
              background: c.card,
              border: `1px solid ${c.cardBorder}`,
              borderRadius: 10,
              fontSize: 12,
              color: c.tooltipText,
            }}
            itemStyle={{ color: c.tooltipText }}
            labelStyle={{ color: c.foreground, fontWeight: 600 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
