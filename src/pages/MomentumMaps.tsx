import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";

export default function MomentumMaps() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
          <Map className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Momentum Maps</h1>
          <p className="text-muted-foreground">AI-powered goal breakdown</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Momentum Maps module will be implemented in Phase 5</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Map className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Transform big goals into achievable chunks with AI assistance</p>
        </CardContent>
      </Card>
    </div>
  );
}
