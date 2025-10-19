import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface Connection {
  thought1_id: string;
  thought2_id: string;
  thought1_content: string;
  thought2_content: string;
  strength: 'Strong' | 'Medium' | 'Weak';
  reason: string;
}

interface ConnectionCardProps {
  connection: Connection;
}

export function ConnectionCard({ connection }: ConnectionCardProps) {
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return 'bg-green-500 hover:bg-green-600';
      case 'Medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Weak': return 'bg-gray-500 hover:bg-gray-600';
      default: return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getThoughtPreview = (content: string) => {
    const firstLine = content.split('\n')[0];
    return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Connection Header */}
        <div className="flex items-center justify-between">
          <Badge 
            className={`text-white ${getStrengthColor(connection.strength)}`}
          >
            {connection.strength} Connection
          </Badge>
        </div>

        {/* Connected Thoughts */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* First Thought */}
          <div className="flex-1 min-w-0">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-body font-medium mb-1">Thought 1:</p>
              <p className="text-body text-muted-foreground leading-relaxed">
                "{getThoughtPreview(connection.thought1_content)}"
              </p>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Second Thought */}
          <div className="flex-1 min-w-0">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-body font-medium mb-1">Thought 2:</p>
              <p className="text-body text-muted-foreground leading-relaxed">
                "{getThoughtPreview(connection.thought2_content)}"
              </p>
            </div>
          </div>
        </div>

        {/* Connection Reason */}
        <div className="pt-3 border-t">
          <p className="text-body font-medium mb-1">Connection Insight:</p>
          <p className="text-body text-muted-foreground leading-relaxed">
            {connection.reason}
          </p>
        </div>
      </div>
    </Card>
  );
}