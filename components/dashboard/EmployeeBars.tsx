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

export default function EmployeeBars({
  rows,
}: {
  rows: DashboardData["bookings_by_employee"];
}) {
  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Bookings per employee</h2>
      {rows.length === 0 ? (
        <p className="chart-empty">No booking-handling employees yet. Add a receptionist or manager.</p>
      ) : (
      <div className="chart-frame">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 8, right: 12, bottom: 0, left: 12 }}
          >
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--chart-axis)", fontSize: 11 }} stroke="var(--chart-axis)" tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="emp_name"
              width={100}
              tick={{ fill: "var(--chart-axis)", fontSize: 11 }}
              stroke="var(--chart-axis)"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
                borderRadius: "0.75rem",
              }}
            />
            <Bar dataKey="bookings_handled" name="Bookings" fill="var(--chart-3)" radius={[0, 5, 5, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}
    </section>
  );
}
