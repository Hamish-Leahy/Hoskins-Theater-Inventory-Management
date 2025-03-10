/*
  # Hoskins Theatre Inventory System Schema

  1. New Tables
    - categories
      - id (uuid, primary key)
      - name (text)
      - description (text)
      - created_at (timestamp)
    
    - items
      - id (uuid, primary key)
      - name (text)
      - category_id (uuid, foreign key)
      - description (text)
      - purchase_date (date)
      - purchase_price (numeric)
      - condition (text)
      - location (text)
      - manual_url (text)
      - receipt_url (text)
      - qr_code (text)
      - created_at (timestamp)
      - last_updated (timestamp)
    
    - checkouts
      - id (uuid, primary key)
      - item_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - checkout_date (timestamp)
      - expected_return_date (timestamp)
      - actual_return_date (timestamp)
      - notes (text)
      - status (text)
      
    - maintenance_logs
      - id (uuid, primary key)
      - item_id (uuid, foreign key)
      - maintenance_date (timestamp)
      - description (text)
      - performed_by (uuid, foreign key)
      - next_maintenance_date (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create categories table
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Create items table
CREATE TABLE items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category_id uuid REFERENCES categories(id),
    description text,
    purchase_date date,
    purchase_price numeric,
    condition text,
    location text,
    manual_url text,
    receipt_url text,
    qr_code text,
    created_at timestamptz DEFAULT now(),
    last_updated timestamptz DEFAULT now()
);

-- Create checkouts table
CREATE TABLE checkouts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid REFERENCES items(id),
    user_id uuid REFERENCES auth.users(id),
    checkout_date timestamptz DEFAULT now(),
    expected_return_date timestamptz,
    actual_return_date timestamptz,
    notes text,
    status text DEFAULT 'checked_out'
);

-- Create maintenance_logs table
CREATE TABLE maintenance_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id uuid REFERENCES items(id),
    maintenance_date timestamptz DEFAULT now(),
    description text NOT NULL,
    performed_by uuid REFERENCES auth.users(id),
    next_maintenance_date timestamptz
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated read access" ON categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON checkouts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access" ON maintenance_logs
    FOR SELECT TO authenticated USING (true);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
    ('Costumes', 'Theatre costumes and accessories'),
    ('Lighting', 'Stage lighting equipment'),
    ('Sound', 'Audio equipment and accessories'),
    ('Set', 'Set pieces and construction materials'),
    ('Props', 'Stage props and hand-held items'),
    ('Tools', 'Construction and maintenance tools'),
    ('Electronics', 'Electronic equipment and cables'),
    ('Documentation', 'Manuals and technical documents');