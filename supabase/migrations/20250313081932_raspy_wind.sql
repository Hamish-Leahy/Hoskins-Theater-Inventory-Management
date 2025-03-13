/*
  # Add admin collaborator to all documents

  1. Changes
    - Create function to automatically add admin as collaborator
    - Add trigger to handle new documents
    - Add admin to existing documents

  2. Security
    - Maintain existing RLS policies
    - Ensure admin access to all documents
*/

-- Function to get admin user ID
CREATE OR REPLACE FUNCTION get_admin_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM auth.users WHERE email = 'hleahy@as.edu.au' LIMIT 1;
$$;

-- Update document creation function to add admin
CREATE OR REPLACE FUNCTION handle_new_document()
RETURNS TRIGGER AS $$
DECLARE
  admin_id uuid;
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

  -- Add admin as editor
  admin_id := get_admin_user_id();
  IF admin_id IS NOT NULL AND admin_id != NEW.created_by THEN
    INSERT INTO document_collaborators (
      document_id,
      user_id,
      role,
      added_by
    ) VALUES (
      NEW.id,
      admin_id,
      'editor',
      NEW.created_by
    ) ON CONFLICT (document_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin to existing documents
DO $$
DECLARE
  admin_id uuid;
BEGIN
  admin_id := get_admin_user_id();
  
  IF admin_id IS NOT NULL THEN
    INSERT INTO document_collaborators (
      document_id,
      user_id,
      role,
      added_by
    )
    SELECT 
      d.id,
      admin_id,
      'editor',
      d.created_by
    FROM show_documents d
    WHERE NOT EXISTS (
      SELECT 1 
      FROM document_collaborators dc 
      WHERE dc.document_id = d.id 
      AND dc.user_id = admin_id
    );
  END IF;
END $$;