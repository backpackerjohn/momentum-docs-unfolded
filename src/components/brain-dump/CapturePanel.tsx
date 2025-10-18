import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CapturePanelProps {
  onCategorizingUpdate?: (thoughtIds: string[], isCategorizing: boolean) => void;
}

export function CapturePanel({ onCategorizingUpdate }: CapturePanelProps) {
  const [content, setContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function splitIntoThoughts(text: string): string[] {
    // First split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
    
    const thoughts: string[] = [];
    
    for (const paragraph of paragraphs) {
      // If paragraph is long (>200 chars), try splitting by sentences
      if (paragraph.length > 200) {
        const sentences = paragraph.split(/\.\s+/).filter(s => s.trim());
        thoughts.push(...sentences.map(s => s.trim() + (s.endsWith('.') ? '' : '.')));
      } else {
        thoughts.push(paragraph.trim());
      }
    }
    
    return thoughts.filter(t => t.length > 0);
  }

  async function handleProcess() {
    if (!content.trim()) {
      toast({ title: "Please enter some thoughts", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const thoughts = splitIntoThoughts(content);
      
      if (thoughts.length === 0) {
        toast({ title: "No valid thoughts found", variant: "destructive" });
        return;
      }

      // Insert thoughts first
      const thoughtRecords = thoughts.map(thought => ({
        user_id: user.id,
        content: thought,
        status: 'active' as const,
      }));

      const { data: insertedThoughts, error: insertError } = await supabase
        .from('thoughts')
        .insert(thoughtRecords)
        .select();

      if (insertError) throw insertError;

      // Track categorizing thoughts
      const thoughtIds = insertedThoughts?.map(t => t.id) || [];
      onCategorizingUpdate?.(thoughtIds, true);

      // Categorize each thought with AI (non-blocking)
      if (insertedThoughts) {
        const categorizationPromises = insertedThoughts.map(async (thought) => {
          try {
            const { data, error } = await supabase.functions.invoke('categorize-thought', {
              body: { 
                thoughtContent: thought.content,
                userId: user.id 
              }
            });

            if (error) {
              console.error('Categorization error for thought:', thought.id, error);
              return;
            }

            if (data?.primaryCategoryId) {
              // Update thought with primary category
              await supabase
                .from('thoughts')
                .update({ category_id: data.primaryCategoryId })
                .eq('id', thought.id);
            }
          } catch (err) {
            console.error('Failed to categorize thought:', err);
          } finally {
            // Remove from categorizing set
            onCategorizingUpdate?.([thought.id], false);
          }
        });

        // Wait for all categorizations to complete
        await Promise.allSettled(categorizationPromises);
      }

      toast({ 
        title: `${thoughts.length} thought${thoughts.length > 1 ? 's' : ''} captured!`,
        description: "AI is categorizing your thoughts..."
      });
      
      setContent("");
    } catch (error) {
      console.error('Error processing thoughts:', error);
      toast({ 
        title: "Failed to process thoughts", 
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Brain dump everything here...&#10;&#10;Press enter twice between different thoughts, or write long paragraphs and we'll split them for you."
          className="min-h-[200px] text-base resize-none"
          disabled={isProcessing}
        />
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {content.length} characters
          </span>
          
          <Button 
            onClick={handleProcess}
            disabled={isProcessing || !content.trim()}
            className="bg-[#e57452] hover:bg-[#e57452]/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing your thoughts...
              </>
            ) : (
              'Process Thoughts'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
