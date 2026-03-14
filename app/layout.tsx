import type { Metadata } from "next";

import "@/app/globals.css";

import { AppShell } from "@/components/app-shell";
import { getGlobalOperationalAlerts } from "@/lib/inventory/queries";

export const metadata: Metadata = {
  title: "Gear Locker",
  description: "Personal production inventory and asset tracking",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const alerts = await getGlobalOperationalAlerts();

  return (
    <html lang="en">
      <body>
        <AppShell alerts={alerts}>{children}</AppShell>
      </body>
    </html>
  );
}
