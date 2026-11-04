import type { ReactNode } from "react";

type Props = { status: string; children?: ReactNode };

export default function StatusBadge({ status, children }: Props) {
  const className = status.toLowerCase().replace(/[^a-z]+/g, "-");
  const badgeLabel = children ?? status;
  return (
    <span className={`status-badge status-${className}`}>{badgeLabel}</span>
  );
}
