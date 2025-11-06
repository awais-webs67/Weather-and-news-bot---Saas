import { Hono } from 'hono'
import { Bindings } from '../types'
import { TelegramBot, WeatherAPI, NewsAPI, GNewsAPI, formatWeatherMessage, formatNewsMessage } from '../lib/integrations'

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

<b>Weather:</b>
🌤️ /weather - Your local weather
🌍 /checkweather - Any city worldwide
📅 /forecast - 7-day forecast
🕐 /hourly - Hourly forecast
📆 /tomorrow - Tomorrow's weather

<b>News:</b>
📰 /news - Top headlines
🌎 /topnews - News by country
🔍 /search - Search any topic

<b>Settings:</b>
⚙️ /settings - Your account settings
❓ /help - Complete help guide

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
      
      // Parse command: /news or /news Pakistan or /news India
      const commandParts = text.trim().split(/\s+/)
      const requestedCountry = commandParts.length > 1 ? commandParts.slice(1).join(' ') : null
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      
      // Countries NOT supported by NewsAPI top-headlines (need to use search)
      const unsupportedCountries = ['Pakistan', 'Bangladesh', 'Afghanistan', 'Nepal', 'Sri Lanka', 'Vietnam', 'Iran', 'Iraq']
      
      // Map country names to NewsAPI country codes
      const countryMap: { [key: string]: string } = {
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
        'Thailand': 'th'
      }
      
      const targetCountry = requestedCountry || (location?.country as string)
      
      let newsResult
      
      // Check if country is unsupported - use search API
      if (targetCountry && unsupportedCountries.includes(targetCountry)) {
        const searchQuery = `${targetCountry} news`
        newsResult = await newsAPI.searchNews(searchQuery)
        
        if (newsResult.success && newsResult.articles && newsResult.articles.length > 0) {
          const headerMsg = location?.language === 'ur' 
            ? `📰 <b>${targetCountry} کی تازہ خبریں</b>\n\n` 
            : `📰 <b>Latest News from ${targetCountry}</b>\n\n`
          const msg = headerMsg + formatNewsMessage(newsResult.articles, location?.language as string || 'en')
          await bot.sendMessage(chatId, msg)
        } else {
          const errorMsg = location?.language === 'ur'
            ? `⚠️ ${targetCountry} کی خبریں نہیں مل سکیں۔`
            : `⚠️ Could not find news for ${targetCountry}.`
          await bot.sendMessage(chatId, errorMsg)
        }
      } else {
        // Use top-headlines API for supported countries
        const countryCode = countryMap[targetCountry] || 'us'
        newsResult = await newsAPI.getTopHeadlines(countryCode)
        
        if (newsResult.success && newsResult.articles) {
          const msg = formatNewsMessage(newsResult.articles, location?.language as string || 'en')
          await bot.sendMessage(chatId, msg)
        } else {
          await bot.sendMessage(chatId, `⚠️ Failed to fetch news: ${newsResult.error}`)
        }
      }
    }
    else if (text.startsWith('/checknews')) {
      // Get news for any country without authentication
      const commandParts = text.trim().split(/\s+/)
      const countryQuery = commandParts.length > 1 ? commandParts.slice(1).join(' ') : null
      
      if (!countryQuery) {
        const helpMsg = `
╔══════════════════════════╗
📰 <b>Check News Anywhere</b>
╚══════════════════════════╝

<b>Usage:</b>
/checknews Country Name

<b>Examples:</b>
• /checknews Pakistan
• /checknews India
• /checknews United States
• /checknews United Kingdom
• /checknews Japan

<b>Supported:</b> All countries worldwide
        `.trim()
        await bot.sendMessage(chatId, helpMsg)
        return c.json({ ok: true })
      }
      
      // Check for GNews API key first (supports all countries)
      const gnewsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'gnews_api_key'"
      ).first()
      
      // Fallback to NewsAPI if GNews not configured
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!gnewsSettings?.setting_value && !newsSettings?.setting_value) {
        await bot.sendMessage(chatId, '📰 <b>News Feature</b>\n\nNews service not configured yet. Contact admin to enable news updates.')
        return c.json({ ok: true })
      }
      
      let newsResult
      
      // Try GNews API first (better country coverage)
      if (gnewsSettings?.setting_value) {
        const gnewsAPI = new GNewsAPI(gnewsSettings.setting_value as string)
        
        // GNews country codes (2-letter ISO codes)
        const gnewsCountryMap: { [key: string]: string } = {
          'Pakistan': 'pk', 'India': 'in', 'United States': 'us', 'USA': 'us',
          'United Kingdom': 'gb', 'UK': 'gb', 'China': 'cn', 'Japan': 'jp',
          'Germany': 'de', 'France': 'fr', 'Canada': 'ca', 'Australia': 'au',
          'Brazil': 'br', 'Russia': 'ru', 'Mexico': 'mx', 'South Korea': 'kr',
          'Indonesia': 'id', 'Turkey': 'tr', 'Saudi Arabia': 'sa', 'Italy': 'it',
          'Spain': 'es', 'Argentina': 'ar', 'Bangladesh': 'bd', 'Egypt': 'eg',
          'Iran': 'ir', 'Thailand': 'th', 'Vietnam': 'vn', 'Philippines': 'ph',
          'Malaysia': 'my', 'Singapore': 'sg', 'UAE': 'ae', 'Afghanistan': 'af'
        }
        
        const countryCode = gnewsCountryMap[countryQuery] || 'us'
        newsResult = await gnewsAPI.getTopHeadlines(countryCode, 5)
      } else {
        // Fallback to NewsAPI search
        const newsAPI = new NewsAPI(newsSettings.setting_value as string)
        const searchQuery = `${countryQuery} news`
        newsResult = await newsAPI.searchNews(searchQuery)
      }
      
      if (newsResult.success && newsResult.articles && newsResult.articles.length > 0) {
        const headerMsg = `📰 <b>Latest News from ${countryQuery}</b>\n\n`
        const msg = headerMsg + formatNewsMessage(newsResult.articles, 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Could not find news for ${countryQuery}. Try a different country name.`)
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
    else if (text.startsWith('/today') || text.startsWith('/current')) {
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
      const weather = await weatherAPI.getCurrentWeather(location.city as string, location.country as string)
      
      if (weather.success && weather.data) {
        const msg = formatWeatherMessage(weather.data, location.temperature_unit as string || 'C', location.language as string || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get weather: ${weather.error}`)
      }
    }
    else if (text.startsWith('/hourly') || text.startsWith('/3hour')) {
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
        let msg = `🕐 <b>Hourly Forecast for ${forecast.data.city}, ${forecast.data.country}</b>\n\n`
        forecast.data.forecast.slice(0, 8).forEach((item: any, index: number) => {
          const temp = location.temperature_unit === 'F' ? (item.temperature * 9/5 + 32).toFixed(1) : item.temperature.toFixed(1)
          const unit = location.temperature_unit === 'F' ? '°F' : '°C'
          const time = new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          msg += `⏰ ${time}\n🌡️ ${temp}${unit} - ${item.description}\n\n`
        })
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get forecast: ${forecast.error}`)
      }
    }
    else if (text.startsWith('/tomorrow')) {
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
      
      if (forecast.success && forecast.data && forecast.data.forecast.length > 0) {
        // Get tomorrow's forecast (skip first 8 items which are today)
        const tomorrowForecast = forecast.data.forecast.slice(8, 16)
        if (tomorrowForecast.length > 0) {
          const avgTemp = tomorrowForecast.reduce((sum: number, item: any) => sum + item.temperature, 0) / tomorrowForecast.length
          const temp = location.temperature_unit === 'F' ? (avgTemp * 9/5 + 32).toFixed(1) : avgTemp.toFixed(1)
          const unit = location.temperature_unit === 'F' ? '°F' : '°C'
          
          let msg = `📅 <b>Tomorrow's Weather</b>\n`
          msg += `📍 ${forecast.data.city}, ${forecast.data.country}\n\n`
          msg += `🌡️ Average: ${temp}${unit}\n\n`
          msg += `<b>Throughout the day:</b>\n\n`
          
          tomorrowForecast.slice(0, 4).forEach((item: any) => {
            const itemTemp = location.temperature_unit === 'F' ? (item.temperature * 9/5 + 32).toFixed(1) : item.temperature.toFixed(1)
            const time = new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            msg += `⏰ ${time}: ${itemTemp}${unit} - ${item.description}\n`
          })
          
          await bot.sendMessage(chatId, msg)
        } else {
          await bot.sendMessage(chatId, '⚠️ Tomorrow\'s forecast not available yet.')
        }
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get forecast: ${forecast.error}`)
      }
    }
    else if (text.startsWith('/topnews ')) {
      const countryQuery = text.replace('/topnews', '').trim()
      
      if (!countryQuery) {
        const helpMsg = `
