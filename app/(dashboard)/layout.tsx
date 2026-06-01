import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const tenant = await getTenantContext();

  if (tenant.clerkOrganizationId) {
    const company = await prisma.company.findUnique({
      where: { id: tenant.companyId },
      include: {
        warehouses: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (company && (company.onboardingStatus !== "active" || company.warehouses.length === 0)) {
      redirect("/onboarding");
    }
  }

  return <AppShell>{children}</AppShell>;
}
