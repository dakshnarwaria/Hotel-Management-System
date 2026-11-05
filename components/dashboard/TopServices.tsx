"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/components/dashboard/types";

export default function TopServices({
  rows,
}: {
  rows: DashboardData["top_services"];
}) {
  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Top services by revenue</h2>
      {rows.length === 0 ? (
        <p className="chart-empty">No service orders yet. Add one from a checked-in booking.</p>
      ) : (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 8, right: 12, bottom: 0, left: 12 }}
            >
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickFormatter={(value: number) => formatCurrency(value)}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                stroke="var(--chart-axis)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="service_name"
                width={110}
                tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
                stroke="var(--chart-axis)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
                contentStyle={{
                  background: "var(--background)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  borderRadius: "0.75rem",
                }}
              />
              <Bar dataKey="revenue" name="Revenue" fill="var(--chart-4)" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
