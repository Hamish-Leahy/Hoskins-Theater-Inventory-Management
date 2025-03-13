/*
  # Add document versioning and metadata

  1. Changes
    - Add version tracking columns
    - Add document metadata columns
    - Add document structure support
    - Add document tags support

  2. Security
    - Maintain existing security model
*/

-- Add new columns for document structure and metadata
ALTER TABLE show_documents 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS structure jsonb DEFAULT '{"type": "doc", "content": []}'::jsonb,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS sections jsonb[] DEFAULT ARRAY[]::jsonb[],
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light',
ADD COLUMN IF NOT EXISTS custom_styles jsonb DEFAULT '{}'::jsonb;

-- Create index for tags search
CREATE INDEX IF NOT EXISTS show_documents_tags_idx ON show_documents USING GIN (tags);

-- Create index for full text search
CREATE INDEX IF NOT EXISTS show_documents_content_idx ON show_documents USING GIN (to_tsvector('english', content));

-- Update document timestamp function to handle versioning
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version
  NEW.version = COALESCE(OLD.version, 1) + 1;
  
  -- Add edit history entry
  NEW.edit_history = array_append(
    COALESCE(OLD.edit_history, ARRAY[]::jsonb[]),
    jsonb_build_object(
      'version', NEW.version,
      'timestamp', now(),
      'editor', (SELECT email FROM auth.users WHERE id = auth.uid()),
      'content_before', OLD.content,
      'content_after', NEW.content,
      'metadata', jsonb_build_object(
        'device', current_setting('request.headers', true)::jsonb->>'user-agent',
        'ip', current_setting('request.headers', true)::jsonb->>'x-real-ip'
      )
    )
  );
  
  -- Update timestamps
  NEW.updated_at = now();
  NEW.last_edited_by = auth.uid();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;