"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCompanyRole } from "@/lib/tenant";
import {
  createBlankLayout,
  createDefaultRowAliases,
  generateSpotCode,
  normalizeSpotLevels,
  normalizeSpotStatus,
  type PalletSpot,
  type WarehouseLayout,
} from "@/components/warehouse-layout/types";

const MAX_GRID_SIZE = 20;

function makeId(prefix: string, value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "new";
  return `${prefix}-${slug}-${Date.now()}`;
}

function clampGridSize(value: number) {
  return Math.min(MAX_GRID_SIZE, Math.max(1, Number(value) || 1));
}

function normalizeLayoutSpots(layout: WarehouseLayout, layoutId: string, rows: number, columns: number, rowAliases: Record<string, string>) {
  const submitted = new Map(layout.spots.map((spot) => [`${spot.row}-${spot.column}`, spot]));
  const spots: PalletSpot[] = [];

  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      const spot = submitted.get(`${row}-${column}`);

      spots.push({
        id: spot?.id || `${layoutId}-spot-${row}-${column}`,
        layoutId,
        row,
        column,
        code: generateSpotCode(row, column, rowAliases),
        status: normalizeSpotStatus(spot?.status ?? "empty"),
        levels: normalizeSpotLevels(spot?.levels ?? 1),
        notes: spot?.notes ?? "",
      });
    }
  }

  return spots;
}

function normalizeRowAliases(rowAliases: WarehouseLayout["rowAliases"], rows: number) {
  const normalized = createDefaultRowAliases(rows);
  const seen = new Set<string>();

  for (const alias of Object.values(normalized)) {
    seen.add(alias.toLowerCase());
  }

  for (const [row, alias] of Object.entries(rowAliases ?? {})) {
    const rowNumber = Number(row);
    const trimmed = alias.trim();

    if (!Number.isInteger(rowNumber) || rowNumber < 1 || rowNumber > rows || !trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (normalized[String(rowNumber)]?.toLowerCase() !== key && seen.has(key)) {
      throw new Error("Row aliases must be unique within a layout.");
    }

    seen.delete(normalized[String(rowNumber)]?.toLowerCase() ?? "");
    seen.add(key);
    normalized[String(rowNumber)] = trimmed.slice(0, 4);
  }

  return normalized;
}

export async function createZoneAction(warehouseId: string, name: string) {
  const tenant = await requireCompanyRole(["manager"]);
  const trimmed = name.trim();

  if (!warehouseId || !trimmed) {
    throw new Error("Warehouse and zone name are required.");
  }

  const warehouse = await prisma.warehouse.findFirst({
    where: {
      id: warehouseId,
      companyId: tenant.companyId,
    },
  });

  if (!warehouse) {
    throw new Error("Warehouse was not found for this workspace.");
  }

  const zone = await prisma.zone.create({
    data: {
      id: makeId("zone", trimmed),
      warehouseId,
      name: trimmed,
    },
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A zone with this name already exists in this warehouse.");
    }

    throw error;
  });

  revalidatePath("/settings/warehouse");
  revalidatePath("/settings/warehouse-layout");
  return zone;
}

export async function renameZoneAction(zoneId: string, name: string) {
  const tenant = await requireCompanyRole(["manager"]);
  const trimmed = name.trim();

  if (!zoneId || !trimmed) {
    throw new Error("Zone and name are required.");
  }

  const existingZone = await prisma.zone.findFirst({
    where: {
      id: zoneId,
      warehouse: {
        companyId: tenant.companyId,
      },
    },
  });

  if (!existingZone) {
    throw new Error("Zone was not found for this workspace.");
  }

  const zone = await prisma.zone.update({
    where: { id: existingZone.id },
    data: { name: trimmed },
  }).catch((error) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A zone with this name already exists in this warehouse.");
    }

    throw error;
  });

  revalidatePath("/settings/warehouse-layout");
  return zone;
}

export async function saveZoneLayoutAction(layout: WarehouseLayout) {
  const tenant = await requireCompanyRole(["manager"]);

  if (!layout.warehouseId || !layout.zoneId) {
    throw new Error("Warehouse and zone are required.");
  }

  const zone = await prisma.zone.findFirst({
    where: {
      id: layout.zoneId,
      warehouseId: layout.warehouseId,
      warehouse: {
        companyId: tenant.companyId,
      },
    },
  });

  if (!zone) {
    throw new Error("Zone was not found for this workspace.");
  }

  const rows = clampGridSize(layout.rows);
  const columns = clampGridSize(layout.columns);
  const layoutId = layout.id || createBlankLayout(layout.warehouseId, layout.zoneId).id;
  const rowAliases = normalizeRowAliases(layout.rowAliases, rows);

  const saved = await prisma.$transaction(async (tx) => {
    const upserted = await tx.warehouseLayout.upsert({
      where: { zoneId: layout.zoneId },
      create: {
        id: layoutId,
        warehouseId: layout.warehouseId,
        zoneId: layout.zoneId,
        rows,
        columns,
        rowAliases,
      },
      update: {
        warehouseId: layout.warehouseId,
        rows,
        columns,
        rowAliases,
      },
    });

    const spots = normalizeLayoutSpots(layout, upserted.id, rows, columns, rowAliases);

    await tx.palletSpot.deleteMany({
      where: {
        layoutId: upserted.id,
        OR: [
          { row: { gt: rows } },
          { column: { gt: columns } },
        ],
      },
    });

    if (spots.length > 0) {
      const values = Prisma.join(
        spots.map((spot) =>
          Prisma.sql`(${spot.id}, ${upserted.id}, ${spot.row}, ${spot.column}, ${spot.code}, ${spot.status}, ${spot.levels}, ${spot.notes || null}, NOW(), NOW())`,
        ),
      );

      await tx.$executeRaw`
        INSERT INTO "PalletSpot" ("id", "layoutId", "row", "column", "code", "status", "levels", "notes", "createdAt", "updatedAt")
        VALUES ${values}
        ON CONFLICT ("layoutId", "row", "column")
        DO UPDATE SET
          "code" = EXCLUDED."code",
          "status" = EXCLUDED."status",
          "levels" = EXCLUDED."levels",
          "notes" = EXCLUDED."notes",
          "updatedAt" = NOW()
      `;
    }

    return tx.warehouseLayout.findUniqueOrThrow({
      where: { id: upserted.id },
      include: {
        spots: {
          orderBy: [{ row: "asc" }, { column: "asc" }],
        },
      },
    });
  });

  revalidatePath("/settings");
  revalidatePath("/settings/warehouse-layout");

  return {
    id: saved.id,
    warehouseId: saved.warehouseId,
    zoneId: saved.zoneId,
    rows: saved.rows,
    columns: saved.columns,
    rowAliases: typeof saved.rowAliases === "object" && saved.rowAliases && !Array.isArray(saved.rowAliases)
      ? Object.fromEntries(Object.entries(saved.rowAliases).map(([key, value]) => [key, String(value)]))
      : {},
    updatedAt: saved.updatedAt.toISOString(),
    spots: saved.spots.map((spot) => ({
      id: spot.id,
      layoutId: spot.layoutId,
      row: spot.row,
      column: spot.column,
      code: spot.code,
      status: normalizeSpotStatus(spot.status),
      levels: normalizeSpotLevels(spot.levels),
      notes: spot.notes ?? "",
    })),
  } satisfies WarehouseLayout;
}
