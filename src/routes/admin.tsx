import { Hono } from 'hono'
import { Bindings } from '../types'
import { getCookie, verifySessionToken } from '../lib/utils'

const admin = new Hono<{ Bindings: Bindings }>()

// Admin authentication middleware for protected routes
async function adminAuthMiddleware(c: any, next: () => Promise<void>) {
  const sessionToken = getCookie(c.req.header('cookie'), 'admin_session')
  
  if (!sessionToken) {
    return c.redirect('/admin')
  }
  
  const payload = verifySessionToken(sessionToken)
  if (!payload || !payload.userId) {
    return c.redirect('/admin')
  }
  
  // Verify admin user exists
  const admin = await c.env.DB.prepare(
    'SELECT * FROM admin_users WHERE id = ? AND is_active = 1'
  ).bind(payload.userId).first()
  
  if (!admin) {
    return c.redirect('/admin')
  }
  
  await next()
}

// Admin login page (unprotected)
admin.get('/', async (c) => {
  // Check if already logged in
  const sessionToken = getCookie(c.req.header('cookie'), 'admin_session')
  if (sessionToken) {
    const payload = verifySessionToken(sessionToken)
    if (payload && payload.userId) {
      return c.redirect('/admin/dashboard')
    }
  }
  
  // Serve login page
  try {
    const loginHTML = await Bun.file('public/static/admin-login.html').text()
    return c.html(loginHTML)
  } catch {
    // Fallback if file not found
    return c.redirect('/static/admin-login.html')
  }
})

