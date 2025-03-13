/*
  # Fix Users Table Creation

  1. Changes
    - Drop existing table if exists
    - Create users table properly
    - Update document_collaborators foreign key
    - Add proper security policies

  2. Security
    - Maintain existing security model
    - Add appropriate RLS policies
*/

-- Drop table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR
    auth.email() = 'hleahy@as.edu.au'
  );

-- Drop existing foreign key if it exists
ALTER TABLE document_collaborators
DROP CONSTRAINT IF EXISTS document_collaborators_user_id_fkey;

-- Update foreign key to reference auth.users directly
ALTER TABLE document_collaborators
ADD CONSTRAINT document_collaborators_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;