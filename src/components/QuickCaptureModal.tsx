import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface QuickCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickCaptureModal({ open, onOpenChange }: QuickCaptureModalProps) {
  const [thought, setThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCapture = async () => {
    if (!thought.trim()) {
      toast({
        title: "Please enter a thought",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Save thought to database
      const { error } = await supabase
        .from("thoughts")
        .insert({
          user_id: user.id,
          content: thought.trim(),
          status: "active",
        });

      if (error) throw error;

      toast({
        title: "Thought captured!",
        description: "View it in Brain Dump",
      });

      setThought("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error capturing thought:", error);
      toast({
        title: "Failed to capture thought",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = thought.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">What's on your mind?</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Textarea
              placeholder="Type your thoughts here..."
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              className="min-h-[200px] resize-none text-base"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {charCount} characters
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCapture}
              disabled={isSubmitting || !thought.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                "Capture Thought"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
