"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  ok: boolean;
  data: { database: string } | null;
  error: string | null;
};

export default function Dashboard() {
  const [databaseStatus, setDatabaseStatus] = useState("Checking database...");

  useEffect(() => {
    let active = true;

    fetch("/api/health")
      .then(async (response) => {
        const result = (await response.json()) as HealthResponse;
        if (!response.ok || !result.ok) {
          throw new Error(result.error ?? "Database connection failed");
        }
        if (active) setDatabaseStatus("Database connected");
      })
      .catch(() => {
        if (active) setDatabaseStatus("Database unavailable");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <header>
        <span className="eyebrow">Hotel operations</span>
        <h1 className="page-title">Dashboard</h1>
        <p className="muted">A considered overview of your property.</p>
      </header>

      <section className="surface setup-card" aria-labelledby="welcome-heading">
        <h2 id="welcome-heading">Your hotel workspace is ready</h2>
        <p>
          The shared database connection and application shell are in place.
          Guest, room, and booking activity will appear here as the management
          modules are added.
        </p>
        <span className="connection-indicator" role="status" aria-live="polite">
          {databaseStatus}
        </span>
      </section>
    </>
  );
}
