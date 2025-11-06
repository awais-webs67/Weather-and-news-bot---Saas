import { Hono } from 'hono'
import { Bindings, User } from '../types'
import { 
  hashPassword, 
  verifyPassword, 
  createSessionToken, 
  calculateTrialEnd, 
  isValidEmail, 
  sanitize,
  verifySessionToken,
  getCookie
} from '../lib/utils'

const api = new Hono<{ Bindings: Bindings }>()

// Auth middleware
async function authMiddleware(c: any, next: () => Promise<void>) {
  const sessionToken = getCookie(c.req.header('cookie'), 'session')
  
  if (!sessionToken) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const payload = verifySessionToken(sessionToken)
  if (!payload) {
    return c.json({ error: 'Invalid session' }, 401)
  }
  
  // Get user from database
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(payload.userId).first() as User | null
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  
  c.set('user', user)
  await next()
}

// Signup endpoint
api.post('/auth/signup', async (c) => {
  try {
    const { name, email, password } = await c.req.json()
    
    // Validate input
    if (!name || !email || !password) {
      return c.json({ error: 'All fields are required' }, 400)
    }
    
    if (!isValidEmail(email)) {
      return c.json({ error: 'Invalid email format' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400)
    }
    
    // Check if user exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()
    
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400)
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password)
    
    // Calculate trial end date
    const trialEndsAt = calculateTrialEnd(3)
    
    // Insert user
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password, name, trial_ends_at, subscription_plan, subscription_status)
      VALUES (?, ?, ?, ?, 'trial', 'active')
    `).bind(email, hashedPassword, sanitize(name), trialEndsAt).run()
    
    if (!result.success) {
      return c.json({ error: 'Failed to create account' }, 500)
    }
    
    // Create session
    const userId = result.meta.last_row_id as number
    const sessionToken = createSessionToken(userId)
    
    return c.json(
      { success: true, message: 'Account created successfully' },
      200,
      {
        'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
      }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Login endpoint
api.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }
    
    // Get user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first() as User | null
    
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    // Verify password
    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    
    // Create session
    const sessionToken = createSessionToken(user.id)
    
    return c.json(
      { success: true, message: 'Login successful' },
      200,
      {
        'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
      }
    )
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Logout endpoint
api.post('/auth/logout', (c) => {
  return c.json(
    { success: true, message: 'Logged out successfully' },
    200,
    {
      'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
    }
  )
})

// Get user profile
api.get('/user/profile', authMiddleware, async (c) => {
  const user = c.get('user') as User
  
  // Remove sensitive data
  const { password, ...safeUser } = user
  
  // Get user location
  const location = await c.env.DB.prepare(
    'SELECT * FROM locations WHERE user_id = ? AND is_active = 1'
  ).bind(user.id).first()
  
  // Get user schedules
  const schedules = await c.env.DB.prepare(
    'SELECT * FROM schedules WHERE user_id = ?'
  ).bind(user.id).all()
  
  return c.json({
    success: true,
    user: safeUser,
    location: location || null,
    schedules: schedules.results || []
  })
})

// Update user preferences
api.post('/user/preferences', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User
    const { 
      country, 
      city, 
      timezone, 
      language, 
      temperature_unit,
      telegram_username,
      whatsapp_phone,
      preferred_channel
    } = await c.req.json()
    
    // Update user channel info
    if (telegram_username || whatsapp_phone || preferred_channel) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET telegram_username = ?, whatsapp_phone = ?, preferred_channel = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        telegram_username || user.telegram_username || null,
        whatsapp_phone || user.whatsapp_phone || null,
        preferred_channel || user.preferred_channel,
        user.id
      ).run()
    }
    
    // Update or insert location
    if (country && city) {
      // Get timezone from country
      const { getTimezoneForCountry } = await import('../lib/timezone')
      const userTimezone = getTimezoneForCountry(country)
      
      const existingLocation = await c.env.DB.prepare(
        'SELECT id FROM locations WHERE user_id = ?'
      ).bind(user.id).first()
      
      if (existingLocation) {
        await c.env.DB.prepare(`
          UPDATE locations 
          SET country = ?, city = ?, timezone = ?, language = ?, temperature_unit = ?
          WHERE user_id = ?
        `).bind(
          sanitize(country),
          sanitize(city),
          userTimezone,
          language || 'en',
          temperature_unit || 'C',
          user.id
        ).run()
      } else {
        await c.env.DB.prepare(`
          INSERT INTO locations (user_id, country, city, timezone, language, temperature_unit)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          user.id,
          sanitize(country),
          sanitize(city),
          userTimezone,
          language || 'en',
          temperature_unit || 'C'
        ).run()
      }
    }
    
    return c.json({ success: true, message: 'Preferences updated' })
  } catch (error) {
    console.error('Update preferences error:', error)
    return c.json({ error: 'Failed to update preferences' }, 500)
  }
})

