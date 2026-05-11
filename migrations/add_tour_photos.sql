ALTER TABLE tours ADD COLUMN IF NOT EXISTS photos json DEFAULT '[]'::json;
