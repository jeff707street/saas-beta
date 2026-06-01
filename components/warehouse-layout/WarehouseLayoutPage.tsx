"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Cloud, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LayoutCanvas } from "./LayoutCanvas";
import { LayoutControlsPanel } from "./LayoutControlsPanel";
import { WarehouseInfoCards } from "./WarehouseInfoCards";
import {
  createBlankLayout,
  createDefaultRowAliases,
  createSpot,
  generateSpotCode,
  rowNumberToLabel,
  type PalletSpot,
  type Warehouse,
  type WarehouseLayout,
} from "./types";

type DraftSpot = Pick<PalletSpot, "notes" | "levels">;

function clampGridSize(value: number) {
  return Math.min(20, Math.max(1, value || 1));
}

function normalizeGrid(layout: WarehouseLayout, rows: number, columns: number): WarehouseLayout {
  const nextRows = clampGridSize(rows);
  const nextColumns = clampGridSize(columns);
  const previous = new Map(layout.spots.map((spot) => [`${spot.row}-${spot.column}`, spot]));
  const spots: PalletSpot[] = [];
  const rowAliases = createDefaultRowAliases(nextRows);

  for (const [row, alias] of Object.entries(layout.rowAliases ?? {})) {
    const rowNumber = Number(row);

    if (rowNumber >= 1 && rowNumber <= nextRows && alias.trim()) {
      rowAliases[row] = alias;
    }
  }

  for (let row = 1; row <= nextRows; row += 1) {
    for (let column = 1; column <= nextColumns; column += 1) {
      spots.push(previous.get(`${row}-${column}`) ?? createSpot(row, column, layout.id));
    }
  }

  return {
    ...layout,
    rows: nextRows,
    columns: nextColumns,
    rowAliases,
    spots: spots.map((spot) => ({
      ...spot,
      code: generateSpotCode(spot.row, spot.column, rowAliases),
    })),
  };
}

function defaultDraft(spot?: PalletSpot): DraftSpot {
  return {
    notes: spot?.notes ?? "",
    levels: spot?.levels ?? 1,
  };
}

function formatLastModified(value?: string) {
  if (!value) {
    return "Not saved yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getActionErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("permission")) {
    return "You do not have permission to do this. Ask an owner or admin to update your role.";
  }

  if (message.includes("already exists")) {
    return message;
  }

  if (message.includes("not found")) {
    return "This warehouse or zone is no longer available in your current workspace.";
  }

  return message || fallback;
}

function InlineError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

type WarehouseLayoutPageProps = {
  initialWarehouses: Warehouse[];
  initialWarehouseId?: string;
  initialZoneId?: string;
  initialAction?: string;
  createZoneAction: (warehouseId: string, name: string) => Promise<{ id: string; warehouseId: string; name: string }>;
  renameZoneAction: (zoneId: string, name: string) => Promise<{ id: string; warehouseId: string; name: string }>;
  saveZoneLayoutAction: (layout: WarehouseLayout) => Promise<WarehouseLayout>;
};

function getInitialSelection(warehouses: Warehouse[], warehouseId?: string, zoneId?: string) {
  const warehouse = warehouses.find((item) => item.id === warehouseId) ?? warehouses[0];
  const zone = warehouse?.zones.find((item) => item.id === zoneId) ?? warehouse?.zones[0];
  const layout = zone?.layout ?? createBlankLayout(warehouse?.id ?? "", zone?.id ?? "");

  return {
    warehouseId: warehouse?.id ?? "",
    zoneId: zone?.id ?? "",
    layout: {
      ...layout,
      rowAliases: {
        ...createDefaultRowAliases(layout.rows),
        ...(layout.rowAliases ?? {}),
      },
    },
  };
}

