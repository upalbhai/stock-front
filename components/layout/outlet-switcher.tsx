"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api-client";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/utils";

type Outlet = {
  _id: string;
  name: string;
  code?: string;
};

export function OutletSwitcher({ className }: { className?: string }) {
  const { token, outletId, setOutletId } = useAuth();

  const { data } = useQuery({
    queryKey: ["outlets"],
    queryFn: () => getJson<{ data: Outlet[] }>("/outlets", token),
    enabled: Boolean(token)
  });

  const outlets = data?.data ?? [];

  React.useEffect(() => {
    if (!outletId && outlets.length) {
      setOutletId(outlets[0]._id);
    }
  }, [outletId, outlets, setOutletId]);

  if (!outlets.length) {
    return null;
  }

  return (
    <select
      value={outletId ?? ""}
      onChange={(event) => setOutletId(event.target.value)}
      className={cn(
        "rounded-2xl border border-border/70 bg-surface/70 px-3 py-2 text-sm",
        className
      )}
    >
      {outlets.map((outlet) => (
        <option key={outlet._id} value={outlet._id}>
          {outlet.name}
        </option>
      ))}
    </select>
  );
}