// Update schedules
api.post('/user/schedules', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User
    const { schedules } = await c.req.json()
    
    if (!Array.isArray(schedules)) {
      return c.json({ error: 'Invalid schedules format' }, 400)
    }
    
    // Delete existing schedules
    await c.env.DB.prepare('DELETE FROM schedules WHERE user_id = ?').bind(user.id).run()
    
    // Insert new schedules
    for (const schedule of schedules) {
      if (schedule.schedule_type && schedule.delivery_time) {
        await c.env.DB.prepare(`
          INSERT INTO schedules (user_id, schedule_type, delivery_time, is_enabled)
          VALUES (?, ?, ?, ?)
        `).bind(
          user.id,
          schedule.schedule_type,
          schedule.delivery_time,
          schedule.is_enabled ? 1 : 0
        ).run()
      }
    }
    
    return c.json({ success: true, message: 'Schedules updated' })
  } catch (error) {
    console.error('Update schedules error:', error)
    return c.json({ error: 'Failed to update schedules' }, 500)
  }
})

// Get weather (placeholder - will integrate actual API later)
api.get('/weather/:city', authMiddleware, async (c) => {
  const city = c.req.param('city')
  
  // Mock weather data for now
  return c.json({
    success: true,
    weather: {
      city,
      temperature: 25,
      feels_like: 27,
      condition: 'Sunny',
      humidity: 60,
      wind_speed: 10,
      high: 28,
      low: 20
    }
  })
})

// Get news (placeholder - will integrate RSS later)
api.get('/news/:country', authMiddleware, async (c) => {
  const country = c.req.param('country')
  
  // Mock news data for now
  return c.json({
    success: true,
    news: [
      {
        title: 'Sample News Title 1',
        summary: 'This is a sample news summary...',
        published_at: new Date().toISOString()
      },
      {
        title: 'Sample News Title 2',
        summary: 'Another sample news summary...',
        published_at: new Date().toISOString()
      }
    ]
  })
})

