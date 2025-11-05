-- License Keys Table
CREATE TABLE IF NOT EXISTS license_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_key TEXT UNIQUE NOT NULL,
    plan_type TEXT NOT NULL, -- 'monthly', 'yearly'
    duration_days INTEGER NOT NULL,
    is_used INTEGER DEFAULT 0,
    used_by_user_id INTEGER,
    created_by_admin_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME,
    expires_at DATETIME,
    FOREIGN KEY (used_by_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by_admin_id) REFERENCES admin_users(id)
);

-- Payment Requests Table
CREATE TABLE IF NOT EXISTS payment_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan_type TEXT NOT NULL,
    amount REAL NOT NULL,
    whatsapp_message TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add Gemini API key setting
INSERT OR IGNORE INTO api_settings (setting_key, setting_value, is_enabled) 
VALUES ('gemini_api_key', '', 0);

-- Add NewsAPI key setting  
INSERT OR IGNORE INTO api_settings (setting_key, setting_value, is_enabled) 
VALUES ('news_api_key', '', 0);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_license_keys_key ON license_keys(license_key);
CREATE INDEX IF NOT EXISTS idx_license_keys_user ON license_keys(used_by_user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);
