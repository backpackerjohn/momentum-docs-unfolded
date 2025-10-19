-- ============================================================================
-- PHASE 1: CLUSTERS FEATURE
-- ============================================================================

-- Create clusters table for grouping thoughts into projects
CREATE TABLE public.clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_collapsed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clusters_user ON public.clusters(user_id);

ALTER TABLE public.clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own clusters"
  ON public.clusters FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at on clusters
CREATE TRIGGER handle_clusters_updated_at
  BEFORE UPDATE ON public.clusters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Create cluster_thoughts join table (many-to-many with completion tracking)
CREATE TABLE public.cluster_thoughts (
  cluster_id UUID NOT NULL REFERENCES public.clusters(id) ON DELETE CASCADE,
  thought_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cluster_id, thought_id)
);

CREATE INDEX idx_cluster_thoughts_cluster ON public.cluster_thoughts(cluster_id);
CREATE INDEX idx_cluster_thoughts_thought ON public.cluster_thoughts(thought_id);

ALTER TABLE public.cluster_thoughts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage cluster_thoughts for own clusters"
  ON public.cluster_thoughts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clusters
      WHERE clusters.id = cluster_thoughts.cluster_id
      AND clusters.user_id = auth.uid()
    )
  );

-- Enable realtime for clusters
ALTER TABLE public.clusters REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clusters;

ALTER TABLE public.cluster_thoughts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cluster_thoughts;

-- ============================================================================
-- PHASE 2: CONNECTIONS FEATURE (PERSISTENT)
-- ============================================================================

-- Create connections table to persist AI-discovered relationships
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  thought1_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  thought2_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  strength TEXT NOT NULL CHECK (strength IN ('Strong', 'Medium', 'Weak')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT different_thoughts CHECK (thought1_id != thought2_id),
  CONSTRAINT unique_connection UNIQUE (user_id, thought1_id, thought2_id)
);

CREATE INDEX idx_connections_user ON public.connections(user_id);
CREATE INDEX idx_connections_thought1 ON public.connections(thought1_id);
CREATE INDEX idx_connections_thought2 ON public.connections(thought2_id);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connections"
  ON public.connections FOR ALL
  USING (auth.uid() = user_id);

-- Enable realtime for connections
ALTER TABLE public.connections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

-- ============================================================================
-- PHASE 3: MULTI-CATEGORY SUPPORT (1-3 categories per thought)
-- ============================================================================

-- Create thought_categories join table for many-to-many relationship
CREATE TABLE public.thought_categories (
  thought_id UUID NOT NULL REFERENCES public.thoughts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thought_id, category_id)
);

CREATE INDEX idx_thought_categories_thought ON public.thought_categories(thought_id);
CREATE INDEX idx_thought_categories_category ON public.thought_categories(category_id);

ALTER TABLE public.thought_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage thought_categories for own thoughts"
  ON public.thought_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.thoughts
      WHERE thoughts.id = thought_categories.thought_id
      AND thoughts.user_id = auth.uid()
    )
  );

-- Migrate existing category_id data to thought_categories join table
INSERT INTO public.thought_categories (thought_id, category_id)
SELECT id, category_id 
FROM public.thoughts 
WHERE category_id IS NOT NULL;

-- Enable realtime for thought_categories
ALTER TABLE public.thought_categories REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.thought_categories;

-- Note: We keep thoughts.category_id for now as the "primary" category
-- This maintains backward compatibility while adding multi-category support