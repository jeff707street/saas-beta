"use client";

import { Building2, Pencil, Plus, Shapes } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Warehouse, Zone } from "./types";

type WarehouseInfoCardsProps = {
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  selectedZoneId: string;
  availableZones: Zone[];
  onWarehouseChange: (warehouseId: string) => void;
  onZoneChange: (zoneId: string) => void;
  onCreateZone: () => void;
  onRenameZone: () => void;
};

export function WarehouseInfoCards({
  warehouses,
  selectedWarehouseId,
  selectedZoneId,
  availableZones,
  onWarehouseChange,
  onZoneChange,
  onCreateZone,
  onRenameZone,
}: WarehouseInfoCardsProps) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Warehouse</label>
          <Select value={selectedWarehouseId} onValueChange={onWarehouseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Shapes className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">Zone</label>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onRenameZone} disabled={!selectedZoneId}>
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onCreateZone} disabled={!selectedWarehouseId}>
                <Plus className="h-3.5 w-3.5" />
                Create Zone
              </Button>
            </div>
          </div>
          <Select value={selectedZoneId} onValueChange={onZoneChange} disabled={availableZones.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={availableZones.length === 0 ? "No zones available" : "Select zone"} />
            </SelectTrigger>
            <SelectContent>
              {availableZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>
    </section>
  );
}
