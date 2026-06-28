import { redirect } from "next/navigation";
import { APP_ROUTES } from "@/lib/routes";

export default function AdminRootPage() {
  redirect(APP_ROUTES.ADMIN_BUSINESSES);
}
