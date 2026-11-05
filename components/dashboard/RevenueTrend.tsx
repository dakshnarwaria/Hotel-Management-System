"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { DashboardData } from "@/components/dashboard/types";

export default function RevenueTrend({
  rows,
  startDay,
  endDay,
}: {
  rows: DashboardData["revenue_trend"];
  startDay: string;
  endDay: string;
}) {
  const values = new Map(rows.map((row) => [row.day, Number(row.total)]));
  const days = fillDays(startDay, endDay, values);

  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Revenue trend</h2>
      {rows.length === 0 && (
        <p className="chart-empty-note">No payments in this range; all days shown as zero.</p>
      )}
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={days} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickFormatter={formatShortDate}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              stroke="var(--chart-axis)"
              tickLine={false}
              axisLine={false}
              minTickGap={18}
            />
            <YAxis
              tickFormatter={(value: number) => formatCurrency(value)}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              stroke="var(--chart-axis)"
              tickLine={false}
              axisLine={false}
              width={74}
            />
            <Tooltip
              labelFormatter={(value) => formatShortDate(String(value))}
              formatter={(value) => [formatCurrency(Number(value ?? 0)), "Payments"]}
              contentStyle={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: "0.75rem",
              }}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Payments"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function fillDays(start: string, end: string, totals: Map<string, number>) {
  const points: { day: string; total: number }[] = [];
  const current = new Date(`${start}T00:00:00`);
  const final = new Date(`${end}T00:00:00`);
  while (current <= final) {
    const day = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    points.push({ day, total: totals.get(day) ?? 0 });
    current.setDate(current.getDate() + 1);
  }
  return points;
}
