-- Add missing fields to align with Momentum Maps spec

-- Add acceptance_criteria to momentum_maps
ALTER TABLE momentum_maps 
ADD COLUMN IF NOT EXISTS acceptance_criteria TEXT[] DEFAULT '{}';

-- Add energy_tag enum type
DO $$ BEGIN
  CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add energy_tag to chunks
ALTER TABLE chunks 
ADD COLUMN IF NOT EXISTS energy_tag energy_level DEFAULT 'medium';

-- Add time_estimate and is_locked to sub_steps
ALTER TABLE sub_steps 
ADD COLUMN IF NOT EXISTS time_estimate TEXT DEFAULT '30 mins';

-- Add locked_chunks tracking to momentum_maps
ALTER TABLE momentum_maps
ADD COLUMN IF NOT EXISTS locked_chunks UUID[] DEFAULT '{}';

COMMENT ON COLUMN momentum_maps.acceptance_criteria IS 'Finish Line criteria - conditions that define goal completion';
COMMENT ON COLUMN chunks.energy_tag IS 'Energy level required: low, medium, or high';
COMMENT ON COLUMN sub_steps.time_estimate IS 'Estimated time to complete (e.g., "30 mins", "2 hours")';
COMMENT ON COLUMN momentum_maps.locked_chunks IS 'Array of chunk IDs that are locked during replan operations';