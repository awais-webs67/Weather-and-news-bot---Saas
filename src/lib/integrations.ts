import { Bindings } from '../types'

// Telegram Bot API Integration
export class TelegramBot {
  private botToken: string

  constructor(botToken: string) {
    this.botToken = botToken
  }

  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`)
      const data = await response.json()
      
      if (data.ok) {
        return {
          success: true,
          data: {
            bot_id: data.result.id,
            bot_name: data.result.first_name,
            username: data.result.username
          }
        }
      } else {
        return {
          success: false,
          error: data.description || 'Failed to connect to Telegram'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async sendMessage(chatId: string, message: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        return { success: true }
      } else {
        return {
          success: false,
          error: data.description || 'Failed to send message'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async getUpdates(): Promise<{ success: boolean; updates?: any[]; error?: string }> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getUpdates`)
      const data = await response.json()
      
      if (data.ok) {
        return {
          success: true,
          updates: data.result
        }
      } else {
        return {
          success: false,
          error: data.description || 'Failed to get updates'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async setCommands(): Promise<{ success: boolean; error?: string }> {
    try {
      const commands = [
        { command: 'start', description: '🚀 Start the bot and get welcome message' },
        { command: 'weather', description: '🌤️ Get your local weather update' },
        { command: 'checkweather', description: '🌍 Check weather for any city worldwide' },
        { command: 'news', description: '📰 Get latest news (or /news Pakistan for specific country)' },
        { command: 'checknews', description: '🌐 Check news from any country worldwide' },
        { command: 'settings', description: '⚙️ View your settings' },
        { command: 'help', description: '❓ Get help and usage guide' }
      ]
      
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      })
      
      const data = await response.json()
      
      if (data.ok) {
        return { success: true }
      } else {
        return {
          success: false,
          error: data.description || 'Failed to set commands'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }
}

// Weather API Integration (OpenWeatherMap)
export class WeatherAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async testConnection(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Test with a known city (London)
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${this.apiKey}&units=metric`
      )
      const data = await response.json()
      
      if (response.ok && data.cod === 200) {
        return {
          success: true,
          data: {
            city: data.name,
            country: data.sys.country,
            temperature: data.main.temp,
            description: data.weather[0].description
          }
        }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to connect to Weather API'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async getCurrentWeather(city: string, country?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const query = country ? `${city},${country}` : city
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${this.apiKey}&units=metric`
      )
      const data = await response.json()
      
      if (response.ok && data.cod === 200) {
        return {
          success: true,
          data: {
            city: data.name,
            country: data.sys.country,
            temperature: data.main.temp,
            feels_like: data.main.feels_like,
            temp_min: data.main.temp_min,
            temp_max: data.main.temp_max,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            wind_speed: data.wind.speed,
            clouds: data.clouds.all,
            sunrise: data.sys.sunrise,
            sunset: data.sys.sunset
          }
        }
      } else {
        return {
          success: false,
          error: data.message || 'City not found'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async getForecast(city: string, country?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const query = country ? `${city},${country}` : city
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${this.apiKey}&units=metric`
      )
      const data = await response.json()
      
      if (response.ok && data.cod === '200') {
        return {
          success: true,
          data: {
            city: data.city.name,
            country: data.city.country,
            timezone: data.city.timezone,
            // Return all available forecast data (up to 5 days / 40 intervals)
            forecast: data.list.map((item: any) => ({
              time: item.dt_txt,
              timestamp: item.dt,
              temperature: item.main.temp,
              temp_min: item.main.temp_min,
              temp_max: item.main.temp_max,
              feels_like: item.main.feels_like,
              humidity: item.main.humidity,
              pressure: item.main.pressure,
              description: item.weather[0].description,
              icon: item.weather[0].icon,
              wind_speed: item.wind.speed,
              wind_deg: item.wind.deg,
              clouds: item.clouds.all,
              visibility: item.visibility,
              pop: item.pop || 0, // Probability of precipitation
              rain: item.rain ? item.rain['3h'] || 0 : 0,
              snow: item.snow ? item.snow['3h'] || 0 : 0
            }))
          }
        }
      } else {
        return {
          success: false,
          error: data.message || 'City not found'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }
}

// API Test Logger
export class APILogger {
  private db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async log(
    apiName: string,
    action: string,
    success: boolean,
    details?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO api_logs (api_name, action, success, details, error_message, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        apiName,
        action,
        success ? 1 : 0,
        details || null,
        errorMessage || null
      ).run()
    } catch (error) {
      console.error('Failed to log API test:', error)
    }
  }

  async getRecentLogs(limit: number = 50): Promise<any[]> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM api_logs
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all()
      
      return result.results || []
    } catch (error) {
      console.error('Failed to get logs:', error)
      return []
    }
  }

  async getLogsByAPI(apiName: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await this.db.prepare(`
        SELECT * FROM api_logs
        WHERE api_name = ?
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(apiName, limit).all()
      
      return result.results || []
    } catch (error) {
      console.error('Failed to get logs:', error)
      return []
    }
  }
}

// News API Integration
// GNews API Integration (Free, supports ALL countries)
export class GNewsAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getTopHeadlines(country: string = 'us', maxResults: number = 5): Promise<{ success: boolean; articles?: any[]; error?: string }> {
    try {
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your-api-key') {
        return {
          success: false,
          error: 'GNews API key not configured. Please contact admin.'
        }
      }

      const url = `https://gnews.io/api/v4/top-headlines?country=${country}&lang=en&max=${maxResults}&apikey=${this.apiKey}`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AlertFlow/1.0',
          'Accept': 'application/json'
        }
      })
      const data = await response.json()
      
      if (response.ok && data.articles) {
        return {
          success: true,
          articles: data.articles.map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: { name: article.source.name },
            publishedAt: article.publishedAt
          }))
        }
      } else {
        return {
          success: false,
          error: data.message || data.errors?.[0] || 'Failed to fetch news'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async searchNews(query: string, maxResults: number = 5): Promise<{ success: boolean; articles?: any[]; error?: string }> {
    try {
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your-api-key') {
        return {
          success: false,
          error: 'GNews API key not configured. Please contact admin.'
        }
      }
      
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=${maxResults}&apikey=${this.apiKey}`
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AlertFlow/1.0',
          'Accept': 'application/json'
        }
      })
      const data = await response.json()
      
      if (response.ok && data.articles) {
        return {
          success: true,
          articles: data.articles.map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            source: { name: article.source.name },
            publishedAt: article.publishedAt
          }))
        }
      } else {
        return {
          success: false,
          error: data.message || data.errors?.[0] || 'Failed to search news'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }
}

export class NewsAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Map of supported countries - NewsAPI v2 top-headlines supported countries
  private static supportedCountries: { [key: string]: string } = {
    'ae': 'United Arab Emirates', 'ar': 'Argentina', 'at': 'Austria', 'au': 'Australia',
    'be': 'Belgium', 'bg': 'Bulgaria', 'br': 'Brazil', 'ca': 'Canada', 'ch': 'Switzerland',
    'cn': 'China', 'co': 'Colombia', 'cu': 'Cuba', 'cz': 'Czech Republic', 'de': 'Germany',
    'eg': 'Egypt', 'fr': 'France', 'gb': 'United Kingdom', 'gr': 'Greece', 'hk': 'Hong Kong',
    'hu': 'Hungary', 'id': 'Indonesia', 'ie': 'Ireland', 'il': 'Israel', 'in': 'India',
    'it': 'Italy', 'jp': 'Japan', 'kr': 'South Korea', 'lt': 'Lithuania', 'lv': 'Latvia',
    'ma': 'Morocco', 'mx': 'Mexico', 'my': 'Malaysia', 'ng': 'Nigeria', 'nl': 'Netherlands',
    'no': 'Norway', 'nz': 'New Zealand', 'ph': 'Philippines', 'pl': 'Poland', 'pt': 'Portugal',
    'ro': 'Romania', 'rs': 'Serbia', 'ru': 'Russia', 'sa': 'Saudi Arabia', 'se': 'Sweden',
    'sg': 'Singapore', 'si': 'Slovenia', 'sk': 'Slovakia', 'th': 'Thailand', 'tr': 'Turkey',
    'tw': 'Taiwan', 'ua': 'Ukraine', 'us': 'United States', 've': 'Venezuela', 'za': 'South Africa'
  }

  async getTopHeadlines(country: string = 'us', category?: string): Promise<{ success: boolean; articles?: any[]; error?: string }> {
    try {
      const countryCode = country.toLowerCase()
      
      // Check if API key is valid (not empty, not placeholder)
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your-api-key') {
        return {
          success: false,
          error: 'News API key not configured. Please contact admin.'
        }
      }
      
      // Check if country is supported
      if (!NewsAPI.supportedCountries[countryCode]) {
        // If country not supported, fall back to 'us'
        console.log(`Country ${countryCode} not supported by NewsAPI, using 'us' as fallback`)
        return await this.getTopHeadlines('us', category)
      }
      
      let url = `https://newsapi.org/v2/top-headlines?country=${countryCode}&apiKey=${this.apiKey}`
      if (category) {
        url += `&category=${category}`
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AlertFlow/1.0',
          'Accept': 'application/json'
        }
      })
      const data = await response.json()
      
      if (response.ok && data.status === 'ok') {
        return {
          success: true,
          articles: data.articles?.slice(0, 5) || []
        }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to fetch news'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }
  
  // Get list of supported countries for UI
  static getSupportedCountries(): { code: string; name: string }[] {
    return Object.entries(NewsAPI.supportedCountries).map(([code, name]) => ({ code, name }))
  }

  async searchNews(query: string): Promise<{ success: boolean; articles?: any[]; error?: string }> {
    try {
      // Check if API key is valid
      if (!this.apiKey || this.apiKey.trim() === '' || this.apiKey === 'your-api-key') {
        return {
          success: false,
          error: 'News API key not configured. Please contact admin.'
        }
      }
      
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${this.apiKey}`,
        {
          headers: {
            'User-Agent': 'AlertFlow/1.0',
            'Accept': 'application/json'
          }
        }
      )
      const data = await response.json()
      
      if (response.ok && data.status === 'ok') {
        return {
          success: true,
          articles: data.articles?.slice(0, 5) || []
        }
      } else {
        return {
          success: false,
          error: data.message || 'Failed to search news'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }
}

// Helper function to format weather message
export function formatWeatherMessage(data: any, temperatureUnit: string = 'C', language: string = 'en'): string {
  const temp = temperatureUnit === 'F' ? (data.temperature * 9/5 + 32).toFixed(1) : data.temperature.toFixed(1)
  const feelsLike = temperatureUnit === 'F' ? (data.feels_like * 9/5 + 32).toFixed(1) : data.feels_like.toFixed(1)
  const tempMax = temperatureUnit === 'F' ? (data.temp_max * 9/5 + 32).toFixed(1) : data.temp_max.toFixed(1)
  const tempMin = temperatureUnit === 'F' ? (data.temp_min * 9/5 + 32).toFixed(1) : data.temp_min.toFixed(1)
  const unit = temperatureUnit === 'F' ? '°F' : '°C'
  
  // Get weather emoji based on condition
  const getWeatherEmoji = (desc: string) => {
    const d = desc.toLowerCase()
    if (d.includes('clear')) return '☀️'
    if (d.includes('cloud')) return '☁️'
    if (d.includes('rain')) return '🌧️'
    if (d.includes('thunder')) return '⛈️'
    if (d.includes('snow')) return '❄️'
    if (d.includes('mist') || d.includes('fog')) return '🌫️'
    return '🌤️'
  }
  
  const weatherEmoji = getWeatherEmoji(data.description)
  
  if (language === 'ur') {
    return `
╔══════════════════════════╗
${weatherEmoji} <b>موسم کی اپ ڈیٹ</b>
╚══════════════════════════╝

📍 <b>${data.city}, ${data.country}</b>

━━━━━━━━━━━━━━━━━━━━━━━━

🌡️ <b>درجہ حرارت:</b> ${temp}${unit}
🤔 <b>محسوس ہوتا ہے:</b> ${feelsLike}${unit}
📊 <b>زیادہ سے زیادہ/کم:</b> ${tempMax}${unit} / ${tempMin}${unit}

━━━━━━━━━━━━━━━━━━━━━━━━

${weatherEmoji} <b>حالت:</b> ${data.description}
💧 <b>نمی:</b> ${data.humidity}%
💨 <b>ہوا:</b> ${data.wind_speed} m/s
☁️ <b>بادل:</b> ${data.clouds}%

━━━━━━━━━━━━━━━━━━━━━━━━

✨ <i>آپ کا دن خوشگوار گزرے!</i>
    `.trim()
  }
  
  return `
╔══════════════════════════╗
${weatherEmoji} <b>Weather Update</b>
╚══════════════════════════╝

📍 <b>${data.city}, ${data.country}</b>

━━━━━━━━━━━━━━━━━━━━━━━━

🌡️ <b>Temperature:</b> ${temp}${unit}
🤔 <b>Feels like:</b> ${feelsLike}${unit}
📊 <b>High/Low:</b> ${tempMax}${unit} / ${tempMin}${unit}

━━━━━━━━━━━━━━━━━━━━━━━━

${weatherEmoji} <b>Condition:</b> ${data.description}
💧 <b>Humidity:</b> ${data.humidity}%
💨 <b>Wind:</b> ${data.wind_speed} m/s
☁️ <b>Clouds:</b> ${data.clouds}%

━━━━━━━━━━━━━━━━━━━━━━━━

✨ <i>Have an amazing day!</i>
  `.trim()
}

// Helper function to format news message
export function formatNewsMessage(articles: any[], language: string = 'en'): string {
  if (!articles || articles.length === 0) {
    return language === 'ur' 
      ? '📰 کوئی خبر دستیاب نہیں ہے۔'
      : '📰 No news available.'
  }

  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣']
  
  if (language === 'ur') {
    let message = `
╔══════════════════════════╗
📰 <b>آج کی اہم خبریں</b>
╚══════════════════════════╝

`
    articles.forEach((article, index) => {
      const title = article.title || 'کوئی عنوان نہیں'
      const source = article.source?.name || 'نامعلوم'
      message += `${numberEmojis[index]} <b>${title}</b>\n`
      message += `   📍 <i>${source}</i>\n\n`
    })
    
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n✨ <i>AlertFlow کے ذریعے فراہم کردہ</i>`
    return message.trim()
  }
  
  let message = `
╔══════════════════════════╗
📰 <b>Today's Top Headlines</b>
╚══════════════════════════╝

`
  
  articles.forEach((article, index) => {
    const title = article.title || 'No title'
    const source = article.source?.name || 'Unknown'
    message += `${numberEmojis[index]} <b>${title}</b>\n`
    message += `   📍 <i>${source}</i>\n\n`
  })
  
  message += `━━━━━━━━━━━━━━━━━━━━━━━━\n✨ <i>Powered by AlertFlow</i>`
  return message.trim()
}

// Gemini API for AI-powered weather analysis and precautions
export class GeminiAPI {
  private apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  async analyzeWeatherAndProvideAdvice(weatherData: any, locationName: string): Promise<{ success: boolean; advice?: string; error?: string }> {
    try {
      const prompt = `You are a weather safety advisor. Analyze the following weather conditions and provide personalized safety precautions and recommendations in 3-4 short bullet points. Be concise and practical.

Location: ${locationName}
Temperature: ${weatherData.temperature}°C (Feels like: ${weatherData.feels_like}°C)
Condition: ${weatherData.description}
Humidity: ${weatherData.humidity}%
Wind Speed: ${weatherData.wind_speed} m/s
Pressure: ${weatherData.pressure} hPa
Air Quality Index (estimated): ${this.estimateAQI(weatherData)}

Provide advice in this format:
• [Safety tip 1]
• [Health recommendation]
• [Activity suggestion]
• [Precaution if needed]

Keep each point under 15 words. Focus on actionable advice.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 200
            }
          })
        }
      )
      
      const data = await response.json()
      
      if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return {
          success: true,
          advice: data.candidates[0].content.parts[0].text.trim()
        }
      } else {
        return {
          success: false,
          error: data.error?.message || 'Failed to generate advice'
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }
  
  private estimateAQI(weatherData: any): string {
    // Estimate AQI based on humidity, wind, and visibility
    const humidity = weatherData.humidity || 50
    const windSpeed = weatherData.wind_speed || 5
    const visibility = weatherData.visibility || 10000
    
    // Simple estimation logic
    if (visibility > 8000 && windSpeed > 3 && humidity < 70) {
      return 'Good (0-50)'
    } else if (visibility > 5000 && windSpeed > 2) {
      return 'Moderate (51-100)'
    } else if (visibility > 3000) {
      return 'Unhealthy for Sensitive Groups (101-150)'
    } else {
      return 'Unhealthy (151-200)'
    }
  }
}
