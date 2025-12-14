-- Add phone column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add index
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

