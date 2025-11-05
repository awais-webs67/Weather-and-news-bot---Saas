-- API Logs table for tracking API tests and calls
CREATE TABLE IF NOT EXISTS api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  api_name TEXT NOT NULL, -- 'telegram', 'weather', 'whatsapp', etc.
  action TEXT NOT NULL, -- 'test_connection', 'send_message', 'get_weather', etc.
  success INTEGER DEFAULT 0, -- 1 for success, 0 for failure
  details TEXT, -- JSON or text with additional info
  error_message TEXT, -- Error message if failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_api_logs_name ON api_logs(api_name);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- Hashed password
  email TEXT UNIQUE NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Create default admin user (password: admin123)
-- Hashed using SHA-256
INSERT OR IGNORE INTO admin_users (username, password, email) 
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@weathernews.com');
