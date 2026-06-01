"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyRole } from "@/lib/tenant";

function makeId(prefix: string, value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "new";
  return `${prefix}-${slug}-${Date.now()}`;
}

export async function createWarehouseAction(name: string, address?: string) {
  const tenant = await requireCompanyRole(["admin"]);
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Warehouse name is required.");
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      id: makeId("wh", trimmed),
      companyId: tenant.companyId,
      name: trimmed,
      address: address?.trim() || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/settings/warehouse-layout");

  return {
    id: warehouse.id,
    name: warehouse.name,
    address: warehouse.address ?? undefined,
  };
}

export async function renameWarehouseAction(warehouseId: string, name: string) {
  const tenant = await requireCompanyRole(["admin"]);
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Warehouse name is required.");
  }

  const warehouse = await prisma.warehouse.update({
    where: {
      id: warehouseId,
      companyId: tenant.companyId,
    },
    data: {
      name: trimmed,
    },
  });

  revalidatePath("/settings/warehouse");
  revalidatePath("/settings/warehouse-layout");

  return {
    id: warehouse.id,
    name: warehouse.name,
    address: warehouse.address ?? undefined,
  };
}

export async function deleteWarehouseAction(warehouseId: string) {
  const tenant = await requireCompanyRole(["admin"]);

  await prisma.$transaction(async (tx) => {
    const warehouseCount = await tx.warehouse.count({
      where: { companyId: tenant.companyId },
    });

    if (warehouseCount <= 1) {
      throw new Error("You must keep at least one warehouse.");
    }

    const warehouse = await tx.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId: tenant.companyId,
      },
      select: { id: true },
    });

    if (!warehouse) {
      throw new Error("Warehouse was not found.");
    }

    await tx.palletSpot.deleteMany({
      where: {
        layout: {
          zone: {
            warehouseId,
          },
        },
      },
    });
    await tx.warehouseLayout.deleteMany({
      where: {
        zone: {
          warehouseId,
        },
      },
    });
    await tx.zone.deleteMany({
      where: { warehouseId },
    });
    await tx.warehouseLocation.deleteMany({
      where: { warehouseId },
    });
    await tx.warehouse.delete({
      where: { id: warehouseId },
    });
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new Error("Unable to delete this warehouse because it has related operational records.");
    }

    if (error instanceof Error && error.message) {
      throw error;
    }

    throw new Error("Unable to delete this warehouse. Remove related operational records first.");
  });

  revalidatePath("/settings/warehouse");
  revalidatePath("/settings/warehouse-layout");

  return { id: warehouseId };
}