// Get Telegram chat ID from bot updates
api.get('/telegram/get-chat-id', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User
    
    // Get Telegram bot token from settings
    const settings = await c.env.DB.prepare(
      "SELECT setting_value FROM api_settings WHERE setting_key = 'telegram_bot_token'"
    ).first()
    
    if (!settings || !settings.setting_value) {
      return c.json({ 
        success: false, 
        error: 'Telegram bot not configured. Please contact admin.' 
      }, 400)
    }
    
    // Import TelegramBot class
    const { TelegramBot } = await import('../lib/integrations')
    const bot = new TelegramBot(settings.setting_value as string)
    
    // Get recent updates
    const result = await bot.getUpdates()
    
    if (!result.success || !result.updates) {
      return c.json({ 
        success: false, 
        error: result.error || 'Failed to get updates from bot' 
      })
    }
    
    // Find messages from user (case-insensitive)
    const userUpdates = result.updates.filter((update: any) => {
      const message = update.message || update.edited_message
      if (!message) return false
      
      const username = message.from?.username?.toLowerCase()
      const userTelegramUsername = user.telegram_username?.replace('@', '').toLowerCase()
      
      return username && userTelegramUsername && username === userTelegramUsername
    })
    
    if (userUpdates.length === 0) {
      // Debug: Show what username we're looking for
      const debugInfo = {
        lookingFor: user.telegram_username?.replace('@', ''),
        foundUsers: result.updates.map((u: any) => {
          const msg = u.message || u.edited_message
          return msg?.from?.username || 'no username'
        }).filter((u, i, arr) => arr.indexOf(u) === i)
      }
      
      return c.json({
        success: false,
        error: `No messages found. Looking for: @${debugInfo.lookingFor}`,
        hint: `Bot: @AivraSols_bot. Found users: ${debugInfo.foundUsers.join(', ')}`,
        debug: debugInfo
      })
    }
    
    // Get the chat ID from the most recent message
    const latestMessage = userUpdates[userUpdates.length - 1]
    const chatId = latestMessage.message?.chat?.id || latestMessage.edited_message?.chat?.id
    
    if (!chatId) {
      return c.json({ 
        success: false, 
        error: 'Could not find your chat ID. Please try again.' 
      })
    }
    
    // Update user's telegram_chat_id in database
    await c.env.DB.prepare(`
      UPDATE users 
      SET telegram_chat_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(chatId.toString(), user.id).run()
    
    return c.json({
      success: true,
      message: 'Chat ID found and saved successfully!',
      chatId: chatId.toString()
    })
  } catch (error) {
    console.error('Get chat ID error:', error)
    return c.json({ error: 'Failed to get chat ID' }, 500)
  }
})

// Send test notification
api.post('/user/test-notification', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User
    
    // Check if user has configured telegram
    if (!user.telegram_username) {
      return c.json({ 
        success: false, 
        error: 'Please configure your Telegram username first' 
      }, 400)
    }
    
    // Get Telegram bot token from settings
    const settings = await c.env.DB.prepare(
      "SELECT setting_value FROM api_settings WHERE setting_key = 'telegram_bot_token'"
    ).first()
    
    if (!settings || !settings.setting_value) {
      return c.json({ 
        success: false, 
        error: 'Telegram bot not configured. Please contact admin.' 
      }, 400)
    }
    
    // If no chat ID, try to get it first
    if (!user.telegram_chat_id) {
      return c.json({
        success: false,
        error: 'Chat ID not found. Please click "Connect Telegram" button first.',
        needsChatId: true
      })
    }
    
    // Import TelegramBot class
    const { TelegramBot } = await import('../lib/integrations')
    const bot = new TelegramBot(settings.setting_value as string)
    
    // Create test message
    const testMessage = `
🎉 <b>Test Notification from WeatherNews Alert!</b>

✅ Your account is successfully connected!
📱 You will receive weather and news updates here.

This is a test message to confirm your setup is working correctly.

Have a great day! ☀️
    `.trim()
    
    // Send message
    const result = await bot.sendMessage(user.telegram_chat_id, testMessage)
    
    if (result.success) {
      return c.json({
        success: true,
        message: 'Test notification sent successfully! Check your Telegram.'
      })
    } else {
      return c.json({
        success: false,
        error: result.error || 'Failed to send message. Please try reconnecting your Telegram.'
      })
    }
  } catch (error) {
    console.error('Test notification error:', error)
    return c.json({ error: 'Failed to send test notification' }, 500)
  }
})

// Activate license key
api.post('/user/activate-license', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User
    const { licenseKey } = await c.req.json()
    
    if (!licenseKey) {
      return c.json({ error: 'License key required' }, 400)
    }
    
    // Check if key exists and is unused
    const key = await c.env.DB.prepare(
      'SELECT * FROM license_keys WHERE license_key = ? AND is_used = 0'
    ).bind(licenseKey.toUpperCase().trim()).first()
    
    if (!key) {
      return c.json({ error: 'Invalid or already used license key' }, 400)
    }
    
    // Calculate expiry date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (key.duration_days as number))
    
    // Mark key as used
    await c.env.DB.prepare(`
      UPDATE license_keys 
      SET is_used = 1, used_by_user_id = ?, activated_at = CURRENT_TIMESTAMP, expires_at = ?
      WHERE id = ?
    `).bind(user.id, expiresAt.toISOString(), key.id).run()
    
    // Update user subscription
    await c.env.DB.prepare(`
      UPDATE users 
      SET subscription_plan = ?, subscription_status = 'active', trial_ends_at = ?
      WHERE id = ?
    `).bind(key.plan_type, expiresAt.toISOString(), user.id).run()
    
    return c.json({ 
      success: true, 
      message: 'License activated successfully!',
      expiresAt: expiresAt.toISOString()
    })
  } catch (error) {
    console.error('Activate license error:', error)
    return c.json({ error: 'Failed to activate license' }, 500)
  }
})

// Request payment (create WhatsApp link)
api.post('/user/request-payment', authMiddleware, async (c) => {
  try {
    const user = c.get('user') as User
    const { planType } = await c.req.json()
    
    if (!planType || !['monthly', 'yearly'].includes(planType)) {
      return c.json({ error: 'Invalid plan type' }, 400)
    }
    
    const { getWhatsAppPaymentLink, PRICING_PLANS } = await import('../lib/pricing')
    const plan = PRICING_PLANS[planType as keyof typeof PRICING_PLANS]
    const whatsappLink = getWhatsAppPaymentLink(planType, user.email)
    
    // Log payment request
    await c.env.DB.prepare(`
      INSERT INTO payment_requests (user_id, plan_type, amount, whatsapp_message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(user.id, planType, plan.price, whatsappLink).run()
    
    return c.json({ 
      success: true, 
      whatsappLink,
      plan: plan.name,
      price: plan.price
    })
  } catch (error) {
    console.error('Request payment error:', error)
    return c.json({ error: 'Failed to create payment request' }, 500)
  }
})

// Get bot settings (public endpoint)
api.get('/bot-settings', async (c) => {
  try {
    const settings = await c.env.DB.prepare(`
      SELECT setting_key, setting_value 
      FROM api_settings 
      WHERE setting_key IN ('telegram_bot_username', 'telegram_bot_link')
    `).all()
    
    const botSettings: any = {}
    settings.results.forEach((row: any) => {
      botSettings[row.setting_key] = row.setting_value
    })
    
    return c.json({
      success: true,
      settings: botSettings
    })
  } catch (error) {
    console.error('Get bot settings error:', error)
    return c.json({ error: 'Failed to get bot settings' }, 500)
  }
})

export default api
