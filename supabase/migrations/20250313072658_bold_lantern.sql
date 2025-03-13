/*
  # Fix document collaborators relationships

  1. Changes
    - Drop and recreate document_collaborators table with proper foreign keys
    - Update queries to use auth.users directly
    - Fix collaborator management functions

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access controls
*/

-- Drop existing table and recreate with proper relationships
DROP TABLE IF EXISTS document_collaborators CASCADE;

CREATE TABLE document_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES show_documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer',
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  UNIQUE(document_id, user_id)
);

-- Enable RLS
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "View collaborators"
  ON document_collaborators
  FOR SELECT
  TO authenticated
  USING (
    -- User is a collaborator
    user_id = auth.uid()
    OR
    -- User is document owner
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_id
      AND created_by = auth.uid()
    )
    OR
    -- User is admin
    auth.email() = 'hleahy@as.edu.au'
  );

CREATE POLICY "Manage collaborators"
  ON document_collaborators
  FOR ALL
  TO authenticated
  USING (
    -- User is document owner
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_id
      AND created_by = auth.uid()
    )
    OR
    -- User is admin
    auth.email() = 'hleahy@as.edu.au'
  )
  WITH CHECK (
    -- User is document owner
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_id
      AND created_by = auth.uid()
    )
    OR
    -- User is admin
    auth.email() = 'hleahy@as.edu.au'
  );

-- Update document creation function
CREATE OR REPLACE FUNCTION handle_new_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Add document creator as an editor
  INSERT INTO document_collaborators (
    document_id,
    user_id,
    role,
    added_by
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'editor',
    NEW.created_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;