export function WarehouseLayoutPage({
  initialWarehouses,
  initialWarehouseId,
  initialZoneId,
  initialAction,
  createZoneAction,
  renameZoneAction,
  saveZoneLayoutAction,
}: WarehouseLayoutPageProps) {
  const initialSelection = useMemo(
    () => getInitialSelection(initialWarehouses, initialWarehouseId, initialZoneId),
    [initialWarehouses, initialWarehouseId, initialZoneId],
  );
  const initialLayout = initialSelection.layout;
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => initialWarehouses);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(initialSelection.warehouseId);
  const [selectedZoneId, setSelectedZoneId] = useState(initialSelection.zoneId);
  const [layout, setLayout] = useState<WarehouseLayout>(() => initialLayout);
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([]);

  const [createZoneDialogOpen, setCreateZoneDialogOpen] = useState(false);
  const [renameZoneDialogOpen, setRenameZoneDialogOpen] = useState(false);
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState("");
  const [renameZoneName, setRenameZoneName] = useState("");
  const [createZoneError, setCreateZoneError] = useState("");
  const [renameZoneError, setRenameZoneError] = useState("");
  const [saveLayoutError, setSaveLayoutError] = useState("");
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [isRenamingZone, setIsRenamingZone] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedWarehouseId),
    [warehouses, selectedWarehouseId],
  );
  const availableZones = selectedWarehouse?.zones ?? [];
  const selectedZone = availableZones.find((zone) => zone.id === selectedZoneId);
  const selectedSpots = useMemo(
    () => layout.spots.filter((spot) => selectedSpotIds.includes(spot.id)),
    [layout.spots, selectedSpotIds],
  );
  const [draftSpot, setDraftSpot] = useState<DraftSpot>(() => defaultDraft(layout.spots.find((spot) => selectedSpotIds.includes(spot.id))));

  useEffect(() => {
    if (initialAction === "create-zone" && selectedWarehouseId) {
      setCreateZoneDialogOpen(true);
    }
  }, [initialAction, selectedWarehouseId]);

  useEffect(() => {
    if (selectedSpots.length === 0) {
      setDraftSpot(defaultDraft());
      return;
    }

    const firstSpot = selectedSpots[0];
    setDraftSpot({
      notes: selectedSpots.every((spot) => (spot.notes ?? "") === (firstSpot.notes ?? "")) ? (firstSpot.notes ?? "") : "",
      levels: selectedSpots.every((spot) => spot.levels === firstSpot.levels) ? firstSpot.levels : 1,
    });
  }, [selectedSpots]);

  function loadZoneLayout(warehouseId: string, zoneId: string, sourceWarehouses = warehouses) {
    const warehouse = sourceWarehouses.find((item) => item.id === warehouseId);
    const zone = warehouse?.zones.find((item) => item.id === zoneId);
    const nextLayout = zone?.layout ?? createBlankLayout(warehouseId, zoneId);

    setLayout(nextLayout);
    setSelectedSpotIds([]);
  }

  function selectWarehouse(warehouseId: string) {
    setSaveLayoutError("");
    const warehouse = warehouses.find((item) => item.id === warehouseId);
    const firstZoneId = warehouse?.zones[0]?.id ?? "";

    setSelectedWarehouseId(warehouseId);
    setSelectedZoneId(firstZoneId);

    if (firstZoneId) {
      loadZoneLayout(warehouseId, firstZoneId);
    } else {
      const blankLayout = createBlankLayout(warehouseId, "");
      setLayout(blankLayout);
      setSelectedSpotIds([]);
    }
  }

  function selectZone(zoneId: string) {
    setSaveLayoutError("");
    setSelectedZoneId(zoneId);
    loadZoneLayout(selectedWarehouseId, zoneId);
  }

  function saveLayout() {
    if (!selectedWarehouseId || !selectedZoneId) {
      setSelectionDialogOpen(true);
      return;
    }

    const payload = {
      ...layout,
      warehouseId: selectedWarehouseId,
      zoneId: selectedZoneId,
    };

    setSaveLayoutError("");
    setIsSavingLayout(true);
    void saveZoneLayoutAction(payload)
      .then((savedLayout) => {
        setWarehouses((current) =>
          current.map((warehouse) =>
            warehouse.id === selectedWarehouseId
              ? {
                  ...warehouse,
                  zones: warehouse.zones.map((zone) =>
                    zone.id === selectedZoneId
                      ? {
                          ...zone,
                          layout: savedLayout,
                        }
                      : zone,
                  ),
                }
              : warehouse,
          ),
        );
        setLayout(savedLayout);
      })
      .catch((error) => {
        console.error("Save zone layout failed:", error);
        setSaveLayoutError(getActionErrorMessage(error, "Unable to save this zone layout. Please try again."));
      })
      .finally(() => setIsSavingLayout(false));
  }

  function createZone() {
    const name = newZoneName.trim();

    if (!name || !selectedWarehouseId) {
      return;
    }

    setCreateZoneError("");
    setIsCreatingZone(true);
    void createZoneAction(selectedWarehouseId, name)
      .then((zone) => {
        setWarehouses((current) =>
          current.map((warehouse) =>
            warehouse.id === selectedWarehouseId
              ? {
                  ...warehouse,
                  zones: [...warehouse.zones, zone],
                }
              : warehouse,
          ),
        );
        setSelectedZoneId(zone.id);
        const blankLayout = createBlankLayout(selectedWarehouseId, zone.id);
        setLayout(blankLayout);
        setSelectedSpotIds([]);
        setNewZoneName("");
        setCreateZoneDialogOpen(false);
      })
      .catch((error) => {
        console.error("Create zone failed:", error);
        setCreateZoneError(getActionErrorMessage(error, "Unable to create this zone. Please try again."));
      })
      .finally(() => setIsCreatingZone(false));
  }

  function renameZone() {
    const name = renameZoneName.trim();

    if (!name || !selectedZoneId) {
      return;
    }

    setRenameZoneError("");
    setIsRenamingZone(true);
    void renameZoneAction(selectedZoneId, name)
      .then((updatedZone) => {
        setWarehouses((current) =>
          current.map((warehouse) =>
            warehouse.id === selectedWarehouseId
              ? {
                  ...warehouse,
                  zones: warehouse.zones.map((zone) => (zone.id === selectedZoneId ? { ...zone, name: updatedZone.name } : zone)),
                }
              : warehouse,
          ),
        );
        setRenameZoneDialogOpen(false);
      })
      .catch((error) => {
        console.error("Rename zone failed:", error);
        setRenameZoneError(getActionErrorMessage(error, "Unable to rename this zone. Please try again."));
      })
      .finally(() => setIsRenamingZone(false));
  }

  function updateRows(rows: number) {
    setLayout((current) => {
      const next = normalizeGrid(current, rows, current.columns);
      setSelectedSpotIds((selection) => selection.filter((id) => next.spots.some((spot) => spot.id === id)));
      return next;
    });
  }

  function updateColumns(columns: number) {
    setLayout((current) => {
      const next = normalizeGrid(current, current.rows, columns);
      setSelectedSpotIds((selection) => selection.filter((id) => next.spots.some((spot) => spot.id === id)));
      return next;
    });
  }

  function updateRowAlias(row: number, value: string) {
    setLayout((current) => {
      const nextValue = (value.trim() || rowNumberToLabel(row)).slice(0, 4);
      const nextAliases = { ...(current.rowAliases ?? {}) };
      const duplicate = Object.entries(nextAliases).some(([key, alias]) => (
        Number(key) !== row && alias.trim().toLowerCase() === nextValue.toLowerCase()
      ));

      if (duplicate) {
        return current;
      }

      nextAliases[String(row)] = nextValue;

      return {
        ...current,
        rowAliases: nextAliases,
        spots: current.spots.map((spot) =>
          spot.row === row
            ? {
                ...spot,
                code: generateSpotCode(spot.row, spot.column, nextAliases),
              }
            : spot,
        ),
      };
    });
  }

  function clearSelectedSpots() {
    if (selectedSpotIds.length === 0) {
      return;
    }

    setLayout((current) => ({
      ...current,
      spots: current.spots.map((spot) =>
        selectedSpotIds.includes(spot.id)
          ? {
              ...spot,
              code: generateSpotCode(spot.row, spot.column, current.rowAliases),
              status: "empty",
              levels: 1,
              notes: "",
            }
          : spot,
      ),
    }));
    setSelectedSpotIds([]);
  }

  function setSelectedSpotStatus(status: "blocked" | "disabled") {
    if (selectedSpotIds.length === 0) {
      return;
    }

    setLayout((current) => ({
      ...current,
      spots: current.spots.map((spot) =>
        selectedSpotIds.includes(spot.id)
          ? {
              ...spot,
              status,
            }
          : spot,
      ),
    }));
    setSelectedSpotIds([]);
  }

  function applyChanges() {
    if (selectedSpotIds.length === 0) {
      return;
    }

    setLayout((current) => ({
      ...current,
      spots: current.spots.map((spot) =>
        selectedSpotIds.includes(spot.id)
          ? {
              ...spot,
              code: generateSpotCode(spot.row, spot.column, current.rowAliases),
              notes: draftSpot.notes,
              status: "structure",
              levels: draftSpot.levels,
            }
          : spot,
      ),
    }));
    setSelectedSpotIds([]);
  }

  function toggleSpotSelection(spot: PalletSpot) {
    setSelectedSpotIds((current) =>
      current.includes(spot.id) ? current.filter((id) => id !== spot.id) : [...current, spot.id],
    );
  }

  function addSpotToSelection(spot: PalletSpot) {
    setSelectedSpotIds((current) => (current.includes(spot.id) ? current : [...current, spot.id]));
  }

  return (
    <>
      <PageHeader
        title="Warehouse Layout Editor"
        description="Create and edit the structural grid for the selected warehouse zone."
        actions={
          <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 xl:flex">
            <Cloud className="h-4 w-4" />
            Last modified: {formatLastModified(layout.updatedAt)}
          </div>
        }
      />

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0 space-y-5">
          <WarehouseInfoCards
            warehouses={warehouses}
            selectedWarehouseId={selectedWarehouseId}
            selectedZoneId={selectedZoneId}
            availableZones={availableZones}
            onWarehouseChange={selectWarehouse}
            onZoneChange={selectZone}
            onCreateZone={() => setCreateZoneDialogOpen(true)}
            onRenameZone={() => {
              setRenameZoneName(selectedZone?.name ?? "");
              setRenameZoneDialogOpen(true);
            }}
          />
          <LayoutCanvas
            rows={layout.rows}
            columns={layout.columns}
            rowAliases={layout.rowAliases}
            spots={layout.spots}
            selectedSpotIds={selectedSpotIds}
            onToggleSpot={toggleSpotSelection}
            onAddSpotToSelection={addSpotToSelection}
            onRowAliasChange={updateRowAlias}
          />
        </main>
        <LayoutControlsPanel
          rows={layout.rows}
          columns={layout.columns}
          selectedSpots={selectedSpots}
          draftSpot={draftSpot}
          onRowsChange={updateRows}
          onColumnsChange={updateColumns}
          onDraftChange={setDraftSpot}
          onApplyChanges={applyChanges}
          onClearSelection={() => setSelectedSpotIds([])}
          onClearSpots={clearSelectedSpots}
          onBlockSpots={() => setSelectedSpotStatus("blocked")}
          onDisableSpots={() => setSelectedSpotStatus("disabled")}
          onSaveZoneLayout={saveLayout}
          isSavingZoneLayout={isSavingLayout}
          saveError={saveLayoutError}
        />
      </div>

      <Dialog
        open={createZoneDialogOpen}
        onOpenChange={(open) => {
          setCreateZoneDialogOpen(open);
          if (open) {
            setCreateZoneError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Zone</DialogTitle>
            <DialogDescription>{selectedWarehouse ? `Warehouse: ${selectedWarehouse.name}` : "Select a warehouse first."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-900">Zone Name</label>
              <Input
                className="mt-2"
                value={newZoneName}
                onChange={(event) => {
                  setNewZoneName(event.target.value);
                  setCreateZoneError("");
                }}
              />
            </div>
            <InlineError message={createZoneError} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateZoneDialogOpen(false)} disabled={isCreatingZone}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={createZone} disabled={!newZoneName.trim() || !selectedWarehouseId || isCreatingZone}>
                {isCreatingZone ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isCreatingZone ? "Creating..." : "Create Zone"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={renameZoneDialogOpen}
        onOpenChange={(open) => {
          setRenameZoneDialogOpen(open);
          if (open) {
            setRenameZoneError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Zone</DialogTitle>
            <DialogDescription>Update the display name for this warehouse zone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={renameZoneName}
              onChange={(event) => {
                setRenameZoneName(event.target.value);
                setRenameZoneError("");
              }}
            />
            <InlineError message={renameZoneError} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameZoneDialogOpen(false)} disabled={isRenamingZone}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={renameZone} disabled={!renameZoneName.trim() || isRenamingZone}>
                {isRenamingZone ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isRenamingZone ? "Saving..." : "Save Zone Name"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={selectionDialogOpen} onOpenChange={setSelectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select warehouse and zone</DialogTitle>
            <DialogDescription>Choose a warehouse and one of its zones before creating or saving a layout.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setSelectionDialogOpen(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
