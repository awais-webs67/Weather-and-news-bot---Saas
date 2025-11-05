import { Hono } from 'hono'
import { Bindings } from '../types'
import { TelegramBot, WeatherAPI, NewsAPI, formatWeatherMessage, formatNewsMessage } from '../lib/integrations'

const webhook = new Hono<{ Bindings: Bindings }>()

// Telegram webhook handler
webhook.post('/telegram', async (c) => {
  try {
    const update = await c.req.json()
    
    // Handle text messages and commands
    const message = update.message
    if (!message || !message.text) {
      return c.json({ ok: true })
    }
    
    const chatId = message.chat.id.toString()
    const text = message.text.trim()
    const username = message.from?.username
    
    // Get bot token
    const botSettings = await c.env.DB.prepare(
      "SELECT setting_value FROM api_settings WHERE setting_key = 'telegram_bot_token'"
    ).first()
    
    if (!botSettings || !botSettings.setting_value) {
      return c.json({ ok: true })
    }
    
    const bot = new TelegramBot(botSettings.setting_value as string)
    
    // Find user by chat ID or username
    let user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE telegram_chat_id = ?'
    ).bind(chatId).first()
    
    if (!user && username) {
      user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE LOWER(REPLACE(telegram_username, "@", "")) = ?'
      ).bind(username.toLowerCase()).first()
      
      // Update chat ID if found
      if (user) {
        await c.env.DB.prepare(
          'UPDATE users SET telegram_chat_id = ? WHERE id = ?'
        ).bind(chatId, user.id).run()
      }
    }
    
    // Handle commands
    if (text.startsWith('/start')) {
      const welcomeMsg = `
🎉 <b>Welcome to WeatherNews Alert!</b>

I can send you daily weather forecasts and news updates!

<b>Available Commands:</b>
/weather - Get current weather
/news - Get latest news
/settings - View your settings
/help - Get help

<b>Getting Started:</b>
1. Sign up at our website
2. Connect your Telegram account
3. Set your location and schedule
4. Receive automated updates!

Visit: ${c.req.header('origin') || 'https://webapp.pages.dev'}
      `.trim()
      
      await bot.sendMessage(chatId, welcomeMsg)
    }
    else if (text.startsWith('/weather')) {
      if (!user) {
        await bot.sendMessage(chatId, '⚠️ Please connect your account first at our website.')
        return c.json({ ok: true })
      }
      
      // Get user location
      const location = await c.env.DB.prepare(
        'SELECT * FROM locations WHERE user_id = ?'
      ).bind(user.id).first()
      
      if (!location || !location.city || !location.country) {
        await bot.sendMessage(chatId, '⚠️ Please set your location in dashboard first.')
        return c.json({ ok: true })
      }
      
      // Get weather
      const weatherSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'weather_api_key'"
      ).first()
      
      if (!weatherSettings || !weatherSettings.setting_value) {
        await bot.sendMessage(chatId, '⚠️ Weather service not configured.')
        return c.json({ ok: true })
      }
      
      const weatherAPI = new WeatherAPI(weatherSettings.setting_value as string)
      const weather = await weatherAPI.getCurrentWeather(location.city as string, location.country as string)
      
      if (weather.success && weather.data) {
        const msg = formatWeatherMessage(weather.data, location.temperature_unit as string || 'C')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get weather: ${weather.error}`)
      }
    }
    else if (text.startsWith('/news')) {
      if (!user) {
        await bot.sendMessage(chatId, '⚠️ Please connect your account first.')
        return c.json({ ok: true })
      }
      
      const location = await c.env.DB.prepare(
        'SELECT * FROM locations WHERE user_id = ?'
      ).bind(user.id).first()
      
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 <b>News Feature</b>\n\nNews service not configured yet. Contact admin to enable news updates.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const countryCode = location?.country === 'Pakistan' ? 'pk' : 'us'
      const newsResult = await newsAPI.getTopHeadlines(countryCode)
      
      if (newsResult.success && newsResult.articles) {
        const msg = formatNewsMessage(newsResult.articles, location?.language as string || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to fetch news: ${newsResult.error}`)
      }
    }
    else if (text.startsWith('/forecast') || text.startsWith('/7day')) {
      if (!user) {
        await bot.sendMessage(chatId, '⚠️ Please connect your account first.')
        return c.json({ ok: true })
      }
      
      const location = await c.env.DB.prepare(
        'SELECT * FROM locations WHERE user_id = ?'
      ).bind(user.id).first()
      
      if (!location || !location.city) {
        await bot.sendMessage(chatId, '⚠️ Please set your location first.')
        return c.json({ ok: true })
      }
      
      const weatherSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'weather_api_key'"
      ).first()
      
      if (!weatherSettings || !weatherSettings.setting_value) {
        await bot.sendMessage(chatId, '⚠️ Weather service not configured.')
        return c.json({ ok: true })
      }
      
      const weatherAPI = new WeatherAPI(weatherSettings.setting_value as string)
      const forecast = await weatherAPI.getForecast(location.city as string, location.country as string)
      
      if (forecast.success && forecast.data) {
        let msg = `📅 <b>7-Day Forecast for ${forecast.data.city}, ${forecast.data.country}</b>\n\n`
        forecast.data.forecast.forEach((item: any) => {
          const temp = location.temperature_unit === 'F' ? (item.temperature * 9/5 + 32).toFixed(1) : item.temperature.toFixed(1)
          const unit = location.temperature_unit === 'F' ? '°F' : '°C'
          msg += `📆 ${item.time}\n🌡️ ${temp}${unit} - ${item.description}\n\n`
        })
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get forecast: ${forecast.error}`)
      }
    }
    else if (text.startsWith('/settings')) {
      if (!user) {
        await bot.sendMessage(chatId, '⚠️ Please connect your account first.')
        return c.json({ ok: true })
      }
      
      const location = await c.env.DB.prepare(
        'SELECT * FROM locations WHERE user_id = ?'
      ).bind(user.id).first()
      
      const schedules = await c.env.DB.prepare(
        'SELECT * FROM schedules WHERE user_id = ? AND is_enabled = 1'
      ).bind(user.id).all()
      
      let settingsMsg = `<b>⚙️ Your Settings</b>\n\n`
      settingsMsg += `<b>Account:</b> ${user.email}\n`
      settingsMsg += `<b>Plan:</b> ${user.subscription_plan}\n\n`
      
      if (location) {
        settingsMsg += `<b>📍 Location:</b>\n`
        settingsMsg += `${location.city}, ${location.country}\n`
        settingsMsg += `Timezone: ${location.timezone}\n`
        settingsMsg += `Language: ${location.language}\n`
        settingsMsg += `Temperature: ${location.temperature_unit}\n\n`
      }
      
      if (schedules.results && schedules.results.length > 0) {
        settingsMsg += `<b>🔔 Active Schedules:</b>\n`
        schedules.results.forEach((s: any) => {
          const type = s.schedule_type.replace('_', ' ')
          settingsMsg += `• ${type}: ${s.delivery_time}\n`
        })
      }
      
      await bot.sendMessage(chatId, settingsMsg)
    }
    else if (text.startsWith('/help')) {
      const helpMsg = `
<b>❓ Help & Usage</b>

<b>Weather Commands:</b>
/weather - Current weather
/forecast or /7day - 7-day forecast
/weather <city> - Weather for any city

<b>News Commands:</b>
/news - Top headlines

<b>Other Commands:</b>
/start - Start the bot
/settings - View your settings
/help - Show this help

<b>Features:</b>
• Automated daily weather & news
• 7-day weather forecasts
• Multi-language support (EN/UR)
• Custom notification schedules

<b>Need more help?</b>
Visit our website or contact support.
      `.trim()
      
      await bot.sendMessage(chatId, helpMsg)
    }
    
    return c.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return c.json({ ok: true })
  }
})

export default webhook
