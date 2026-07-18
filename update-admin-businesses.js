const fs = require('fs');
const path = require('path');

// 1. Update admin.service.ts
const serviceFile = path.join(__dirname, 'services/admin.service.ts');
let serviceContent = fs.readFileSync(serviceFile, 'utf8');

serviceContent = serviceContent.replace(
  'getAdminBusinesses: async (token?: string | null, params?: { search?: string; status?: string }) => {',
  'getAdminBusinesses: async (token?: string | null, params?: { search?: string; status?: string; page?: number; limit?: number }) => {'
);
serviceContent = serviceContent.replace(
  'return getJson<{ businesses: (Business & { ownerId?: { name: string; phone: string; email?: string } })[] }>("/admin/businesses", token, params);',
  'return getJson<{ businesses: (Business & { ownerId?: { name: string; phone: string; email?: string } })[], total: number }>("/admin/businesses", token, params);'
);
fs.writeFileSync(serviceFile, serviceContent);
console.log('Updated admin.service.ts');

// 2. Update page.tsx
const pageFile = path.join(__dirname, 'app/dashboard/admin/businesses/page.tsx');
let pageContent = fs.readFileSync(pageFile, 'utf8');

// Add DropdownMenu imports
if (!pageContent.includes('DropdownMenu,')) {
  pageContent = pageContent.replace(
    'import { Select } from "@/components/ui/select";',
    `import { Select } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";`
  );
}

// Add MoreHorizontal icon
if (!pageContent.includes('MoreHorizontal')) {
  pageContent = pageContent.replace(
    'import { Search, Edit3, CheckCircle2, DollarSign, LogIn, Mail } from "lucide-react";',
    'import { Search, Edit3, CheckCircle2, DollarSign, LogIn, Mail, MoreHorizontal } from "lucide-react";'
  );
}

// Add parseAsInteger
if (!pageContent.includes('parseAsInteger')) {
  pageContent = pageContent.replace(
    'import { useQueryStates, parseAsString } from "nuqs";',
    'import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";'
  );
}

// Update query state
pageContent = pageContent.replace(
  `  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    statusFilter: parseAsString.withDefault("all")
  });`,
  `  const [query, setQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    statusFilter: parseAsString.withDefault("all"),
    page: parseAsInteger.withDefault(1)
  });`
);

// Update useQuery for admin-businesses
const oldUseQuery = `  const { data: bizData, isLoading: loadingBiz, refetch } = useQuery({
    queryKey: ["admin-businesses", query.search, query.statusFilter],
    queryFn: () => adminService.getAdminBusinesses(token, { search: query.search || undefined, status: query.statusFilter !== "all" ? query.statusFilter : undefined }),
    enabled: Boolean(token)
  });`;
const newUseQuery = `  const { data: bizData, isLoading: loadingBiz, refetch } = useQuery({
    queryKey: ["admin-businesses", query.search, query.statusFilter, query.page],
    queryFn: () => adminService.getAdminBusinesses(token, { 
      search: query.search || undefined, 
      status: query.statusFilter !== "all" ? query.statusFilter : undefined,
      page: query.page,
      limit: 10
    }),
    enabled: Boolean(token)
  });`;
pageContent = pageContent.replace(oldUseQuery, newUseQuery);

// Update DataTable
const oldDataTable = `        emptyStateText="No businesses registered on the platform matching search."
        filters={`;
const newDataTable = `        emptyStateText="No businesses registered on the platform matching search."
        totalItems={bizData?.total}
        page={query.page}
        limit={10}
        onPageChange={(p) => setQuery({ page: p })}
        filters={`;
pageContent = pageContent.replace(oldDataTable, newDataTable);

// Update columns - actions
const oldActionsStart = `          {
            key: "actions", header: "Administration Tools",
            render: (b) => (
              <div className="flex gap-2 flex-wrap items-center">
                {b.status === "pending" && (
                  <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveBizMutation.mutate(b._id)}>
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </Button>
                )}
                <Button variant="outline" size="xs" className="gap-1" onClick={() => openPlanEdit(b)}><Edit3 className="h-3 w-3" /> Settings</Button>
                <Button variant="default" size="xs" className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => openManualSub(b)}><DollarSign className="h-3 w-3" /> Manual Sub</Button>
                {b.subscriptionStatus === "active" && (
                  <Button variant="outline" size="xs" className="gap-1 bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200" onClick={() => openEmailPreview(b._id)}>
                    <Mail className="h-3 w-3" /> Mail
                  </Button>
                )}
                {b.subscriptionStatus === "active" && (
                  <Button variant="destructive" size="xs" className="gap-1" onClick={() => { if(confirm(\`Cancel subscription for \${b.name}?\`)) cancelSubMutation.mutate(b._id); }}>Cancel Sub</Button>
                )}
                <Button variant="soft" size="xs" className="gap-1" onClick={() => triggerImpersonate(b)}><LogIn className="h-3 w-3" /> Impersonate</Button>
                <div className="w-28">
                  <Select
                    id={\`set-status-\${b._id}\`} value={b.status || "pending"}
                    onValueChange={(status) => setBizStatusMutation.mutate({ id: b._id, status })}
                    options={[
                      { value: "active", label: "Active" }, { value: "suspended", label: "Suspend" }, { value: "banned", label: "Ban Account" }
                    ]}
                  />
                </div>
              </div>
            )
          }`;

const newActionsContent = `          {
            key: "actions", header: "Administration Tools",
            render: (b) => (
              <div className="flex gap-2 items-center justify-end pr-4">
                {b.status === "pending" && (
                  <Button variant="default" size="xs" className="gap-1 bg-success hover:bg-success/90" onClick={() => approveBizMutation.mutate(b._id)}>
                    <CheckCircle2 className="h-3 w-3" /> Approve
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => openPlanEdit(b)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openManualSub(b)}>
                      <DollarSign className="mr-2 h-4 w-4" /> Manual Sub
                    </DropdownMenuItem>
                    {b.subscriptionStatus === "active" && (
                      <DropdownMenuItem onClick={() => openEmailPreview(b._id)}>
                        <Mail className="mr-2 h-4 w-4" /> Mail
                      </DropdownMenuItem>
                    )}
                    {b.subscriptionStatus === "active" && (
                      <DropdownMenuItem onClick={() => { if(confirm(\`Cancel subscription for \${b.name}?\`)) cancelSubMutation.mutate(b._id); }} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        Cancel Sub
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => triggerImpersonate(b)}>
                      <LogIn className="mr-2 h-4 w-4" /> Impersonate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "active" })}>
                      Set Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "suspended" })}>
                      Suspend
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setBizStatusMutation.mutate({ id: b._id, status: "banned" })}>
                      Ban Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          }`;

pageContent = pageContent.replace(oldActionsStart, newActionsContent);
fs.writeFileSync(pageFile, pageContent);
console.log('Updated page.tsx');
