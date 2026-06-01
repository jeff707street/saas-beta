"use client";

import Link from "next/link";
import { ArrowRight, Building2, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";

const settingsPages = [
  {
    title: "Company Settings",
    description: "Manage company members, invitations, join requests, and access roles.",
    href: "/settings/company",
    icon: Building2,
  },
  {
    title: "Warehouse Settings",
    description: "Create warehouses and open the zone layout editor for structural setup.",
    href: "/settings/warehouse",
    icon: Warehouse,
  },
] as const;

export function SettingsPageClient() {
  return (
    <>
      <PageHeader title="Settings" description="Manage workspace setup from focused settings pages." />
      <div className="grid gap-4 xl:grid-cols-3">
        {settingsPages.map((page) => {
          const Icon = page.icon;

          return (
            <Link key={page.href} href={page.href} className="group block">
              <Card className="h-full border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
                <CardContent className="flex h-full flex-col justify-between gap-8 p-6">
                  <div>
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition-colors group-hover:bg-blue-50 group-hover:text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-950">{page.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{page.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-medium text-slate-700">
                    <span>Open</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
