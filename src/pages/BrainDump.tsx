import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

export default function BrainDump() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Brain className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brain Dump</h1>
          <p className="text-muted-foreground">Capture thoughts without friction</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Brain Dump module will be implemented in Phase 4</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Brain className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Quick thought capture, AI categorization, and smart organization</p>
        </CardContent>
      </Card>
    </div>
  );
}
