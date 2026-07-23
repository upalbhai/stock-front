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
  UserCheck,
  Banknote,
} from "lucide-react";
import type { UserRole } from "@/lib/types";
import { APP_ROUTES } from "@/lib/routes";

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
        path: APP_ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        keywords: ["home", "stats", "overview", "analytics"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Billing",
        path: APP_ROUTES.BILLING,
        icon: Receipt,
        keywords: ["bill", "pos", "sale", "invoice", "checkout"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Orders",
        path: APP_ROUTES.ORDERS,
        icon: History,
        keywords: ["orders", "history", "sales"],
        roles: ["owner", "manager"],
        feature: "order_history",
      },
      {
        title: "Customers",
        path: APP_ROUTES.CUSTOMERS,
        icon: UserCircle,
        keywords: ["customers", "clients", "khata"],
        roles: ["owner", "manager"],
        feature: "customers",
      },
      {
        title: "Invoices",
        path: APP_ROUTES.INVOICES,
        icon: FileText,
        keywords: ["invoices", "gst", "tax"],
        roles: ["owner", "manager"],
        feature: "gst_invoices",
      },
      {
        title: "Products",
        path: APP_ROUTES.PRODUCTS,
        icon: Tag,
        keywords: ["products", "items", "catalog"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Categories",
        path: APP_ROUTES.CATEGORIES,
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
        path: APP_ROUTES.STOCK,
        icon: Package,
        keywords: ["inventory", "stock", "quantity"],
        roles: ["owner", "manager", "staff"],
      },
      {
        title: "Units",
        path: APP_ROUTES.UNITS,
        icon: Gauge,
        keywords: ["units", "measurement"],
        roles: ["owner", "manager"],
      },
      {
        title: "Transfers",
        path: APP_ROUTES.STOCK_TRANSFERS,
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
        path: APP_ROUTES.PROFIT,
        icon: TrendingUp,
        keywords: ["profit", "loss", "pnl", "finance"],
        roles: ["owner", "manager"],
      },
      {
        title: "Reports",
        path: APP_ROUTES.REPORTS,
        icon: LineChart,
        keywords: ["reports", "analytics", "charts"],
        roles: ["owner", "manager"],
      },
      {
        title: "Expenses",
        path: APP_ROUTES.EXPENSES,
        icon: DollarSign,
        keywords: ["expenses", "costs"],
        roles: ["owner", "manager"],
      },
      {
        title: "Outlets",
        path: APP_ROUTES.OUTLETS,
        icon: Store,
        keywords: ["outlets", "branches", "locations"],
        roles: ["owner"],
      },
      {
        title: "Staff",
        path: APP_ROUTES.STAFF,
        icon: Users,
        keywords: ["staff", "employees", "team"],
        roles: ["owner", "manager"],
      },
      {
        title: "Roles",
        path: APP_ROUTES.ROLES,
        icon: Shield,
        keywords: ["roles", "permissions", "access"],
        roles: ["owner"],
      },
      {
        title: "Audit Logs",
        path: APP_ROUTES.AUDIT_LOGS,
        icon: ClipboardList,
        keywords: ["audit", "logs", "history", "trail"],
        roles: ["owner"],
      },
      {
        title: "Settings",
        path: APP_ROUTES.SETTINGS,
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
        path: APP_ROUTES.ADMIN,
        icon: Sparkles,
        keywords: ["dashboard", "stats", "overview", "platform"],
        roles: ["superadmin"],
        feature: "dashboard"
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        title: "Businesses",
        path: APP_ROUTES.ADMIN_BUSINESSES,
        icon: Store,
        keywords: ["businesses", "clients", "accounts"],
        roles: ["superadmin"],
        feature: "businesses"
      },
      {
        title: "Agents",
        path: APP_ROUTES.ADMIN_AGENTS,
        icon: UserCheck,
        keywords: ["agents", "sales", "partners", "commission"],
        roles: ["superadmin"],
        feature: "agents"
      },
      {
        title: "Manual Payments",
        path: APP_ROUTES.ADMIN_PAYMENTS,
        icon: Banknote,
        keywords: ["payments", "verification", "manual", "proofs"],
        roles: ["superadmin"],
        feature: "payments"
      },
      {
        title: "Subscriptions",
        path: APP_ROUTES.ADMIN_SUBSCRIPTIONS,
        icon: Receipt,
        keywords: ["subscriptions", "billing"],
        roles: ["superadmin"],
        feature: "subscriptions"
      },
      {
        title: "Outlets",
        path: APP_ROUTES.ADMIN_OUTLETS,
        icon: Store,
        keywords: ["outlets", "branches"],
        roles: ["superadmin"],
        feature: "businesses"
      },
      {
        title: "Users Registry",
        path: APP_ROUTES.ADMIN_USERS,
        icon: Users,
        keywords: ["users", "accounts", "registry"],
        roles: ["superadmin"],
        feature: "users"
      },
      {
        title: "Audit Trails",
        path: APP_ROUTES.ADMIN_AUDIT_LOGS,
        icon: ClipboardList,
        keywords: ["audit", "logs", "trails"],
        roles: ["superadmin"],
        feature: "audit_logs"
      },
      {
        title: "Plans",
        path: APP_ROUTES.ADMIN_PLANS,
        icon: CreditCard,
        keywords: ["plans", "subscriptions", "pricing"],
        roles: ["superadmin"],
        feature: "plans"
      },
      {
        title: "Platform Settings",
        path: APP_ROUTES.ADMIN_SETTINGS,
        icon: Settings,
        keywords: ["settings", "global", "configuration"],
        roles: ["superadmin"],
        feature: "settings"
      },
    ],
  },
];

export const agentSidebarGroups: SidebarGroupDef[] = [
  {
    label: "Agent Portal",
    items: [
      {
        title: "Dashboard",
        path: APP_ROUTES.AGENT,
        icon: LayoutDashboard,
        keywords: ["dashboard", "stats", "overview", "agent"],
        roles: ["agent"],
      },
      {
        title: "Clients & Custom Plans",
        path: APP_ROUTES.AGENT_CLIENTS,
        icon: Users,
        keywords: ["clients", "plans", "custom", "pricing"],
        roles: ["agent"],
      },
    ],
  },
];

export const allSidebarItems = [
  ...sidebarGroups.flatMap((g) => g.items),
  ...adminSidebarGroups.flatMap((g) => g.items),
  ...agentSidebarGroups.flatMap((g) => g.items),
];

export const bottomNavItems = [
  { href: APP_ROUTES.DASHBOARD, label: "Home", icon: LayoutDashboard, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: APP_ROUTES.BILLING, label: "Billing", icon: Receipt, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: APP_ROUTES.PRODUCTS, label: "Products", icon: Tag, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: APP_ROUTES.STOCK, label: "Stock", icon: Package, roles: ["owner", "manager", "staff"] as UserRole[] },
  { href: APP_ROUTES.SETTINGS, label: "Settings", icon: Settings, roles: ["owner", "manager", "staff"] as UserRole[] },
];
