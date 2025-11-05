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
╔══════════════════════════╗
⚡ <b>Welcome to AlertFlow!</b>
╚══════════════════════════╝

Smart weather & news automation delivered right here! 🌟

━━━━━━━━━━━━━━━━━━━━━━━━

<b>📋 Available Commands:</b>

🌤️ /weather - Get your local weather
🌍 /checkweather - Check any city worldwide
📰 /news - Get latest news headlines
⚙️ /settings - View your settings
❓ /help - Get help & usage guide

━━━━━━━━━━━━━━━━━━━━━━━━

<b>🚀 Getting Started:</b>

1️⃣ Sign up at our website
2️⃣ Connect your Telegram account
3️⃣ Set your location and schedule
4️⃣ Receive automated updates!

━━━━━━━━━━━━━━━━━━━━━━━━

<b>🌐 Visit:</b> ${c.req.header('origin') || 'https://webapp.pages.dev'}

✨ <i>Powered by AlertFlow</i>
      `.trim()
      
      await bot.sendMessage(chatId, welcomeMsg)
    }
    else if (text.startsWith('/checkweather')) {
      const weatherSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'weather_api_key'"
      ).first()
      
      if (!weatherSettings || !weatherSettings.setting_value) {
        await bot.sendMessage(chatId, '⚠️ Weather service not configured.')
        return c.json({ ok: true })
      }
      
      // Extract city name from command
      const cityQuery = text.replace('/checkweather', '').trim()
      
      if (!cityQuery) {
        const helpMsg = `
╔══════════════════════════╗
🌍 <b>Check Weather Anywhere</b>
╚══════════════════════════╝

<b>Usage:</b>
/checkweather City Name
/checkweather City, Country

<b>Examples:</b>
• /checkweather London
• /checkweather Paris, France
• /checkweather New York
• /checkweather Tokyo, Japan
• /checkweather Karachi, Pakistan

━━━━━━━━━━━━━━━━━━━━━━━━

<i>Get weather for any city worldwide! 🌏</i>
        `.trim()
        await bot.sendMessage(chatId, helpMsg)
        return c.json({ ok: true })
      }
      
      // Get weather for requested city
      const weatherAPI = new WeatherAPI(weatherSettings.setting_value as string)
      
      // Parse city and country if provided
      let city = cityQuery
      let country = undefined
      if (cityQuery.includes(',')) {
        const parts = cityQuery.split(',')
        city = parts[0].trim()
        country = parts[1].trim()
      }
      
      const weather = await weatherAPI.getCurrentWeather(city, country)
      
      if (weather.success && weather.data) {
        // Get user's temperature preference or default to Celsius
        let tempUnit = 'C'
        if (user) {
          const location = await c.env.DB.prepare(
            'SELECT temperature_unit, language FROM locations WHERE user_id = ?'
          ).bind(user.id).first()
          if (location) {
            tempUnit = location.temperature_unit as string || 'C'
          }
        }
        
        const msg = formatWeatherMessage(weather.data, tempUnit, user ? 'en' : 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ <b>City Not Found</b>\n\nCouldn't find weather for "${cityQuery}".\n\nPlease check:\n• City name spelling\n• Try adding country name\n• Use English city names`)
      }
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
        const msg = formatWeatherMessage(weather.data, location.temperature_unit as string || 'C', location.language as string || 'en')
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
      
      // Map country names to NewsAPI country codes
      const countryMap: { [key: string]: string } = {
        'Pakistan': 'us', // Pakistan not supported, use US as fallback
        'United States': 'us', 'USA': 'us', 'America': 'us',
        'United Kingdom': 'gb', 'UK': 'gb', 'England': 'gb',
        'India': 'in', 'China': 'cn', 'Japan': 'jp',
        'Germany': 'de', 'France': 'fr', 'Canada': 'ca',
        'Australia': 'au', 'Brazil': 'br', 'Russia': 'ru',
        'South Korea': 'kr', 'Italy': 'it', 'Spain': 'es',
        'Mexico': 'mx', 'Indonesia': 'id', 'Turkey': 'tr',
        'Saudi Arabia': 'sa', 'Argentina': 'ar', 'South Africa': 'za',
        'Egypt': 'eg', 'UAE': 'ae', 'United Arab Emirates': 'ae',
        'Malaysia': 'my', 'Singapore': 'sg', 'Philippines': 'ph',
        'Thailand': 'th', 'Vietnam': 'us', 'Bangladesh': 'us',
        'Iran': 'us', 'Iraq': 'us', 'Afghanistan': 'us'
      }
      
      const countryCode = countryMap[location?.country as string] || 'us'
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
╔══════════════════════════╗
❓ <b>AlertFlow Help Guide</b>
╚══════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━

<b>🌤️ Weather Commands:</b>

/weather
└ Get your local weather update

/checkweather City Name
└ Check weather anywhere worldwide
└ Example: /checkweather Tokyo

/forecast or /7day
└ Get 7-day weather forecast

━━━━━━━━━━━━━━━━━━━━━━━━

<b>📰 News Commands:</b>

/news
└ Get today's top headlines
└ News from your country

━━━━━━━━━━━━━━━━━━━━━━━━

<b>⚙️ Account Commands:</b>

/settings
└ View your account settings
└ Location, schedules, preferences

/start
└ Welcome message & quick start

━━━━━━━━━━━━━━━━━━━━━━━━

<b>✨ Premium Features:</b>

• 📅 Automated daily updates
• 🌍 Multi-language support (EN/UR)
• ⏰ Custom notification schedules
• 🎯 Personalized content
• 🌡️ Temperature unit preference

━━━━━━━━━━━━━━━━━━━━━━━━

<b>🆘 Need Help?</b>
Visit: ${c.req.header('origin') || 'alertflow.pages.dev'}
WhatsApp: +92 343 0641457

<i>Powered by AlertFlow ⚡</i>
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
