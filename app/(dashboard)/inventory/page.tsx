import { Search, SlidersHorizontal } from "lucide-react";
import { assignProductToSpotAction, ensureDemoProducts, removeSpotProductAssignmentAction, type InventoryLayoutData } from "@/app/actions/inventory";
import { WarehouseLayoutInventoryViewer } from "@/components/inventory/WarehouseLayoutInventoryViewer";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inventory } from "@/lib/mock-data";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const tenant = await getTenantContext();
  await ensureDemoProducts(tenant.companyId);

  const [warehouses, products] = await Promise.all([
    prisma.warehouse.findMany({
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
                  include: {
                    productAssignments: {
                      orderBy: [{ level: "asc" }, { createdAt: "asc" }],
                      include: {
                        sku: {
                          include: {
                            product: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { companyId: tenant.companyId },
      orderBy: { name: "asc" },
      include: {
        skus: {
          orderBy: { code: "asc" },
        },
      },
    }),
  ]);

  const layoutData: InventoryLayoutData = {
    warehouses: warehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      zones: warehouse.zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        layout: zone.layout
          ? {
              id: zone.layout.id,
              rows: zone.layout.rows,
              columns: zone.layout.columns,
              spots: zone.layout.spots.map((spot) => ({
                id: spot.id,
                code: spot.code,
                row: spot.row,
                column: spot.column,
                status: spot.status,
                levels: spot.levels,
                assignments: spot.productAssignments.map((assignment) => ({
                  id: assignment.id,
                  skuId: assignment.skuId,
                  skuCode: assignment.sku.code,
                  productName: assignment.sku.product.name,
                  level: assignment.level,
                  quantity: assignment.quantity,
                })),
              })),
            }
          : undefined,
      })),
    })),
    products: products.flatMap((product) =>
      product.skus.map((sku) => ({
        skuId: sku.id,
        skuCode: sku.code,
        productName: product.name,
        brand: product.brand ?? undefined,
      })),
    ),
  };

  return (
    <>
      <PageHeader title="Inventory" description="Track SKU availability, reservations, and warehouse locations." />
      <div className="space-y-5">
        <WarehouseLayoutInventoryViewer
          initialData={layoutData}
          assignProductToSpotAction={assignProductToSpotAction}
          removeSpotProductAssignmentAction={removeSpotProductAssignmentAction}
        />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>SKU availability</CardTitle>
            <CardDescription>Live stock position by warehouse bin and channel.</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search SKU" className="pl-9" />
            </div>
            <Button variant="outline" size="icon"><SlidersHorizontal className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Warning</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.sku}>
                    <TableCell className="font-medium">{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.available}</TableCell>
                    <TableCell>{item.reserved}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.channels.join(", ")}</TableCell>
                    <TableCell>{item.low ? <Badge variant="orange">Low stock</Badge> : <Badge variant="green">Healthy</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden">
            {inventory.map((item) => (
              <div key={item.sku} className="rounded-md border p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.sku}</div>
                    <div className="text-sm text-muted-foreground">{item.name}</div>
                  </div>
                  {item.low ? <Badge variant="orange">Low</Badge> : <Badge variant="green">OK</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <span>{item.available} avail.</span>
                  <span>{item.reserved} reserved</span>
                  <span>{item.location}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
