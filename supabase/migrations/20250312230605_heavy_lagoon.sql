/*
  # Fix Document Policies

  1. Changes
    - Drop and recreate policies for show_documents
    - Fix infinite recursion in policy conditions
    - Maintain same security model with optimized queries

  2. Security
    - Maintain existing access control rules
    - Prevent infinite recursion
    - Keep policies atomic and efficient
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view documents they have access to" ON show_documents;
  DROP POLICY IF EXISTS "Users can edit documents they have editor access to" ON show_documents;
  DROP POLICY IF EXISTS "Users can create documents for shows" ON show_documents;
  DROP POLICY IF EXISTS "Admin can delete documents" ON show_documents;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new optimized policies for show_documents
DO $$ 
BEGIN
  -- View policy
  CREATE POLICY "Users can view documents they have access to"
    ON show_documents
    FOR SELECT
    TO authenticated
    USING (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM document_collaborators
        WHERE document_id = id
        AND user_id = auth.uid()
      )
      OR auth.email() = 'hleahy@as.edu.au'
    );

  -- Edit policy
  CREATE POLICY "Users can edit documents they have editor access to"
    ON show_documents
    FOR UPDATE
    TO authenticated
    USING (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM document_collaborators
        WHERE document_id = id
        AND user_id = auth.uid()
        AND role = 'editor'
      )
      OR auth.email() = 'hleahy@as.edu.au'
    )
    WITH CHECK (
      created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM document_collaborators
        WHERE document_id = id
        AND user_id = auth.uid()
        AND role = 'editor'
      )
      OR auth.email() = 'hleahy@as.edu.au'
    );

  -- Create policy
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

  -- Delete policy
  CREATE POLICY "Admin can delete documents"
    ON show_documents
    FOR DELETE
    TO authenticated
    USING (auth.email() = 'hleahy@as.edu.au');

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policies: %', SQLERRM;
END $$;