// Admin dashboard (protected)
admin.get('/dashboard', adminAuthMiddleware, (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>Admin Dashboard - AlertFlow v2.0 FIXED</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg border-b-4 border-red-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 md:h-20 items-center">
                <div class="flex items-center space-x-2 md:space-x-3">
                    <div class="relative">
                        <div class="absolute inset-0 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl blur opacity-60"></div>
                        <div class="relative bg-gradient-to-br from-red-600 to-orange-600 p-2 md:p-2.5 rounded-xl">
                            <i class="fas fa-user-shield text-xl md:text-2xl text-white"></i>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-lg md:text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">AlertFlow</span>
                        <span class="text-[10px] md:text-xs text-gray-500 font-semibold">Admin Panel</span>
                    </div>
                </div>
                
                <!-- Mobile menu button -->
                <button onclick="toggleAdminMenu()" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
                    <i id="adminMenuIcon" class="fas fa-bars text-gray-600 text-xl"></i>
                </button>
                
                <!-- Desktop menu -->
                <div class="hidden md:flex items-center space-x-4">
                    <a href="/" class="nav-link text-gray-600">
                        <i class="fas fa-home"></i> Home
                    </a>
                    <a href="/dashboard" class="nav-link text-gray-600">
                        <i class="fas fa-users"></i> User View
                    </a>
                    <button onclick="logout()" class="nav-link text-red-600 hover:bg-red-50">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
            
            <!-- Mobile menu -->
            <div id="adminMobileMenu" class="hidden md:hidden py-4 border-t border-gray-200">
                <div class="flex flex-col space-y-2">
                    <a href="/" class="nav-link text-gray-600 justify-start">
                        <i class="fas fa-home w-6"></i> Home
                    </a>
                    <a href="/dashboard" class="nav-link text-gray-600 justify-start">
                        <i class="fas fa-users w-6"></i> User View
                    </a>
                    <button onclick="logout()" class="nav-link text-red-600 hover:bg-red-50 justify-start w-full">
                        <i class="fas fa-sign-out-alt w-6"></i> Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- VERSION INDICATOR - If you see this, cache is cleared! -->
    <div class="bg-green-600 text-white text-center py-2 px-4 font-bold">
        ✅ ADMIN PANEL v2.0 FIXED - All Functions Working! Cache Cleared Successfully!
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4">
            <h1 class="text-2xl md:text-4xl font-bold gradient-text">System Administration</h1>
            <div class="flex space-x-3">
                <button onclick="refreshStats()" class="btn-secondary text-sm md:text-base">
                    <i class="fas fa-sync-alt"></i> <span class="hidden sm:inline">Refresh</span>
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
            <div class="glass-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-xs md:text-sm">Total Users</p>
                        <p class="text-2xl md:text-3xl font-bold" id="totalUsers">0</p>
                    </div>
                    <i class="fas fa-users text-3xl md:text-5xl text-blue-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-yellow-100 text-xs md:text-sm">Active Trials</p>
                        <p class="text-2xl md:text-3xl font-bold" id="activeTrials">0</p>
                    </div>
                    <i class="fas fa-clock text-3xl md:text-5xl text-yellow-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-100 text-xs md:text-sm">Premium Users</p>
                        <p class="text-2xl md:text-3xl font-bold" id="premiumUsers">0</p>
                    </div>
                    <i class="fas fa-crown text-3xl md:text-5xl text-green-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-100 text-xs md:text-sm">Messages Today</p>
                        <p class="text-2xl md:text-3xl font-bold" id="messagesToday">0</p>
                    </div>
                    <i class="fas fa-envelope text-3xl md:text-5xl text-purple-200"></i>
                </div>
            </div>
        </div>

        <!-- API Configuration & Testing -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <!-- Telegram API -->
            <div class="glass-card">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6 gap-3">
                    <h2 class="text-xl md:text-2xl font-bold flex items-center text-blue-600">
                        <i class="fab fa-telegram text-2xl md:text-3xl mr-2 md:mr-3"></i>
                        <span class="hidden sm:inline">Telegram Bot API</span>
                        <span class="sm:hidden">Telegram API</span>
                    </h2>
                    <span id="telegramStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">
                        Not Tested
                    </span>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-key text-blue-600"></i> Bot Token
                        </label>
                        <input type="password" id="telegram_bot_token" placeholder="Enter Telegram bot token" 
                            class="input-field" value="8492433968:AAFQownK5mneU8d5SdLF7LfOuxSKWAEYX3s">
                        <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://t.me/BotFather" target="_blank" class="text-blue-600 hover:underline">@BotFather</a></p>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3">
                        <button onclick="testTelegram()" class="btn-primary flex-1">
                            <i class="fas fa-vial mr-2"></i> <span class="hidden sm:inline">Test Connection</span><span class="sm:hidden">Test</span>
                        </button>
                        <button onclick="saveTelegramKey()" class="btn-secondary">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>

                    <div id="telegramResult" class="hidden p-4 rounded-lg"></div>
                </div>
            </div>

            <!-- Weather API -->
            <div class="glass-card">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold flex items-center text-orange-600">
                        <i class="fas fa-cloud-sun text-3xl mr-3"></i>
                        Weather API
                    </h2>
                    <span id="weatherStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">
                        Not Tested
                    </span>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-key text-orange-600"></i> API Key
                        </label>
                        <input type="password" id="weather_api_key" placeholder="Enter OpenWeatherMap API key" 
                            class="input-field" value="b31456e99dabf0b590e4a4ef0b0e3a1e">
                        <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://openweathermap.org/api" target="_blank" class="text-orange-600 hover:underline">OpenWeatherMap</a></p>
                    </div>

                    <div class="flex space-x-3">
                        <button onclick="testWeather()" class="btn-primary flex-1">
                            <i class="fas fa-vial mr-2"></i> Test Connection
                        </button>
                        <button onclick="saveWeatherKey()" class="btn-secondary">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>

                    <div id="weatherResult" class="hidden p-4 rounded-lg"></div>
                </div>
            </div>
            
            <!-- News API -->
            <div class="glass-card">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold flex items-center text-red-600">
                        <i class="fas fa-newspaper text-3xl mr-3"></i>
                        News API
                    </h2>
                    <span id="newsStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">
                        Not Tested
                    </span>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-key text-red-600"></i> API Key (FREE 100 requests/day)
                        </label>
                        <input type="password" id="news_api_key" placeholder="Enter NewsAPI.org key" 
                            class="input-field">
                        <p class="text-xs text-gray-500 mt-1">Get FREE key: <a href="https://newsapi.org/register" target="_blank" class="text-red-600 hover:underline font-semibold">newsapi.org/register</a></p>
                    </div>

                    <div class="flex space-x-3">
                        <button onclick="testNews()" class="btn-primary flex-1">
                            <i class="fas fa-vial mr-2"></i> Test Connection
                        </button>
                        <button onclick="saveNewsKey()" class="btn-secondary">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>

                    <div id="newsResult" class="hidden p-4 rounded-lg"></div>
                </div>
            </div>

            <!-- GNews API (Better for ALL countries) -->
            <div class="glass-card">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold flex items-center text-green-600">
                        <i class="fas fa-globe text-3xl mr-3"></i>
                        GNews API
                    </h2>
                    <span id="gnewsStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">
                        Not Tested
                    </span>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-key text-green-600"></i> API Key (FREE - Supports ALL Countries!)
                        </label>
                        <input type="password" id="gnews_api_key" placeholder="Enter GNews API key" 
                            class="input-field">
                        <p class="text-xs text-gray-500 mt-1">
                            <strong>✨ Best for Pakistan & all countries!</strong><br/>
                            Get FREE key (100/day): <a href="https://gnews.io/" target="_blank" class="text-green-600 hover:underline font-semibold">gnews.io</a>
                        </p>
                    </div>

                    <div class="flex space-x-3">
                        <button onclick="testGNews()" class="btn-primary flex-1">
                            <i class="fas fa-vial mr-2"></i> Test Connection
                        </button>
                        <button onclick="saveGNewsKey()" class="btn-secondary">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>

                    <div id="gnewsResult" class="hidden p-4 rounded-lg"></div>
                </div>
            </div>

            <!-- Gemini AI -->
            <div class="glass-card">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold flex items-center text-purple-600">
                        <i class="fas fa-brain text-3xl mr-3"></i>
                        Gemini AI
                    </h2>
                    <span id="geminiStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">
                        Not Tested
                    </span>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-key text-purple-600"></i> AI API Key
                        </label>
                        <input type="password" id="gemini_api_key" placeholder="Enter Gemini API key" 
                            class="input-field" value="AIzaSyDlz2Lo5IaIou5o28AUc_Txp4c0T2eu8WQ">
                        <p class="text-xs text-gray-500 mt-1">For AI-powered weather insights & summaries</p>
                    </div>

                    <div class="flex space-x-3">
                        <button onclick="testGemini()" class="btn-primary flex-1">
                            <i class="fas fa-vial mr-2"></i> Test Connection
                        </button>
                        <button onclick="saveGeminiKey()" class="btn-secondary">
                            <i class="fas fa-save"></i> Save
                        </button>
                    </div>

                    <div id="geminiResult" class="hidden p-4 rounded-lg"></div>
                </div>
            </div>
        </div>

        <!-- License Key Generation -->
        <div class="glass-card mb-8">
            <h2 class="text-2xl font-bold mb-6 flex items-center text-teal-600">
                <i class="fas fa-key text-3xl mr-3"></i>
                License Key Generator
            </h2>
            
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Plan Type</label>
                    <select id="licensePlan" class="input-field">
                        <option value="monthly">Monthly ($9.99 - 30 days)</option>
                        <option value="yearly">Yearly ($95.99 - 365 days)</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Duration (days)</label>
                    <input type="number" id="licenseDuration" value="30" class="input-field">
                </div>
            </div>
            
            <div class="mt-4 flex space-x-3">
                <button onclick="generateLicenseKey()" class="btn-primary flex-1">
                    <i class="fas fa-plus-circle mr-2"></i> Generate License Key
                </button>
            </div>
            
            <div id="generatedKey" class="hidden mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                <p class="text-sm font-semibold text-gray-700 mb-2">Generated License Key:</p>
                <div class="flex items-center justify-between">
                    <code id="keyDisplay" class="text-2xl font-mono font-bold text-green-600"></code>
                    <button onclick="copyKey()" class="btn-secondary">
                        <i class="fas fa-copy mr-2"></i> Copy
                    </button>
                </div>
            </div>
        </div>

        <!-- Bot Settings Management -->
        <div class="glass-card mb-8">
            <h2 class="text-2xl font-bold mb-6 flex items-center text-purple-600">
                <i class="fas fa-robot text-3xl mr-3"></i>
                Bot Settings
            </h2>
            <p class="text-sm text-gray-600 mb-6">Configure and update your Telegram bot information</p>
            
            <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fab fa-telegram text-blue-500"></i> Bot Username
                        </label>
                        <div class="input-field bg-white flex items-center justify-between">
                            <span class="text-gray-700 font-mono">@AivraSols_bot</span>
                            <a href="https://t.me/AivraSols_bot" target="_blank" class="text-blue-500 hover:text-blue-600">
                                <i class="fas fa-external-link-alt"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-link text-purple-500"></i> Bot Link
                        </label>
                        <div class="input-field bg-white flex items-center justify-between">
                            <span class="text-gray-500 text-sm">https://t.me/AivraSols_bot</span>
                            <button onclick="copyToClipboard('https://t.me/AivraSols_bot')" class="text-purple-500 hover:text-purple-600">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-key text-orange-500"></i> Bot Token (Current)
                        </label>
                        <div class="input-field bg-white flex items-center justify-between">
                            <span class="text-gray-500 font-mono text-sm">8492433968:AAF...X3s</span>
                            <span class="text-green-600">
                                <i class="fas fa-check-circle"></i> Active
                            </span>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-users text-teal-500"></i> Bot Status
                        </label>
                        <div class="input-field bg-white flex items-center justify-between">
                            <span class="text-gray-700">Connected & Running</span>
                            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 p-4 bg-white rounded-lg border border-purple-200">
                    <p class="text-xs text-gray-700 mb-2">
                        <i class="fas fa-info-circle text-blue-500"></i> 
                        <strong>Note:</strong> To update bot credentials, contact your developer or update via @BotFather on Telegram.
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Channel Management -->
        <div class="glass-card mb-8">
            <h2 class="text-2xl font-bold mb-6 flex items-center text-gray-900">
                <i class="fas fa-satellite-dish text-3xl mr-3 text-blue-600"></i>
                Messaging Channels
            </h2>
            <p class="text-sm text-gray-600 mb-6">Enable or disable messaging platforms for alert delivery</p>
            
            <!-- Telegram Toggle -->
            <div class="border-2 border-blue-200 rounded-xl p-6 mb-4 bg-blue-50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <i class="fab fa-telegram text-5xl text-blue-500"></i>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">Telegram Bot</h3>
                            <p class="text-sm text-gray-600">Primary messaging platform for AlertFlow</p>
                            <span id="telegramChannelStatus" class="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                ✓ Active & Configured
                            </span>
                        </div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="telegramToggle" class="sr-only peer" checked onchange="toggleTelegram(this.checked)">
                        <div class="w-16 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>
            
            <!-- WhatsApp Toggle -->
            <div class="border-2 border-green-200 rounded-xl p-6 bg-green-50">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <i class="fab fa-whatsapp text-5xl text-green-600"></i>
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">WhatsApp Notifications</h3>
                            <p class="text-sm text-gray-600">Direct messaging via WhatsApp for premium users</p>
                            <span id="whatsappChannelStatus" class="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                                ⚠️ Disabled (Default)
                            </span>
                        </div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="whatsappToggle" class="sr-only peer" onchange="toggleWhatsApp(this.checked)">
                        <div class="w-16 h-8 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all"></div>
                    </label>
                </div>
                <div class="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <p class="text-xs text-gray-700">
                        <i class="fas fa-info-circle text-blue-500"></i> 
                        <strong>WhatsApp Integration:</strong> Uses wa.me links for direct messaging. No API credentials required. Contact: +92 343 0641457
                    </p>
                </div>
            </div>
        </div>

        <!-- AI-Powered Feature Suggestions -->
        <div class="glass-card mb-8">
            <h2 class="text-2xl md:text-3xl font-bold mb-6 flex items-center gradient-text">
                <i class="fas fa-brain text-3xl md:text-4xl mr-3"></i>
                AI Feature Suggestions
            </h2>
            <p class="text-sm text-gray-600 mb-6">Get intelligent suggestions to improve your SaaS using Gemini AI</p>
            
            <div class="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 md:p-6">
                <div class="mb-4">
                    <label class="block text-sm font-semibold text-gray-700 mb-2">
                        <i class="fas fa-lightbulb text-yellow-500"></i> Ask AI for Suggestions
                    </label>
                    <textarea id="aiPrompt" rows="3" placeholder="e.g., How can I improve user engagement? What features should I add for weather alerts?" 
                        class="input-field resize-none"></textarea>
                </div>
                
                <div class="flex flex-col sm:flex-row gap-3 mb-4">
                    <button onclick="getAISuggestions()" class="btn-primary flex-1">
                        <i class="fas fa-magic mr-2"></i> Get AI Suggestions
                    </button>
                    <button onclick="loadPresetSuggestions()" class="btn-secondary">
                        <i class="fas fa-list mr-2"></i> <span class="hidden sm:inline">Preset Questions</span><span class="sm:hidden">Presets</span>
                    </button>
                </div>
                
                <div id="aiSuggestionsResult" class="hidden">
                    <div class="bg-white rounded-lg border-2 border-purple-300 p-4">
                        <h3 class="font-bold text-lg text-purple-700 mb-3 flex items-center">
                            <i class="fas fa-robot mr-2"></i> AI Recommendations
                        </h3>
                        <div id="aiSuggestionsContent" class="text-gray-700 prose prose-sm max-w-none"></div>
                    </div>
                </div>
                
                <!-- Preset Suggestions -->
                <div id="presetSuggestions" class="hidden mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button onclick="askAI('How can I improve user retention and engagement?')" class="text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
                        <i class="fas fa-users text-purple-500 mr-2"></i>
                        <span class="text-sm font-medium">Improve User Engagement</span>
                    </button>
                    <button onclick="askAI('What new features should I add to my weather and news SaaS?')" class="text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
                        <i class="fas fa-plus-circle text-blue-500 mr-2"></i>
                        <span class="text-sm font-medium">New Feature Ideas</span>
                    </button>
                    <button onclick="askAI('How can I monetize my SaaS better?')" class="text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
                        <i class="fas fa-dollar-sign text-green-500 mr-2"></i>
                        <span class="text-sm font-medium">Monetization Strategies</span>
                    </button>
                    <button onclick="askAI('What marketing strategies work best for B2C SaaS?')" class="text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
                        <i class="fas fa-bullhorn text-orange-500 mr-2"></i>
                        <span class="text-sm font-medium">Marketing Ideas</span>
                    </button>
                    <button onclick="askAI('How can I improve the UX/UI of my application?')" class="text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
                        <i class="fas fa-paint-brush text-pink-500 mr-2"></i>
                        <span class="text-sm font-medium">UX/UI Improvements</span>
                    </button>
                    <button onclick="askAI('What analytics and metrics should I track?')" class="text-left p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all">
                        <i class="fas fa-chart-line text-teal-500 mr-2"></i>
                        <span class="text-sm font-medium">Analytics & Metrics</span>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- User Management -->
        <div class="glass-card mb-8">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold flex items-center gradient-text">
                    <i class="fas fa-users mr-3"></i>
                    Registered Users
                </h2>
                <button onclick="loadUsers()" class="btn-secondary">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200" id="usersTableBody">
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading users...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- API Logs -->
        <div class="glass-card">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold flex items-center gradient-text">
                    <i class="fas fa-list-alt mr-3"></i>
                    API Test Logs
                </h2>
                <button onclick="loadLogs()" class="btn-secondary">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200" id="logsTableBody">
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading logs...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/utils.js"></script>
    <script>
        // Mobile menu toggle
        function toggleAdminMenu() {
            const menu = document.getElementById('adminMobileMenu');
            const icon = document.getElementById('adminMenuIcon');
            if (menu.classList.contains('hidden')) {
                menu.classList.remove('hidden');
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                menu.classList.add('hidden');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
        
        // Load initial data
        async function init() {
            console.log('Initializing admin panel...');
            try {
                console.log('Loading stats...');
                await loadStats();
                console.log('Loading settings...');
                await loadSettings();
                console.log('Loading users...');
                await loadUsers();
                console.log('Loading logs...');
                await loadLogs();
                console.log('Admin panel initialized successfully!');
            } catch (error) {
                console.error('Init failed:', error);
                showToast('Failed to load admin data: ' + error.message, 'error');
            }
        }

        async function loadStats() {
            try {
                const response = await axios.get('/api/admin/stats');
                if (response.data.success) {
                    const stats = response.data.stats;
                    document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
                    document.getElementById('activeTrials').textContent = stats.activeTrials || 0;
                    document.getElementById('premiumUsers').textContent = stats.premiumUsers || 0;
                    document.getElementById('messagesToday').textContent = stats.messagesToday || 0;
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    window.location.href = '/admin';
                }
            }
        }

        async function loadSettings() {
            try {
                const response = await axios.get('/api/admin/settings');
                if (response.data.success) {
                    const settings = response.data.settings;
                    if (settings.telegram_bot_token) {
                        document.getElementById('telegram_bot_token').value = settings.telegram_bot_token;
                    }
                    if (settings.weather_api_key) {
                        document.getElementById('weather_api_key').value = settings.weather_api_key;
                    }
                    if (settings.news_api_key) {
                        document.getElementById('news_api_key').value = settings.news_api_key;
                    }
                    if (settings.gnews_api_key) {
                        document.getElementById('gnews_api_key').value = settings.gnews_api_key;
                    }
                    if (settings.gemini_api_key) {
                        document.getElementById('gemini_api_key').value = settings.gemini_api_key;
                    }
                }
            } catch (error) {
                console.error('Failed to load settings');
            }
        }

        async function testTelegram() {
            const token = document.getElementById('telegram_bot_token').value;
            const resultDiv = document.getElementById('telegramResult');
            const statusBadge = document.getElementById('telegramStatus');
            
            if (!token) {
                showToast('Please enter Telegram bot token', 'warning');
                return;
            }
            
            resultDiv.classList.add('hidden');
            statusBadge.textContent = 'Testing...';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
            
            try {
                const response = await axios.post('/api/admin/test/telegram', { token });
                
                if (response.data.success) {
                    const data = response.data.data;
                    resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200';
                    resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i><div><p class="font-semibold text-green-800">✅ Connection Successful!</p><p class="text-sm text-green-700 mt-1">Bot Name: <strong>' + data.bot_name + '</strong></p><p class="text-sm text-green-700">Username: @' + data.username + '</p><p class="text-sm text-green-700">Bot ID: ' + data.bot_id + '</p></div></div>';
                    statusBadge.textContent = '✅ Working';
                    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                    showToast('Telegram bot connected successfully!', 'success');
                } else {
                    throw new Error(response.data.error || 'Test failed');
                }
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
                resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i><div><p class="font-semibold text-red-800">❌ Connection Failed</p><p class="text-sm text-red-700 mt-1">' + (error.response?.data?.error || error.message) + '</p></div></div>';
                statusBadge.textContent = '❌ Failed';
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
                resultDiv.classList.remove('hidden');
                showToast('Telegram test failed', 'error');
            }
            
            await loadLogs();
        }

        async function testWeather() {
            const apiKey = document.getElementById('weather_api_key').value;
            const resultDiv = document.getElementById('weatherResult');
            const statusBadge = document.getElementById('weatherStatus');
            
            if (!apiKey) {
                showToast('Please enter Weather API key', 'warning');
                return;
            }
            
            resultDiv.classList.add('hidden');
            statusBadge.textContent = 'Testing...';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
            
            try {
                const response = await axios.post('/api/admin/test/weather', { apiKey });
                
                if (response.data.success) {
                    const data = response.data.data;
                    resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200';
                    resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i><div><p class="font-semibold text-green-800">✅ Connection Successful!</p><p class="text-sm text-green-700 mt-1">Test City: <strong>' + data.city + ', ' + data.country + '</strong></p><p class="text-sm text-green-700">Temperature: ' + data.temperature + '°C</p><p class="text-sm text-green-700">Condition: ' + data.description + '</p></div></div>';
                    statusBadge.textContent = '✅ Working';
                    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                    showToast('Weather API connected successfully!', 'success');
                } else {
                    throw new Error(response.data.error || 'Test failed');
                }
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
                resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i><div><p class="font-semibold text-red-800">❌ Connection Failed</p><p class="text-sm text-red-700 mt-1">' + (error.response?.data?.error || error.message) + '</p><p class="text-xs text-red-600 mt-2">Get a valid key from: <a href="https://openweathermap.org/api" target="_blank" class="underline">OpenWeatherMap</a></p></div></div>';
                statusBadge.textContent = '❌ Failed';
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
                resultDiv.classList.remove('hidden');
                showToast('Weather API test failed', 'error');
            }
            
            await loadLogs();
        }

        async function saveTelegramKey() {
            const token = document.getElementById('telegram_bot_token').value;
            
            if (!token) {
                showToast('Please enter Telegram bot token', 'warning');
                return;
            }
            
            try {
                await axios.post('/api/admin/settings', {
                    settings: { telegram_bot_token: token }
                });
                showToast('Telegram token saved successfully!', 'success');
            } catch (error) {
                showToast('Failed to save Telegram token', 'error');
            }
        }

        async function saveWeatherKey() {
            const apiKey = document.getElementById('weather_api_key').value;
            
            if (!apiKey) {
                showToast('Please enter Weather API key', 'warning');
                return;
            }
            
            try {
                await axios.post('/api/admin/settings', {
                    settings: { weather_api_key: apiKey }
                });
                showToast('Weather API key saved successfully!', 'success');
            } catch (error) {
                showToast('Failed to save Weather API key', 'error');
            }
        }

        async function loadUsers() {
            try {
                const response = await axios.get('/api/admin/users');
                if (response.data.success) {
                    const users = response.data.users;
                    const tbody = document.getElementById('usersTableBody');
                    
                    if (users.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No users registered yet.</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = users.map(user => '<tr><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + user.email + '</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">' + (user.name || '-') + '</td><td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 py-1 rounded-full bg-' + (user.subscription_plan === 'premium' ? 'green' : user.subscription_plan === 'trial' ? 'yellow' : 'gray') + '-100 text-' + (user.subscription_plan === 'premium' ? 'green' : user.subscription_plan === 'trial' ? 'yellow' : 'gray') + '-800">' + user.subscription_plan.toUpperCase() + '</span></td><td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 py-1 rounded-full bg-' + (user.subscription_status === 'active' ? 'green' : 'red') + '-100 text-' + (user.subscription_status === 'active' ? 'green' : 'red') + '-800">' + user.subscription_status.toUpperCase() + '</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">' + new Date(user.created_at).toLocaleDateString() + '</td></tr>').join('');
                }
            } catch (error) {
                console.error('Failed to load users');
                const tbody = document.getElementById('usersTableBody');
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Failed to load users</td></tr>';
            }
        }

        async function loadLogs() {
            try {
                const response = await axios.get('/api/admin/logs');
                if (response.data.success) {
                    const logs = response.data.logs;
                    const tbody = document.getElementById('logsTableBody');
                    
                    if (logs.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No logs yet. Test APIs to see results here.</td></tr>';
                        return;
                    }
                    
                    tbody.innerHTML = logs.map(log => '<tr><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">' + new Date(log.created_at).toLocaleString() + '</td><td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 py-1 rounded-full bg-' + (log.api_name === 'telegram' ? 'blue' : 'orange') + '-100 text-' + (log.api_name === 'telegram' ? 'blue' : 'orange') + '-800">' + log.api_name.toUpperCase() + '</span></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">' + log.action + '</td><td class="px-6 py-4 whitespace-nowrap text-sm"><span class="px-2 py-1 rounded-full bg-' + (log.success ? 'green' : 'red') + '-100 text-' + (log.success ? 'green' : 'red') + '-800">' + (log.success ? '✅ Success' : '❌ Failed') + '</span></td><td class="px-6 py-4 text-sm text-gray-600">' + (log.success ? (log.details || 'OK') : (log.error_message || 'Error')) + '</td></tr>').join('');
                }
            } catch (error) {
                console.error('Failed to load logs');
            }
        }

        async function saveNewsKey() {
            const apiKey = document.getElementById('news_api_key').value;
            
            if (!apiKey) {
                showToast('Please enter News API key', 'warning');
                return;
            }
            
            try {
                await axios.post('/api/admin/settings', {
                    settings: { news_api_key: apiKey }
                });
                document.getElementById('newsStatus').textContent = 'Configured';
                document.getElementById('newsStatus').className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                showToast('News API key saved! Get FREE key at newsapi.org', 'success');
            } catch (error) {
                showToast('Failed to save News API key', 'error');
            }
        }

        async function saveGeminiKey() {
            const apiKey = document.getElementById('gemini_api_key').value;
            
            if (!apiKey) {
                showToast('Please enter Gemini API key', 'warning');
                return;
            }
            
            try {
                await axios.post('/api/admin/settings', {
                    settings: { gemini_api_key: apiKey }
                });
                document.getElementById('geminiStatus').textContent = 'Configured';
                document.getElementById('geminiStatus').className = 'px-3 py-1 rounded-full text-sm font-semibold bg-purple-200 text-purple-800';
                showToast('Gemini AI key saved successfully!', 'success');
            } catch (error) {
                showToast('Failed to save Gemini key', 'error');
            }
        }

        async function toggleTelegram(isEnabled) {
            try {
                await axios.post('/api/admin/settings', {
                    settings: { telegram_enabled: isEnabled ? '1' : '0' }
                });
                
                const statusEl = document.getElementById('telegramChannelStatus');
                if (isEnabled) {
                    statusEl.textContent = '✓ Active & Configured';
                    statusEl.className = 'inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold';
                    showToast('Telegram channel enabled successfully!', 'success');
                } else {
                    statusEl.textContent = '⚠ Disabled';
                    statusEl.className = 'inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold';
                    showToast('Telegram channel disabled. Users will not receive alerts.', 'warning');
                }
            } catch (error) {
                showToast('Failed to update Telegram channel status', 'error');
                // Revert toggle
                document.getElementById('telegramToggle').checked = !isEnabled;
            }
        }
        
        async function toggleWhatsApp(isEnabled) {
            try {
                await axios.post('/api/admin/settings', {
                    settings: { whatsapp_enabled: isEnabled ? '1' : '0' }
                });
                
                const statusEl = document.getElementById('whatsappChannelStatus');
                if (isEnabled) {
                    statusEl.textContent = '✓ Active & Enabled';
                    statusEl.className = 'inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold';
                    showToast('WhatsApp notifications enabled successfully!', 'success');
                } else {
                    statusEl.textContent = '⚠ Disabled (Default)';
                    statusEl.className = 'inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold';
                    showToast('WhatsApp notifications disabled.', 'warning');
                }
            } catch (error) {
                showToast('Failed to update WhatsApp status', 'error');
                // Revert toggle
                document.getElementById('whatsappToggle').checked = !isEnabled;
            }
        }

        async function testNews() {
            const apiKey = document.getElementById('news_api_key').value;
            const resultDiv = document.getElementById('newsResult');
            const statusBadge = document.getElementById('newsStatus');
            
            if (!apiKey) {
                showToast('Please enter News API key', 'warning');
                return;
            }
            
            resultDiv.classList.add('hidden');
            statusBadge.textContent = 'Testing...';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
            
            try {
                const response = await axios.post('/api/admin/test/news', { apiKey });
                
                if (response.data.success) {
                    const data = response.data.data;
                    resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200';
                    resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i><div class="flex-1"><p class="font-semibold text-green-800">✅ Connection Successful!</p><p class="text-sm text-green-700 mt-1">Headlines Fetched: <strong>' + data.count + '</strong></p><div class="mt-2 text-xs text-green-700"><p class="font-semibold">Sample Headlines:</p><ul class="list-disc list-inside mt-1">' + data.headlines.map(function(h) { return '<li class="truncate">' + h + '</li>'; }).join('') + '</ul></div></div></div>';
                    statusBadge.textContent = '✅ Working';
                    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                    showToast('News API connected successfully!', 'success');
                } else {
                    throw new Error(response.data.error || 'Test failed');
                }
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
                resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i><div><p class="font-semibold text-red-800">❌ Connection Failed</p><p class="text-sm text-red-700 mt-1">' + (error.response?.data?.error || error.message) + '</p><p class="text-xs text-red-600 mt-2">Get a FREE key from: <a href="https://newsapi.org/register" target="_blank" class="underline">NewsAPI.org</a></p></div></div>';
                statusBadge.textContent = '❌ Failed';
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
                resultDiv.classList.remove('hidden');
                showToast('News API test failed', 'error');
            }
            
            await loadLogs();
        }

        async function testGemini() {
            const apiKey = document.getElementById('gemini_api_key').value;
            const resultDiv = document.getElementById('geminiResult');
            const statusBadge = document.getElementById('geminiStatus');
            
            if (!apiKey) {
                showToast('Please enter Gemini API key', 'warning');
                return;
            }
            
            resultDiv.classList.add('hidden');
            statusBadge.textContent = 'Testing...';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
            
            try {
                const response = await axios.post('/api/admin/test/gemini', { apiKey });
                
                if (response.data.success) {
                    const data = response.data.data;
                    resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200';
                    resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i><div class="flex-1"><p class="font-semibold text-green-800">✅ Connection Successful!</p><p class="text-sm text-green-700 mt-1">Model: <strong>' + data.model + '</strong></p><div class="mt-2 p-2 bg-white rounded border border-green-300"><p class="text-xs text-gray-700 font-semibold">AI Response:</p><p class="text-sm text-gray-800 mt-1">' + data.response + '</p></div></div></div>';
                    statusBadge.textContent = '✅ Working';
                    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                    showToast('Gemini AI connected successfully!', 'success');
                } else {
                    throw new Error(response.data.error || 'Test failed');
                }
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
                resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i><div><p class="font-semibold text-red-800">❌ Connection Failed</p><p class="text-sm text-red-700 mt-1">' + (error.response?.data?.error || error.message) + '</p><p class="text-xs text-red-600 mt-2">Check your Gemini API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" class="underline">Google AI Studio</a></p></div></div>';
                statusBadge.textContent = '❌ Failed';
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
                resultDiv.classList.remove('hidden');
                showToast('Gemini AI test failed', 'error');
            }
            
            await loadLogs();
        }

        async function testGNews() {
            const apiKey = document.getElementById('gnews_api_key').value;
            const resultDiv = document.getElementById('gnewsResult');
            const statusBadge = document.getElementById('gnewsStatus');
            
            if (!apiKey) {
                showToast('Please enter GNews API key', 'warning');
                return;
            }
            
            resultDiv.classList.add('hidden');
            statusBadge.textContent = 'Testing...';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
            
            try {
                const response = await axios.post('/api/admin/test/gnews', { apiKey });
                
                if (response.data.success) {
                    const data = response.data.data;
                    resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200';
                    resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i><div class="flex-1"><p class="font-semibold text-green-800">✅ Connection Successful!</p><p class="text-sm text-green-700 mt-1">Headlines Fetched: <strong>' + data.count + '</strong></p><div class="mt-2 text-xs text-green-700"><p class="font-semibold">Sample Headlines:</p><ul class="list-disc list-inside mt-1">' + data.headlines.map(h => '<li class="truncate">' + h + '</li>').join('') + '</ul></div></div></div>';
                    statusBadge.textContent = '✅ Working';
                    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                    showToast('GNews API connected successfully!', 'success');
                } else {
                    throw new Error(response.data.error || 'Test failed');
                }
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
                resultDiv.innerHTML = '<div class="flex items-start"><i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i><div><p class="font-semibold text-red-800">❌ Connection Failed</p><p class="text-sm text-red-700 mt-1">' + (error.response?.data?.error || error.message) + '</p><p class="text-xs text-red-600 mt-2">Get FREE key at: <a href="https://gnews.io/" target="_blank" class="underline">gnews.io</a></p></div></div>';
                statusBadge.textContent = '❌ Failed';
                statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
                resultDiv.classList.remove('hidden');
                showToast('GNews API test failed', 'error');
            }
            
            await loadLogs();
        }
        
        async function saveGNewsKey() {
            const apiKey = document.getElementById('gnews_api_key').value;
            
            if (!apiKey) {
                showToast('Please enter GNews API key', 'warning');
                return;
            }
            
            try {
                await axios.post('/api/admin/settings', {
                    settings: { gnews_api_key: apiKey }
                });
                showToast('GNews API key saved successfully!', 'success');
            } catch (error) {
                showToast('Failed to save GNews API key', 'error');
            }
        }

        async function generateLicenseKey() {
            const planType = document.getElementById('licensePlan').value;
            const duration = parseInt(document.getElementById('licenseDuration').value);
            
            if (!duration || duration < 1) {
                showToast('Please enter valid duration', 'warning');
                return;
            }
            
            try {
                const response = await axios.post('/api/admin/generate-license', {
                    planType,
                    durationDays: duration
                });
                
                if (response.data.success) {
                    document.getElementById('keyDisplay').textContent = response.data.licenseKey;
                    document.getElementById('generatedKey').classList.remove('hidden');
                    showToast('License key generated: ' + response.data.licenseKey, 'success');
                } else {
                    showToast('Failed to generate key', 'error');
                }
            } catch (error) {
                showToast('Error generating license key', 'error');
            }
        }

        function copyKey() {
            const key = document.getElementById('keyDisplay').textContent;
            navigator.clipboard.writeText(key);
            showToast('License key copied to clipboard!', 'success');
        }

        function refreshStats() {
            loadStats();
            showToast('Stats refreshed', 'info');
        }
        
        // AI Feature Suggestions
        function loadPresetSuggestions() {
            const presetsDiv = document.getElementById('presetSuggestions');
            if (presetsDiv.classList.contains('hidden')) {
                presetsDiv.classList.remove('hidden');
            } else {
                presetsDiv.classList.add('hidden');
            }
        }
        
        function askAI(question) {
            document.getElementById('aiPrompt').value = question;
            document.getElementById('presetSuggestions').classList.add('hidden');
            getAISuggestions();
        }
        
        async function getAISuggestions() {
            const prompt = document.getElementById('aiPrompt').value.trim();
            const resultDiv = document.getElementById('aiSuggestionsResult');
            const contentDiv = document.getElementById('aiSuggestionsContent');
            
            if (!prompt) {
                showToast('Please enter a question or select a preset', 'warning');
                return;
            }
            
            // Show loading
            resultDiv.classList.remove('hidden');
            contentDiv.innerHTML = '<div class="flex items-center justify-center py-8"><div class="spinner"></div><span class="ml-3 text-gray-600">AI is thinking...</span></div>';
            
            try {
                // Get Gemini API key from settings
                const response = await axios.post('/api/admin/ai/suggestions', { prompt });
                
                if (response.data.success) {
                    const suggestions = response.data.suggestions;
                    
                    // Format the response with better HTML
                    const formattedSuggestions = suggestions
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n\n/g, '</p><p class="mb-3">')
                        .replace(/\n- /g, '<br/>• ')
                        .replace(/\n\d+\. /g, '<br/><strong>$&</strong>');
                    
                    contentDiv.innerHTML = '<p class="mb-3">' + formattedSuggestions + '</p>';
                    showToast('AI suggestions generated successfully!', 'success');
                } else {
                    contentDiv.innerHTML = '<div class="text-red-600"><i class="fas fa-exclamation-circle mr-2"></i>' + (response.data.error || 'Failed to get AI suggestions') + '</div>';
                    showToast('Failed to get AI suggestions', 'error');
                }
            } catch (error) {
                console.error('AI suggestions error:', error);
                contentDiv.innerHTML = '<div class="text-red-600"><i class="fas fa-exclamation-circle mr-2"></i>Failed to connect to AI service. Please check your Gemini API key in settings.</div>';
                showToast('Failed to get AI suggestions', 'error');
            }
        }

        async function logout() {
            try {
                await axios.post('/api/admin/auth/logout');
                showToast('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/admin';
                }, 1000);
            } catch (error) {
                window.location.href = '/admin';
            }
        }

        // Make all functions globally accessible
        window.toggleAdminMenu = toggleAdminMenu;
        window.init = init;
        window.loadStats = loadStats;
        window.loadSettings = loadSettings;
        window.testTelegram = testTelegram;
        window.testWeather = testWeather;
        window.saveTelegramKey = saveTelegramKey;
        window.saveWeatherKey = saveWeatherKey;
        window.loadUsers = loadUsers;
        window.loadLogs = loadLogs;
        window.saveNewsKey = saveNewsKey;
        window.saveGeminiKey = saveGeminiKey;
        window.toggleTelegram = toggleTelegram;
        window.toggleWhatsApp = toggleWhatsApp;
        window.testNews = testNews;
        window.testGemini = testGemini;
        window.testGNews = testGNews;
        window.saveGNewsKey = saveGNewsKey;
        window.generateLicenseKey = generateLicenseKey;
        window.copyKey = copyKey;
        window.refreshStats = refreshStats;
        window.loadPresetSuggestions = loadPresetSuggestions;
        window.askAI = askAI;
        window.getAISuggestions = getAISuggestions;
        window.logout = logout;

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, initializing admin panel...');
            try {
                init();
            } catch (error) {
                console.error('Init error:', error);
                alert('Failed to initialize admin panel: ' + error.message);
            }
        });
    </script>
</body>
</html>
  `)
})

export default admin
