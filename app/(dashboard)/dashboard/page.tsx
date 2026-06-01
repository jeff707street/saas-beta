import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { activityFeed, inventory, metrics, orders, warehouseTasks } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live view of orders, inventory, channels, and warehouse flow."
        actions={<Button size="sm">Create shipment</Button>}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardDescription>{metric.label}</CardDescription>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{metric.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{metric.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Newest orders across connected channels.</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View all
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="hidden overflow-hidden rounded-md border md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 5).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-xs text-muted-foreground">{order.customer}</div>
                      </TableCell>
                      <TableCell>{order.channel}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="space-y-3 md:hidden">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{order.id}</div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{order.customer} · {order.channel}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory alerts</CardTitle>
              <CardDescription>SKUs that need attention.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {inventory.filter((item) => item.low).map((item) => (
                <div key={item.sku} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">{item.sku}</div>
                    <div className="text-sm text-muted-foreground">{item.name}</div>
                  </div>
                  <Badge variant="orange">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {item.available} left
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Warehouse activity</CardTitle>
              <CardDescription>Recent work across the floor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityFeed.map((item) => (
                <div key={item} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order volume</CardTitle>
            <CardDescription>Placeholder chart for daily order flow.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-end gap-3 rounded-md bg-slate-50 p-4">
              {[42, 68, 51, 88, 73, 96, 84].map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                  <div className="w-full rounded-t bg-blue-500/70" style={{ height: `${height}%` }} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active warehouse tasks</CardTitle>
            <CardDescription>Top queue items.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {warehouseTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{task.type}</span>
                  <StatusBadge status={task.priority} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{task.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
