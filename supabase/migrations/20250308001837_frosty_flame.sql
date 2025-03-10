/*
  # Set up authentication policies

  1. Changes
    - Add policies for authenticated users to access their own data
    - Add admin-specific policies for full access
    - Enable RLS on all tables

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-specific policies
*/

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Allow authenticated read access to categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  )
  WITH CHECK (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  );

-- Items policies
CREATE POLICY "Allow authenticated read access to items"
  ON items
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to items"
  ON items
  FOR ALL
  TO authenticated
  USING (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  )
  WITH CHECK (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  );

-- Checkouts policies
CREATE POLICY "Allow users to view their own checkouts"
  ON checkouts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow admin full access to checkouts"
  ON checkouts
  FOR ALL
  TO authenticated
  USING (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  )
  WITH CHECK (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  );

-- Maintenance logs policies
CREATE POLICY "Allow authenticated read access to maintenance_logs"
  ON maintenance_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin full access to maintenance_logs"
  ON maintenance_logs
  FOR ALL
  TO authenticated
  USING (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  )
  WITH CHECK (
    coalesce(
      (auth.jwt() ->> 'user_metadata')::jsonb ->> 'is_admin',
      'false'
    )::boolean
  );