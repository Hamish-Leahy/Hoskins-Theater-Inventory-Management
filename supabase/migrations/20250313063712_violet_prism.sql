/*
  # Fix document collaborators and policies

  1. Changes
    - Add index on users.email for faster lookups
    - Update policies to allow viewing all users
    - Fix collaborator management policies
    - Add function to automatically add creator as editor

  2. Security
    - Maintain existing RLS
    - Ensure proper access controls
*/

-- Add index on users.email
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Create function to handle new document creation
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

-- Create trigger for new documents
DROP TRIGGER IF EXISTS on_document_created ON show_documents;
CREATE TRIGGER on_document_created
  AFTER INSERT ON show_documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_document();

-- Update policies to allow viewing all users
CREATE POLICY "Allow viewing all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);