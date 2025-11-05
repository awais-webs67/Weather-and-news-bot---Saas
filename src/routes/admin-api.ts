import { Hono } from 'hono'
import { Bindings } from '../types'
import { hashPassword, verifyPassword, createSessionToken, getCookie, verifySessionToken } from '../lib/utils'
import { TelegramBot, WeatherAPI, APILogger } from '../lib/integrations'

const adminApi = new Hono<{ Bindings: Bindings }>()

// Admin authentication middleware
async function adminAuthMiddleware(c: any, next: () => Promise<void>) {
  const sessionToken = getCookie(c.req.header('cookie'), 'admin_session')
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const payload = verifySessionToken(sessionToken)
  if (!payload || !payload.userId) {
    return c.json({ error: 'Invalid session' }, 401)
  }
  
  // Verify admin user exists
  const admin = await c.env.DB.prepare(
    'SELECT * FROM admin_users WHERE id = ? AND is_active = 1'
  ).bind(payload.userId).first()
  
  if (!admin) {
    return c.json({ error: 'Admin not found' }, 404)
  }
  
  c.set('admin', admin)
  await next()
}

// Admin login
adminApi.post('/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400)
    }
    
    // Get admin user
    const admin = await c.env.DB.prepare(
      'SELECT * FROM admin_users WHERE username = ? AND is_active = 1'
    ).bind(username).first() as any
    
    if (!admin) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Verify password
    const isValid = await verifyPassword(password, admin.password)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }
    
    // Update last login
    await c.env.DB.prepare(
      'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(admin.id).run()
    
    // Create session
    const sessionToken = createSessionToken(admin.id)
    
    return c.json(
      { success: true, admin: { username: admin.username, email: admin.email } },
      200,
      {
        'Set-Cookie': `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
      }
    )
  } catch (error) {
    console.error('Admin login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Admin logout
adminApi.post('/auth/logout', (c) => {
  return c.json(
    { success: true },
    200,
    {
      'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    }
  )
})

// Check admin session
adminApi.get('/auth/check', adminAuthMiddleware, async (c) => {
  const admin = c.get('admin') as any
  return c.json({
    success: true,
    admin: {
      username: admin.username,
      email: admin.email
    }
  })
})

// Get stats
adminApi.get('/stats', adminAuthMiddleware, async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    const activeTrials = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'trial' AND subscription_status = 'active'"
    ).first()
    const premiumUsers = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'premium' AND subscription_status = 'active'"
    ).first()
    const messagesToday = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = DATE('now')"
    ).first()

    return c.json({
      success: true,
      stats: {
        totalUsers: (totalUsers as any).count || 0,
        activeTrials: (activeTrials as any).count || 0,
        premiumUsers: (premiumUsers as any).count || 0,
        messagesToday: (messagesToday as any).count || 0
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to load stats' }, 500)
  }
})

// Get settings
adminApi.get('/settings', adminAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT setting_key, setting_value, is_enabled FROM api_settings').all()
    
    const settings: any = {}
    result.results.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value
      settings[`${row.setting_key}_enabled`] = row.is_enabled
    })

    return c.json({ success: true, settings })
  } catch (error) {
    return c.json({ error: 'Failed to load settings' }, 500)
  }
})

// Save settings
adminApi.post('/settings', adminAuthMiddleware, async (c) => {
  try {
    const { settings } = await c.req.json()
    
    for (const [key, value] of Object.entries(settings)) {
      // Skip enabled flags
      if (key.endsWith('_enabled')) continue
      
      const isEnabled = settings[`${key}_enabled`] !== undefined ? settings[`${key}_enabled`] : 1
      
      await c.env.DB.prepare(`
        INSERT INTO api_settings (setting_key, setting_value, is_enabled, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(setting_key) DO UPDATE SET 
          setting_value = ?,
          is_enabled = ?,
          updated_at = CURRENT_TIMESTAMP
      `).bind(key, value, isEnabled, value, isEnabled).run()
    }

    return c.json({ success: true, message: 'Settings saved successfully' })
  } catch (error) {
    console.error('Save settings error:', error)
    return c.json({ error: 'Failed to save settings' }, 500)
  }
})

// Test Telegram API
adminApi.post('/test/telegram', adminAuthMiddleware, async (c) => {
  try {
    const { token } = await c.req.json()
    
    if (!token) {
      return c.json({ error: 'Token is required' }, 400)
    }
    
    const bot = new TelegramBot(token)
    const result = await bot.testConnection()
    
    // Log the test
    const logger = new APILogger(c.env.DB)
    await logger.log(
      'telegram',
      'test_connection',
      result.success,
      result.data ? JSON.stringify(result.data) : undefined,
      result.error
    )
    
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Test Weather API
adminApi.post('/test/weather', adminAuthMiddleware, async (c) => {
  try {
    const { apiKey } = await c.req.json()
    
    if (!apiKey) {
      return c.json({ error: 'API key is required' }, 400)
    }
    
    const weatherApi = new WeatherAPI(apiKey)
    const result = await weatherApi.testConnection()
    
    // Log the test
    const logger = new APILogger(c.env.DB)
    await logger.log(
      'weather',
      'test_connection',
      result.success,
      result.data ? JSON.stringify(result.data) : undefined,
      result.error
    )
    
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Setup bot commands
adminApi.post('/setup-bot-commands', adminAuthMiddleware, async (c) => {
  try {
    const settings = await c.env.DB.prepare(
      "SELECT setting_value FROM api_settings WHERE setting_key = 'telegram_bot_token'"
    ).first()
    
    if (!settings || !settings.setting_value) {
      return c.json({ success: false, error: 'Bot token not configured' }, 400)
    }
    
    const bot = new TelegramBot(settings.setting_value as string)
    const result = await bot.setCommands()
    
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get API logs
adminApi.get('/logs', adminAuthMiddleware, async (c) => {
  try {
    const apiName = c.req.query('api')
    const logger = new APILogger(c.env.DB)
    
    const logs = apiName 
      ? await logger.getLogsByAPI(apiName, 50)
      : await logger.getRecentLogs(100)
    
    return c.json({ success: true, logs })
  } catch (error) {
    return c.json({ error: 'Failed to load logs' }, 500)
  }
})

// Get users
adminApi.get('/users', adminAuthMiddleware, async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT id, email, name, subscription_plan, subscription_status, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    ).all()

    return c.json({ success: true, users: result.results })
  } catch (error) {
    return c.json({ error: 'Failed to load users' }, 500)
  }
})

// Send test notification
adminApi.post('/test/send-message', adminAuthMiddleware, async (c) => {
  try {
    const { chatId, message } = await c.req.json()
    
    if (!chatId || !message) {
      return c.json({ error: 'Chat ID and message are required' }, 400)
    }
    
    // Get Telegram token
    const tokenResult = await c.env.DB.prepare(
      'SELECT setting_value FROM api_settings WHERE setting_key = ? AND is_enabled = 1'
    ).bind('telegram_bot_token').first() as any
    
    if (!tokenResult || !tokenResult.setting_value) {
      return c.json({ error: 'Telegram bot token not configured' }, 400)
    }
    
    const bot = new TelegramBot(tokenResult.setting_value)
    const result = await bot.sendMessage(chatId, message)
    
    // Log the test
    const logger = new APILogger(c.env.DB)
    await logger.log(
      'telegram',
      'send_test_message',
      result.success,
      `Sent to chat ${chatId}`,
      result.error
    )
    
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Get weather for testing
adminApi.post('/test/get-weather', adminAuthMiddleware, async (c) => {
  try {
    const { city, country } = await c.req.json()
    
    if (!city) {
      return c.json({ error: 'City is required' }, 400)
    }
    
    // Get Weather API key
    const keyResult = await c.env.DB.prepare(
      'SELECT setting_value FROM api_settings WHERE setting_key = ? AND is_enabled = 1'
    ).bind('weather_api_key').first() as any
    
    if (!keyResult || !keyResult.setting_value) {
      return c.json({ error: 'Weather API key not configured' }, 400)
    }
    
    const weatherApi = new WeatherAPI(keyResult.setting_value)
    const result = await weatherApi.getCurrentWeather(city, country)
    
    // Log the test
    const logger = new APILogger(c.env.DB)
    await logger.log(
      'weather',
      'get_current_weather',
      result.success,
      result.data ? JSON.stringify(result.data) : undefined,
      result.error
    )
    
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default adminApi
