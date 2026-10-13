import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { REQUEST_PATH_HEADER } from "@/lib/jwt";
import { DashboardShell } from "@/components/dashboard/DashboardShell";


export const metadata = {
  title: { default: "Ringkasan - Expense Tracker", template: "%s - Expense Tracker" },
  description: "Pantau ringkasan kondisi keuangan pribadi Anda",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Clears a revoked cookie first; redirecting to /login directly would loop via the proxy
  if (!user) {
    const requestedPath = (await headers()).get(REQUEST_PATH_HEADER) ?? "/dashboard";
    redirect(`/api/auth/session-expired?redirect=${encodeURIComponent(requestedPath)}`);
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
