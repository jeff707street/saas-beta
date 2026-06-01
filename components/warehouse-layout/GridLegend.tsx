import { cn } from "@/lib/utils";
import type { SpotStatus } from "./types";

const items: { label: string; status: SpotStatus | "selected" }[] = [
  { label: "Empty / Not set", status: "empty" },
  { label: "Selected", status: "selected" },
  { label: "Structure only", status: "structure" },
  { label: "Blocked", status: "blocked" },
  { label: "Disabled", status: "disabled" },
];

function indicatorClass(status: SpotStatus | "selected") {
  return cn(
    "h-4 w-4 rounded border",
    status === "empty" && "border-dashed border-slate-300 bg-slate-50",
    status === "selected" && "border-blue-600 bg-blue-50",
    status === "structure" && "border-blue-200 bg-blue-50",
    status === "blocked" &&
      "border-red-200 bg-[repeating-linear-gradient(135deg,#fee2e2_0,#fee2e2_6px,#fecaca_6px,#fecaca_12px)]",
    status === "disabled" &&
      "border-slate-300 bg-[repeating-linear-gradient(135deg,#f1f5f9_0,#f1f5f9_6px,#e2e8f0_6px,#e2e8f0_12px)]",
  );
}

export function GridLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-200 pt-5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className={indicatorClass(item.status)} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
