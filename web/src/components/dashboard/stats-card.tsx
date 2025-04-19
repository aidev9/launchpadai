import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  change?: string;
  changeText?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  change,
  changeText,
  className,
}: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6", className)}>
      <div className="flex items-center justify-between space-y-0">
        <h3 className="font-medium tracking-tight text-muted-foreground">
          {title}
        </h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            <span>{change} </span>
            <span>{changeText}</span>
          </p>
        )}
      </div>
    </div>
  );
}
