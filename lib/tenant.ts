import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export const COMPANY_ROLES = ["owner", "admin", "manager", "operator", "viewer"] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

const ROLE_RANK: Record<CompanyRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  operator: 2,
  viewer: 1,
};

export function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return "";
  }

  return user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
}

export function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>) {
  if (!user) {
    return "Workspace";
  }

  return user.fullName ?? user.username ?? getPrimaryEmail(user) ?? "Workspace";
}

function normalizeStoredCompanyRole(role?: string | null): CompanyRole | null {
  if (COMPANY_ROLES.includes(role as CompanyRole)) {
    return role as CompanyRole;
  }

  if (role === "org:admin" || role === "admin") {
    return "admin";
  }

  if (role === "org:member" || role === "member") {
    return "operator";
  }

  return null;
}

function normalizeClerkCompanyRole(role?: string | null): CompanyRole {
  if (role === "org:admin" || role === "admin") {
    return "admin";
  }

  if (role === "org:member" || role === "member") {
    return "operator";
  }

  return "owner";
}

function hasAllowedRole(role: CompanyRole, allowedRoles: CompanyRole[]) {
  return allowedRoles.some((allowedRole) => ROLE_RANK[role] >= ROLE_RANK[allowedRole]);
}

export async function getTenantContext() {
  const session = await auth.protect();
  const user = await currentUser();
  const email = getPrimaryEmail(user);
  const name = getDisplayName(user);
  const companyName = session.orgId ? session.orgSlug ?? "Organization Workspace" : `${name} Workspace`;

  const dbUser = await prisma.user.upsert({
    where: { clerkUserId: session.userId },
    create: {
      clerkUserId: session.userId,
      email: email || `${session.userId}@clerk.local`,
      name,
    },
    update: {
      email: email || `${session.userId}@clerk.local`,
      name,
    },
  });

  const company = session.orgId
    ? await prisma.company.upsert({
        where: { clerkOrganizationId: session.orgId },
        create: {
          clerkOrganizationId: session.orgId,
          name: companyName,
        },
        update: {
          name: companyName,
        },
      })
    : await prisma.company.upsert({
        where: { personalOwnerClerkUserId: session.userId },
        create: {
          personalOwnerClerkUserId: session.userId,
          name: companyName,
        },
        update: {
          name: companyName,
        },
      });

  const existingMembership = await prisma.companyMembership.findUnique({
    where: {
      userId_companyId: {
        userId: dbUser.id,
        companyId: company.id,
      },
    },
  });
  const pendingInvitation = email
    ? await prisma.companyInvitation.findUnique({
        where: {
          companyId_email: {
            companyId: company.id,
            email: email.toLowerCase(),
          },
        },
      })
    : null;
  const existingRole = normalizeStoredCompanyRole(existingMembership?.role);
  const invitedRole = pendingInvitation?.status === "pending" ? normalizeStoredCompanyRole(pendingInvitation.role) : null;
  const clerkRole = session.orgId ? normalizeClerkCompanyRole(session.orgRole) : "owner";
  const role = existingRole === "owner" ? "owner" : clerkRole === "admin" ? "admin" : existingRole ?? invitedRole ?? clerkRole;

  await prisma.companyMembership.upsert({
    where: {
      userId_companyId: {
        userId: dbUser.id,
        companyId: company.id,
      },
    },
    create: {
      userId: dbUser.id,
      companyId: company.id,
      role,
    },
    update: {
      role,
    },
  });

  if (pendingInvitation?.status === "pending") {
    await prisma.companyInvitation.update({
      where: { id: pendingInvitation.id },
      data: { status: "accepted", role },
    });
  }

  if (dbUser.companyId !== company.id) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { companyId: company.id },
    });
  }

  return {
    companyId: company.id,
    companyName: company.name,
    userId: dbUser.id,
    clerkUserId: session.userId,
    clerkOrganizationId: session.orgId,
    role,
  };
}

export async function requireCompanyRole(allowedRoles: CompanyRole[]) {
  const tenant = await getTenantContext();

  if (!hasAllowedRole(tenant.role, allowedRoles)) {
    throw new Error("You do not have permission to perform this action.");
  }

  return tenant;
}
