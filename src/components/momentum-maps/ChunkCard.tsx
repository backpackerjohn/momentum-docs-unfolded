import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Unlock, HelpCircle, ChevronDown, ChevronRight, Zap, Flame, Battery } from "lucide-react";
import { Chunk, SubStep } from "@/hooks/useMomentumMaps";
import { cn } from "@/lib/utils";

interface ChunkCardProps {
  chunk: Chunk;
  chunkNumber: number;
  isLocked: boolean;
  onToggleLock: () => void;
  onToggleSubStep: (subStepId: string, isCompleted: boolean) => void;
  onGetHelp: () => void;
}

const ENERGY_COLORS = {
  low: 'bg-green-500/20 text-green-800 dark:text-green-300 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-800 dark:text-red-300 border-red-500/30',
};

const ENERGY_ICONS = {
  low: Battery,
  medium: Zap,
  high: Flame,
};

export function ChunkCard({
  chunk,
  chunkNumber,
  isLocked,
  onToggleLock,
  onToggleSubStep,
  onGetHelp,
}: ChunkCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  const completedSteps = chunk.sub_steps.filter(s => s.is_completed).length;
  const totalSteps = chunk.sub_steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  const EnergyIcon = ENERGY_ICONS[chunk.energy_tag];

  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-lg relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'perspective(1000px) rotateX(2deg) rotateY(-2deg)' : 'none',
        transition: 'transform 0.2s ease-out',
      }}
    >
      {/* Shimmer effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-start gap-3 flex-1 text-left group"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-muted-foreground">
                  Phase {chunkNumber}
                </span>
                <Badge className={cn(ENERGY_COLORS[chunk.energy_tag], "flex items-center gap-1")}>
                  <EnergyIcon className="h-3 w-3" />
                  {chunk.energy_tag}
                </Badge>
              </div>
              <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                {chunk.title}
              </h3>
            </div>
          </button>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onGetHelp}
              aria-label="Get help with this phase"
              className="h-8 w-8"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleLock}
              aria-label={isLocked ? "Unlock phase" : "Lock phase"}
              className="h-8 w-8"
            >
              {isLocked ? (
                <Lock className="h-4 w-4 text-primary" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{completedSteps} of {totalSteps} steps</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {chunk.sub_steps
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((step) => (
                <li
                  key={step.id}
                  className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={step.id}
                    checked={step.is_completed}
                    onCheckedChange={(checked) => 
                      onToggleSubStep(step.id, checked as boolean)
                    }
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={step.id}
                    className={cn(
                      "flex-1 cursor-pointer select-none",
                      step.is_completed && "line-through text-muted-foreground"
                    )}
                  >
                    <span className="block">{step.title}</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {step.time_estimate}
                    </span>
                  </label>
                </li>
              ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
