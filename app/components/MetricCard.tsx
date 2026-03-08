import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass: "bg-blue" | "bg-green" | "bg-orange" | "bg-purple" | "bg-pink";
}

export default function MetricCard({ title, value, subtitle, icon: Icon, colorClass }: MetricCardProps) {
  return (
    <div className={`metric-card ${colorClass}`}>
      <div>
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <p style={{ fontSize: "0.8rem", marginTop: "0.5rem", opacity: 0.8 }}>{subtitle}</p>}
      </div>
      <Icon className="icon-bg" />
    </div>
  );
}
