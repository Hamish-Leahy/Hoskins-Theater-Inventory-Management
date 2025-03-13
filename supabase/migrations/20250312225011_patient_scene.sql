/*
  # Fix Document Collaborator Policies

  1. Changes
    - Fix infinite recursion in document_collaborators policies
    - Simplify policy conditions to avoid circular references
    - Maintain same security model with optimized queries
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view collaborators for their documents" ON document_collaborators;
  DROP POLICY IF EXISTS "Document owners and admins can manage collaborators" ON document_collaborators;
END $$;

-- Create new optimized policies for document_collaborators
CREATE POLICY "Users can view collaborators for their documents"
  ON document_collaborators
  FOR SELECT
  TO authenticated
  USING (
    -- User is document owner
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_collaborators.document_id
      AND created_by = auth.uid()
    )
    OR
    -- User is a collaborator
    user_id = auth.uid()
    OR
    -- User is admin
    auth.email() = 'hleahy@as.edu.au'
  );

CREATE POLICY "Document owners and admins can manage collaborators"
  ON document_collaborators
  FOR ALL
  TO authenticated
  USING (
    -- User is document owner
    EXISTS (
      SELECT 1 FROM show_documents
      WHERE id = document_collaborators.document_id
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
      WHERE id = document_collaborators.document_id
      AND created_by = auth.uid()
    )
    OR
    -- User is admin
    auth.email() = 'hleahy@as.edu.au'
  );