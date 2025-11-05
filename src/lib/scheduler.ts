import { TelegramBot, WeatherAPI, formatWeatherMessage } from './integrations'

export class MessageScheduler {
  private db: D1Database
  
  constructor(db: D1Database) {
    this.db = db
  }
  
  async sendScheduledMessages(): Promise<void> {
    try {
      // Get current time in UTC
      const now = new Date()
      const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`
      
      console.log(`Running scheduler at ${currentTime} UTC`)
      
      // Get bot token
      const botSettings = await this.db.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'telegram_bot_token'"
      ).first()
      
      if (!botSettings || !botSettings.setting_value) {
        console.error('Bot token not configured')
        return
      }
      
      // Get weather API key
      const weatherSettings = await this.db.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'weather_api_key'"
      ).first()
      
      if (!weatherSettings || !weatherSettings.setting_value) {
        console.error('Weather API key not configured')
        return
      }
      
      const bot = new TelegramBot(botSettings.setting_value as string)
      const weatherAPI = new WeatherAPI(weatherSettings.setting_value as string)
      
      // Get all active schedules for current time (within ±2 minutes to handle cron timing)
      const schedules = await this.db.prepare(`
        SELECT 
          s.*,
          u.telegram_chat_id,
          u.telegram_username,
          l.country,
          l.city,
          l.timezone,
          l.language,
          l.temperature_unit
        FROM schedules s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN locations l ON u.id = l.user_id
        WHERE s.is_enabled = 1
          AND u.telegram_chat_id IS NOT NULL
          AND u.subscription_status = 'active'
          AND s.delivery_time = ?
      `).bind(currentTime).all()
      
      console.log(`Found ${schedules.results.length} schedules to process`)
      
      for (const schedule of schedules.results) {
        try {
          let message = ''
          
          if (schedule.schedule_type === 'weather_morning' || schedule.schedule_type === 'weather_night') {
            // Send weather update
            if (schedule.city && schedule.country) {
              const weather = await weatherAPI.getCurrentWeather(schedule.city as string, schedule.country as string)
              
              if (weather.success && weather.data) {
                const timeOfDay = schedule.schedule_type === 'weather_morning' ? '🌅 Good Morning' : '🌙 Good Evening'
                message = `${timeOfDay}!\n\n` + formatWeatherMessage(weather.data, schedule.temperature_unit as string || 'C')
              } else {
                message = `⚠️ Weather update failed: ${weather.error}`
              }
            } else {
              message = '⚠️ Please set your location in dashboard to receive weather updates.'
            }
          } else if (schedule.schedule_type === 'news') {
            // Send news update (placeholder for now)
            message = `📰 <b>Daily News Summary</b>\n\n🔹 News feature coming soon!\nWe're working on bringing you the latest news updates.\n\nStay tuned! 📱`
          }
          
          if (message && schedule.telegram_chat_id) {
            await bot.sendMessage(schedule.telegram_chat_id as string, message)
            console.log(`Sent ${schedule.schedule_type} to user ${schedule.user_id}`)
            
            // Log the delivery
            await this.db.prepare(`
              INSERT INTO messages (user_id, message_type, content, delivery_status, sent_at)
              VALUES (?, ?, ?, 'delivered', CURRENT_TIMESTAMP)
            `).bind(schedule.user_id, schedule.schedule_type, message).run()
          }
        } catch (error) {
          console.error(`Failed to send message to user ${schedule.user_id}:`, error)
          
          // Log the failure
          await this.db.prepare(`
            INSERT INTO messages (user_id, message_type, content, delivery_status, error_message, sent_at)
            VALUES (?, ?, ?, 'failed', ?, CURRENT_TIMESTAMP)
          `).bind(schedule.user_id, schedule.schedule_type, '', error instanceof Error ? error.message : 'Unknown error').run()
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error)
    }
  }
  
  async sendWeatherNow(userId: number): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Get user info
      const user = await this.db.prepare(`
        SELECT u.*, l.country, l.city, l.temperature_unit
        FROM users u
        LEFT JOIN locations l ON u.id = l.user_id
        WHERE u.id = ?
      `).bind(userId).first()
      
      if (!user) {
        return { success: false, error: 'User not found' }
      }
      
      if (!user.telegram_chat_id) {
        return { success: false, error: 'Telegram not connected' }
      }
      
      if (!user.city || !user.country) {
        return { success: false, error: 'Location not set' }
      }
      
      // Get API keys
      const botSettings = await this.db.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'telegram_bot_token'"
      ).first()
      
      const weatherSettings = await this.db.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'weather_api_key'"
      ).first()
      
      if (!botSettings?.setting_value || !weatherSettings?.setting_value) {
        return { success: false, error: 'APIs not configured' }
      }
      
      const bot = new TelegramBot(botSettings.setting_value as string)
      const weatherAPI = new WeatherAPI(weatherSettings.setting_value as string)
      
      const weather = await weatherAPI.getCurrentWeather(user.city as string, user.country as string)
      
      if (!weather.success || !weather.data) {
        return { success: false, error: weather.error || 'Failed to get weather' }
      }
      
      const message = formatWeatherMessage(weather.data, user.temperature_unit as string || 'C')
      
      const result = await bot.sendMessage(user.telegram_chat_id as string, message)
      
      if (result.success) {
        return { success: true, message: 'Weather update sent!' }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}
