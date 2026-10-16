ALTER TABLE staff_access ADD COLUMN role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer'));
