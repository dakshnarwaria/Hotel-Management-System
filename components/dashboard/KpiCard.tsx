import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  highlight?: boolean;
};

export default function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  highlight = false,
}: Props) {
  return (
    <article className={`surface kpi-card${highlight ? " kpi-highlight" : ""}`}>
      <div className="kpi-topline">
        <span className="kpi-icon">
          <Icon size={18} />
        </span>
        <span className="muted">{title}</span>
      </div>
      <strong className="kpi-value">{value}</strong>
      <span className="kpi-description">{description}</span>
    </article>
  );
}
