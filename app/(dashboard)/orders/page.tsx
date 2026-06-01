import { Calendar, Filter } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orders } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  return (
    <>
      <PageHeader title="Orders" description="Review, filter, pick, pack, and ship orders across every channel." />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Order queue</CardTitle>
            <CardDescription>{orders.length} orders match the current view.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input placeholder="Search order or customer" className="sm:w-64" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4" />
                  Channel
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {["All channels", "Amazon", "Shopify", "eBay", "Walmart", "Retail Store"].map((item) => (
                  <DropdownMenuItem key={item}>{item}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline">
              <Calendar className="h-4 w-4" />
              Date
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden overflow-hidden rounded-md border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.channel}</TableCell>
                    <TableCell><StatusBadge status={order.status} /></TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="text-right">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="sm">Details</Button>
                        </SheetTrigger>
                        <SheetContent>
                          <SheetHeader>
                            <SheetTitle>{order.id}</SheetTitle>
                          </SheetHeader>
                          <div className="space-y-4 text-sm">
                            <div className="rounded-md border p-4">
                              <div className="font-medium">{order.customer}</div>
                              <div className="text-muted-foreground">{order.channel} · {order.date}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-md bg-muted p-3">
                                <div className="text-muted-foreground">Items</div>
                                <div className="text-lg font-semibold">{order.items}</div>
                              </div>
                              <div className="rounded-md bg-muted p-3">
                                <div className="text-muted-foreground">Total</div>
                                <div className="text-lg font-semibold">{formatCurrency(order.total)}</div>
                              </div>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                        </SheetContent>
                      </Sheet>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="grid gap-3 md:hidden">
            {orders.map((order) => (
              <div key={order.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{order.id}</div>
                    <div className="text-sm text-muted-foreground">{order.customer}</div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span>{order.channel} · {order.date}</span>
                  <span className="font-medium">{formatCurrency(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
