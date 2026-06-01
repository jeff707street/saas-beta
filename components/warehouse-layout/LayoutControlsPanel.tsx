"use client";

import { AlertCircle, Ban, Loader2, Minus, Plus, RotateCcw, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MAX_SPOT_LEVELS, type PalletSpot } from "./types";

type DraftSpot = Pick<PalletSpot, "notes" | "levels">;

type LayoutControlsPanelProps = {
  rows: number;
  columns: number;
  selectedSpots: PalletSpot[];
  draftSpot: DraftSpot;
  onRowsChange: (value: number) => void;
  onColumnsChange: (value: number) => void;
  onDraftChange: (value: DraftSpot) => void;
  onApplyChanges: () => void;
  onClearSelection: () => void;
  onClearSpots: () => void;
  onBlockSpots: () => void;
  onDisableSpots: () => void;
  onSaveZoneLayout: () => void;
  isSavingZoneLayout?: boolean;
  saveError?: string;
};

type GridStepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function GridStepper({ label, value, onChange }: GridStepperProps) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</label>
      <div className="grid grid-cols-[28px_minmax(44px,1fr)_28px] items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-7 rounded-none border-r border-slate-100"
          onClick={() => onChange(value - 1)}
          aria-label={`Remove ${label.toLowerCase()}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Input
          type="number"
          min={1}
          max={20}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-8 w-full appearance-none rounded-none border-0 bg-transparent px-0 text-center text-sm font-semibold shadow-none [appearance:textfield] focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          aria-label={label}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-7 rounded-none border-l border-slate-100"
          onClick={() => onChange(value + 1)}
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function LayoutControlsPanel({
  rows,
  columns,
  selectedSpots,
  draftSpot,
  onRowsChange,
  onColumnsChange,
  onDraftChange,
  onApplyChanges,
  onClearSelection,
  onClearSpots,
  onBlockSpots,
  onDisableSpots,
  onSaveZoneLayout,
  isSavingZoneLayout = false,
  saveError,
}: LayoutControlsPanelProps) {
  const selectedSpot = selectedSpots[0];
  const selectedCount = selectedSpots.length;
  const hasSelection = selectedCount > 0;
  const isSingleSelection = selectedCount === 1;

  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-fit w-full shrink-0 rounded-2xl border border-slate-200 bg-white px-5 py-6 shadow-soft xl:sticky xl:top-24 xl:w-[360px]"
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">Layout Controls</h2>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-950">Grid Size</h3>
            <span className="text-xs font-medium text-slate-500">
              {rows} x {columns}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <GridStepper label="Rows" value={rows} onChange={onRowsChange} />
            <GridStepper label="Columns" value={columns} onChange={onColumnsChange} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-950">Selected Spots</h3>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClearSelection} disabled={!hasSelection}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2",
              hasSelection && "border-blue-100 bg-blue-50/60",
            )}
          >
            <div className="flex h-9 w-12 shrink-0 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 text-xs font-bold text-blue-700">
              {isSingleSelection && selectedSpot ? selectedSpot.code : selectedCount || "--"}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-900">
                {isSingleSelection && selectedSpot
                  ? `Row ${selectedSpot.row}, Column ${selectedSpot.column}`
                  : hasSelection
                    ? `${selectedCount} spots selected`
                    : "No spot selected"}
              </div>
              <div className="mt-0.5 truncate text-[11px] font-medium text-blue-700">
                {hasSelection ? "Apply shared values below" : "Select one or more grid cells"}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <label className="text-sm font-semibold text-slate-950">Quick Actions</label>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={onClearSpots} disabled={!hasSelection}>
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={onBlockSpots} disabled={!hasSelection}>
              <Ban className="h-4 w-4" />
              Block
            </Button>
            <Button variant="outline" size="sm" onClick={onDisableSpots} disabled={!hasSelection}>
              <X className="h-4 w-4" />
              Disable
            </Button>
          </div>
          <p className="text-xs text-slate-500">These actions update selected spots immediately.</p>
        </section>

        <section className="space-y-2">
          <label className="text-sm font-semibold text-slate-950">Levels</label>
          <Input
            type="number"
            min={1}
            max={MAX_SPOT_LEVELS}
            value={draftSpot.levels}
            disabled={!hasSelection}
            onChange={(event) => {
              const levels = Math.min(MAX_SPOT_LEVELS, Math.max(1, Number(event.target.value) || 1));
              onDraftChange({ ...draftSpot, levels });
            }}
          />
          <p className="text-xs text-slate-500">Applies to all selected spots.</p>
        </section>

        {isSingleSelection ? (
          <section className="space-y-2">
            <label className="text-sm font-semibold text-slate-950">Notes</label>
            <textarea
              value={draftSpot.notes ?? ""}
              onChange={(event) => onDraftChange({ ...draftSpot, notes: event.target.value })}
              placeholder="Add notes about this spot..."
              className="min-h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={onApplyChanges} disabled={!hasSelection}>
            Apply Changes
          </Button>
          <Button variant="outline" onClick={onClearSelection} disabled={!hasSelection}>
            Done
          </Button>
        </div>

        <div className="border-t border-slate-200 pt-5">
          {saveError ? (
            <div className="mb-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          ) : null}
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={onSaveZoneLayout} disabled={isSavingZoneLayout}>
            {isSavingZoneLayout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSavingZoneLayout ? "Saving..." : "Save Layout"}
          </Button>
        </div>
      </div>
    </motion.aside>
  );
}
