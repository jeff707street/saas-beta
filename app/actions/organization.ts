"use server";

import { Prisma } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { COMPANY_ROLES, requireCompanyRole, type CompanyRole } from "@/lib/tenant";

export type OrganizationManagerData = {
  companyId: string;
  companyName: string;
  clerkOrganizationId: string | null;
  currentRole: CompanyRole;
  canManage: boolean;
  members: Array<{
    id: string;
    userId: string;
    clerkUserId: string | null;
    name: string | null;
    email: string;
    role: CompanyRole;
  }>;
  joinRequests: Array<{
    id: string;
    email: string;
    domain: string;
    status: string;
    message: string | null;
    userId: string;
    userName: string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
  }>;
};

function normalizeAppRole(role: string): CompanyRole {
  return COMPANY_ROLES.includes(role as CompanyRole) ? (role as CompanyRole) : "operator";
}

function toClerkRole(role: CompanyRole) {
  return role === "owner" || role === "admin" ? "org:admin" : "org:member";
}

function ensureMutableRole(role: CompanyRole) {
  if (role === "owner") {
    throw new Error("Owner role is reserved for workspace owners.");
  }
}

async function loadOrganizationManagerData(): Promise<OrganizationManagerData> {
  const tenant = await requireCompanyRole(["viewer"]);
  const canManage = tenant.role === "owner" || tenant.role === "admin";
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: tenant.companyId },
    include: {
      memberships: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      joinRequests: {
        where: { status: "pending" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      invitations: {
        where: { status: "pending" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  let clerkInvitationStatusByEmail = new Map<string, string>();

  if (company.clerkOrganizationId && canManage) {
    const client = await clerkClient();
    const invitationList = await client.organizations.getOrganizationInvitationList({
      organizationId: company.clerkOrganizationId,
      status: ["pending"],
      limit: 20,
    });

    clerkInvitationStatusByEmail = new Map(
      invitationList.data.map((invitation) => [
        invitation.emailAddress.toLowerCase(),
        invitation.status ?? "pending",
      ]),
    );
  }

  return {
    companyId: company.id,
    companyName: company.name,
    clerkOrganizationId: company.clerkOrganizationId,
    currentRole: tenant.role,
    canManage,
    members: company.memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      clerkUserId: membership.user.clerkUserId,
      name: membership.user.name,
      email: membership.user.email,
      role: normalizeAppRole(membership.role),
    })),
    joinRequests: company.joinRequests.map((request) => ({
      id: request.id,
      email: request.email,
      domain: request.domain,
      status: request.status,
      message: request.message,
      userId: request.userId,
      userName: request.user.name,
    })),
    invitations: company.invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: clerkInvitationStatusByEmail.get(invitation.email.toLowerCase()) ?? invitation.status,
    })),
  };
}

export async function getOrganizationManagerDataAction() {
  return loadOrganizationManagerData();
}

export async function inviteCompanyMemberAction(email: string, role: CompanyRole) {
  const tenant = await requireCompanyRole(["admin"]);
  ensureMutableRole(role);
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Enter a valid email address.");
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: tenant.companyId },
    include: {
      memberships: {
        where: {
          user: {
            email: trimmedEmail,
          },
        },
      },
    },
  });

  if (!company.clerkOrganizationId) {
    throw new Error("This workspace is not connected to a Clerk organization.");
  }

  if (company.memberships.length > 0) {
    throw new Error("This user is already a member of the workspace.");
  }

  const client = await clerkClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const invitation = await client.organizations.createOrganizationInvitation({
    organizationId: company.clerkOrganizationId,
    emailAddress: trimmedEmail,
    role: toClerkRole(role),
    inviterUserId: tenant.clerkUserId,
    ...(appUrl ? { redirectUrl: `${appUrl}/onboarding` } : {}),
    publicMetadata: {
      appRole: role,
    },
  }).catch((error) => {
    if (error instanceof Error && error.message.toLowerCase().includes("already")) {
      throw new Error("This user already has a pending invitation or membership.");
    }

    throw error;
  });

  await prisma.companyInvitation.upsert({
    where: {
      companyId_email: {
        companyId: tenant.companyId,
        email: trimmedEmail,
      },
    },
    create: {
      companyId: tenant.companyId,
      email: trimmedEmail,
      role,
      status: "pending",
      clerkInvitationId: invitation.id,
      invitedByUserId: tenant.userId,
    },
    update: {
      role,
      status: "pending",
      clerkInvitationId: invitation.id,
      invitedByUserId: tenant.userId,
    },
  });

  revalidatePath("/settings");
  return loadOrganizationManagerData();
}

