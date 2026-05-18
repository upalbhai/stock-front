import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const roles = [
  { role: "Owner / Admin", access: "Full access" },
  { role: "Manager", access: "Stock, reports, approvals" },
  { role: "Staff / Cashier", access: "Billing and daily tasks" }
];

const toggles = [
  { label: "Low stock alerts", defaultChecked: true },
  { label: "Auto tax calculation", defaultChecked: true },
  { label: "Offline ready mode", defaultChecked: false }
];

export default function SettingsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Outlet Settings</CardTitle>
          <CardDescription>Basic outlet preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="space-y-2 text-sm">
            Outlet Name
            <Input defaultValue="Main Outlet" />
          </label>
          <label className="space-y-2 text-sm">
            Default Language
            <Input defaultValue="English (Hindi/Gujarati ready)" />
          </label>
          <div className="space-y-3">
            {toggles.map((toggle) => (
              <label
                key={toggle.label}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface/70 p-3 text-sm"
              >
                <span>{toggle.label}</span>
                <input
                  type="checkbox"
                  defaultChecked={toggle.defaultChecked}
                  className="h-5 w-5 accent-primary"
                />
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>Assign user access levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.role}
              className="rounded-2xl border border-border/70 bg-surface/70 p-3"
            >
              <p className="text-sm font-semibold">{role.role}</p>
              <p className="text-xs text-muted">{role.access}</p>
              <Badge variant="soft" className="mt-2">
                Active
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
