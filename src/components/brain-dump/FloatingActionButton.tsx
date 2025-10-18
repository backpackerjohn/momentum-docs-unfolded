import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-shadow"
    >
      <Plus className="h-5 w-5 md:mr-2" />
      <span className="hidden md:inline">Brain Dump</span>
    </Button>
  );
}