╔══════════════════════════╗
📰 <b>Top News by Country</b>
╚══════════════════════════╝

<b>Usage:</b>
/topnews Country Name

<b>Examples:</b>
• /topnews United States
• /topnews United Kingdom
• /topnews India
• /topnews Pakistan
• /topnews Japan

<i>Get breaking news from any country! 🌍</i>
        `.trim()
        await bot.sendMessage(chatId, helpMsg)
        return c.json({ ok: true })
      }
      
      // Try GNews first (supports all countries)
      const gnewsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'gnews_api_key'"
      ).first()
      
      if (gnewsSettings && gnewsSettings.setting_value) {
        const gnewsAPI = new GNewsAPI(gnewsSettings.setting_value as string)
        const newsResult = await gnewsAPI.getTopHeadlines(countryQuery)
        
        if (newsResult.success && newsResult.articles && newsResult.articles.length > 0) {
          const msg = `📰 <b>Top News from ${countryQuery}</b>\n\n` + formatNewsMessage(newsResult.articles, user?.language || 'en')
          await bot.sendMessage(chatId, msg)
          return c.json({ ok: true })
        }
      }
      
      // Fallback to NewsAPI
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews(`${countryQuery} news`)
      
      if (searchResult.success && searchResult.articles) {
        const msg = `📰 <b>Top News from ${countryQuery}</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Could not find news for ${countryQuery}.`)
      }
    }
    else if (text.startsWith('/search ')) {
      const query = text.replace('/search', '').trim()
      
      if (!query) {
        const helpMsg = `
