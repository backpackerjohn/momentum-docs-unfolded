-- Momentum ADHD App Database Schema
-- Phase 1A: Complete database foundation with all tables

-- Create enum types
CREATE TYPE public.thought_status AS ENUM ('active', 'archived');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.chunk_status AS ENUM ('not_started', 'in_progress', 'stuck', 'completed');
CREATE TYPE public.reminder_trigger AS ENUM ('time', 'location', 'context', 'manual');

-- ========================================
-- 1. PROFILES TABLE (User data extension)
-- ========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 2. CATEGORIES TABLE (Thought organization)
-- ========================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#e57452',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own categories"
  ON public.categories FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 3. THOUGHTS TABLE (Brain Dump entries)
-- ========================================
CREATE TABLE public.thoughts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status public.thought_status NOT NULL DEFAULT 'active',
  priority public.priority_level DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_thoughts_user_status ON public.thoughts(user_id, status);
CREATE INDEX idx_thoughts_category ON public.thoughts(category_id);
CREATE INDEX idx_thoughts_tags ON public.thoughts USING GIN(tags);

ALTER TABLE public.thoughts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own thoughts"
  ON public.thoughts FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 4. MOMENTUM MAPS TABLE (AI-generated goal plans)
-- ========================================
CREATE TABLE public.momentum_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_momentum_maps_user_active ON public.momentum_maps(user_id, is_active);

ALTER TABLE public.momentum_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own momentum maps"
  ON public.momentum_maps FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 5. CHUNKS TABLE (Map breakdown phases)
-- ========================================
CREATE TABLE public.chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  momentum_map_id UUID NOT NULL REFERENCES public.momentum_maps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.chunk_status NOT NULL DEFAULT 'not_started',
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_duration_hours INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_chunks_map ON public.chunks(momentum_map_id);

ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage chunks for own maps"
  ON public.chunks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.momentum_maps
      WHERE id = chunks.momentum_map_id
      AND user_id = auth.uid()
    )
  );

-- ========================================
-- 6. SUB_STEPS TABLE (Chunk breakdown)
-- ========================================
CREATE TABLE public.sub_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES public.chunks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sub_steps_chunk ON public.sub_steps(chunk_id);

ALTER TABLE public.sub_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sub_steps for own chunks"
  ON public.sub_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chunks c
      JOIN public.momentum_maps m ON m.id = c.momentum_map_id
      WHERE c.id = sub_steps.chunk_id
      AND m.user_id = auth.uid()
    )
  );

-- ========================================
-- 7. ANCHORS TABLE (Recurring schedule blocks)
-- ========================================
CREATE TABLE public.anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  color TEXT DEFAULT '#e57452',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_anchors_user_day ON public.anchors(user_id, day_of_week);

ALTER TABLE public.anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own anchors"
  ON public.anchors FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 8. SMART REMINDERS TABLE (Contextual reminders)
-- ========================================
CREATE TABLE public.smart_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  trigger_type public.reminder_trigger NOT NULL DEFAULT 'manual',
  trigger_time TIMESTAMPTZ,
  trigger_location TEXT,
  trigger_context TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_snoozed BOOLEAN NOT NULL DEFAULT false,
  snooze_until TIMESTAMPTZ,
  priority public.priority_level DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_smart_reminders_user_completed ON public.smart_reminders(user_id, is_completed);
CREATE INDEX idx_smart_reminders_trigger_time ON public.smart_reminders(trigger_time) WHERE is_completed = false;

ALTER TABLE public.smart_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own smart reminders"
  ON public.smart_reminders FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- 9. DND WINDOWS TABLE (Do Not Disturb periods)
-- ========================================
CREATE TABLE public.dnd_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dnd_windows_user_time ON public.dnd_windows(user_id, start_time, end_time);

ALTER TABLE public.dnd_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dnd windows"
  ON public.dnd_windows FOR ALL
  USING (auth.uid() = user_id);

-- ========================================
-- TIMESTAMP TRIGGERS
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_thoughts
  BEFORE UPDATE ON public.thoughts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_momentum_maps
  BEFORE UPDATE ON public.momentum_maps
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_chunks
  BEFORE UPDATE ON public.chunks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_anchors
  BEFORE UPDATE ON public.anchors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_smart_reminders
  BEFORE UPDATE ON public.smart_reminders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();