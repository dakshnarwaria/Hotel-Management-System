import type { ReactNode } from "react";

type Props = { eyebrow: string; title: string; action?: ReactNode };

export default function PageHeader({ eyebrow, title, action }: Props) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="page-title">{title}</h1>
      </div>
      {action}
    </header>
  );
}
