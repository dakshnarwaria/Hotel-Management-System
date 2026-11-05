"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShortDate } from "@/lib/format";
import type { DashboardData } from "@/components/dashboard/types";

export default function OccupancyForecast({
  rows,
}: {
  rows: DashboardData["occupancy_forecast"];
}) {
  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Occupancy forecast</h2>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
              domain={[0, 100]}
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              stroke="var(--chart-axis)"
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              labelFormatter={(value) => formatShortDate(String(value))}
              formatter={(value) => [`${Number(value ?? 0)}%`, "Occupancy"]}
              contentStyle={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: "0.75rem",
              }}
            />
            <Area
              type="monotone"
              dataKey="occupancy_percent"
              name="Occupancy"
              stroke="var(--chart-1)"
              fill="var(--chart-fill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
