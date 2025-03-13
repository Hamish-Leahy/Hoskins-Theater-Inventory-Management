/*
  # Add Show Documents System

  1. New Tables
    - `show_documents`
      - `id` (uuid, primary key)
      - `show_id` (uuid, foreign key)
      - `title` (text)
      - `content` (text)
      - `type` (text) - 'rehearsal_notes', 'tech_notes', 'production_notes', etc.
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_edited_by` (uuid, foreign key)
    
    - `document_collaborators`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `role` (text) - 'editor', 'viewer'
      - `added_at` (timestamp)
      - `added_by` (uuid, foreign key)

  2. Security
    - Enable RLS on all tables
    - Add policies for document access and editing
*/

-- Create show_documents table
CREATE TABLE show_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  type text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_edited_by uuid REFERENCES auth.users(id)
);

-- Create document_collaborators table
CREATE TABLE document_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES show_documents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'viewer',
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  UNIQUE(document_id, user_id)
);

-- Enable RLS
ALTER TABLE show_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for show_documents
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

-- Policies for document_collaborators
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

-- Function to update document's updated_at and last_edited_by
CREATE OR REPLACE FUNCTION update_document_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_edited_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating document timestamp
CREATE TRIGGER update_document_timestamp
  BEFORE UPDATE ON show_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_timestamp();