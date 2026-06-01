"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Grid3X3, Loader2, Map, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type LocalWarehouse = {
  id: string;
  name: string;
  address?: string;
};

export type WarehouseSettingsWarehouse = LocalWarehouse & {
  zones: Array<{
    id: string;
    warehouseId: string;
    name: string;
    layout?: {
      id: string;
      rows: number;
      columns: number;
      updatedAt: string;
    };
  }>;
};

type WarehouseSettingsPageClientProps = {
  initialWarehouses: WarehouseSettingsWarehouse[];
  createWarehouseAction: (name: string, address?: string) => Promise<LocalWarehouse>;
  renameWarehouseAction: (warehouseId: string, name: string) => Promise<LocalWarehouse>;
  deleteWarehouseAction: (warehouseId: string) => Promise<{ id: string }>;
};

export function WarehouseSettingsPageClient({
  initialWarehouses,
  createWarehouseAction,
  renameWarehouseAction,
  deleteWarehouseAction,
}: WarehouseSettingsPageClientProps) {
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [editWarehouseDialogOpen, setEditWarehouseDialogOpen] = useState(false);
  const [deleteWarehouseDialogOpen, setDeleteWarehouseDialogOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseSettingsWarehouse[]>(initialWarehouses);
  const [warehouseName, setWarehouseName] = useState("");
  const [address, setAddress] = useState("");
  const [editingWarehouseId, setEditingWarehouseId] = useState("");
  const [editingWarehouseName, setEditingWarehouseName] = useState("");
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseSettingsWarehouse | null>(null);
  const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);
  const [isRenamingWarehouse, setIsRenamingWarehouse] = useState(false);
  const [isDeletingWarehouse, setIsDeletingWarehouse] = useState(false);
  const [error, setError] = useState("");
  const [renameError, setRenameError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [latestCreatedWarehouseName, setLatestCreatedWarehouseName] = useState("");

  function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function createWarehouse() {
    const name = warehouseName.trim();

    if (!name) {
      return;
    }

    setIsCreatingWarehouse(true);
    setError("");
    void createWarehouseAction(name, address)
      .then((warehouse) => {
        setWarehouses((current) => [...current, { ...warehouse, zones: [] }]);
        setLatestCreatedWarehouseName(warehouse.name);
        setWarehouseName("");
        setAddress("");
        setWarehouseDialogOpen(false);
      })
      .catch((createError) => {
        setError(createError instanceof Error ? createError.message : "Unable to create warehouse.");
      })
      .finally(() => setIsCreatingWarehouse(false));
  }

  function openEditWarehouse(warehouse: WarehouseSettingsWarehouse) {
    setEditingWarehouseId(warehouse.id);
    setEditingWarehouseName(warehouse.name);
    setRenameError("");
    setEditWarehouseDialogOpen(true);
  }

  function openDeleteWarehouse(warehouse: WarehouseSettingsWarehouse) {
    setDeletingWarehouse(warehouse);
    setDeleteError("");
    setDeleteWarehouseDialogOpen(true);
  }

  function renameWarehouse() {
    const name = editingWarehouseName.trim();

    if (!name || !editingWarehouseId) {
      return;
    }

    setIsRenamingWarehouse(true);
    setRenameError("");
    void renameWarehouseAction(editingWarehouseId, name)
      .then((warehouse) => {
        setWarehouses((current) =>
          current.map((item) => (item.id === warehouse.id ? { ...item, name: warehouse.name, address: warehouse.address } : item)),
        );
        setEditWarehouseDialogOpen(false);
      })
      .catch((updateError) => {
        setRenameError(updateError instanceof Error ? updateError.message : "Unable to rename warehouse.");
      })
      .finally(() => setIsRenamingWarehouse(false));
  }

  function deleteWarehouse() {
    if (!deletingWarehouse) {
      return;
    }

    setIsDeletingWarehouse(true);
    setDeleteError("");
    void deleteWarehouseAction(deletingWarehouse.id)
      .then((deleted) => {
        setWarehouses((current) => current.filter((warehouse) => warehouse.id !== deleted.id));
        setDeleteWarehouseDialogOpen(false);
        setDeletingWarehouse(null);
      })
      .catch((removeError) => {
        setDeleteError(removeError instanceof Error ? removeError.message : "Unable to delete warehouse.");
      })
      .finally(() => setIsDeletingWarehouse(false));
  }

  return (
    <>
      <PageHeader
        title="Warehouse Settings"
        description="Manage warehouses, zones, and layout setup."
        actions={
          <Button onClick={() => setWarehouseDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Create Warehouse
          </Button>
        }
      />
      <div className="space-y-4">
        {latestCreatedWarehouseName ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Created {latestCreatedWarehouseName}
          </div>
        ) : null}

        <div className="space-y-3">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{warehouse.name}</CardTitle>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-slate-500" onClick={() => openEditWarehouse(warehouse)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {warehouses.length > 1 ? (
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => openDeleteWarehouse(warehouse)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                  <CardDescription>{warehouse.address || "No address saved"}</CardDescription>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {warehouse.zones.length} zone{warehouse.zones.length === 1 ? "" : "s"}
                </div>
              </CardHeader>
              <CardContent>
                {warehouse.zones.length === 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">No zones yet</div>
                      <div className="mt-1 text-sm text-slate-500">Create the first zone before editing a layout.</div>
                    </div>
                    <Button asChild variant="outline" className="gap-2">
                      <Link href={`/settings/warehouse-layout?warehouseId=${warehouse.id}&action=create-zone`}>
                        <Plus className="h-4 w-4" />
                        Create Zone
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                    {warehouse.zones.map((zone) => (
                      <div key={zone.id} className="grid gap-3 bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <Map className="h-4 w-4 text-blue-700" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-950">{zone.name}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                              {zone.layout ? (
                                <>
                                  <span>{zone.layout.rows} x {zone.layout.columns} grid</span>
                                  <span>Updated {formatDate(zone.layout.updatedAt)}</span>
                                </>
                              ) : (
                                <span>No layout created yet</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button asChild variant="outline" className="justify-between gap-2">
                          <Link href={`/settings/warehouse-layout?warehouseId=${warehouse.id}&zoneId=${zone.id}`}>
                            <Grid3X3 className="h-4 w-4" />
                            Edit Layout
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {warehouse.zones.length > 0 ? (
                  <div className="mt-3 flex justify-end">
                    <Button asChild variant="ghost" size="sm" className="gap-2 text-slate-600">
                      <Link href={`/settings/warehouse-layout?warehouseId=${warehouse.id}&action=create-zone`}>
                        <Plus className="h-4 w-4" />
                        Create Zone
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Warehouse</DialogTitle>
            <DialogDescription>Add a warehouse for WMS setup and zone layout design.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
            <div>
              <label className="text-sm font-semibold text-slate-900">Warehouse Name</label>
              <Input className="mt-2" value={warehouseName} onChange={(event) => setWarehouseName(event.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">Address</label>
              <Input className="mt-2" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWarehouseDialogOpen(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={createWarehouse} disabled={!warehouseName.trim() || isCreatingWarehouse}>
                {isCreatingWarehouse ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create Warehouse
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editWarehouseDialogOpen} onOpenChange={setEditWarehouseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
            <DialogDescription>Update the warehouse name used across settings and layouts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {renameError ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{renameError}</div> : null}
            <div>
              <label className="text-sm font-semibold text-slate-900">Warehouse Name</label>
              <Input className="mt-2" value={editingWarehouseName} onChange={(event) => setEditingWarehouseName(event.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditWarehouseDialogOpen(false)} disabled={isRenamingWarehouse}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={renameWarehouse} disabled={!editingWarehouseName.trim() || isRenamingWarehouse}>
                {isRenamingWarehouse ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteWarehouseDialogOpen} onOpenChange={setDeleteWarehouseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Warehouse</DialogTitle>
            <DialogDescription>
              Delete {deletingWarehouse?.name}. This also removes zones and saved zone layout structure for this warehouse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {deleteError ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteError}</div> : null}
            {warehouses.length <= 1 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                You must keep at least one warehouse.
              </div>
            ) : (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                This will erase all zones, spot layouts, and any product connections saved to spots for this warehouse.
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteWarehouseDialogOpen(false)} disabled={isDeletingWarehouse}>Cancel</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={deleteWarehouse} disabled={!deletingWarehouse || warehouses.length <= 1 || isDeletingWarehouse}>
                {isDeletingWarehouse ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Warehouse
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
