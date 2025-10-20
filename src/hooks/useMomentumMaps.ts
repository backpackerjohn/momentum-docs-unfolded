import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export type EnergyLevel = 'low' | 'medium' | 'high';

export interface SubStep {
  id: string;
  chunk_id: string;
  title: string;
  time_estimate: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  completed_at: string | null;
}

export interface Chunk {
  id: string;
  momentum_map_id: string;
  title: string;
  description: string | null;
  energy_tag: EnergyLevel;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  sub_steps: SubStep[];
}

export interface MomentumMap {
  id: string;
  user_id: string;
  goal: string;
  description: string | null;
  target_date: string | null;
  is_active: boolean;
  ai_generated: boolean;
  acceptance_criteria: string[];
  locked_chunks: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  chunks: Chunk[];
}

export function useMomentumMaps() {
  const queryClient = useQueryClient();

  const { data: maps, isLoading } = useQuery({
    queryKey: ['momentum-maps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('momentum_maps')
        .select(`
          *,
          chunks (
            *,
            sub_steps (*)
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MomentumMap[];
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('momentum-maps-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'momentum_maps'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['momentum-maps'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chunks'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['momentum-maps'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sub_steps'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['momentum-maps'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const deleteMap = useMutation({
    mutationFn: async (mapId: string) => {
      const { error } = await supabase
        .from('momentum_maps')
        .update({ is_active: false })
        .eq('id', mapId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['momentum-maps'] });
      toast({ title: "Map archived" });
    },
    onError: (error) => {
      toast({ 
        title: "Error archiving map", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  return {
    maps: maps || [],
    isLoading,
    deleteMap: deleteMap.mutate,
  };
}
