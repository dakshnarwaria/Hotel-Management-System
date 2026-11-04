import type { ReactNode } from "react";

type Props = { status: string; children?: ReactNode };

export default function StatusBadge({ status, children }: Props) {
  const className = status.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <span className={`status-badge status-${className}`}>
      {children ?? status}
    </span>
  );
}
