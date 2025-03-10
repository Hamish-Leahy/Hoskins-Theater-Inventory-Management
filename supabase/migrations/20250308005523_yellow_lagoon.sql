/*
  # Fix Item Deletion

  1. Changes
    - Update foreign key constraints to use CASCADE on delete
    - This ensures that when an item is deleted, all related records (checkouts, maintenance logs) are also deleted

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Update checkouts foreign key to cascade on delete
ALTER TABLE checkouts
DROP CONSTRAINT checkouts_item_id_fkey,
ADD CONSTRAINT checkouts_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE CASCADE;

-- Update maintenance_logs foreign key to cascade on delete
ALTER TABLE maintenance_logs
DROP CONSTRAINT maintenance_logs_item_id_fkey,
ADD CONSTRAINT maintenance_logs_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE CASCADE;