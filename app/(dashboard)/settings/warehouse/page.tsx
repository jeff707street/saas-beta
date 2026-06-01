import { createWarehouseAction, deleteWarehouseAction, renameWarehouseAction } from "@/app/actions/settings";
import {
  WarehouseSettingsPageClient,
  type WarehouseSettingsWarehouse,
} from "@/components/settings/WarehouseSettingsPageClient";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function WarehouseSettingsPage() {
  let warehouses: WarehouseSettingsWarehouse[] = [];

  try {
    const tenant = await getTenantContext();
    const warehouseRecords = await prisma.warehouse.findMany({
      where: { companyId: tenant.companyId },
      orderBy: { name: "asc" },
      include: {
        zones: {
          orderBy: { name: "asc" },
          include: {
            layout: {
              select: {
                id: true,
                rows: true,
                columns: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    warehouses = warehouseRecords.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      address: warehouse.address ?? undefined,
      zones: warehouse.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        warehouseId: zone.warehouseId,
        layout: zone.layout
          ? {
              id: zone.layout.id,
              rows: zone.layout.rows,
              columns: zone.layout.columns,
              updatedAt: zone.layout.updatedAt.toISOString(),
            }
          : undefined,
      })),
    }));
  } catch (error) {
    console.error("Unable to load warehouse settings", error);
  }

  return (
    <WarehouseSettingsPageClient
      initialWarehouses={warehouses}
      createWarehouseAction={createWarehouseAction}
      renameWarehouseAction={renameWarehouseAction}
      deleteWarehouseAction={deleteWarehouseAction}
    />
  );
}
