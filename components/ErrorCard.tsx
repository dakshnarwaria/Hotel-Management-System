"use client";

import Button from "@/components/Button";

export default function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section className="surface error-card" role="alert">
      <p>{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </section>
  );
}
