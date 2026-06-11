"use client";

import { cn } from "@/lib/utils";

export type FeatureRegistryItem = {
  key: string;
  label: string;
  group: string;
  description?: string;
};

type FeatureMultiSelectProps = {
  features: FeatureRegistryItem[];
  value: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
  className?: string;
};

export function FeatureMultiSelect({
  features,
  value,
  onChange,
  disabled,
  className,
}: FeatureMultiSelectProps) {
  const grouped = features.reduce<Record<string, FeatureRegistryItem[]>>((acc, feature) => {
    const group = feature.group || "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(feature);
    return acc;
  }, {});

  const toggle = (key: string) => {
    if (disabled) return;
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {group}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((feature) => {
              const checked = value.includes(feature.key);
              return (
                <label
                  key={feature.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-md border px-2.5 py-2 transition-colors",
                    checked
                      ? "border-primary/40 bg-primary/5"
                      : "border-transparent hover:bg-accent/50",
                    disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(feature.key)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{feature.label}</span>
                    {feature.description && (
                      <span className="block text-[11px] leading-snug text-muted-foreground">
                        {feature.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      {features.length === 0 && (
        <p className="text-sm text-muted-foreground">No features available from server.</p>
      )}
    </div>
  );
}
