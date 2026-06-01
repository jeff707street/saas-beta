"use client";

import { useMemo, useState } from "react";
import { Layers3, Loader2, PackagePlus, Trash2, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InventoryLayoutData, InventoryLayoutSpot, ProductOption, SpotAssignment } from "@/app/actions/inventory";

type WarehouseLayoutInventoryViewerProps = {
  initialData: InventoryLayoutData;
  assignProductToSpotAction: (palletSpotId: string, skuId: string, level: number, quantity: number) => Promise<SpotAssignment>;
  removeSpotProductAssignmentAction: (assignmentId: string) => Promise<{ id: string; palletSpotId: string }>;
};

function getSpotStyle(spot: InventoryLayoutSpot, selected: boolean) {
  if (selected) {
    return "border-blue-500 bg-blue-50 text-blue-800 shadow-sm";
  }

  if (spot.status === "blocked") {
    return "border-red-200 bg-[repeating-linear-gradient(135deg,#fee2e2_0,#fee2e2_6px,#fff1f2_6px,#fff1f2_12px)] text-red-700";
  }

  if (spot.status === "disabled") {
    return "border-slate-200 bg-[repeating-linear-gradient(135deg,#e5e7eb_0,#e5e7eb_6px,#f8fafc_6px,#f8fafc_12px)] text-slate-500";
  }

  if (spot.assignments.length > 0) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300";
  }

  return "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/50";
}

function isSpotAvailable(spot?: InventoryLayoutSpot) {
  return Boolean(spot && spot.status !== "blocked" && spot.status !== "disabled");
}

