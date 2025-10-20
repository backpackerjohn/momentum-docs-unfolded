import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw } from "lucide-react";

interface ReplanDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPlan: any;
  onAccept: () => void;
  isAccepting: boolean;
}

export function ReplanDiffModal({
  isOpen,
  onClose,
  newPlan,
  onAccept,
  isAccepting,
}: ReplanDiffModalProps) {
  if (!newPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Review Your Replan</DialogTitle>
          </div>
          <DialogDescription>
            Here's your updated momentum map. Review the changes and accept when ready.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-6 pr-4">
            {/* Acceptance Criteria */}
            {newPlan.acceptance_criteria && newPlan.acceptance_criteria.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Finish Line</h3>
                <ul className="space-y-2">
                  {newPlan.acceptance_criteria.map((criterion: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Chunks */}
            <div>
              <h3 className="font-semibold mb-3">Phases ({newPlan.chunks?.length || 0})</h3>
              <div className="space-y-4">
                {newPlan.chunks?.map((chunk: any, idx: number) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 bg-accent/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        Phase {idx + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        {chunk.energy_tag} energy
                      </span>
                    </div>
                    <h4 className="font-semibold mb-3">{chunk.title}</h4>
                    {chunk.sub_steps && chunk.sub_steps.length > 0 && (
                      <ul className="space-y-1 text-sm">
                        {chunk.sub_steps.map((step: any, stepIdx: number) => (
                          <li key={stepIdx} className="flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span className="flex-1">{step.title}</span>
                            <span className="text-xs font-mono text-muted-foreground">
                              {step.time_estimate}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isAccepting}>
            Cancel
          </Button>
          <Button onClick={onAccept} disabled={isAccepting}>
            {isAccepting ? 'Accepting...' : 'Accept Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
