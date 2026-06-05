export type UserRole = "superadmin" | "owner" | "manager" | "staff";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CursorMeta {
  nextCursor: string | null;
  hasNextPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: {
    pagination?: PaginationMeta;
    cursor?: CursorMeta;
  } | null;
}

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
  businessId?: string | null;
  outletId?: string | null;
  outletIds?: string[];
  subscriptionStatus?: "trial" | "active" | "expired" | "cancelled" | null;
  trialEndsAt?: string | null;
  trialExpired?: boolean;
};

export type Plan = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxOutlets: number;
  maxStaff: number;
  maxProducts: number;
  features: string[];
  isPopular?: boolean;
  isActive: boolean;
};

export type Business = {
  _id: string;
  name: string;
  code: string;
  plan?: string;
  planId?: Plan | string;
  subscriptionStatus?: "trial" | "active" | "expired" | "cancelled";
  status?: "pending" | "active" | "suspended" | "banned";
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  maxOutlets?: number;
  maxStaff?: number;
  maxProducts?: number;
  isActive: boolean;
  currency: string;
  timezone: string;
  logo?: string;
  address?: string;
  gstNumber?: string;
  phone?: string;
  email?: string;
  settings?: {
    requireCustomerName?: boolean;
    defaultTaxRate?: number;
  };
};

export type Outlet = {
  _id: string;
  businessId: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  taxEnabled: boolean;
  defaultTaxRate: number;
  billingModes: string[];
  settings?: {
    enableUPI?: boolean;
    enableCard?: boolean;
    enableCash?: boolean;
    enableWallet?: boolean;
    requireCustomerName?: boolean;
    printReceiptDefault?: boolean;
  };
  managerId?: { _id: string; name: string; phone: string } | null;
};

export type Category = {
  _id: string;
  businessId: string;
  parentId?: string | null;
  name: string;
  slug: string;
  icon: string;
  color: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  children?: Category[];
};

export type Unit = {
  _id: string;
  businessId: string;
  outletId?: string | null;
  name: string;
  key: string;
  abbreviation?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  _id: string;
  businessId: string;
  outletId: string;
  categoryId?: Category | string | null;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  unit: string;
  price: number;
  costPrice?: number;
  taxRate: number;
  gstRate: number;
  onHandQty: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured?: boolean;
  image?: string;
  tags?: string[];
  sortOrder: number;
};

export type OrderItem = {
  productId?: string;
  name: string;
  qty: number;
  unit?: string;
  price: number;
  taxRate: number;
  discount?: number;
  lineTotal: number;
  taxTotal: number;
  notes?: string;
};

export type Order = {
  _id: string;
  businessId: string;
  outletId: string;
  orderNumber: string;
  billingMode: "takeaway" | "dine_in" | "parcel" | "quick";
  customerName?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  status: "pending" | "completed" | "cancelled" | "refunded";
  paymentStatus: "paid" | "partial" | "pending";
  createdBy?: { name: string };
  createdAt: string;
};

export type Payment = {
  _id: string;
  orderId: string;
  method: "cash" | "upi" | "card" | "wallet" | "split";
  amount: number;
  split?: { cash?: number; upi?: number; card?: number; wallet?: number };
};

export type Role = {
  _id: string;
  businessId: string;
  name: string;
  description?: string;
  permissions: { module: string; actions: string[] }[];
  outletScope: "all" | "restricted";
  outletIds: string[];
  isSystem: boolean;
};

export type StaffUser = {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  businessId: string;
  outletIds: string[];
  roleId?: Role | string | null;
  isActive: boolean;
  lastLoginAt?: string;
};

export type Expense = {
  _id: string;
  outletId: string;
  category: string;
  amount: number;
  note?: string;
  date: string;
  createdBy?: { name: string };
};

export type AuditLog = {
  _id: string;
  actorName?: string;
  actorRole?: string;
  impersonatorName?: string;
  module?: string;
  action: string;
  targetType?: string;
  targetName?: string;
  message?: string;
  ip?: string;
  createdAt: string;
};

export type StockTransfer = {
  _id: string;
  fromOutletId: { _id: string; name: string };
  toOutletId: { _id: string; name: string };
  items: { productId: string; productName: string; qty: number; unit: string }[];
  status: "pending" | "approved" | "completed" | "rejected";
  note?: string;
  requestedBy?: { name: string };
  createdAt: string;
};
