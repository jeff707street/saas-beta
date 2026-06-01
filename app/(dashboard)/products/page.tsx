import { ImageIcon, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { products } from "@/lib/mock-data";

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="Manage catalog data and channel listing sync state."
        actions={<Button size="sm"><Plus className="h-4 w-4" />New product</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.sku}>
            <CardHeader>
              <div className="mb-4 flex aspect-[4/3] items-center justify-center rounded-md bg-slate-100">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.brand} · {product.category}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">SKU</span>
                <span className="font-medium">{product.sku}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.channels.map((channel) => <Badge key={channel} variant="secondary">{channel}</Badge>)}
              </div>
              <StatusBadge status={product.sync} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
