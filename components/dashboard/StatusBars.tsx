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
import type { DashboardData } from "@/components/dashboard/types";

export default function StatusBars({
  rows,
}: {
  rows: DashboardData["bookings_by_status"];
}) {
  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Bookings by status</h2>
      {rows.length === 0 ? (
        <p className="chart-empty">No bookings yet. Create a booking to see status totals.</p>
      ) : (
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="status" tick={{ fill: "var(--chart-axis)", fontSize: 11 }} stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: "0.75rem",
              }}
            />
            <Bar dataKey="count" name="Bookings" fill="var(--chart-2)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
