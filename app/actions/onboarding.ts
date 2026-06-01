"use server";

import { Prisma } from "@prisma/client";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getEmailDomain, isPublicEmailDomain } from "@/lib/email-domain";
import { prisma } from "@/lib/prisma";
import { getDisplayName, getPrimaryEmail } from "@/lib/tenant";

export type OnboardingDomainMatch = {
  email: string;
  domain: string;
  isPublicDomain: boolean;
  warehouseSetup?: {
    companyId: string;
    clerkOrganizationId: string;
    companyName: string;
  };
  companies: Array<{
    id: string;
    name: string;
    domain: string;
    existingRequest?: {
      id: string;
      status: string;
    };
  }>;
  existingRequest?: {
    id: string;
    status: string;
  };
};

async function requireOnboardingUser() {
  const session = await auth.protect();
  const user = await currentUser();
  const email = getPrimaryEmail(user);

  if (!user || !email) {
    throw new Error("A verified email address is required to continue.");
  }

  const dbUser = await prisma.user.upsert({
    where: { clerkUserId: session.userId },
    create: {
      clerkUserId: session.userId,
      email,
      name: getDisplayName(user),
    },
    update: {
      email,
      name: getDisplayName(user),
    },
  });

  return {
    clerkUserId: session.userId,
    orgId: session.orgId,
    user: dbUser,
    email,
    domain: getEmailDomain(email),
  };
}

export async function getOnboardingDomainMatch(): Promise<OnboardingDomainMatch> {
  const context = await requireOnboardingUser();
  const isPublicDomain = !context.domain || isPublicEmailDomain(context.domain);

  if (context.orgId) {
    const company = await prisma.company.findUnique({
      where: { clerkOrganizationId: context.orgId },
      include: {
        warehouses: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (company && (company.onboardingStatus !== "active" || company.warehouses.length === 0)) {
      return {
        email: context.email,
        domain: context.domain,
        isPublicDomain,
        warehouseSetup: {
          companyId: company.id,
          clerkOrganizationId: context.orgId,
          companyName: company.name,
        },
        companies: [],
      };
    }
  }

  if (isPublicDomain) {
    return {
      email: context.email,
      domain: context.domain,
      isPublicDomain: true,
      companies: [],
    };
  }

  const companyDomains = await prisma.companyDomain.findMany({
    where: { domain: context.domain },
    include: {
      company: {
        include: {
          joinRequests: {
            where: {
              userId: context.user.id,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    email: context.email,
    domain: context.domain,
    isPublicDomain: false,
    companies: companyDomains.map((companyDomain) => ({
      id: companyDomain.company.id,
      name: companyDomain.company.name,
      domain: companyDomain.domain,
      existingRequest: companyDomain.company.joinRequests[0]
        ? {
            id: companyDomain.company.joinRequests[0].id,
            status: companyDomain.company.joinRequests[0].status,
          }
        : undefined,
    })),
  };
}

export async function requestJoinCompanyAction(companyId: string, message?: string) {
  const context = await requireOnboardingUser();

  if (!context.domain || isPublicEmailDomain(context.domain)) {
    throw new Error("Use a business email address to request access to an existing company.");
  }

  const companyDomain = await prisma.companyDomain.findFirst({
    where: {
      companyId,
      domain: context.domain,
    },
    include: {
      company: true,
    },
  });

  if (!companyDomain) {
    throw new Error("This email domain is not associated with the selected company.");
  }

  const request = await prisma.companyJoinRequest.upsert({
    where: {
      companyId_userId: {
        companyId,
        userId: context.user.id,
      },
    },
    create: {
      companyId,
      userId: context.user.id,
      email: context.email,
      domain: context.domain,
      message: message?.trim() || null,
    },
    update: {
      status: "pending",
      message: message?.trim() || null,
    },
  });

  revalidatePath("/onboarding");
  return {
    id: request.id,
    companyName: companyDomain.company.name,
    status: request.status,
  };
}

export async function createCompanyWorkspaceAction(name: string) {
  const context = await requireOnboardingUser();
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Company name is required.");
  }

  const domain = context.domain && !isPublicEmailDomain(context.domain) ? context.domain : null;
  const client = await clerkClient();
  const organization = await client.organizations.createOrganization({
    name: trimmed,
    createdBy: context.clerkUserId,
  });

  const company = await prisma.company.create({
    data: {
      name: trimmed,
      clerkOrganizationId: organization.id,
      onboardingStatus: "warehouse_required",
      memberships: {
        create: {
          userId: context.user.id,
          role: "owner",
        },
      },
    },
  }).catch(async (error) => {
    await client.organizations.deleteOrganization(organization.id).catch(() => undefined);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A company with this organization already exists.");
    }

    throw error;
  });

  if (domain) {
    await prisma.companyDomain.create({
      data: {
        companyId: company.id,
        domain,
        clerkOrganizationId: organization.id,
      },
    }).catch(async (error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("This domain is already connected to this company.");
      }

      throw error;
    });

    await client.organizations.createOrganizationDomain({
      organizationId: organization.id,
      name: domain,
      enrollmentMode: "automatic_suggestion",
    }).catch(() => undefined);
  }

  await prisma.user.update({
    where: { id: context.user.id },
    data: { companyId: company.id },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  return {
    companyId: company.id,
    clerkOrganizationId: organization.id,
    companyName: company.name,
    requiresWarehouseSetup: true,
  };
}

export async function createInitialWarehouseAction(name: string, address?: string) {
  const context = await requireOnboardingUser();
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Warehouse name is required.");
  }

  if (!context.orgId) {
    throw new Error("Select your organization workspace before creating the first warehouse.");
  }

  const company = await prisma.company.findUnique({
    where: { clerkOrganizationId: context.orgId },
    include: {
      memberships: {
        where: {
          userId: context.user.id,
          role: { in: ["owner", "admin"] },
        },
      },
      warehouses: {
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!company) {
    throw new Error("Company workspace was not found.");
  }

  if (company.memberships.length === 0) {
    throw new Error("Only owners and admins can complete workspace setup.");
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      companyId: company.id,
      name: trimmed,
      address: address?.trim() || null,
    },
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A warehouse with this name already exists.");
    }

    throw error;
  });

  await prisma.company.update({
    where: { id: company.id },
    data: { onboardingStatus: "active" },
  });

  await prisma.user.update({
    where: { id: context.user.id },
    data: { companyId: company.id },
  });

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  revalidatePath("/settings/warehouse");

  return {
    companyId: company.id,
    companyName: company.name,
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
  };
}
