import { ClipboardCheck, MapPinned, PackageCheck, PackageOpen, ScanLine, Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { warehouseTasks } from "@/lib/mock-data";

const queues = [
  { title: "Picking queue", count: 42, icon: PackageCheck },
  { title: "Packing queue", count: 18, icon: PackageOpen },
  { title: "Receiving", count: 7, icon: Truck },
  { title: "Putaway", count: 13, icon: MapPinned },
  { title: "Bin locations", count: 1240, icon: ScanLine },
  { title: "Cycle count", count: 9, icon: ClipboardCheck },
];

export default function WarehousePage() {
  return (
    <>
      <PageHeader title="Warehouse / WMS" description="Coordinate floor tasks, bins, receiving, picking, and packing." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {queues.map((queue) => {
          const Icon = queue.icon;
          return (
            <Card key={queue.title}>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>{queue.title}</CardTitle>
                  <CardDescription>{queue.count} active records</CardDescription>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm">Open queue</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Warehouse task board</CardTitle>
          <CardDescription>Mobile-friendly queue grouped by operational workflow.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pick">Pick</TabsTrigger>
              <TabsTrigger value="pack">Pack</TabsTrigger>
              <TabsTrigger value="receive">Receive</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4 grid gap-3 md:grid-cols-2">
              {warehouseTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <div key={task.id} className="rounded-md border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">{task.id}</div>
                          <div className="text-sm text-muted-foreground">{task.zone}</div>
                        </div>
                      </div>
                      <StatusBadge status={task.priority} />
                    </div>
                    <p className="mt-3 text-sm">{task.title}</p>
                  </div>
                );
              })}
            </TabsContent>
            {["pick", "pack", "receive"].map((value) => (
              <TabsContent key={value} value={value} className="mt-4 rounded-md border p-6 text-sm text-muted-foreground">
                Filtered {value} queue placeholder.
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
