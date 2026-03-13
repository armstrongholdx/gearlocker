"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, House, MapPinned, PackagePlus, QrCode, ScanSearch, Settings2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const operationalNavItems = [
  { href: "/", label: "Dashboard", icon: House, caption: "Command center" },
  { href: "/inventory", label: "Inventory", icon: Boxes, caption: "Primary operating surface" },
  { href: "/kits", label: "Kits", icon: QrCode, caption: "Packages and return checks" },
  { href: "/locations", label: "Locations", icon: MapPinned, caption: "Storage map" },
  { href: "/scan", label: "Scan", icon: ScanSearch, caption: "Action-first workflow" },
];

const setupNavItems = [
  { href: "/items/new", label: "Add Item", icon: PackagePlus, caption: "Create a record" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeItem = [...operationalNavItems, ...setupNavItems].find((item) => isActive(pathname, item.href)) ?? operationalNavItems[0];

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="surface-grid hidden w-[290px] shrink-0 border-r border-white/80 bg-slate-950/[0.96] px-5 py-6 text-slate-100 lg:flex lg:flex-col">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-slate-950 shadow-[0_16px_40px_rgba(236,172,54,0.28)]">
                <Settings2 className="h-6 w-6" />
              </div>
              <div>
                <Link href="/" className="text-lg font-semibold tracking-tight text-white">
                  Gear Locker
                </Link>
                <p className="text-sm text-slate-400">Production inventory</p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              Asset IDs drive labels, scan actions, and navigation. Use the dashboard as the daily command center.
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <NavGroup title="Operate" items={operationalNavItems} pathname={pathname} />
            <NavGroup title="Create" items={setupNavItems} pathname={pathname} />
          </div>

          <div className="mt-auto rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            Desktop-first management UI with scan-oriented shortcuts and mobile-safe navigation.
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-background/85 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Gear Locker</div>
                <div className="text-lg font-semibold tracking-tight">{activeItem.label}</div>
                <div className="text-sm text-muted-foreground">{activeItem.caption}</div>
              </div>
              <div className="hidden items-center gap-2 md:flex">
                <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs text-slate-600">
                  Asset ID-first operations
                </div>
                <Link href="/scan" className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium hover:bg-white">
                  Scan action
                </Link>
                <Link href="/items/new" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[0_12px_32px_rgba(15,23,42,0.16)]">
                  Add item
                </Link>
              </div>
            </div>
            <div className="scroll-fade flex gap-2 overflow-x-auto px-4 pb-4 sm:px-6 lg:hidden">
              {[...operationalNavItems, ...setupNavItems].map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm whitespace-nowrap",
                      active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white/80 text-slate-700",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: Array<{ href: string; label: string; icon: LucideIcon; caption: string }>;
  pathname: string;
}) {
  return (
    <div>
      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</div>
      <nav className="space-y-2">
        {items.map(({ href, label, icon: Icon, caption }) => {
          const active = isActive(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group flex items-start gap-3 rounded-2xl border px-4 py-3 transition",
                active
                  ? "border-white/10 bg-white text-slate-950 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
                  : "border-transparent bg-transparent text-slate-300 hover:border-white/8 hover:bg-white/6 hover:text-white",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl",
                  active ? "bg-slate-950 text-white" : "bg-white/8 text-slate-200 group-hover:bg-white/12",
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">{label}</div>
                <div className={cn("text-xs", active ? "text-slate-500" : "text-slate-500 group-hover:text-slate-400")}>{caption}</div>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
