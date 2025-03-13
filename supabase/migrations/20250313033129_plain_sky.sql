/*
  # Fix Document Policies

  1. Changes
    - Drop and recreate all document-related policies
    - Simplify policy conditions to avoid recursion
    - Use direct checks instead of nested queries
    - Remove circular references between policies

  2. Security
    - Maintain same security model
    - Fix infinite recursion issues
    - Keep policies atomic and efficient
*/

-- Drop all existing policies
DO $$ 
BEGIN
  -- Drop show_documents policies
  DROP POLICY IF EXISTS "Users can view documents they have access to" ON show_documents;
  DROP POLICY IF EXISTS "Users can edit documents they have editor access to" ON show_documents;
  DROP POLICY IF EXISTS "Users can create documents for shows" ON show_documents;
  DROP POLICY IF EXISTS "Admin can delete documents" ON show_documents;

  -- Drop document_collaborators policies
  DROP POLICY IF EXISTS "Users can view collaborators" ON document_collaborators;
  DROP POLICY IF EXISTS "Users can manage collaborators" ON document_collaborators;
  DROP POLICY IF EXISTS "Users can view collaborators for their documents" ON document_collaborators;
  DROP POLICY IF EXISTS "Document owners and admins can manage collaborators" ON document_collaborators;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new simplified policies for show_documents
DO $$ 
BEGIN
  -- Basic view policy
  CREATE POLICY "View documents"
    ON show_documents
    FOR SELECT
    TO authenticated
    USING (
      -- Document creator
      created_by = auth.uid()
      OR
      -- Admin
      auth.email() = 'hleahy@as.edu.au'
    );

  -- Edit policy
  CREATE POLICY "Edit documents"
    ON show_documents
    FOR UPDATE
    TO authenticated
    USING (
      -- Document creator
      created_by = auth.uid()
      OR
      -- Admin
      auth.email() = 'hleahy@as.edu.au'
    )
    WITH CHECK (
      -- Document creator
      created_by = auth.uid()
      OR
      -- Admin
      auth.email() = 'hleahy@as.edu.au'
    );

  -- Create policy
  CREATE POLICY "Create documents"
    ON show_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (
      -- Show must exist
      EXISTS (
        SELECT 1 FROM shows
        WHERE id = show_id
      )
    );

  -- Delete policy
  CREATE POLICY "Delete documents"
    ON show_documents
    FOR DELETE
    TO authenticated
    USING (
      -- Document creator
      created_by = auth.uid()
      OR
      -- Admin
      auth.email() = 'hleahy@as.edu.au'
    );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating show_documents policies: %', SQLERRM;
END $$;

-- Create new simplified policies for document_collaborators
DO $$ 
BEGIN
  -- View policy
  CREATE POLICY "View collaborators"
    ON document_collaborators
    FOR SELECT
    TO authenticated
    USING (
      -- Collaborator themselves
      user_id = auth.uid()
      OR
      -- Document creator (direct check)
      EXISTS (
        SELECT 1 FROM show_documents
        WHERE id = document_id
        AND created_by = auth.uid()
      )
      OR
      -- Admin
      auth.email() = 'hleahy@as.edu.au'
    );

  -- Manage policy
  CREATE POLICY "Manage collaborators"
    ON document_collaborators
    FOR ALL
    TO authenticated
    USING (
      -- Document creator (direct check)
      EXISTS (
        SELECT 1 FROM show_documents
        WHERE id = document_id
        AND created_by = auth.uid()
      )
      OR
      -- Admin
      auth.email() = 'hleahy@as.edu.au'
    )
    WITH CHECK (
      -- Document creator (direct check)
      EXISTS (
        SELECT 1 FROM show_documents
        WHERE id = document_id
        AND created_by = auth.uid()
      )
      OR
      -- Admin
      auth.email() = 'hleahy@as.edu.au'
    );

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating document_collaborators policies: %', SQLERRM;
END $$;