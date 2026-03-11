import type { Metadata } from "next";

import "@/app/globals.css";

import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Gear Locker",
  description: "Personal production inventory and asset tracking",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
