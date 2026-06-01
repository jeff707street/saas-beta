"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth, useOrganizationList, useUser, UserButton } from "@clerk/nextjs";
import {
  Boxes,
  Building2,
  Check,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Package,
  PackageSearch,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Warehouse,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/products", label: "Products", icon: Package },
  { href: "/warehouse", label: "Warehouse", icon: Warehouse },
  { href: "/channels", label: "Channels", icon: Store },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1", mobile && "grid grid-cols-4 gap-1 space-y-0")}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-slate-900 text-white hover:bg-slate-900 hover:text-white",
              mobile && "flex-col gap-1 px-2 py-2 text-[11px]",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function WorkspaceSwitcher() {
  const { orgId } = useAuth();
  const { user } = useUser();
  const { isLoaded, setActive, userMemberships } = useOrganizationList({ userMemberships: true });
  const memberships = userMemberships.data ?? [];
  const activeOrganization = memberships.find((membership) => membership.organization.id === orgId)?.organization;
  const personalLabel = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Personal workspace";
  const label = orgId ? activeOrganization?.name ?? "Organization workspace" : personalLabel;

  async function selectPersonalWorkspace() {
    if (!isLoaded || !setActive) {
      return;
    }

    await setActive({ organization: null, redirectUrl: "/dashboard" });
  }

  async function selectOrganization(organizationId: string) {
    if (!isLoaded || !setActive) {
      return;
    }

    await setActive({ organization: organizationId, redirectUrl: "/dashboard" });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-64 justify-between gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{isLoaded ? label : "Loading workspace"}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={selectPersonalWorkspace} className="flex items-center justify-between gap-2">
          <span className="truncate">Personal workspace</span>
          {!orgId ? <Check className="h-4 w-4 text-blue-600" /> : null}
        </DropdownMenuItem>
        {memberships.length > 0 ? <div className="my-1 border-t border-slate-200" /> : null}
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organization.id}
            onClick={() => selectOrganization(membership.organization.id)}
            className="flex items-center justify-between gap-2"
          >
            <span className="truncate">{membership.organization.name}</span>
            {orgId === membership.organization.id ? <Check className="h-4 w-4 text-blue-600" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white px-4 py-5 lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white">
            <PackageSearch className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">OpsFlow WMS</div>
            <div className="text-xs text-muted-foreground">Commerce control</div>
          </div>
        </Link>
        <Navigation />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 border-b bg-white/85 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="left-0 right-auto max-w-72 border-l-0 border-r">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <Navigation />
              </SheetContent>
            </Sheet>
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search orders, SKUs, channels..." />
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <WorkspaceSwitcher />
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="px-4 pb-24 pt-6 sm:px-6 lg:pb-8"
        >
          {children}
        </motion.main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-white p-2 lg:hidden">
        <Navigation mobile />
      </div>
    </div>
  );
}
