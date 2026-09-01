"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { useAuth } from "@/components/auth/auth-provider";
import { DataTable, ColumnDef } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";

type OtpLog = {
  _id: string;
  email: string;
  code: string;
  type: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
};

export default function AdminOtpLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<OtpLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminService.getOtpLogs(token || "", page, limit);
      if (res.success && res.data?.logs) {
        setLogs(res.data.logs);
        setTotal(res.data.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch OTP logs:", error);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit]);

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [token, fetchLogs]);

  const getStatusBadge = (log: OtpLog) => {
    const isExpired = new Date(log.expiresAt) < new Date();
    if (log.used) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" /> Used</Badge>;
    }
    if (isExpired) {
      return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
    }
    return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Active</Badge>;
  };

  const columns: ColumnDef<OtpLog>[] = [
    {
      header: "Email",
      accessorKey: "email",
      render: (row) => <span className="font-medium">{row.email}</span>,
    },
    {
      header: "Code",
      accessorKey: "code",
      render: (row) => (
        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-primary">
          {row.code}
        </code>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      render: (row) => <span className="capitalize">{row.type}</span>,
    },
    {
      header: "Status",
      accessorKey: "used",
      render: (row) => getStatusBadge(row),
    },
    {
      header: "Generated At",
      accessorKey: "createdAt",
      render: (row) => <span>{format(new Date(row.createdAt), "MMM d, yyyy h:mm a")}</span>,
    },
    {
      header: "Expires",
      accessorKey: "expiresAt",
      render: (row) => <span>{format(new Date(row.expiresAt), "h:mm a")}</span>,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OTP Logs</h1>
          <p className="text-muted-foreground">
            View recent login and invitation OTPs to assist users who are not receiving emails.
          </p>
        </div>
      </div>

      <DataTable
        title="Recent OTPs"
        description="OTPs are automatically deleted after 7 days."
        columns={columns}
        data={logs}
        isLoading={loading}
        totalItems={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onRefetch={fetchLogs}
        hidePagination={false}
      />
    </div>
  );
}
