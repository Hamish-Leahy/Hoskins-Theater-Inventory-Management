/*
  # Remove access control and add edit history

  1. Changes
    - Remove RLS policies from show_documents
    - Add edit_history column to track changes
    - Add last_edited_by tracking
*/

-- Remove RLS from show_documents
ALTER TABLE show_documents DISABLE ROW LEVEL SECURITY;

-- Add edit history column
ALTER TABLE show_documents 
ADD COLUMN IF NOT EXISTS edit_history jsonb[] DEFAULT ARRAY[]::jsonb[];

-- Update trigger function to track edit history
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Add edit history entry
  NEW.edit_history = array_append(
    COALESCE(OLD.edit_history, ARRAY[]::jsonb[]),
    jsonb_build_object(
      'timestamp', now(),
      'editor', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'content_before', OLD.content,
      'content_after', NEW.content
    )
  );
  
  -- Update timestamps
  NEW.updated_at = now();
  NEW.last_edited_by = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;