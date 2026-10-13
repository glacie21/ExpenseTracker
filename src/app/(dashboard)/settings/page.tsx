import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export const metadata = {
  title: "Pengaturan",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/api/auth/session-expired?redirect=/settings");
  }

  return <SettingsPanel user={user} />;
}
