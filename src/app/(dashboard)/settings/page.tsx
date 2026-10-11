import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata = {
  title: "Pengaturan - Expense Tracker",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/settings");
  }

  return <SettingsPanel user={user} />;
}
