import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Map, Bell, PlusCircle } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();

  const modules = [
    {
      title: "Brain Dump",
      description: "Capture thoughts instantly without friction",
      icon: Brain,
      route: "/brain-dump",
      color: "from-primary/20 to-primary/5",
    },
    {
      title: "Momentum Maps",
      description: "AI-powered goal breakdown into achievable steps",
      icon: Map,
      route: "/momentum-maps",
      color: "from-accent/20 to-accent/5",
    },
    {
      title: "Smart Reminders",
      description: "Contextual reminders that adapt to your flow",
      icon: Bell,
      route: "/smart-reminders",
      color: "from-success/20 to-success/5",
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">Your ADHD-friendly productivity hub</p>
        </div>
        <Button size="lg" className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          Quick Capture
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {modules.map((module) => (
          <Card
            key={module.route}
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            onClick={() => navigate(module.route)}
          >
            <CardHeader>
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${module.color} flex items-center justify-center mb-4`}>
                <module.icon className="h-6 w-6 text-foreground" />
              </div>
              <CardTitle>{module.title}</CardTitle>
              <CardDescription>{module.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="w-full">
                Open Module →
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Focus</CardTitle>
          <CardDescription>Your momentum for today</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          No active tasks yet. Start by capturing a thought or creating a momentum map!
        </CardContent>
      </Card>
    </div>
  );
}
