-- Add emergency caretaker fields to pets table
ALTER TABLE pets 
ADD COLUMN IF NOT EXISTS emergency_caretaker TEXT,
ADD COLUMN IF NOT EXISTS emergency_caretaker_phone TEXT;

-- Add comments
COMMENT ON COLUMN pets.emergency_caretaker IS 'Name of person who should care for this pet in case of emergency';
COMMENT ON COLUMN pets.emergency_caretaker_phone IS 'Phone number of emergency caretaker';
