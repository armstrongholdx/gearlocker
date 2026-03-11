import Link from "next/link";
import { Boxes, House, PackagePlus, QrCode, ScanSearch } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/items/new", label: "Add Item", icon: PackagePlus },
  { href: "/scan", label: "Scan", icon: ScanSearch },
  { href: "/kits", label: "Kits", icon: QrCode },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/60 bg-white/80 backdrop-blur">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Gear Locker
            </Link>
            <p className="text-sm text-muted-foreground">Personal production inventory</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