export async function updateCompanyMemberRoleAction(userId: string, role: CompanyRole) {
  const tenant = await requireCompanyRole(["admin"]);
  ensureMutableRole(role);
  const company = await prisma.company.findUniqueOrThrow({
    where: { id: tenant.companyId },
  });
  const membership = await prisma.companyMembership.findUniqueOrThrow({
    where: {
      userId_companyId: {
        userId,
        companyId: tenant.companyId,
      },
    },
    include: { user: true },
  });

  if (membership.role === "owner") {
    throw new Error("Workspace owner role cannot be changed here.");
  }

  await prisma.companyMembership.update({
    where: { id: membership.id },
    data: { role },
  });

  if (company.clerkOrganizationId && membership.user.clerkUserId) {
    const client = await clerkClient();
    await client.organizations.updateOrganizationMembership({
      organizationId: company.clerkOrganizationId,
      userId: membership.user.clerkUserId,
      role: toClerkRole(role),
    }).catch(() => undefined);
  }

  revalidatePath("/settings");
  return loadOrganizationManagerData();
}

export async function removeCompanyMemberAction(userId: string) {
  const tenant = await requireCompanyRole(["admin"]);

  if (userId === tenant.userId) {
    throw new Error("You cannot remove yourself from the workspace.");
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { id: tenant.companyId },
  });
  const membership = await prisma.companyMembership.findUniqueOrThrow({
    where: {
      userId_companyId: {
        userId,
        companyId: tenant.companyId,
      },
    },
    include: { user: true },
  });

  if (membership.role === "owner") {
    throw new Error("Workspace owner cannot be removed here.");
  }

  await prisma.companyMembership.delete({
    where: { id: membership.id },
  });

  if (company.clerkOrganizationId && membership.user.clerkUserId) {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: company.clerkOrganizationId,
      userId: membership.user.clerkUserId,
    }).catch(() => undefined);
  }

  revalidatePath("/settings");
  return loadOrganizationManagerData();
}

export async function approveJoinRequestAction(requestId: string, role: CompanyRole) {
  const tenant = await requireCompanyRole(["admin"]);
  ensureMutableRole(role);
  const request = await prisma.companyJoinRequest.findFirstOrThrow({
    where: {
      id: requestId,
      companyId: tenant.companyId,
      status: "pending",
    },
    include: {
      user: true,
      company: true,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.companyMembership.upsert({
      where: {
        userId_companyId: {
          userId: request.userId,
          companyId: tenant.companyId,
        },
      },
      create: {
        userId: request.userId,
        companyId: tenant.companyId,
        role,
      },
      update: { role },
    });

    await tx.companyJoinRequest.update({
      where: { id: request.id },
      data: { status: "approved" },
    });

    await tx.user.update({
      where: { id: request.userId },
      data: { companyId: tenant.companyId },
    });
  });

  if (request.company.clerkOrganizationId && request.user.clerkUserId) {
    const client = await clerkClient();
    await client.organizations.createOrganizationMembership({
      organizationId: request.company.clerkOrganizationId,
      userId: request.user.clerkUserId,
      role: toClerkRole(role),
    }).catch(async (error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return;
      }

      if (error instanceof Error && error.message.toLowerCase().includes("already")) {
        return;
      }

      throw error;
    });
  }

  revalidatePath("/settings");
  return loadOrganizationManagerData();
}

export async function rejectJoinRequestAction(requestId: string) {
  const tenant = await requireCompanyRole(["admin"]);
  await prisma.companyJoinRequest.updateMany({
    where: {
      id: requestId,
      companyId: tenant.companyId,
      status: "pending",
    },
    data: { status: "rejected" },
  });

  revalidatePath("/settings");
  return loadOrganizationManagerData();
}
