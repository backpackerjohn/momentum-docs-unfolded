import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Cluster = Database['public']['Tables']['clusters']['Row'];
type Thought = Database['public']['Tables']['thoughts']['Row'];

interface ClusterWithThoughts extends Cluster {
  cluster_thoughts: {
    thought_id: string;
    is_completed: boolean;
    thoughts: Thought;
  }[];
}

export function useClusterData() {
  const [clusters, setClusters] = useState<ClusterWithThoughts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClusters();

    // Subscribe to real-time updates
    const clustersChannel = supabase
      .channel('clusters-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clusters'
        },
        () => {
          fetchClusters();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cluster_thoughts'
        },
        () => {
          fetchClusters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(clustersChannel);
    };
  }, []);

  async function fetchClusters() {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Not authenticated");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('clusters')
        .select(`
          *,
          cluster_thoughts (
            thought_id,
            is_completed,
            thoughts (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setClusters((data as ClusterWithThoughts[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clusters');
    } finally {
      setIsLoading(false);
    }
  }

  async function createCluster(name: string, thoughtIds?: string[]) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create cluster
      const { data: cluster, error: clusterError } = await supabase
        .from('clusters')
        .insert({
          user_id: user.id,
          name,
          is_collapsed: false
        })
        .select()
        .single();

      if (clusterError) throw clusterError;

      // Add thoughts to cluster if provided
      if (thoughtIds && thoughtIds.length > 0) {
        const clusterThoughts = thoughtIds.map(thoughtId => ({
          cluster_id: cluster.id,
          thought_id: thoughtId,
          is_completed: false
        }));

        const { error: linkError } = await supabase
          .from('cluster_thoughts')
          .insert(clusterThoughts);

        if (linkError) throw linkError;
      }

      fetchClusters();
      return cluster;
    } catch (error) {
      throw error;
    }
  }

  return {
    clusters,
    isLoading,
    error,
    refetch: fetchClusters,
    createCluster
  };
}