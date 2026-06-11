"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api-client";
import { useAuth } from "@/components/auth/auth-provider";
import { Select } from "@/components/ui/select";
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
    queryFn: () => getJson<{ outlets: Outlet[] }>("/outlets", token),
    enabled: Boolean(token)
  });

  const outlets = data?.outlets ?? [];

  React.useEffect(() => {
    if (!outletId && outlets.length) {
      setOutletId(outlets[0]._id);
    }
  }, [outletId, outlets, setOutletId]);

  if (!outlets.length) {
    return null;
  }

  return (
    <Select
      value={outletId ?? outlets[0]?._id ?? ""}
      onValueChange={setOutletId}
      placeholder="Select outlet"
      size="sm"
      options={outlets.map((outlet) => ({
        value: outlet._id,
        label: outlet.name,
      }))}
      className={cn("min-w-[8.5rem] max-w-[11rem]", className)}
    />
  );
}
