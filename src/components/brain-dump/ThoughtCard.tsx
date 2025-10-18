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
type Category = Database['public']['Tables']['categories']['Row'];

interface ThoughtWithCategory extends Thought {
  categories?: Pick<Category, 'id' | 'name' | 'color'> | null;
}

interface ThoughtCardProps {
  thought: ThoughtWithCategory;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
  isCategorizing?: boolean;
}

export function ThoughtCard({ thought, onArchive, onDelete, isCategorizing = false }: ThoughtCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(thought.content);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{name: string, id: string}[]>([]);

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

  async function handleAISuggest() {
    setIsLoadingSuggestions(true);
    setSuggestions([]);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('categorize-thought', {
        body: { 
          thoughtContent: thought.content,
          userId: user.id 
        }
      });

      if (error) throw error;

      if (data?.categories && data?.categoryIds) {
        const suggestionsData = data.categories.map((name: string, idx: number) => ({
          name,
          id: data.categoryIds[idx]
        }));
        setSuggestions(suggestionsData);
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error);
      toast({ title: "Failed to get suggestions", variant: "destructive" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  }

  async function handleAddCategory(categoryId: string) {
    setIsLoading(true);
    const { error } = await supabase
      .from('thoughts')
      .update({ category_id: categoryId })
      .eq('id', thought.id);

    if (error) {
      toast({ title: "Failed to add category", variant: "destructive" });
    } else {
      toast({ title: "Category added!" });
      setSuggestions([]);
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

          <div className="flex flex-wrap gap-2 mb-4">
            {isCategorizing && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                🤖 Categorizing...
              </span>
            )}
            {!isCategorizing && thought.categories && (
              <span
                className="px-2 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: thought.categories.color || getCategoryColor(thought.categories.name) }}
              >
                {thought.categories.name}
              </span>
            )}
            {!isCategorizing && !thought.categories && !thought.category_id && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                Uncategorized
              </span>
            )}
          </div>

          {suggestions.length > 0 && (
            <div className="mb-4 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-2">AI Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(sug => (
                  <button
                    key={sug.id}
                    onClick={() => handleAddCategory(sug.id)}
                    disabled={isLoading}
                    className="px-2 py-1 rounded-full text-xs border-2 border-dashed border-primary text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                  >
                    {sug.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAISuggest}
              disabled={isLoadingSuggestions || isCategorizing || isLoading}
              className="text-xs"
            >
              {isLoadingSuggestions ? 'Generating...' : 'AI Suggest'}
            </Button>
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