export function WarehouseLayoutInventoryViewer({
  initialData,
  assignProductToSpotAction,
  removeSpotProductAssignmentAction,
}: WarehouseLayoutInventoryViewerProps) {
  const [warehouses, setWarehouses] = useState(initialData.warehouses);
  const [products] = useState<ProductOption[]>(initialData.products);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(initialData.warehouses[0]?.id ?? "");
  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedWarehouseId),
    [warehouses, selectedWarehouseId],
  );
  const [selectedZoneId, setSelectedZoneId] = useState(selectedWarehouse?.zones[0]?.id ?? "");
  const selectedZone = selectedWarehouse?.zones.find((zone) => zone.id === selectedZoneId) ?? selectedWarehouse?.zones[0];
  const layout = selectedZone?.layout;
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const selectedSpot = layout?.spots.find((spot) => spot.id === selectedSpotId);
  const [selectedSkuId, setSelectedSkuId] = useState(products[0]?.skuId ?? "");
  const [selectedLevel, setSelectedLevel] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function selectWarehouse(warehouseId: string) {
    const warehouse = warehouses.find((item) => item.id === warehouseId);
    const zoneId = warehouse?.zones[0]?.id ?? "";

    setSelectedWarehouseId(warehouseId);
    setSelectedZoneId(zoneId);
    setSelectedSpotId("");
    setError("");
    setNotice("");
  }

  function selectZone(zoneId: string) {
    setSelectedZoneId(zoneId);
    setSelectedSpotId("");
    setError("");
    setNotice("");
  }

  function updateSpotAssignments(palletSpotId: string, updater: (assignments: SpotAssignment[]) => SpotAssignment[]) {
    setWarehouses((current) =>
      current.map((warehouse) => ({
        ...warehouse,
        zones: warehouse.zones.map((zone) => ({
          ...zone,
          layout: zone.layout
            ? {
                ...zone.layout,
                spots: zone.layout.spots.map((spot) =>
                  spot.id === palletSpotId
                    ? {
                        ...spot,
                        assignments: updater(spot.assignments),
                      }
                    : spot,
                ),
              }
            : undefined,
        })),
      })),
    );
  }

  function assignProduct() {
    if (!selectedSpot || !isSpotAvailable(selectedSpot)) {
      setError("Select an available spot before assigning a product.");
      return;
    }

    if (!selectedSkuId) {
      setError("Select a product SKU.");
      return;
    }

    setBusyKey("assign");
    setError("");
    setNotice("");

    void assignProductToSpotAction(selectedSpot.id, selectedSkuId, Number(selectedLevel), Number(quantity))
      .then((assignment) => {
        updateSpotAssignments(selectedSpot.id, (assignments) => [
          ...assignments.filter((item) => !(item.skuId === assignment.skuId && item.level === assignment.level)),
          assignment,
        ].sort((a, b) => a.level - b.level || a.skuCode.localeCompare(b.skuCode)));
        setNotice(`${assignment.skuCode} assigned to ${selectedSpot.code}, level ${assignment.level}.`);
      })
      .catch((assignError) => {
        setError(assignError instanceof Error ? assignError.message : "Unable to assign product to this spot.");
      })
      .finally(() => setBusyKey(""));
  }

  function removeAssignment(assignment: SpotAssignment) {
    if (!selectedSpot) {
      return;
    }

    setBusyKey(assignment.id);
    setError("");
    setNotice("");

    void removeSpotProductAssignmentAction(assignment.id)
      .then((removed) => {
        updateSpotAssignments(removed.palletSpotId, (assignments) => assignments.filter((item) => item.id !== removed.id));
        setNotice(`${assignment.skuCode} removed from ${selectedSpot.code}.`);
      })
      .catch((removeError) => {
        setError(removeError instanceof Error ? removeError.message : "Unable to remove this assignment.");
      })
      .finally(() => setBusyKey(""));
  }

  const levelOptions = Array.from({ length: selectedSpot?.levels ?? 1 }, (_, index) => String(index + 1));

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <CardTitle>Warehouse Layout Inventory</CardTitle>
          <CardDescription>View saved zone layouts and assign products to available pallet spots by level.</CardDescription>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[420px]">
          <Select value={selectedWarehouseId} onValueChange={selectWarehouse}>
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedZone?.id ?? ""} onValueChange={selectZone} disabled={!selectedWarehouse || selectedWarehouse.zones.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={selectedWarehouse?.zones.length ? "Select zone" : "No zones"} />
            </SelectTrigger>
            <SelectContent>
              {selectedWarehouse?.zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {!layout ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
              <Warehouse className="h-8 w-8 text-slate-400" />
              <div className="mt-3 text-sm font-semibold text-slate-900">No layout saved for this zone</div>
              <div className="mt-1 max-w-sm text-sm text-slate-500">Create and save a zone layout in Warehouse Settings before assigning products to spots.</div>
            </div>
          ) : (
            <div className="overflow-auto pb-2">
              <div
                className="grid w-max gap-1"
                style={{
                  gridTemplateColumns: `32px repeat(${layout.columns}, 46px)`,
                }}
              >
                <div />
                {Array.from({ length: layout.columns }, (_, index) => (
                  <div key={index} className="flex h-7 items-center justify-center text-[11px] font-semibold text-slate-400">
                    {index + 1}
                  </div>
                ))}
                {Array.from({ length: layout.rows }, (_, rowIndex) => {
                  const row = rowIndex + 1;
                  return [
                    <div key={`label-${row}`} className="flex h-11 items-center justify-center text-[11px] font-semibold text-slate-400">
                      {String.fromCharCode(64 + row)}
                    </div>,
                    ...Array.from({ length: layout.columns }, (_, columnIndex) => {
                      const column = columnIndex + 1;
                      const spot = layout.spots.find((item) => item.row === row && item.column === column);

                      if (!spot) {
                        return <div key={`${row}-${column}`} className="h-11 w-11 rounded-lg border border-slate-100 bg-white" />;
                      }

                      const selected = selectedSpotId === spot.id;
                      const totalAssignments = spot.assignments.length;

                      return (
                        <button
                          key={spot.id}
                          type="button"
                          onClick={() => {
                            setSelectedSpotId(spot.id);
                            setSelectedLevel("1");
                            setError("");
                            setNotice("");
                          }}
                          className={cn(
                            "relative flex h-11 w-11 flex-col items-center justify-center rounded-lg border text-[10px] font-semibold transition",
                            getSpotStyle(spot, selected),
                            !isSpotAvailable(spot) && "cursor-not-allowed opacity-75",
                          )}
                        >
                          <span>{spot.code}</span>
                          <span className="mt-0.5 flex items-center gap-0.5 text-[9px]">
                            <Layers3 className="h-2.5 w-2.5" />
                            {spot.levels}
                          </span>
                          {totalAssignments > 0 ? (
                            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] text-white">
                              {totalAssignments}
                            </span>
                          ) : null}
                        </button>
                      );
                    }),
                  ];
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-950">Selected Spot</div>
                <div className="mt-1 text-sm text-slate-500">{selectedSpot ? `${selectedSpot.code} · ${selectedSpot.levels} levels` : "Select an available spot"}</div>
              </div>
              {selectedSpot ? (
                <Badge variant={isSpotAvailable(selectedSpot) ? "green" : "gray"}>
                  {isSpotAvailable(selectedSpot) ? "Available" : selectedSpot.status}
                </Badge>
              ) : null}
            </div>

            {error ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            {notice ? <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">{notice}</div> : null}

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Product / SKU</label>
                <Select value={selectedSkuId} onValueChange={setSelectedSkuId} disabled={!selectedSpot || !isSpotAvailable(selectedSpot) || products.length === 0}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={products.length ? "Select product" : "No products"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.skuId} value={product.skuId}>
                        {product.skuCode} · {product.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Level</label>
                  <Select value={selectedLevel} onValueChange={setSelectedLevel} disabled={!selectedSpot || !isSpotAvailable(selectedSpot)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levelOptions.map((level) => (
                        <SelectItem key={level} value={level}>Level {level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Quantity</label>
                  <Input
                    className="mt-1"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={!selectedSpot || !isSpotAvailable(selectedSpot)}
                  />
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={assignProduct}
                disabled={!selectedSpot || !isSpotAvailable(selectedSpot) || !selectedSkuId || busyKey === "assign"}
              >
                {busyKey === "assign" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
                Assign Product
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-950">Products in Spot</div>
            <div className="mt-3 space-y-2">
              {!selectedSpot ? <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No spot selected.</div> : null}
              {selectedSpot && selectedSpot.assignments.length === 0 ? <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No products assigned.</div> : null}
              {selectedSpot?.assignments.map((assignment) => (
                <div key={assignment.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{assignment.productName}</div>
                      <div className="mt-1 text-xs text-slate-500">{assignment.skuCode} · Level {assignment.level} · Qty {assignment.quantity}</div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => removeAssignment(assignment)} disabled={busyKey === assignment.id}>
                      {busyKey === assignment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </CardContent>
    </Card>
  );
}
