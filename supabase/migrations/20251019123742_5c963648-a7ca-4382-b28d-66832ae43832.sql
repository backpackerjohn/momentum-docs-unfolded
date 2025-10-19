-- Remove the single category_id column from thoughts table
-- Data has already been migrated to thought_categories table
ALTER TABLE public.thoughts DROP COLUMN IF EXISTS category_id;

-- Add index for better query performance on thought_categories
CREATE INDEX IF NOT EXISTS idx_thought_categories_thought_id ON public.thought_categories(thought_id);
CREATE INDEX IF NOT EXISTS idx_thought_categories_category_id ON public.thought_categories(category_id);