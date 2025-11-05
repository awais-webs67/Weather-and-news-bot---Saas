-- Add telegram_chat_id column to users table
ALTER TABLE users ADD COLUMN telegram_chat_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id);
