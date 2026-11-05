"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      localStorage.getItem("hotel-theme") !== "light",
    );
  }, []);

  return (
    <html lang="en" className="dark">
      <body>
        <main className="error-boundary">
          <span className="eyebrow">Application error</span>
          <h1 className="page-title">Hearth & Stay could not start</h1>
          <p>Try loading the application again.</p>
          <button className="button button-primary button-md" onClick={reset}>
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
