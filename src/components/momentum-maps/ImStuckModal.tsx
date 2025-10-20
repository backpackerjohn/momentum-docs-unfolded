import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2 } from "lucide-react";
import { Chunk } from "@/hooks/useMomentumMaps";

interface ImStuckModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunk: Chunk | null;
  getSuggestions: (goal: string, chunk: any) => Promise<string[]>;
  goal: string;
}

export function ImStuckModal({
  isOpen,
  onClose,
  chunk,
  getSuggestions,
  goal,
}: ImStuckModalProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && chunk) {
      setIsLoading(true);
      getSuggestions(goal, chunk)
        .then(setSuggestions)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, chunk, goal, getSuggestions]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
            </div>
            <DialogTitle>You've got this!</DialogTitle>
          </div>
          <DialogDescription>
            Feeling stuck on <strong>{chunk?.title}</strong>? Here are some suggestions to help you move forward.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ul className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="flex gap-3 p-4 rounded-lg bg-accent/50 border border-border"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm flex-1">{suggestion}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Got it, thanks!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
