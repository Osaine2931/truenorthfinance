import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { formatCompact } from "@/lib/api";

const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "14px",
  fontSize: "12px",
} as const;

const axisTick = { fill: "var(--color-muted-foreground)", fontSize: 11 } as const;

export function PortfolioChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="royalFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-royal)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-royal)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisTick} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={axisTick}
          tickFormatter={(v) => formatCompact(v)}
          width={54}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCompact(v)} />
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

export function PerformanceChart({
  data,
}: {
  data: { label: string; invested: number; profit: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={axisTick}
          tickFormatter={(v) => formatCompact(v)}
          width={54}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCompact(v)} cursor={false} />
        <Bar dataKey="invested" fill="var(--color-royal)" radius={[8, 8, 0, 0]} maxBarSize={26} />
        <Bar dataKey="profit" fill="oklch(0.86 0.07 235)" radius={[8, 8, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AllocationChart({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius="60%" outerRadius="88%" paddingAngle={3} stroke="none">
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
