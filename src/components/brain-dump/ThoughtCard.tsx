import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Archive, Edit2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getCategoryColor } from "@/lib/categoryColors";
import type { Database } from "@/integrations/supabase/types";

type Thought = Database['public']['Tables']['thoughts']['Row'];

interface ThoughtCardProps {
  thought: Thought;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ThoughtCard({ thought, onArchive, onDelete }: ThoughtCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thought.content);
  const [isLoading, setIsLoading] = useState(false);

  const lines = thought.content.split('\n').filter(line => line.trim());
  const title = lines[0] || thought.content.substring(0, 50);
  const snippet = lines.slice(1, 3).join(' ') || (lines.length === 1 ? '' : thought.content.substring(50, 150));

  async function handleSave() {
    if (!editContent.trim()) {
      toast({ title: "Content cannot be empty", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('thoughts')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', thought.id);

    if (error) {
      toast({ title: "Failed to update thought", variant: "destructive" });
    } else {
      toast({ title: "Thought updated" });
      setIsEditing(false);
    }
    setIsLoading(false);
  }

  async function handleArchive() {
    setIsLoading(true);
    const { error } = await supabase
      .from('thoughts')
      .update({ status: 'archived', archived_at: new Date().toISOString() })
      .eq('id', thought.id);

    if (error) {
      toast({ title: "Failed to archive thought", variant: "destructive" });
    } else {
      toast({ title: "Thought archived" });
      onArchive?.(thought.id);
    }
    setIsLoading(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this thought?')) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', thought.id);

    if (error) {
      toast({ title: "Failed to delete thought", variant: "destructive" });
    } else {
      toast({ title: "Thought deleted" });
      onDelete?.(thought.id);
    }
    setIsLoading(false);
  }

  return (
    <Card className="p-4 hover:scale-[1.02] hover:shadow-xl transition-all duration-200">
      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[120px]"
            disabled={isLoading}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isLoading} size="sm">
              Save
            </Button>
            <Button onClick={() => setIsEditing(false)} variant="outline" size="sm" disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>
            {snippet && (
              <p className="text-sm text-muted-foreground line-clamp-3">{snippet}</p>
            )}
          </div>

          {thought.tags && thought.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {thought.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getCategoryColor(tag) }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
              className="flex-1 sm:flex-none text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
