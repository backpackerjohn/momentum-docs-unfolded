import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Cluster = Database['public']['Tables']['clusters']['Row'];
type Thought = Database['public']['Tables']['thoughts']['Row'];

interface ClusterWithThoughts extends Cluster {
  cluster_thoughts: {
    thought_id: string;
    is_completed: boolean;
    thoughts: Thought;
  }[];
}

interface ClusterCardProps {
  cluster: ClusterWithThoughts;
  onUpdate?: () => void;
}

export function ClusterCard({ cluster, onUpdate }: ClusterCardProps) {
  const [isExpanded, setIsExpanded] = useState(!cluster.is_collapsed);
  const [isLoading, setIsLoading] = useState(false);

  const totalThoughts = cluster.cluster_thoughts.length;
  const completedThoughts = cluster.cluster_thoughts.filter(ct => ct.is_completed).length;
  const progressPercentage = totalThoughts > 0 ? Math.round((completedThoughts / totalThoughts) * 100) : 0;

  const activeThoughts = cluster.cluster_thoughts.filter(ct => !ct.is_completed);
  const completedThoughtsList = cluster.cluster_thoughts.filter(ct => ct.is_completed);

  async function handleToggleExpanded() {
    setIsLoading(true);
    const newCollapsedState = isExpanded;
    
    const { error } = await supabase
      .from('clusters')
      .update({ is_collapsed: newCollapsedState })
      .eq('id', cluster.id);

    if (error) {
      toast({ title: "Failed to update cluster", variant: "destructive" });
    } else {
      setIsExpanded(!newCollapsedState);
    }
    setIsLoading(false);
  }

  async function handleToggleThoughtCompletion(thoughtId: string, currentCompleted: boolean) {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('cluster_thoughts')
      .update({ is_completed: !currentCompleted })
      .eq('cluster_id', cluster.id)
      .eq('thought_id', thoughtId);

    if (error) {
      toast({ title: "Failed to update thought", variant: "destructive" });
    } else {
      onUpdate?.();
    }
    setIsLoading(false);
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={handleToggleExpanded}
      >
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="p-0 h-6 w-6"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1">
            <h3 className="text-h3 mb-1">{cluster.name}</h3>
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="flex-1 max-w-40" />
              <Badge variant="secondary" className="text-ui-label">
                {completedThoughts}/{totalThoughts}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Active Tasks */}
          {activeThoughts.length > 0 && (
            <div>
              <h4 className="text-body font-medium mb-2 text-muted-foreground">
                Active ({activeThoughts.length})
              </h4>
              <div className="space-y-2">
                {activeThoughts.map((ct) => (
                  <div
                    key={ct.thought_id}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleThoughtCompletion(ct.thought_id, ct.is_completed)}
                      disabled={isLoading}
                      className="mt-0.5 h-4 w-4 p-0 rounded border-2 border-muted-foreground hover:border-green-500"
                    />
                    <div className="flex-1">
                      <p className="text-body leading-relaxed">
                        {ct.thoughts.content.split('\n')[0]}
                      </p>
                      {ct.thoughts.content.split('\n').length > 1 && (
                        <p className="text-caption text-muted-foreground mt-1">
                          {ct.thoughts.content.split('\n').slice(1, 2).join(' ')}...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedThoughtsList.length > 0 && (
            <div>
              <h4 className="text-body font-medium mb-2 text-muted-foreground">
                Completed ({completedThoughtsList.length})
              </h4>
              <div className="space-y-2">
                {completedThoughtsList.map((ct) => (
                  <div
                    key={ct.thought_id}
                    className="flex items-start gap-3 p-2 rounded-md opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleThoughtCompletion(ct.thought_id, ct.is_completed)}
                      disabled={isLoading}
                      className="mt-0.5 h-4 w-4 p-0 rounded bg-green-500 hover:bg-green-600 border-green-500"
                    >
                      <span className="text-white text-xs">✓</span>
                    </Button>
                    <div className="flex-1">
                      <p className="text-body leading-relaxed line-through">
                        {ct.thoughts.content.split('\n')[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {totalThoughts === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-body">No thoughts in this cluster yet</p>
              <p className="text-caption">Drag thoughts here or use bulk actions to add them</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}