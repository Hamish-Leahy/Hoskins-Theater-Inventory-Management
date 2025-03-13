/*
  # Fix collaborator access and policies

  1. Changes
    - Simplify collaborator access policies
    - Add direct user email access
    - Fix policy recursion issues

  2. Security
    - Maintain RLS protection
    - Ensure proper access control
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "View collaborators" ON document_collaborators;
  DROP POLICY IF EXISTS "Manage collaborators" ON document_collaborators;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Create new simplified policies
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

-- Ensure users table has proper indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Update users policies to allow email lookups
CREATE POLICY "Allow email lookups"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);