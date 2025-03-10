/*
  # Add Show Archives Schema

  1. New Tables
    - `shows`
      - `id` (uuid, primary key)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `description` (text)
      - `status` (text) - 'upcoming', 'active', 'completed'
      - `created_at` (timestamp)
    
    - `show_items`
      - `id` (uuid, primary key)
      - `show_id` (uuid, foreign key)
      - `item_id` (uuid, foreign key)
      - `assigned_date` (timestamp)
      - `return_date` (timestamp)
      - `notes` (text)
      - `status` (text) - 'assigned', 'returned'

    - `show_files`
      - `id` (uuid, primary key)
      - `show_id` (uuid, foreign key)
      - `name` (text)
      - `file_url` (text)
      - `file_type` (text)
      - `size` (bigint)
      - `uploaded_by` (uuid, foreign key)
      - `uploaded_at` (timestamp)
      - `description` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date,
  end_date date,
  description text,
  status text DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all shows"
  ON shows
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage shows"
  ON shows
  USING ((jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);

-- Show items table
CREATE TABLE IF NOT EXISTS show_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  assigned_date timestamptz DEFAULT now(),
  return_date timestamptz,
  notes text,
  status text DEFAULT 'assigned',
  UNIQUE(show_id, item_id)
);

ALTER TABLE show_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view show items"
  ON show_items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage show items"
  ON show_items
  USING ((jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);

-- Show files table
CREATE TABLE IF NOT EXISTS show_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  size bigint,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  description text
);

ALTER TABLE show_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view show files"
  ON show_files
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage show files"
  ON show_files
  USING ((jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text)
  WITH CHECK ((jwt() ->> 'email'::text) = 'hleahy@as.edu.au'::text);