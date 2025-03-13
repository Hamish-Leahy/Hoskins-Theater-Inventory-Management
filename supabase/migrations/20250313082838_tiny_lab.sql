/*
  # Add autosave functionality and image support

  1. Changes
    - Add last_autosave_at column
    - Add autosave_content column for draft content
    - Add images array for tracking uploaded images
    - Add autosave trigger (with proper existence check)
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'show_documents' AND column_name = 'last_autosave_at'
  ) THEN
    ALTER TABLE show_documents ADD COLUMN last_autosave_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'show_documents' AND column_name = 'autosave_content'
  ) THEN
    ALTER TABLE show_documents ADD COLUMN autosave_content text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'show_documents' AND column_name = 'images'
  ) THEN
    ALTER TABLE show_documents ADD COLUMN images jsonb[] DEFAULT ARRAY[]::jsonb[];
  END IF;
END $$;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_autosave ON show_documents;
DROP FUNCTION IF EXISTS handle_autosave();

-- Create or replace the autosave function
CREATE OR REPLACE FUNCTION handle_autosave()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_autosave_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (will not fail since we dropped it above)
CREATE TRIGGER on_autosave
  BEFORE UPDATE OF autosave_content ON show_documents
  FOR EACH ROW
  EXECUTE FUNCTION handle_autosave();