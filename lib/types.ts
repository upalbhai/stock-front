export type UserRole = "owner" | "manager" | "staff";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  outletId?: string | null;
};
