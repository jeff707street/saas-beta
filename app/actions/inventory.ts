"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyRole } from "@/lib/tenant";
import { products as mockProducts } from "@/lib/mock-data";

export type ProductOption = {
  skuId: string;
  skuCode: string;
  productName: string;
  brand?: string;
};

export type SpotAssignment = {
  id: string;
  skuId: string;
  skuCode: string;
  productName: string;
  level: number;
  quantity: number;
};

export type InventoryLayoutSpot = {
  id: string;
  code: string;
  row: number;
  column: number;
  status: string;
  levels: number;
  assignments: SpotAssignment[];
};

export type InventoryLayoutData = {
  warehouses: Array<{
    id: string;
    name: string;
    zones: Array<{
      id: string;
      name: string;
      layout?: {
        id: string;
        rows: number;
        columns: number;
        spots: InventoryLayoutSpot[];
      };
    }>;
  }>;
  products: ProductOption[];
};

function toPositiveInteger(value: number, fallback = 1) {
  return Math.max(1, Math.floor(Number(value) || fallback));
}

export async function ensureDemoProducts(companyId: string) {
  const count = await prisma.product.count({ where: { companyId } });

  if (count > 0) {
    return;
  }

  await prisma.$transaction(
    mockProducts.map((item) =>
      prisma.product.create({
        data: {
          companyId,
          name: item.name,
          brand: item.brand,
          category: item.category,
          skus: {
            create: {
              code: item.sku,
            },
          },
        },
      }),
    ),
  );
}

export async function assignProductToSpotAction(palletSpotId: string, skuId: string, level: number, quantity: number) {
  const tenant = await requireCompanyRole(["manager"]);
  const normalizedLevel = toPositiveInteger(level);
  const normalizedQuantity = toPositiveInteger(quantity);

  const [spot, sku] = await Promise.all([
    prisma.palletSpot.findFirst({
      where: {
        id: palletSpotId,
        layout: {
          zone: {
            warehouse: {
              companyId: tenant.companyId,
            },
          },
        },
      },
    }),
    prisma.sKU.findFirst({
      where: {
        id: skuId,
        product: {
          companyId: tenant.companyId,
        },
      },
      include: {
        product: true,
      },
    }),
  ]);

  if (!spot) {
    throw new Error("This warehouse spot was not found.");
  }

  if (!sku) {
    throw new Error("This product SKU was not found.");
  }

  if (spot.status === "blocked" || spot.status === "disabled") {
    throw new Error("Products can only be assigned to available spots.");
  }

  if (normalizedLevel > spot.levels) {
    throw new Error(`This spot only supports ${spot.levels} level${spot.levels === 1 ? "" : "s"}.`);
  }

  const assignment = await prisma.spotProductAssignment.upsert({
    where: {
      palletSpotId_skuId_level: {
        palletSpotId,
        skuId,
        level: normalizedLevel,
      },
    },
    create: {
      palletSpotId,
      skuId,
      level: normalizedLevel,
      quantity: normalizedQuantity,
    },
    update: {
      quantity: normalizedQuantity,
    },
    include: {
      sku: {
        include: {
          product: true,
        },
      },
    },
  });

  revalidatePath("/inventory");

  return {
    id: assignment.id,
    skuId: assignment.skuId,
    skuCode: assignment.sku.code,
    productName: assignment.sku.product.name,
    level: assignment.level,
    quantity: assignment.quantity,
  } satisfies SpotAssignment;
}

export async function removeSpotProductAssignmentAction(assignmentId: string) {
  const tenant = await requireCompanyRole(["manager"]);

  const assignment = await prisma.spotProductAssignment.findFirst({
    where: {
      id: assignmentId,
      palletSpot: {
        layout: {
          zone: {
            warehouse: {
              companyId: tenant.companyId,
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    throw new Error("This spot assignment was not found.");
  }

  await prisma.spotProductAssignment.delete({
    where: { id: assignment.id },
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new Error("This spot assignment was already removed.");
    }

    throw error;
  });

  revalidatePath("/inventory");
  return { id: assignment.id, palletSpotId: assignment.palletSpotId };
}
