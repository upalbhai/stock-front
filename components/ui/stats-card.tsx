"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "./card";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

type StatsCardProps = {
  label: string;
  value: string | number;
  fullValue?: string | number;
  hint?: string;
  trend?: { value: number; label: string };
  icon?: React.ReactNode;
  className?: string;
  color?: "default" | "primary" | "success" | "warning" | "danger" | "purple";
};

const colorMap = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-info",
  warning: "text-warning",
  danger: "text-destructive",
  purple: "text-purple-600 dark:text-purple-400",
};

const bgTintMap = {
  default: "bg-muted/10 border-border/80",
  primary: "bg-primary/5 dark:bg-primary/10 border-primary/20",
  success: "bg-info/5 dark:bg-info/10 border-info/20",
  warning: "bg-warning/5 dark:bg-warning/10 border-warning/20",
  danger: "bg-destructive/5 dark:bg-destructive/10 border-destructive/20",
  purple: "bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20",
};

const iconColorMap = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-info/10 text-info",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

export function StatsCard({ label, value, fullValue, hint, trend, icon, className, color = "default" }: StatsCardProps) {
  return (
    <Card className={cn("border transition-colors duration-200 hover:shadow-md h-full flex flex-col", bgTintMap[color], className)}>
      <CardContent className="pt-4.5 pb-4 px-4.5 flex-1 flex flex-col justify-center">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 block">
              {label}
            </span>
            {fullValue ? (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className={cn("mt-1.5 text-3xl font-extrabold tracking-tight leading-none truncate cursor-default sm:cursor-help w-fit max-w-full", colorMap[color])}>
                      {value}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="font-mono text-sm tracking-tight px-3 py-1.5">
                    {String(fullValue)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <p className={cn("mt-1.5 text-3xl font-extrabold tracking-tight leading-none truncate w-fit max-w-full", colorMap[color])}>
                {value}
              </p>
            )}
            
            {trend && (
              <div
                className={cn(
                  "mt-2 flex items-center gap-1 text-xs font-semibold leading-none",
                  trend.value >= 0 
                    ? (color === "success" || color === "default" ? "text-emerald-500" : colorMap[color])
                    : "text-rose-500"
                )}
              >
                <span>
                  {trend.value >= 0 ? "↑" : "↓"} {trend.value >= 0 ? "+" : ""}{trend.value}%
                </span>
                <span className="text-muted-foreground text-[10px] font-normal">
                  {trend.label}
                </span>
              </div>
            )}

            {hint && (
              <p className={cn("text-xs text-muted-foreground/80 font-medium", trend ? "mt-1.5" : "mt-2")}>
                {hint}
              </p>
            )}
          </div>
          
          {icon && (
            <div className={cn("flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl transition-all duration-300 shadow-xs", iconColorMap[color])}>
              {React.isValidElement(icon) 
                ? React.cloneElement(icon as React.ReactElement<any>, { className: "h-4.5 w-4.5" })
                : icon
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

