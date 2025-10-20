import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { MomentumMap } from "./useMomentumMaps";

export function useMapGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const generateMap = async (goal: string): Promise<MomentumMap | null> => {
    if (!goal || goal.trim().length === 0) {
      setError("Please enter a goal");
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-map', {
        body: { goal: goal.trim() }
      });

      if (functionError) throw functionError;
      if (!data) throw new Error('No data returned from function');

      toast({
        title: "Map generated!",
        description: "Your momentum map is ready.",
      });

      return data as MomentumMap;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate map';
      console.error('Map generation error:', err);
      setError(errorMessage);
      toast({
        title: "Generation failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const replanMap = async (mapId: string, goal: string, lockedChunks: any[]) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('replan-map', {
        body: { mapId, goal, lockedChunks }
      });

      if (functionError) throw functionError;
      if (!data) throw new Error('No data returned from function');

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to replan';
      console.error('Replan error:', err);
      setError(errorMessage);
      toast({
        title: "Replan failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const getStuckSuggestions = async (goal: string, chunk: any) => {
    try {
      const { data, error: functionError } = await supabase.functions.invoke('get-stuck-suggestions', {
        body: { goal, chunk }
      });

      if (functionError) throw functionError;
      return data?.suggestions || [];
    } catch (err) {
      console.error('Stuck suggestions error:', err);
      return [
        "Break this phase into even smaller tasks - what's the absolute smallest first step?",
        "Who could you ask for help or advice on this specific challenge?",
        "Try timeboxing: commit to working on this for just 25 minutes without judgment."
      ];
    }
  };

  return {
    generateMap,
    replanMap,
    getStuckSuggestions,
    isGenerating,
    error,
    setError,
  };
}
