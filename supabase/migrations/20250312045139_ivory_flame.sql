/*
  # Add BioBox Equipment

  1. New Items
    - Lighting Control Equipment
      - IonXe Board
      - ETC Submasters
    - Audio Equipment
      - I-liveT80 Soundboard
      - IDR-32
      - ULXD4QL51 Units (5x)
    - Display Equipment
      - HP Screen
      - Projector
      - BioBox TV
    - Communication Equipment
      - Tempest 2400
      - Event Lighting Split Units (2x)

  2. Changes
    - Add detailed equipment specifications
    - Include serial numbers
    - Set proper categories and locations
*/

-- First ensure we have the right categories
INSERT INTO categories (name, description, color)
VALUES 
  ('Lighting Control', 'Lighting control systems and interfaces', 'purple'),
  ('Audio Control', 'Audio mixing and control equipment', 'blue'),
  ('Display Systems', 'Screens, projectors, and displays', 'green'),
  ('Communication', 'Communication and intercom systems', 'yellow')
ON CONFLICT (name) DO NOTHING;

-- Add the new equipment
INSERT INTO items (
  name,
  description,
  serial_number,
  part_number,
  category_id,
  location,
  condition,
  technical_specs,
  status
) VALUES
  -- Lighting Control Equipment
  (
    'IonXe Control Board',
    'Main lighting control board',
    '434110412',
    'IonXe',
    (SELECT id FROM categories WHERE name = 'Lighting Control'),
    'BioBox',
    'good',
    'ETC IonXe lighting control console',
    'available'
  ),
  (
    'ETC Fader Wing',
    'ETC 2x20 submasters fader wing',
    '432002583',
    'ETC 2x20',
    (SELECT id FROM categories WHERE name = 'Lighting Control'),
    'BioBox',
    'good',
    '2x20 fader wing for expanded control',
    'available'
  ),

  -- Display Equipment
  (
    'BioBox HP Monitor',
    'HP monitor for lighting control',
    NULL,
    'HP',
    (SELECT id FROM categories WHERE name = 'Display Systems'),
    'BioBox',
    'good',
    'HP Monitor for lighting control system',
    'available'
  ),
  (
    'NEC Projector',
    'Main theatre projector',
    '1840002LG',
    'NP-PA804UL-BG',
    (SELECT id FROM categories WHERE name = 'Display Systems'),
    'BioBox',
    'good',
    'NEC Professional Installation Projector',
    'available'
  ),
  (
    'Sony BioBox TV',
    'Control room monitoring display',
    '1208104',
    'KDL46W3100',
    (SELECT id FROM categories WHERE name = 'Display Systems'),
    'BioBox',
    'good',
    '46" Sony BRAVIA Professional Display',
    'available'
  ),

  -- Communication Equipment
  (
    'Tempest Intercom',
    'Clear-Com Tempest 2400 wireless intercom',
    NULL,
    'Tempest 2400',
    (SELECT id FROM categories WHERE name = 'Communication'),
    'BioBox',
    'good',
    'Clear-Com Tempest 2400 Digital Wireless Intercom',
    'available'
  ),
  (
    'Event Split 124 A',
    'DMX splitter for lighting control',
    NULL,
    'Split 124',
    (SELECT id FROM categories WHERE name = 'Lighting Control'),
    'BioBox',
    'good',
    'Event Lighting DMX Splitter',
    'available'
  ),
  (
    'Event Split 124 B',
    'DMX splitter for lighting control',
    NULL,
    'Split 124',
    (SELECT id FROM categories WHERE name = 'Lighting Control'),
    'BioBox',
    'good',
    'Event Lighting DMX Splitter',
    'available'
  ),

  -- Audio Equipment
  (
    'I-live T80 Soundboard',
    'Main audio mixing console',
    'ILT080800509',
    'I-liveT80',
    (SELECT id FROM categories WHERE name = 'Audio Control'),
    'BioBox',
    'good',
    'Allen & Heath iLive T80 Digital Mixing System',
    'available'
  ),
  (
    'IDR-32 Audio Interface',
    'Digital audio interface',
    'IDR32X214649',
    'IDR-32',
    (SELECT id FROM categories WHERE name = 'Audio Control'),
    'BioBox',
    'good',
    'Allen & Heath iDR-32 MixRack',
    'available'
  ),
  (
    'Shure ULXD4 Receiver 1',
    'Digital wireless receiver',
    NULL,
    'ULXD4QL51',
    (SELECT id FROM categories WHERE name = 'Audio Control'),
    'BioBox',
    'good',
    'Shure ULXD4 Digital Wireless Receiver',
    'available'
  ),
  (
    'Shure ULXD4 Receiver 2',
    'Digital wireless receiver',
    NULL,
    'ULXD4QL51',
    (SELECT id FROM categories WHERE name = 'Audio Control'),
    'BioBox',
    'good',
    'Shure ULXD4 Digital Wireless Receiver',
    'available'
  ),
  (
    'Shure ULXD4 Receiver 3',
    'Digital wireless receiver',
    NULL,
    'ULXD4QL51',
    (SELECT id FROM categories WHERE name = 'Audio Control'),
    'BioBox',
    'good',
    'Shure ULXD4 Digital Wireless Receiver',
    'available'
  ),
  (
    'Shure ULXD4 Receiver 4',
    'Digital wireless receiver',
    NULL,
    'ULXD4QL51',
    (SELECT id FROM categories WHERE name = 'Audio Control'),
    'BioBox',
    'good',
    'Shure ULXD4 Digital Wireless Receiver',
    'available'
  ),
  (
    'Shure ULXD4 Receiver 5',
    'Digital wireless receiver',
    NULL,
    'ULXD4QL51',
    (SELECT id FROM categories WHERE name = 'Audio Control'),
    'BioBox',
    'good',
    'Shure ULXD4 Digital Wireless Receiver',
    'available'
  )
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  serial_number = EXCLUDED.serial_number,
  part_number = EXCLUDED.part_number,
  category_id = EXCLUDED.category_id,
  location = EXCLUDED.location,
  condition = EXCLUDED.condition,
  technical_specs = EXCLUDED.technical_specs,
  status = EXCLUDED.status;