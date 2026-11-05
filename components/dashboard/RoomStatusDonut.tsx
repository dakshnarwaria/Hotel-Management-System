"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardData } from "@/components/dashboard/types";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
];

export default function RoomStatusDonut({
  rooms,
}: {
  rooms: DashboardData["rooms"];
}) {
  const data = [
    { name: "Available", value: rooms.available },
    { name: "Reserved", value: rooms.reserved },
    { name: "Occupied", value: rooms.occupied },
    { name: "Maintenance", value: rooms.maintenance },
  ];

  return (
    <section className="surface dashboard-card">
      <h2 className="dashboard-card-title">Room status</h2>
      {rooms.total === 0 && (
        <p className="chart-empty">No rooms yet. Add rooms to see their status.</p>
      )}
      <div className="donut-layout">
        <div className="chart-frame donut-frame">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={3}
                stroke="none"
              >
                {data.map((item, index) => (
                  <Cell key={item.name} fill={colors[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  borderRadius: "0.75rem",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <span className="donut-total">{rooms.total}</span>
          <span className="donut-caption">rooms</span>
        </div>
        <ul className="chart-legend">
          {data.map((item, index) => (
            <li key={item.name}>
              <span
                className="legend-dot"
                style={{ backgroundColor: colors[index] }}
              />
              <span>{item.name}</span>
              <strong>{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
