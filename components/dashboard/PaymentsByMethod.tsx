"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/format";
import type { DashboardData } from "@/components/dashboard/types";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function PaymentsByMethod({
  rows,
}: {
  rows: DashboardData["payments_by_method"];
}) {
  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Payments by method</h2>
      {rows.length === 0 ? (
        <p className="chart-empty">No payments in this range. Record one from a booking.</p>
      ) : (
        <div className="donut-layout">
          <div className="chart-frame donut-frame">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={rows}
                  dataKey="total"
                  nameKey="method"
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke="none"
                >
                  {rows.map((row, index) => (
                    <Cell key={row.method} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    background: "var(--background)",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                    borderRadius: "0.75rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="chart-legend">
            {rows.map((row, index) => (
              <li key={row.method}>
                <span
                  className="legend-dot"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span>{row.method} · {row.txns} txns</span>
                <strong>{formatCurrency(row.total)}</strong>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
