/*
  # Fix Document Collaborators Policies

  1. Changes
    - Drop and recreate document_collaborators policies
    - Simplify policy conditions to avoid recursion
    - Optimize policy checks for better performance

  2. Security
    - Maintain same security model
    - Fix infinite recursion issue
    - Keep policies atomic and efficient
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view collaborators for their documents" ON document_collaborators;
  DROP POLICY IF EXISTS "Document owners and admins can manage collaborators" ON document_collaborators;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new simplified policies for document_collaborators
DO $$ 
BEGIN
  -- View policy - Simple direct checks without recursion
  CREATE POLICY "Users can view collaborators"
    ON document_collaborators
    FOR SELECT
    TO authenticated
    USING (
      -- User is the collaborator
      user_id = auth.uid()
      OR
      -- User is document owner (direct check)
      EXISTS (
        SELECT 1 FROM show_documents
        WHERE id = document_id
        AND created_by = auth.uid()
      )
      OR
      -- User is admin
      auth.email() = 'hleahy@as.edu.au'
    );

  -- Manage policy - For adding/removing collaborators
  CREATE POLICY "Users can manage collaborators"
    ON document_collaborators
    FOR ALL
    TO authenticated
    USING (
      -- User is document owner (direct check)
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
      -- User is document owner (direct check)
      EXISTS (
        SELECT 1 FROM show_documents
        WHERE id = document_id
        AND created_by = auth.uid()
      )
      OR
      -- User is admin
      auth.email() = 'hleahy@as.edu.au'
    );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;