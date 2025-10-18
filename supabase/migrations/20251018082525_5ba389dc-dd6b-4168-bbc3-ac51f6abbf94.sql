-- Enable realtime updates for thoughts table
ALTER TABLE thoughts REPLICA IDENTITY FULL;

-- Add thoughts table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE thoughts;