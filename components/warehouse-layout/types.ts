export type SpotStatus = "empty" | "structure" | "blocked" | "disabled";

export type PalletSpot = {
  id: string;
  layoutId: string;
  row: number;
  column: number;
  code: string;
  status: SpotStatus;
  levels: number;
  notes?: string;
};

export type Warehouse = {
  id: string;
  name: string;
  address?: string;
  zones: Zone[];
};

export type Zone = {
  id: string;
  warehouseId: string;
  name: string;
  layout?: WarehouseLayout;
};

export type WarehouseLayout = {
  id: string;
  warehouseId: string;
  zoneId: string;
  rows: number;
  columns: number;
  rowAliases?: Record<string, string>;
  spots: PalletSpot[];
  updatedAt?: string;
};

const DEFAULT_LAYOUT_ROWS = 15;
const DEFAULT_LAYOUT_COLUMNS = 20;
export const MAX_SPOT_LEVELS = 99;

export function rowNumberToLabel(row: number) {
  let value = Math.max(1, row);
  let label = "";

  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }

  return label;
}

export function createDefaultRowAliases(rows: number) {
  const aliases: Record<string, string> = {};

  for (let row = 1; row <= rows; row += 1) {
    aliases[String(row)] = rowNumberToLabel(row);
  }

  return aliases;
}

export function generateSpotCode(row: number, column: number, rowAliases?: Record<string, string>) {
  return `${getRowDisplayLabel(row, rowAliases)}-${column}`;
}

export function getRowDisplayLabel(row: number, rowAliases?: Record<string, string>) {
  const alias = rowAliases?.[String(row)]?.trim();
  return alias || rowNumberToLabel(row);
}

export function normalizeSpotStatus(value: string): SpotStatus {
  if (value === "structure" || value === "blocked" || value === "disabled") {
    return value;
  }

  return "empty";
}

export function normalizeSpotLevels(value: number): PalletSpot["levels"] {
  return Math.min(MAX_SPOT_LEVELS, Math.max(1, value || 1));
}

export function createSpot(row: number, column: number, layoutId: string): PalletSpot {
  return {
    id: `${layoutId}-spot-${row}-${column}`,
    layoutId,
    row,
    column,
    code: generateSpotCode(row, column),
    status: "empty",
    levels: 1,
    notes: "",
  };
}

export function createSpots(rows: number, columns: number, layoutId: string): PalletSpot[] {
  const spots: PalletSpot[] = [];

  for (let row = 1; row <= rows; row += 1) {
    for (let column = 1; column <= columns; column += 1) {
      spots.push(createSpot(row, column, layoutId));
    }
  }

  return spots;
}

export function createBlankLayout(warehouseId: string, zoneId: string): WarehouseLayout {
  const id = `layout-${warehouseId || "warehouse"}-${zoneId || "zone"}`;

  return {
    id,
    warehouseId,
    zoneId,
    rows: DEFAULT_LAYOUT_ROWS,
    columns: DEFAULT_LAYOUT_COLUMNS,
    rowAliases: createDefaultRowAliases(DEFAULT_LAYOUT_ROWS),
    spots: createSpots(DEFAULT_LAYOUT_ROWS, DEFAULT_LAYOUT_COLUMNS, id),
  };
}
