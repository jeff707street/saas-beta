"use client";

import { Layers3, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PalletSpot } from "./types";

type PalletSpotCellProps = {
  spot: PalletSpot;
  selected: boolean;
  size: number;
  onPointerDown: (spot: PalletSpot) => void;
  onPointerEnter: (spot: PalletSpot) => void;
};

export function PalletSpotCell({ spot, selected, size, onPointerDown, onPointerEnter }: PalletSpotCellProps) {
  return (
    <motion.button
      type="button"
      layout
      whileHover={{ scale: selected ? 1.03 : 1.02 }}
      whileTap={{ scale: 0.97 }}
      animate={selected ? { scale: [1, 1.05, 1] } : { scale: 1 }}
      transition={{ duration: 0.22 }}
      onPointerDown={(event) => {
        event.preventDefault();
        onPointerDown(spot);
      }}
      onPointerEnter={() => onPointerEnter(spot)}
      className={cn(
        "flex cursor-pointer select-none flex-col items-center justify-center rounded-md border p-0.5 text-[10px] font-bold leading-none transition-all duration-200",
        spot.status === "empty" && "border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-blue-300 hover:bg-blue-50",
        spot.status === "structure" && "border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-400",
        spot.status === "blocked" &&
          "border-red-200 bg-[repeating-linear-gradient(135deg,#fff1f2_0,#fff1f2_7px,#fecdd3_7px,#fecdd3_14px)] text-red-700",
        spot.status === "disabled" &&
          "border-slate-300 bg-[repeating-linear-gradient(135deg,#f8fafc_0,#f8fafc_7px,#e2e8f0_7px,#e2e8f0_14px)] text-slate-400",
        selected && "border-2 border-blue-600 bg-blue-50 text-blue-700 shadow-[0_10px_28px_rgba(37,99,235,0.16)]",
      )}
      style={{ width: size, height: size }}
    >
      {spot.status === "empty" && !selected ? (
        <Plus className="h-4 w-4" />
      ) : (
        <>
          <span>{spot.code}</span>
          <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] leading-none">
            <Layers3 className="h-3 w-3" />
            {spot.levels}
          </span>
        </>
      )}
    </motion.button>
  );
}
