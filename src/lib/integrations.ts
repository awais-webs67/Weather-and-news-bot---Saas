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
        { command: 'news', description: '📰 Get latest news summary' },
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
            forecast: data.list.slice(0, 8).map((item: any) => ({
              time: item.dt_txt,
              temperature: item.main.temp,
              description: item.weather[0].description,
              icon: item.weather[0].icon
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
export class NewsAPI {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getTopHeadlines(country: string = 'us', category?: string): Promise<{ success: boolean; articles?: any[]; error?: string }> {
    try {
      let url = `https://newsapi.org/v2/top-headlines?country=${country.toLowerCase()}&apiKey=${this.apiKey}`
      if (category) {
        url += `&category=${category}`
      }
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WeatherAlert/1.0',
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

  async searchNews(query: string): Promise<{ success: boolean; articles?: any[]; error?: string }> {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${this.apiKey}`,
        {
          headers: {
            'User-Agent': 'WeatherAlert/1.0',
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
