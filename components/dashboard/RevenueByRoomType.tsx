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
import { formatCompactINR, formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/components/dashboard/types";

export default function RevenueByRoomType({
  rows,
}: {
  rows: DashboardData["revenue_by_room_type"];
}) {
  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Revenue by room type</h2>
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="type_name"
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              stroke="var(--chart-axis)"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={58}
            />
            <YAxis
              tickFormatter={(value: number) => formatCompactINR(value)}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              stroke="var(--chart-axis)"
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value ?? 0)), "Room revenue"]}
              contentStyle={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: "0.75rem",
              }}
            />
            <Bar dataKey="revenue" name="Room revenue" fill="var(--chart-1)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
