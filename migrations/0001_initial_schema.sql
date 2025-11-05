-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  telegram_username TEXT,
  telegram_chat_id TEXT,
  whatsapp_phone TEXT,
  preferred_channel TEXT DEFAULT 'telegram', -- 'telegram' or 'whatsapp'
  trial_ends_at DATETIME,
  subscription_plan TEXT DEFAULT 'free', -- 'free', 'trial', 'premium'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'expired', 'cancelled'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Locations table (user preferences)
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en', -- 'en' or 'ur'
  temperature_unit TEXT DEFAULT 'C', -- 'C' or 'F'
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Schedules table (notification timings)
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  schedule_type TEXT NOT NULL, -- 'weather_morning', 'weather_night', 'news'
  delivery_time TEXT NOT NULL, -- Format: 'HH:MM'
  is_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages log table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  message_type TEXT NOT NULL, -- 'weather', 'news', 'command'
  channel TEXT NOT NULL, -- 'telegram', 'whatsapp'
  content TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- News items table
CREATE TABLE IF NOT EXISTS news_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country TEXT NOT NULL,
  city TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  published_at DATETIME,
  source TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API settings table (for admin panel)
CREATE TABLE IF NOT EXISTS api_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  is_enabled INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weather cache table
CREATE TABLE IF NOT EXISTS weather_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  weather_data TEXT, -- JSON data
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_name TEXT UNIQUE NOT NULL,
  plan_description TEXT,
  price REAL DEFAULT 0,
  duration_days INTEGER DEFAULT 30,
  features TEXT, -- JSON array of features
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON users(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_locations_user ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_news_country ON news_items(country);
CREATE INDEX IF NOT EXISTS idx_weather_cache_city ON weather_cache(city, country);
CREATE INDEX IF NOT EXISTS idx_api_settings_key ON api_settings(setting_key);

-- Insert default API settings
INSERT OR IGNORE INTO api_settings (setting_key, setting_value, is_enabled) VALUES
('whatsapp_enabled', 'false', 0),
('telegram_bot_token', '', 1),
('whatsapp_api_key', '', 0),
('whatsapp_phone_number_id', '', 0),
('weather_api_key', '', 1),
('trial_duration_days', '3', 1);

-- Insert default subscription plans
INSERT OR IGNORE INTO subscription_plans (plan_name, plan_description, price, duration_days, features, is_active) VALUES
('Free Trial', '3-day free trial with all features', 0, 3, '["Weather updates", "News summaries", "Telegram support"]', 1),
('Monthly Premium', 'Monthly subscription with unlimited updates', 9.99, 30, '["Weather updates", "News summaries", "Telegram & WhatsApp support", "Priority delivery"]', 1),
('Yearly Premium', 'Yearly subscription with 20% discount', 95.99, 365, '["Weather updates", "News summaries", "Telegram & WhatsApp support", "Priority delivery", "Custom schedules"]', 1);
