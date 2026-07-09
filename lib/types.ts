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
  enabledFeatures?: string[];
  businessProfile?: "retail" | "wholesale" | "hybrid";
  planType?: "retail" | "wholesale" | "hybrid";
  customPermissions?: { module: string; actions: string[] }[];
  permissions?: { module: string; actions: string[] }[];
  preferredLoginMethod?: "password" | "otp";
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
  planType?: "retail" | "wholesale" | "hybrid";
  featureKeys?: string[];
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
  status?: "pending" | "active" | "suspended" | "banned";
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

export type PackagingUnit = {
  unitId: string | Unit;
  qtyPerUnit: number;
  price?: number;
  costPrice?: number;
  isActive?: boolean;
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
  unitId?: string | Unit;
  price: number;
  costPrice?: number;
  taxRate: number;
  gstRate: number;
  hsnCode?: string;
  packagingUnits?: PackagingUnit[];
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
  soldUnit?: string;
  soldQty?: number;
  hsnCode?: string;
  price: number;
  taxRate: number;
  discount?: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  lineTotal: number;
  taxTotal: number;
  notes?: string;
};

export type Order = {
  _id: string;
  businessId: string;
  outletId: string;
  orderNumber: string;
  invoiceNumber?: string;
  invoiceGeneratedAt?: string;
  billingMode: "takeaway" | "dine_in" | "parcel" | "quick" | "wholesale";
  taxMode?: "exclusive" | "inclusive";
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  amountPaid?: number;
  amountDue?: number;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  supplyType?: "intra" | "inter";
  total: number;
  notes?: string;
  status: "pending" | "completed" | "cancelled" | "refunded" | "voided";
  paymentStatus: "paid" | "partial" | "pending";
  payments?: { method: string; amount: number }[];
  createdBy?: { name: string };
  voidedBy?: { name: string };
  voidedAt?: string;
  voidReason?: string;
  refundedBy?: { name: string };
  refundedAt?: string;
  refundReason?: string;
  createdAt: string;
};

export type Payment = {
  _id: string;
  orderId: string;
  method: "cash" | "upi" | "card" | "wallet" | "split" | "credit";
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

export type Customer = {
  _id: string;
  businessId: string;
  outletId?: string | null;
  name: string;
  phone?: string;
  gstin?: string;
  address?: string;
  defaultTaxMode?: "exclusive" | "inclusive";
  outstandingBalance: number;
  creditLimit?: number;
  isActive: boolean;
  createdBy?: { name: string };
  createdAt?: string;
};

export type CustomerTransaction = {
  _id: string;
  customerId: string;
  type: "sale" | "payment" | "credit_note" | "opening_balance" | "void_reversal";
  orderId?: { _id: string; orderNumber: string; total: number } | string;
  debit: number;
  credit: number;
  balanceAfter: number;
  note?: string;
  status?: "active" | "voided";
  createdBy?: { name: string };
  createdAt: string;
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
  customPermissions?: { module: string; actions: string[] }[];
};

export type Expense = {
  _id: string;
  outletId: string;
  category: string;
  amount: number;
  note?: string;
  date: string;
  status?: "active" | "voided";
  voidedBy?: { name: string };
  voidedAt?: string;
  voidReason?: string;
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
