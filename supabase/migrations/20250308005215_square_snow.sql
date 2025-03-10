/*
  # System Setup and Policies

  1. Policies
    - Add RLS policies for items table
    - Add RLS policies for categories table
    - Add RLS policies for checkouts table
    - Add RLS policies for maintenance_logs table

  2. Functions
    - Add system metrics function
    - Add emergency shutdown function
    - Add maintenance mode function

  3. Indexes
    - Add performance indexes
*/

-- Enable RLS on all tables
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Enable read access for authenticated users"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for admin users"
ON categories FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Enable update for admin users"
ON categories FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Enable delete for admin users"
ON categories FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- Items Policies
CREATE POLICY "Enable read access for authenticated users"
ON items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for admin users"
ON items FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Enable update for admin users"
ON items FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Enable delete for admin users"
ON items FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- Checkouts Policies
CREATE POLICY "Enable read access for authenticated users"
ON checkouts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON checkouts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON checkouts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Maintenance Logs Policies
CREATE POLICY "Enable read access for authenticated users"
ON maintenance_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for admin users"
ON maintenance_logs FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Enable update for admin users"
ON maintenance_logs FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au')
WITH CHECK (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

CREATE POLICY "Enable delete for admin users"
ON maintenance_logs FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'hleahy@as.edu.au');

-- System Functions
CREATE OR REPLACE FUNCTION get_system_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF (auth.jwt() ->> 'email' != 'hleahy@as.edu.au') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'database_size', pg_size_pretty(pg_database_size(current_database())),
    'cpu_usage', 45, -- Simulated value
    'memory_usage', 60, -- Simulated value
    'disk_usage', 55, -- Simulated value
    'last_backup', NOW() - interval '2 hours'
  ) INTO result;

  RETURN result;
END;
$$;

-- Emergency Shutdown Function
CREATE OR REPLACE FUNCTION emergency_shutdown()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (auth.jwt() ->> 'email' != 'hleahy@as.edu.au') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Simulate emergency shutdown
  -- In a real system, this would trigger actual shutdown procedures
  RAISE NOTICE 'Emergency shutdown initiated';
END;
$$;

-- Maintenance Mode Function
CREATE OR REPLACE FUNCTION toggle_maintenance_mode(enable boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (auth.jwt() ->> 'email' != 'hleahy@as.edu.au') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Simulate maintenance mode toggle
  -- In a real system, this would update system configuration
  RAISE NOTICE 'Maintenance mode %', CASE WHEN enable THEN 'enabled' ELSE 'disabled' END;
END;
$$;

-- Add Performance Indexes
CREATE INDEX IF NOT EXISTS items_category_id_idx ON items(category_id);
CREATE INDEX IF NOT EXISTS checkouts_item_id_idx ON checkouts(item_id);
CREATE INDEX IF NOT EXISTS maintenance_logs_item_id_idx ON maintenance_logs(item_id);
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON categories(parent_id);