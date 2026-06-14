"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/services/user.service";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch],
    queryFn: () => userService.getUsers(token, { search: debouncedSearch || undefined }),
    enabled: Boolean(token),
  });

  const allUsers = data?.users ?? [];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search system users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <DataTable
        loading={isLoading}
        data={allUsers}
        keyExtractor={(u) => u._id}
        emptyMessage="No system users matching search."
        columns={[
          {
            key: "name", header: "User Profile",
            render: (u) => (
              <div>
                <p className="font-semibold text-sm">{u.name}</p>
                <p className="text-xs text-muted font-mono">{u.email || "No email"}</p>
                <p className="text-[10px] text-muted font-mono">{u.phone || "No phone"}</p>
              </div>
            )
          },
          {
            key: "role", header: "Platform Role",
            render: (u) => (
              <div className="flex flex-col gap-1 items-start">
                <Badge variant={u.role === "superadmin" ? "danger" : u.role === "owner" ? "default" : "soft"} className="capitalize">
                  {u.role}
                </Badge>
                {u.roleId?.name && (
                  <span className="text-[10px] text-muted">Custom Role: {u.roleId.name}</span>
                )}
              </div>
            )
          },
          {
            key: "business", header: "Business association",
            render: (u) => (
              <span className="text-xs text-muted">{u.businessId?.name || "System Administrator"}</span>
            )
          },
          {
            key: "isActive", header: "Status",
            render: (u) => (
              <Badge variant={u.isActive ? "soft" : "danger"}>
                {u.isActive ? "Active" : "Suspended"}
              </Badge>
            )
          }
        ]}
      />
    </div>
  );
}
