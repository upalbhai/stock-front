"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Select } from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import { useAuth } from "@/components/auth/auth-provider";
import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import { outletService } from "@/services/outlet.service";
import type { StaffUser } from "@/lib/types";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/lib/error";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const getStaffSchema = (isEdit: boolean) => z.object({
  name: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: isEdit
    ? z.string().optional().refine((val) => !val || val.length >= 6, {
        message: "Password must be at least 6 characters",
      })
    : z.string().min(6, "Password must be at least 6 characters"),
  role: z.string().min(1, "Role is required"),
  roleId: z.string().optional(),
  outletIds: z.array(z.string()),
});

type StaffFormValues = z.infer<ReturnType<typeof getStaffSchema>>;

export default function StaffPage() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [showModal, setShowModal] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const staffSchema = getStaffSchema(!!editId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      role: "staff",
      roleId: "",
      outletIds: [],
      password: "",
    },
  });

  // Watch values for custom controlled fields/UI updates
  const watchedRole = watch("role");
  const watchedRoleId = watch("roleId");
  const watchedOutletIds = watch("outletIds") || [];

  const { data: staffData, isLoading, refetch } = useQuery({
    queryKey: ["staff", search],
    queryFn: () => userService.getUsers(token, { search: search || undefined }),
    enabled: Boolean(token)
  });
  const { data: rolesData } = useQuery({ queryKey: ["roles"], queryFn: () => roleService.getRoles(token), enabled: Boolean(token) });
  const { data: outletsData } = useQuery({ queryKey: ["outlets"], queryFn: () => outletService.getOutlets(token), enabled: Boolean(token) });

  const saveMutation = useMutation({
    mutationFn: (body: StaffFormValues) => {
      // Clean up body (remove empty strings or empty password on edit)
      const cleanBody: any = { ...body };
      if (!cleanBody.email) delete cleanBody.email;
      cleanBody.roleId = cleanBody.roleId || null;
      if (editId && !cleanBody.password) delete cleanBody.password;
      return editId ? userService.updateUser(editId, cleanBody, token) : userService.createUser(cleanBody, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      setShowModal(false);
      toast.success(editId ? "Staff updated" : "Staff invited");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to save staff"))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff deleted");
    },
    onError: (err: any) => toast.error(getErrorMessage(err, "Failed to delete staff"))
  });

  const users = staffData?.users ?? [];
  const roles = rolesData?.roles ?? [];
  const outlets = outletsData?.outlets ?? [];

  const openCreate = () => {
    setEditId(null);
    reset({ name: "", phone: "", email: "", role: "staff", roleId: "", outletIds: [], password: "" });
    setShowModal(true);
  };

  const openEdit = (u: StaffUser) => {
    setEditId(u._id);
    reset({
      name: u.name,
      phone: u.phone,
      email: u.email ?? "",
      role: u.role,
      roleId: typeof u.roleId === "object" ? u.roleId?._id ?? "" : u.roleId ?? "",
      outletIds: u.outletIds || [],
      password: ""
    });
    setShowModal(true);
  };

  const onSubmit = (data: StaffFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm text-muted">{users.length} team members</p>
        </div>
      </div>

      <DataTable
        isLoading={isLoading}
        data={users}
        keyExtractor={(u) => u._id}
        searchQuery={search}
        onSearchChange={setSearch}
        onRefetch={() => refetch()}
        placeholderText="Search by name or phone..."
        emptyStateText="No staff members yet."
        filters={
          <Button id="add-staff-btn" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Staff
          </Button>
        }
        columns={[
          {
            key: "name",
            header: "Staff Member",
            render: (u) => (
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size="sm" />
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted">
                    {u.phone} {u.email ? `• ${u.email}` : ""}
                  </p>
                </div>
              </div>
            )
          },
          { key: "role", header: "Role", render: (u) => <Badge variant="soft" className="capitalize">{u.role}</Badge> },
          { key: "outletIds", header: "Outlets", render: (u) => <span className="text-sm text-muted">{u.outletIds.length === 0 ? "All" : `${u.outletIds.length} outlet(s)`}</span> },
          { key: "isActive", header: "Status", render: (u) => <Badge variant={u.isActive ? "soft" : "danger"}>{u.isActive ? "Active" : "Inactive"}</Badge> },
          {
            key: "actions",
            header: "",
            render: (u) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-danger" onClick={() => setDeleteId(u._id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          }
        ]}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? "Edit Staff" : "Add Staff"} size="md">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Full Name *</label>
              <Input id="staff-name" {...register("name")} />
              {errors.name && <p className="text-[10px] text-danger mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Phone *</label>
              <Input id="staff-phone" {...register("phone")} />
              {errors.phone && <p className="text-[10px] text-danger mt-1">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Email</label>
              <Input id="staff-email" type="email" placeholder="e.g. staff@business.com" {...register("email")} />
              {errors.email && <p className="text-[10px] text-danger mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Password {editId ? "(leave blank to keep)" : "*"}</label>
              <Input id="staff-password" type="password" {...register("password")} placeholder="At least 6 characters" />
              {errors.password && <p className="text-[10px] text-danger mt-1">{errors.password.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Role</label>
              <Select
                id="staff-role"
                value={watchedRole}
                onValueChange={(v) => setValue("role", v, { shouldValidate: true })}
                options={[
                  { value: "manager", label: "Manager" },
                  { value: "staff", label: "Staff" }
                ]}
              />
              {errors.role && <p className="text-[10px] text-danger mt-1">{errors.role.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Permission Set</label>
              <Select
                id="staff-role-id"
                value={watchedRoleId}
                onValueChange={(v) => setValue("roleId", v, { shouldValidate: true })}
                options={[
                  { value: "", label: "Default" },
                  ...roles.map((r) => ({ value: r._id, label: r.name }))
                ]}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Outlets</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {outlets.map((o) => {
                const isSelected = watchedOutletIds.includes(o._id);
                return (
                  <button
                    key={o._id}
                    type="button"
                    onClick={() => {
                      const nextOutlets = isSelected
                        ? watchedOutletIds.filter((id) => id !== o._id)
                        : [...watchedOutletIds, o._id];
                      setValue("outletIds", nextOutlets, { shouldValidate: true });
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? "bg-primary text-white border-primary"
                        : "border-border text-muted"
                    }`}
                  >
                    {o.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : (editId ? "Save Changes" : "Add Staff")}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Deactivate Staff?"
        message="This user will lose access immediately."
        confirmLabel="Deactivate"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
