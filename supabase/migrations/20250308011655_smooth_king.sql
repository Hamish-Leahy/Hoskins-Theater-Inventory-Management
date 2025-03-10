/*
  # Update checkouts table relationships

  1. Changes
    - Add proper foreign key relationship between checkouts and users
    - Update existing RLS policies
    - Add new policies for checkouts management

  2. Security
    - Enable RLS on checkouts table
    - Add policies for users to manage their own checkouts
    - Add policies for admins to manage all checkouts
*/

-- First drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow users to view their own checkouts" ON checkouts;
  DROP POLICY IF EXISTS "Enable insert for authenticated users" ON checkouts;
  DROP POLICY IF EXISTS "Enable read access for authenticated users" ON checkouts;
  DROP POLICY IF EXISTS "Enable update for authenticated users" ON checkouts;
  DROP POLICY IF EXISTS "Users can view all checkouts" ON checkouts;
  DROP POLICY IF EXISTS "Users can manage their own checkouts" ON checkouts;
  DROP POLICY IF EXISTS "Admin can manage all checkouts" ON checkouts;
END $$;

-- Drop existing foreign key if it exists
ALTER TABLE checkouts
DROP CONSTRAINT IF EXISTS checkouts_user_id_fkey;

-- Now we can safely alter the column
ALTER TABLE checkouts
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Add foreign key constraint
ALTER TABLE checkouts
ADD CONSTRAINT checkouts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view all checkouts"
  ON checkouts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own checkouts"
  ON checkouts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all checkouts"
  ON checkouts
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'hleahy@as.edu.au')
  WITH CHECK ((auth.jwt() ->> 'email') = 'hleahy@as.edu.au');