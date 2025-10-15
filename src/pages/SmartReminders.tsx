import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function SmartReminders() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
          <Bell className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Smart Reminders</h1>
          <p className="text-muted-foreground">Contextual reminders that adapt</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Smart Reminders module will be implemented in Phase 6</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Bell className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p>Intelligent reminders based on time, location, and context</p>
        </CardContent>
      </Card>
    </div>
  );
}
