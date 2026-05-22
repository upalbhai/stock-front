"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription } from "./card";

type StatsCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: number; label: string };
  icon?: React.ReactNode;
  className?: string;
  color?: "default" | "primary" | "success" | "warning" | "danger";
};

const colorMap = {
  default: "text-text",
  primary: "text-primary",
  success: "text-muted",
  warning: "text-muted",
  danger: "text-muted"
};

export function StatsCard({ label, value, hint, trend, icon, className, color = "default" }: StatsCardProps) {
  return (
    <Card className={cn("animate-rise", className)}>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardDescription className="truncate">{label}</CardDescription>
            <p className={cn("mt-1 text-2xl font-bold tracking-tight", colorMap[color])}>
              {value}
            </p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
            {trend && (
              <div className={cn("mt-2 flex items-center gap-1 text-xs font-medium",
                trend.value >= 0 ? "text-text" : "text-muted"
              )}>
                {trend.value >= 0
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />
                }
                <span>{Math.abs(trend.value)}% {trend.label}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-border/40 text-text">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
