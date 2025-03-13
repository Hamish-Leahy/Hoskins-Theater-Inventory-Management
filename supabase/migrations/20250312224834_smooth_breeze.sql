/*
  # Fix Show Documents Migration

  1. Changes
    - Add existence checks for tables and policies
    - Drop existing policies before recreating
    - Handle trigger function update
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies for show_documents
  DROP POLICY IF EXISTS "Users can view documents they have access to" ON show_documents;
  DROP POLICY IF EXISTS "Users can edit documents they have editor access to" ON show_documents;
  DROP POLICY IF EXISTS "Users can create documents for shows" ON show_documents;
  DROP POLICY IF EXISTS "Admin can delete documents" ON show_documents;

  -- Drop policies for document_collaborators
  DROP POLICY IF EXISTS "Users can view collaborators for their documents" ON document_collaborators;
  DROP POLICY IF EXISTS "Document owners and admins can manage collaborators" ON document_collaborators;
END $$;

-- Recreate policies for show_documents
CREATE POLICY "Users can view documents they have access to"
  ON show_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = show_documents.id
      AND user_id = auth.uid()
    )
    OR
    created_by = auth.uid()
    OR
    auth.email() = 'hleahy@as.edu.au'
  );

CREATE POLICY "Users can edit documents they have editor access to"
  ON show_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = show_documents.id
      AND user_id = auth.uid()
      AND role = 'editor'
    )
    OR
    created_by = auth.uid()
    OR
    auth.email() = 'hleahy@as.edu.au'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_collaborators
      WHERE document_id = show_documents.id
      AND user_id = auth.uid()
      AND role = 'editor'
    )
    OR
    created_by = auth.uid()
    OR
    auth.email() = 'hleahy@as.edu.au'
  );

CREATE POLICY "Users can create documents for shows"
  ON show_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shows
      WHERE id = show_id
    )
  );

CREATE POLICY "Admin can delete documents"
  ON show_documents
  FOR DELETE
  TO authenticated
  USING (auth.email() = 'hleahy@as.edu.au');

-- Recreate policies for document_collaborators
CREATE POLICY "Users can view collaborators for their documents"
  ON document_collaborators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_id
      AND (
        created_by = auth.uid()
        OR
        EXISTS (
          SELECT 1 FROM document_collaborators dc2
          WHERE dc2.document_id = document_id
          AND dc2.user_id = auth.uid()
        )
      )
    )
    OR
    auth.email() = 'hleahy@as.edu.au'
  );

CREATE POLICY "Document owners and admins can manage collaborators"
  ON document_collaborators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_id
      AND created_by = auth.uid()
    )
    OR
    auth.email() = 'hleahy@as.edu.au'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_id
      AND created_by = auth.uid()
    )
    OR
    auth.email() = 'hleahy@as.edu.au'
  );

-- Drop and recreate trigger function
DROP FUNCTION IF EXISTS update_document_timestamp CASCADE;

CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_edited_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_document_timestamp ON show_documents;

CREATE TRIGGER update_document_timestamp
  BEFORE UPDATE ON show_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_timestamp();