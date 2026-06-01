"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { PalletSpotCell } from "./PalletSpotCell";
import { getRowDisplayLabel, rowNumberToLabel, type PalletSpot } from "./types";

type PalletGridProps = {
  rows: number;
  columns: number;
  spots: PalletSpot[];
  rowAliases?: Record<string, string>;
  zoom: number;
  selectedSpotIds: string[];
  onToggleSpot: (spot: PalletSpot) => void;
  onAddSpotToSelection: (spot: PalletSpot) => void;
  onRowAliasChange: (row: number, value: string) => void;
};

export function PalletGrid({
  rows,
  columns,
  spots,
  rowAliases,
  zoom,
  selectedSpotIds,
  onToggleSpot,
  onAddSpotToSelection,
  onRowAliasChange,
}: PalletGridProps) {
  const spotMap = new Map(spots.map((spot) => [`${spot.row}-${spot.column}`, spot]));
  const selectedSet = new Set(selectedSpotIds);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartedRef = useRef(false);
  const startSpotRef = useRef<PalletSpot | null>(null);
  const startWasSelectedRef = useRef(false);
  const cellSize = 38 * zoom;
  const rowLabelWidth = 54 * zoom;
  const headerHeight = 20 * zoom;
  const gap = 4 * zoom;

  useEffect(() => {
    function endDrag() {
      if (!startSpotRef.current) {
        return;
      }

      if (!dragStartedRef.current && startWasSelectedRef.current) {
        onToggleSpot(startSpotRef.current);
      }

      setIsDragging(false);
      dragStartedRef.current = false;
      startSpotRef.current = null;
      startWasSelectedRef.current = false;
    }

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);

    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [onToggleSpot]);

  function startDragSelection(spot: PalletSpot) {
    startSpotRef.current = spot;
    startWasSelectedRef.current = selectedSet.has(spot.id);
    dragStartedRef.current = false;
    setIsDragging(true);

    if (!selectedSet.has(spot.id)) {
      onAddSpotToSelection(spot);
    }
  }

  function extendDragSelection(spot: PalletSpot) {
    if (!isDragging || !startSpotRef.current) {
      return;
    }

    if (spot.id !== startSpotRef.current.id) {
      dragStartedRef.current = true;
    }

    onAddSpotToSelection(spot);
  }

  return (
    <div className="overflow-x-auto overflow-y-visible rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
      <div
        className="grid w-max transition-all duration-200 ease-out"
        style={{
          gridTemplateColumns: `${rowLabelWidth}px repeat(${columns}, ${cellSize}px)`,
          gap,
        }}
      >
        <div />
        {Array.from({ length: columns }, (_, index) => (
          <div
            key={index + 1}
            className="flex items-center justify-center text-xs font-semibold text-slate-400 transition-all duration-200"
            style={{ height: headerHeight }}
          >
            {index + 1}
          </div>
        ))}

        {Array.from({ length: rows }, (_, rowIndex) => {
          const row = rowIndex + 1;
          return (
            <Fragment key={`grid-row-${row}`}>
              <div
                key={`row-${row}`}
                className="flex items-center justify-center text-xs font-semibold text-slate-400 transition-all duration-200"
                style={{ height: cellSize }}
              >
                <input
                  value={getRowDisplayLabel(row, rowAliases)}
                  onChange={(event) => {
                    const value = event.target.value;
                    onRowAliasChange(row, value === rowNumberToLabel(row) ? "" : value);
                  }}
                  maxLength={4}
                  aria-label={`Row ${rowNumberToLabel(row)} alias`}
                  title="Edit row alias"
                  className="h-7 w-12 rounded-md border border-slate-200 bg-white px-1 text-center text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-blue-200 hover:bg-blue-50/40 focus:border-blue-300 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              {Array.from({ length: columns }, (_, columnIndex) => {
                const column = columnIndex + 1;
                const spot = spotMap.get(`${row}-${column}`);

                if (!spot) {
                  return null;
                }

                return (
                  <PalletSpotCell
                    key={spot.id}
                    spot={spot}
                    size={cellSize}
                    selected={selectedSet.has(spot.id)}
                    onPointerDown={startDragSelection}
                    onPointerEnter={extendDragSelection}
                  />
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
