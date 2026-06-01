import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

export type OrderStatus = "Pending" | "Processing" | "Picked" | "Packed" | "Shipped" | "Canceled";

export const metrics = [
  { label: "Total orders", value: "1,284", change: "+12.4%", icon: ShoppingBag },
  { label: "Pending shipments", value: "86", change: "-7 today", icon: Truck },
  { label: "Low stock SKUs", value: "24", change: "6 critical", icon: AlertTriangle },
  { label: "Revenue today", value: "$42,810", change: "+18.2%", icon: Activity },
  { label: "Active channels", value: "5", change: "All synced", icon: Store },
];

export const orders = [
  { id: "ORD-10482", customer: "Northstar Supply", channel: "Amazon", status: "Processing" as OrderStatus, date: "May 19", total: 428.5, items: 6 },
  { id: "ORD-10481", customer: "Mira Chen", channel: "Shopify", status: "Picked" as OrderStatus, date: "May 19", total: 189.0, items: 2 },
  { id: "ORD-10480", customer: "Boulder Outfitters", channel: "Walmart", status: "Packed" as OrderStatus, date: "May 18", total: 912.75, items: 12 },
  { id: "ORD-10479", customer: "Evan Torres", channel: "eBay", status: "Pending" as OrderStatus, date: "May 18", total: 76.2, items: 1 },
  { id: "ORD-10478", customer: "Retail POS", channel: "Retail Store", status: "Shipped" as OrderStatus, date: "May 17", total: 341.1, items: 4 },
  { id: "ORD-10477", customer: "Harbor Market", channel: "Shopify", status: "Canceled" as OrderStatus, date: "May 17", total: 59.9, items: 1 },
];

export const inventory = [
  { sku: "ATH-SHOE-09", name: "Aero Trail Runner", available: 18, reserved: 7, location: "A-12-03", channels: ["Amazon", "Shopify"], low: true },
  { sku: "BAG-CAN-21", name: "Canvas Weekender", available: 142, reserved: 19, location: "B-04-11", channels: ["Shopify", "Retail"], low: false },
  { sku: "JKT-RAN-32", name: "Rain Shell Pro", available: 9, reserved: 5, location: "C-01-07", channels: ["Amazon", "eBay", "Walmart"], low: true },
  { sku: "BOT-INS-14", name: "Insulated Bottle", available: 386, reserved: 42, location: "D-08-01", channels: ["All"], low: false },
];

export const products = [
  { sku: "ATH-SHOE-09", name: "Aero Trail Runner", brand: "Kestrel", category: "Footwear", channels: ["Amazon", "Shopify"], sync: "Synced" },
  { sku: "BAG-CAN-21", name: "Canvas Weekender", brand: "Nomad", category: "Bags", channels: ["Shopify", "Retail Store"], sync: "Synced" },
  { sku: "JKT-RAN-32", name: "Rain Shell Pro", brand: "Summit", category: "Outerwear", channels: ["Amazon", "eBay", "Walmart"], sync: "Needs review" },
  { sku: "BOT-INS-14", name: "Insulated Bottle", brand: "Forge", category: "Accessories", channels: ["Amazon", "Shopify", "Walmart"], sync: "Syncing" },
];

export const warehouseTasks = [
  { id: "PICK-3321", type: "Picking", title: "Pick 18 units for wave 42", priority: "High", zone: "Aisle A", icon: PackageCheck },
  { id: "PACK-1188", type: "Packing", title: "Pack Shopify express orders", priority: "Medium", zone: "Station 3", icon: Boxes },
  { id: "RCV-0912", type: "Receiving", title: "Receive PO-772 from Kestrel", priority: "Medium", zone: "Dock 2", icon: Truck },
  { id: "CNT-0219", type: "Cycle count", title: "Count high-variance SKUs", priority: "Low", zone: "Aisle C", icon: CheckCircle2 },
];

export const channels = [
  { name: "Amazon", status: "Connected", lastSync: "4 minutes ago", errors: 0 },
  { name: "Shopify", status: "Connected", lastSync: "9 minutes ago", errors: 0 },
  { name: "eBay", status: "Connected", lastSync: "21 minutes ago", errors: 1 },
  { name: "Walmart", status: "Connected", lastSync: "36 minutes ago", errors: 0 },
  { name: "Retail Store", status: "Connected", lastSync: "Live POS", errors: 0 },
];

export const activityFeed = [
  "Wave 42 released with 31 orders",
  "Amazon inventory sync completed",
  "SKU JKT-RAN-32 crossed reorder point",
  "Receiving closed PO-772 with 240 units",
  "Packing station 3 shipped 18 parcels",
];
