/*
  # Add inventory items and update schema

  1. Schema Updates
    - Add new columns to items table:
      - serial_number (text): For tracking item serial numbers
      - rating (integer): For item quality ratings
      - warranty (text): Warranty information
      - technical_specs (text): Technical specifications
      - part_number (text): Manufacturer part numbers
      - invoice_url (text): Links to invoice documents
      - image_url (text): Links to item images
      - image_metadata (jsonb): Store image metadata
      - stock (integer): Track item quantity
      - status (text): Item status tracking
    - Add unique constraint on name column

  2. Data Migration
    - Insert provided inventory items
    - Map CSV fields to database columns
    - Preserve existing relationships with categories
*/

-- Add unique constraint to name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'items_name_key'
  ) THEN
    ALTER TABLE items ADD CONSTRAINT items_name_key UNIQUE (name);
  END IF;
END $$;

-- Add new columns to items table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'items' AND column_name = 'serial_number'
  ) THEN
    ALTER TABLE items ADD COLUMN serial_number text;
    ALTER TABLE items ADD COLUMN rating integer;
    ALTER TABLE items ADD COLUMN warranty text;
    ALTER TABLE items ADD COLUMN technical_specs text;
    ALTER TABLE items ADD COLUMN part_number text;
    ALTER TABLE items ADD COLUMN invoice_url text;
    ALTER TABLE items ADD COLUMN image_url text;
    ALTER TABLE items ADD COLUMN image_metadata jsonb;
    ALTER TABLE items ADD COLUMN stock integer DEFAULT 1;
    ALTER TABLE items ADD COLUMN status text DEFAULT 'available';
  END IF;
END $$;

-- Insert items
INSERT INTO items (
  name,
  serial_number,
  rating,
  warranty,
  description,
  location,
  category_id,
  part_number
) VALUES
  -- Sound Equipment
  ('Hoskins #1', NULL, NULL, NULL, 'SM58 Microphone', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'SM58'),
  ('Hoskins #2', NULL, NULL, NULL, 'SM58 Microphone', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'SM58'),
  ('Hoskins #3', NULL, NULL, NULL, 'SM58 Microphone', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'SM58'),
  ('Hoskins #4', '3DA29592222', NULL, '2 Years', 'SM58 Microphone', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'SM58'),
  ('Music #2', NULL, NULL, NULL, 'SM58 Microphone', NULL, (SELECT id FROM categories WHERE name = 'Sound'), 'SM58'),
  ('Music #3', NULL, 2, NULL, 'SM58 Microphone - FAULTY', 'Amys Desk', (SELECT id FROM categories WHERE name = 'Sound'), 'SM58'),
  ('Music #4', '3DA29648926', NULL, '2 Years', 'SM58 Microphone - Denis has this mic with approval from Leanne Roobol', 'Denis', (SELECT id FROM categories WHERE name = 'Sound'), 'SM58'),
  ('Lecturen Mic', NULL, NULL, NULL, 'Used for the Lecturn in Hoskins', 'Left Ms Showell Desk', (SELECT id FROM categories WHERE name = 'Sound'), 'MEG 14-40'),
  ('JTS Lecturen Mic', NULL, NULL, NULL, 'Need to check quality', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'JP-GM5218'),
  ('Røde Podcaster', '0012114', NULL, NULL, 'Need to check quality', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'RØDE Podcaster'),
  ('TAS #1', NULL, NULL, NULL, NULL, 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'AXIS 5'),
  ('TAS #2', NULL, NULL, NULL, 'Broken Pin', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'VALVE 500'),
  ('Soundbooth Mic', NULL, 4, NULL, 'Used for soundbooth', 'Mic Shelf', (SELECT id FROM categories WHERE name = 'Sound'), 'JM37DP'),
  ('Drop Mic #3', NULL, NULL, NULL, 'Need to check qaulity', NULL, (SELECT id FROM categories WHERE name = 'Sound'), 'MB2k'),
  ('ArtsNat Lapel', NULL, NULL, NULL, NULL, 'Bio Box', (SELECT id FROM categories WHERE name = 'Sound'), 'BLX12CVL-K14'),
  ('Mic Leads - 21', NULL, 5, NULL, 'counted 29/05/24', NULL, (SELECT id FROM categories WHERE name = 'Sound'), NULL),

  -- Misc Equipment
  ('Full Screen 1', NULL, NULL, NULL, NULL, 'AV Room', (SELECT id FROM categories WHERE name = 'Misc'), NULL),
  ('Half Screen 3', NULL, NULL, NULL, NULL, 'AV Room', (SELECT id FROM categories WHERE name = 'Misc'), NULL),
  ('Portable Projector 1', NULL, 4, NULL, NULL, 'AV Room', (SELECT id FROM categories WHERE name = 'Misc'), NULL),

  -- Stairs
  ('1600 Stairs', NULL, NULL, NULL, 'Hight: 1600mm, Width: 1200mm, Length 2030mm', 'Out Side Hoskins', (SELECT id FROM categories WHERE name = 'Stairs'), NULL),
  ('700 Stairs', NULL, NULL, NULL, 'Hight: 700mm, Width: 1220mm, Length: 770mm', 'Out Side Hoskins', (SELECT id FROM categories WHERE name = 'Stairs'), NULL),
  ('2020 Stairs', NULL, NULL, NULL, 'Stair Height: 2020mm, Rail Height: 3050mm, Width: 750mm, Length: 2400mm', 'Out Side Hoskins', (SELECT id FROM categories WHERE name = 'Stairs'), NULL)
ON CONFLICT (name) DO UPDATE
SET
  serial_number = EXCLUDED.serial_number,
  rating = EXCLUDED.rating,
  warranty = EXCLUDED.warranty,
  description = EXCLUDED.description,
  location = EXCLUDED.location,
  category_id = EXCLUDED.category_id,
  part_number = EXCLUDED.part_number;