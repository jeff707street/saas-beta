import { RefreshCw, Store } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { channels } from "@/lib/mock-data";

export default function ChannelsPage() {
  return (
    <>
      <PageHeader title="Channels" description="Monitor marketplace and store connections." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {channels.map((channel) => (
          <Card key={channel.name}>
            <CardHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Store className="h-5 w-5 text-slate-700" />
              </div>
              <CardTitle>{channel.name}</CardTitle>
              <CardDescription>Last sync: {channel.lastSync}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={channel.status} />
                {channel.errors ? <Badge variant="red">{channel.errors} error</Badge> : null}
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <RefreshCw className="h-4 w-4" />
                Sync
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
