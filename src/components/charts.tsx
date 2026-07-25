import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { portfolioSeries, distribution, formatCompact } from "@/lib/mock-data";

export function PortfolioChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={portfolioSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="royalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-royal)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-royal)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          tickFormatter={(v) => formatCompact(v)}
          width={50}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            fontSize: "12px",
          }}
          formatter={(v: number) => [formatCompact(v), "Portfolio"]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-royal)"
          strokeWidth={2.5}
          fill="url(#royalFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={distribution}
          dataKey="value"
          innerRadius="62%"
          outerRadius="92%"
          paddingAngle={2}
          strokeWidth={0}
        >
          {distribution.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            fontSize: "12px",
          }}
          formatter={(v: number, n) => [`${v}%`, n as string]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
