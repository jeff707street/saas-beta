import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/mock-data";

const variants: Record<string, BadgeProps["variant"]> = {
  Pending: "orange",
  Processing: "blue",
  Picked: "blue",
  Packed: "green",
  Shipped: "green",
  Canceled: "red",
  Synced: "green",
  "Needs review": "orange",
  Syncing: "blue",
  Connected: "green",
  High: "red",
  Medium: "orange",
  Low: "gray",
};

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  return <Badge variant={variants[status] ?? "secondary"}>{status}</Badge>;
}
