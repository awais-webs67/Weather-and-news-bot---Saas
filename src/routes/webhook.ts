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

<b>🌤️ Weather Commands:</b>
/weather - Your local weather + AI advice
/checkweather - Any city worldwide
/6hour - Next 6-hour detailed forecast
/forecast - 24-hour detailed forecast
/hourly - Hourly forecast
/tomorrow - Tomorrow's weather
/wind - Wind speed & direction
/humidity - Humidity & air details
/sunrise - Sun rise/set times

<b>📰 News Commands:</b>
/news - Top headlines
/topnews - News by country
/search - Search any topic
/sports - Sports news ⚽
/tech - Technology news 💻
/business - Business & finance 💼
/entertainment - Entertainment 🎬
/health - Health & medical 🏥
/science - Science news 🔬

<b>⚙️ Settings:</b>
/settings - Your account settings
/help - Complete help guide

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
        let msg = formatWeatherMessage(weather.data, location.temperature_unit as string || 'C', location.language as string || 'en')
        
        // Add Gemini AI precautions if API key is configured
        const geminiSettings = await c.env.DB.prepare(
          "SELECT setting_value FROM api_settings WHERE setting_key = 'gemini_api_key'"
        ).first()
        
        if (geminiSettings && geminiSettings.setting_value) {
          const { GeminiAPI } = await import('../lib/integrations')
          const gemini = new GeminiAPI(geminiSettings.setting_value as string)
          const advice = await gemini.analyzeWeatherAndProvideAdvice(
            weather.data, 
            `${location.city}, ${location.country}`
          )
          
          if (advice.success && advice.advice) {
            msg += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n🤖 <b>AI Safety Advisor:</b>\n\n${advice.advice}`
          }
        }
        
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
    else if (text.startsWith('/6hour') || text.startsWith('/6hr')) {
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
        const unit = location.temperature_unit === 'F' ? '°F' : '°C'
        const next6Hours = forecast.data.forecast.slice(0, 2) // 6 hours (2 x 3-hour intervals)
        
        let msg = `
╔══════════════════════════╗
🌤️ <b>6-Hour Forecast</b>
╚══════════════════════════╝

📍 <b>${forecast.data.city}, ${forecast.data.country}</b>

━━━━━━━━━━━━━━━━━━━━━━━━
`
        
        next6Hours.forEach((item: any, index: number) => {
          const temp = location.temperature_unit === 'F' ? (item.temperature * 9/5 + 32).toFixed(1) : item.temperature.toFixed(1)
          const feelsLike = location.temperature_unit === 'F' ? (item.feels_like * 9/5 + 32).toFixed(1) : item.feels_like.toFixed(1)
          const time = new Date(item.timestamp * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          const rainChance = Math.round(item.pop * 100)
          
          msg += `
⏰ <b>${time}</b>
🌡️ Temp: ${temp}${unit} (feels ${feelsLike}${unit})
☁️ ${item.description}
💧 Humidity: ${item.humidity}%
💨 Wind: ${item.wind_speed.toFixed(1)} m/s
${rainChance > 0 ? `☔ Rain: ${rainChance}%` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━
`
        })
        
        msg += `\n✨ <i>Plan ahead with confidence!</i>`
        await bot.sendMessage(chatId, msg.trim())
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get forecast: ${forecast.error}`)
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
        const unit = location.temperature_unit === 'F' ? '°F' : '°C'
        
        // Group forecast by day
        const dayGroups: any = {}
        forecast.data.forecast.forEach((item: any) => {
          const date = new Date(item.timestamp * 1000)
          const dayKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          if (!dayGroups[dayKey]) {
            dayGroups[dayKey] = []
          }
          dayGroups[dayKey].push(item)
        })
        
        let msg = `
╔══════════════════════════╗
📅 <b>5-Day Weather Forecast</b>
╚══════════════════════════╝

📍 <b>${forecast.data.city}, ${forecast.data.country}</b>

━━━━━━━━━━━━━━━━━━━━━━━━
`
        
        // Process each day
        Object.keys(dayGroups).slice(0, 5).forEach((dayKey, index) => {
          const dayData = dayGroups[dayKey]
          
          // Calculate day statistics
          const temps = dayData.map((d: any) => d.temperature)
          const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length
          const minTemp = Math.min(...dayData.map((d: any) => d.temp_min))
          const maxTemp = Math.max(...dayData.map((d: any) => d.temp_max))
          const avgHumidity = Math.round(dayData.reduce((sum: number, d: any) => sum + d.humidity, 0) / dayData.length)
          const maxRainChance = Math.max(...dayData.map((d: any) => d.pop)) * 100
          const avgWindSpeed = dayData.reduce((sum: number, d: any) => sum + d.wind_speed, 0) / dayData.length
          
          // Most common condition
          const conditions = dayData.map((d: any) => d.description)
          const mostCommon = conditions.sort((a: string, b: string) =>
            conditions.filter((v: string) => v === a).length - conditions.filter((v: string) => v === b).length
          ).pop()
          
          // Estimate AQI based on visibility and humidity
          const avgVisibility = dayData.reduce((sum: number, d: any) => sum + (d.visibility || 10000), 0) / dayData.length
          let aqi = 'Good'
          if (avgVisibility < 3000 || avgHumidity > 80) aqi = 'Moderate'
          if (avgVisibility < 2000) aqi = 'Unhealthy'
          
          const tempAvg = location.temperature_unit === 'F' ? (avgTemp * 9/5 + 32).toFixed(1) : avgTemp.toFixed(1)
          const tempMin = location.temperature_unit === 'F' ? (minTemp * 9/5 + 32).toFixed(1) : minTemp.toFixed(1)
          const tempMax = location.temperature_unit === 'F' ? (maxTemp * 9/5 + 32).toFixed(1) : maxTemp.toFixed(1)
          
          msg += `
📆 <b>${dayKey}</b>
🌡️ ${tempAvg}${unit} (${tempMin}° - ${tempMax}°)
☁️ ${mostCommon}
💧 Humidity: ${avgHumidity}%
💨 Wind: ${avgWindSpeed.toFixed(1)} m/s
☔ Rain: ${Math.round(maxRainChance)}%
🌫️ Air Quality: ${aqi}

━━━━━━━━━━━━━━━━━━━━━━━━
`
        })
        
        // Add Gemini AI recommendations if available
        const geminiSettings = await c.env.DB.prepare(
          "SELECT setting_value FROM api_settings WHERE setting_key = 'gemini_api_key'"
        ).first()
        
        if (geminiSettings && geminiSettings.setting_value) {
          try {
            const { GeminiAPI } = await import('../lib/integrations')
            const gemini = new GeminiAPI(geminiSettings.setting_value as string)
            
            // Use first day data for AI analysis
            const firstDayData = Object.values(dayGroups)[0] as any[]
            const avgFirstDay = {
              temperature: firstDayData.reduce((sum: number, d: any) => sum + d.temperature, 0) / firstDayData.length,
              humidity: Math.round(firstDayData.reduce((sum: number, d: any) => sum + d.humidity, 0) / firstDayData.length),
              wind_speed: firstDayData.reduce((sum: number, d: any) => sum + d.wind_speed, 0) / firstDayData.length,
              description: firstDayData[0].description,
              pressure: firstDayData[0].pressure,
              visibility: firstDayData[0].visibility,
              feels_like: firstDayData[0].feels_like
            }
            
            const advice = await gemini.analyzeWeatherAndProvideAdvice(
              avgFirstDay,
              `${forecast.data.city}, ${forecast.data.country}`
            )
            
            if (advice.success && advice.advice) {
              msg += `\n🤖 <b>AI Weather Advisor:</b>\n\n${advice.advice}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n`
            }
          } catch (error) {
            console.log('Gemini AI not available')
          }
        }
        
        msg += `\n✨ <i>Plan your week with confidence!</i>`
        await bot.sendMessage(chatId, msg.trim())
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
    // ==========================================
    // NEW: Additional Weather Detail Commands
    // ==========================================
    
    else if (text.startsWith('/wind')) {
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
        const windSpeed = (weather.data as any).wind_speed || 0
        const windDeg = (weather.data as any).wind_deg || 0
        const windDir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(windDeg / 45) % 8]
        const unit = location.temperature_unit === 'F' ? '°F' : '°C'
        const feelsLike = location.temperature_unit === 'F' ? (weather.data.feels_like * 9/5 + 32).toFixed(1) : weather.data.feels_like.toFixed(1)
        
        let msg = `
╔══════════════════════════╗
💨 <b>Wind Conditions</b>
╚══════════════════════════╝

📍 <b>${weather.data.city}, ${weather.data.country}</b>

━━━━━━━━━━━━━━━━━━━━━━━━

🌬️ <b>Wind Speed:</b> ${windSpeed.toFixed(1)} m/s (${(windSpeed * 3.6).toFixed(1)} km/h)
🧭 <b>Direction:</b> ${windDir} (${windDeg}°)
🌡️ <b>Feels Like:</b> ${feelsLike}${unit}
🌪️ <b>Condition:</b> ${weather.data.description}

━━━━━━━━━━━━━━━━━━━━━━━━

✨ <i>Stay safe out there!</i>
        `.trim()
        
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get wind data: ${weather.error}`)
      }
    }
    
    else if (text.startsWith('/humidity')) {
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
        const humidity = (weather.data as any).humidity || 0
        const pressure = (weather.data as any).pressure || 0
        const visibility = (weather.data as any).visibility || 10000
        const unit = location.temperature_unit === 'F' ? '°F' : '°C'
        const temp = location.temperature_unit === 'F' ? (weather.data.temperature * 9/5 + 32).toFixed(1) : weather.data.temperature.toFixed(1)
        
        // Humidity level description
        const humidityLevel = humidity < 30 ? 'Low (Dry)' : humidity < 60 ? 'Comfortable' : humidity < 80 ? 'High' : 'Very High'
        
        let msg = `
╔══════════════════════════╗
💧 <b>Humidity & Air Quality</b>
╚══════════════════════════╝

📍 <b>${weather.data.city}, ${weather.data.country}</b>

━━━━━━━━━━━━━━━━━━━━━━━━

💧 <b>Humidity:</b> ${humidity}% (${humidityLevel})
🔽 <b>Pressure:</b> ${pressure} hPa
👁️ <b>Visibility:</b> ${(visibility / 1000).toFixed(1)} km
🌡️ <b>Temperature:</b> ${temp}${unit}

━━━━━━━━━━━━━━━━━━━━━━━━

☁️ <b>Condition:</b> ${weather.data.description}

━━━━━━━━━━━━━━━━━━━━━━━━

✨ <i>Stay hydrated!</i>
        `.trim()
        
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get humidity data: ${weather.error}`)
      }
    }
    
    else if (text.startsWith('/sunrise') || text.startsWith('/sunset')) {
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
        const sunrise = (weather.data as any).sunrise || 0
        const sunset = (weather.data as any).sunset || 0
        const sunriseTime = new Date(sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        const sunsetTime = new Date(sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        const unit = location.temperature_unit === 'F' ? '°F' : '°C'
        const temp = location.temperature_unit === 'F' ? (weather.data.temperature * 9/5 + 32).toFixed(1) : weather.data.temperature.toFixed(1)
        
        // Calculate daylight duration
        const daylightSeconds = sunset - sunrise
        const hours = Math.floor(daylightSeconds / 3600)
        const minutes = Math.floor((daylightSeconds % 3600) / 60)
        
        let msg = `
╔══════════════════════════╗
🌅 <b>Sun Times</b>
╚══════════════════════════╝

📍 <b>${weather.data.city}, ${weather.data.country}</b>

━━━━━━━━━━━━━━━━━━━━━━━━

🌄 <b>Sunrise:</b> ${sunriseTime}
🌇 <b>Sunset:</b> ${sunsetTime}
⏱️ <b>Daylight:</b> ${hours}h ${minutes}m

━━━━━━━━━━━━━━━━━━━━━━━━

☀️ <b>Current:</b> ${weather.data.description}
🌡️ <b>Temperature:</b> ${temp}${unit}

━━━━━━━━━━━━━━━━━━━━━━━━

✨ <i>Enjoy your day!</i>
        `.trim()
        
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get sun times: ${weather.error}`)
      }
    }
    
    // ==========================================
    // NEW: Category-Specific News Commands
    // ==========================================
    
    else if (text.startsWith('/sports')) {
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews('sports')
      
      if (searchResult.success && searchResult.articles && searchResult.articles.length > 0) {
        const msg = `⚽ <b>Sports News</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get sports news.`)
      }
    }
    
    else if (text.startsWith('/tech') || text.startsWith('/technology')) {
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews('technology')
      
      if (searchResult.success && searchResult.articles && searchResult.articles.length > 0) {
        const msg = `💻 <b>Technology News</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get technology news.`)
      }
    }
    
    else if (text.startsWith('/business') || text.startsWith('/finance')) {
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews('business finance')
      
      if (searchResult.success && searchResult.articles && searchResult.articles.length > 0) {
        const msg = `💼 <b>Business & Finance News</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get business news.`)
      }
    }
    
    else if (text.startsWith('/entertainment') || text.startsWith('/movies')) {
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews('entertainment movies')
      
      if (searchResult.success && searchResult.articles && searchResult.articles.length > 0) {
        const msg = `🎬 <b>Entertainment News</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get entertainment news.`)
      }
    }
    
    else if (text.startsWith('/health') || text.startsWith('/medical')) {
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews('health medical')
      
      if (searchResult.success && searchResult.articles && searchResult.articles.length > 0) {
        const msg = `🏥 <b>Health & Medical News</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get health news.`)
      }
    }
    
    else if (text.startsWith('/science')) {
      const newsSettings = await c.env.DB.prepare(
        "SELECT setting_value FROM api_settings WHERE setting_key = 'news_api_key'"
      ).first()
      
      if (!newsSettings || !newsSettings.setting_value) {
        await bot.sendMessage(chatId, '📰 News service not configured.')
        return c.json({ ok: true })
      }
      
      const newsAPI = new NewsAPI(newsSettings.setting_value as string)
      const searchResult = await newsAPI.searchNews('science')
      
      if (searchResult.success && searchResult.articles && searchResult.articles.length > 0) {
        const msg = `🔬 <b>Science News</b>\n\n` + formatNewsMessage(searchResult.articles, user?.language || 'en')
        await bot.sendMessage(chatId, msg)
      } else {
        await bot.sendMessage(chatId, `⚠️ Failed to get science news.`)
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
└ Get your local weather with AI safety advice
└ Includes temperature, conditions, and precautions

/checkweather City Name
└ Check weather anywhere worldwide
└ Example: /checkweather Tokyo

/6hour or /6hr ⭐ NEW
└ Next 6-hour detailed forecast
└ Perfect for planning your day

/forecast or /7day
└ 24-hour detailed weather forecast
└ Temperature, humidity, wind, rain chance

/hourly or /3hour
└ Get hourly forecast (next 24hrs)

/tomorrow
└ Get tomorrow's weather forecast

/wind
└ Wind speed and direction

/humidity
└ Humidity, pressure, air quality estimate

/sunrise or /sunset
└ Sun rise and set times with daylight duration

━━━━━━━━━━━━━━━━━━━━━━━━

<b>📰 General News Commands:</b>

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

<b>📂 Category News Commands:</b>

/sports ⚽
└ Sports news and updates

/tech or /technology 💻
└ Technology and gadget news

/business or /finance 💼
└ Business and financial news

/entertainment or /movies 🎬
└ Entertainment and movie news

/health or /medical 🏥
└ Health and medical updates

/science 🔬
└ Science discoveries and research

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
