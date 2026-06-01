"use client";

import { motion } from "framer-motion";
import { GridLegend } from "./GridLegend";
import { PalletGrid } from "./PalletGrid";
import type { PalletSpot } from "./types";

type LayoutCanvasProps = {
  rows: number;
  columns: number;
  rowAliases?: Record<string, string>;
  spots: PalletSpot[];
  selectedSpotIds: string[];
  onToggleSpot: (spot: PalletSpot) => void;
  onAddSpotToSelection: (spot: PalletSpot) => void;
  onRowAliasChange: (row: number, value: string) => void;
};

export function LayoutCanvas({ rows, columns, rowAliases, spots, selectedSpotIds, onToggleSpot, onAddSpotToSelection, onRowAliasChange }: LayoutCanvasProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-950">Zone Grid</h2>
          <p className="mt-1 text-xs text-slate-500">Select spots to edit shared structure values.</p>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-slate-700">Columns</span>
          <span className="text-slate-500">1 - {columns} of {columns}</span>
        </div>
      </div>

      <PalletGrid
        rows={rows}
        columns={columns}
        rowAliases={rowAliases}
        spots={spots}
        zoom={1}
        selectedSpotIds={selectedSpotIds}
        onToggleSpot={onToggleSpot}
        onAddSpotToSelection={onAddSpotToSelection}
        onRowAliasChange={onRowAliasChange}
      />

      <div className="mt-5">
        <GridLegend />
      </div>
    </motion.section>
  );
}
