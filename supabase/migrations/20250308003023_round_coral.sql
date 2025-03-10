/*
  # Add category hierarchies and metadata

  1. Changes
    - Add parent_id to categories table for hierarchical relationships
    - Add color field for category styling
    - Add icon field for custom category icons
    - Add cascade delete for items when category is deleted

  2. Security
    - Maintain existing RLS policies
    - Add referential integrity constraints
*/

-- Add new columns to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS color text DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS icon text;

-- Add cascade delete for items
ALTER TABLE items
DROP CONSTRAINT IF EXISTS items_category_id_fkey,
ADD CONSTRAINT items_category_id_fkey 
  FOREIGN KEY (category_id) 
  REFERENCES categories(id) 
  ON DELETE CASCADE;

-- Update RLS policies to handle hierarchical access
CREATE POLICY "Users can view child categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);