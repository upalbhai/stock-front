import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  Receipt,
  LineChart,
  Settings,
  Store,
  Users,
  Shield,
  DollarSign,
  ArrowLeftRight,
  ClipboardList,
  Tag,
  FolderOpen,
  Gauge,
  History,
  UserCircle,
  FileText,
  TrendingUp,
  CreditCard,
  Sparkles,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export type SidebarItem = {
  title: string;
  path: string;
  icon: LucideIcon;
  keywords: string[];
  roles: UserRole[];
  feature?: string;
};

export type SidebarGroupDef = {
  label: string;
  items: SidebarItem[];
};

export const sidebarGroups: SidebarGroupDef[] = [
  {
    label: "Operations",
    items: [
      {
        title: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        keywords: ["home", "stats", "overview", "analytics"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Billing",
        path: "/billing",
        icon: Receipt,
        keywords: ["bill", "pos", "sale", "invoice", "checkout"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Orders",
        path: "/orders",
        icon: History,
        keywords: ["orders", "history", "sales"],
        roles: ["owner", "manager"],
        feature: "order_history",
      },
      {
        title: "Customers",
        path: "/customers",
        icon: UserCircle,
        keywords: ["customers", "clients", "khata"],
        roles: ["owner", "manager"],
        feature: "customers",
      },
      {
        title: "Invoices",
        path: "/invoices",
        icon: FileText,
        keywords: ["invoices", "gst", "tax"],
        roles: ["owner", "manager"],
        feature: "gst_invoices",
      },
      {
        title: "Products",
        path: "/products",
        icon: Tag,
        keywords: ["products", "items", "catalog"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Categories",
        path: "/categories",
        icon: FolderOpen,
        keywords: ["categories", "groups"],
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        title: "Stock",
        path: "/stock",
        icon: Package,
        keywords: ["inventory", "stock", "quantity"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Units",
        path: "/units",
        icon: Gauge,
        keywords: ["units", "measurement"],
        roles: ["owner", "manager"],
      },
      {
        title: "Transfers",
        path: "/stock/transfers",
        icon: ArrowLeftRight,
        keywords: ["transfers", "move stock"],
        roles: ["owner", "manager"],
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        title: "Profit & Loss",
        path: "/profit",
        icon: TrendingUp,
        keywords: ["profit", "loss", "pnl", "finance"],
        roles: ["owner", "manager"],
      },
      {
        title: "Reports",
        path: "/reports",
        icon: LineChart,
        keywords: ["reports", "analytics", "charts"],
        roles: ["owner", "manager"],
      },
      {
        title: "Expenses",
        path: "/expenses",
        icon: DollarSign,
        keywords: ["expenses", "costs"],
        roles: ["owner", "manager"],
      },
      {
        title: "Outlets",
        path: "/outlets",
        icon: Store,
        keywords: ["outlets", "branches", "locations"],
        roles: ["owner"],
      },
      {
        title: "Staff",
        path: "/staff",
        icon: Users,
        keywords: ["staff", "employees", "team"],
        roles: ["owner", "manager"],
      },
      {
        title: "Roles",
        path: "/roles",
        icon: Shield,
        keywords: ["roles", "permissions", "access"],
        roles: ["owner"],
      },
      {
        title: "Audit Logs",
        path: "/audit-logs",
        icon: ClipboardList,
        keywords: ["audit", "logs", "history", "trail"],
        roles: ["owner"],
      },
      {
        title: "Settings",
        path: "/settings",
        icon: Settings,
        keywords: ["settings", "configuration", "preferences"],
        roles: ["owner", "manager", "staff"],
      },
    ],
  },
];

export const adminSidebarGroups: SidebarGroupDef[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Platform Dashboard",
        path: "/admin/businesses",
        icon: Sparkles,
        keywords: ["dashboard", "stats", "overview", "platform"],
        roles: ["superadmin"],
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        title: "Businesses",
        path: "/admin/businesses",
        icon: Store,
        keywords: ["businesses", "clients", "accounts"],
        roles: ["superadmin"],
      },
      {
        title: "Outlets",
        path: "/admin/outlets",
        icon: Store,
        keywords: ["outlets", "branches"],
        roles: ["superadmin"],
      },
      {
        title: "Users Registry",
        path: "/admin/users",
        icon: Users,
        keywords: ["users", "accounts", "registry"],
        roles: ["superadmin"],
      },
      {
        title: "Audit Trails",
        path: "/admin/audit-logs",
        icon: ClipboardList,
        keywords: ["audit", "logs", "trails"],
        roles: ["superadmin"],
      },
      {
        title: "Plans",
        path: "/admin/plans",
        icon: CreditCard,
        keywords: ["plans", "subscriptions", "pricing"],
        roles: ["superadmin"],
      },
    ],
  },
];

export const allSidebarItems = [
  ...sidebarGroups.flatMap((g) => g.items),
  ...adminSidebarGroups.flatMap((g) => g.items),
];

export const bottomNavItems = [
  { href: "/", label: "Home", icon: LayoutDashboard, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/billing", label: "Billing", icon: Receipt, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/products", label: "Products", icon: Tag, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/stock", label: "Stock", icon: Package, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["owner", "manager", "staff"] as UserRole[] },
];
