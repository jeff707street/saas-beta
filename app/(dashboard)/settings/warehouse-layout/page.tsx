import { WarehouseLayoutPage } from "@/components/warehouse-layout/WarehouseLayoutPage";
import { createZoneAction, renameZoneAction, saveZoneLayoutAction } from "@/app/actions/warehouse-layout";
import { normalizeSpotLevels, normalizeSpotStatus, type Warehouse } from "@/components/warehouse-layout/types";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    warehouseId?: string;
    zoneId?: string;
    action?: string;
  };
};

export default async function Page({ searchParams }: PageProps) {
  const tenant = await getTenantContext();

  const warehouses = await prisma.warehouse.findMany({
    where: { companyId: tenant.companyId },
    orderBy: { name: "asc" },
    include: {
      zones: {
        orderBy: { name: "asc" },
        include: {
          layout: {
            include: {
              spots: {
                orderBy: [{ row: "asc" }, { column: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  const data: Warehouse[] = warehouses.map((warehouse) => ({
    id: warehouse.id,
    name: warehouse.name,
    address: warehouse.address ?? undefined,
    zones: warehouse.zones.map((zone) => ({
      id: zone.id,
      warehouseId: zone.warehouseId,
      name: zone.name,
      layout: zone.layout
        ? {
            id: zone.layout.id,
            warehouseId: zone.layout.warehouseId,
            zoneId: zone.layout.zoneId,
            rows: zone.layout.rows,
            columns: zone.layout.columns,
            rowAliases: typeof zone.layout.rowAliases === "object" && zone.layout.rowAliases && !Array.isArray(zone.layout.rowAliases)
              ? Object.fromEntries(Object.entries(zone.layout.rowAliases).map(([key, value]) => [key, String(value)]))
              : {},
            updatedAt: zone.layout.updatedAt.toISOString(),
            spots: zone.layout.spots.map((spot) => ({
              id: spot.id,
              layoutId: spot.layoutId,
              row: spot.row,
              column: spot.column,
              code: spot.code,
              status: normalizeSpotStatus(spot.status),
              levels: normalizeSpotLevels(spot.levels),
              notes: spot.notes ?? "",
            })),
          }
        : undefined,
    })),
  }));

  return (
    <WarehouseLayoutPage
      initialWarehouses={data}
      initialWarehouseId={searchParams?.warehouseId}
      initialZoneId={searchParams?.zoneId}
      initialAction={searchParams?.action}
      createZoneAction={createZoneAction}
      renameZoneAction={renameZoneAction}
      saveZoneLayoutAction={saveZoneLayoutAction}
    />
  );
}