╔══════════════════════════╗
🔍 <b>Search News</b>
╚══════════════════════════╝

<b>Usage:</b>
/search Your Search Query

<b>Examples:</b>
• /search technology
• /search climate change
• /search sports updates
• /search stock market
• /search artificial intelligence

<i>Search any topic worldwide! 🌐</i>
        `.trim()
        await bot.sendMessage(chatId, helpMsg)
        return c.json({ ok: true })
      }
      
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews(query)
      
      if (searchResult.success && searchResult.articles && searchResult.articles.length > 0) {
        const msg = `🔍 <b>Search Results for "${query}"</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ No results found for "${query}".`)
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

/weather or /today
└ Get your local weather update

/checkweather City Name
└ Check weather anywhere worldwide
└ Example: /checkweather Tokyo

/forecast or /7day
└ Get 7-day weather forecast

/hourly or /3hour
└ Get hourly forecast (next 24hrs)

/tomorrow
└ Get tomorrow's weather forecast

━━━━━━━━━━━━━━━━━━━━━━━━

<b>📰 News Commands:</b>

/news
└ Get today's top headlines
└ News from your country

/checknews Country Name
└ Get news from any country
└ Example: /checknews Pakistan

/topnews Country Name
└ Top breaking news by country
└ Example: /topnews India

/search Query
└ Search news by topic or keyword
└ Example: /search technology

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
