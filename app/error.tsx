"use client";

import Button from "@/components/Button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="surface error-boundary">
      <span className="eyebrow">Something went wrong</span>
      <h1 className="page-title">This page could not be displayed</h1>
      <p className="muted">Try again. Your saved records have not been changed.</p>
      <Button onClick={reset}>Retry</Button>
    </section>
  );
}
