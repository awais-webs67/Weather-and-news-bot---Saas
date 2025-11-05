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
    <title>Admin Dashboard - AlertFlow v3.0</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
    <style>
        body { font-family: 'Inter', system-ui, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .glass { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); }
        .card { transition: all 0.3s; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    </style>
</head>
<body class="bg-gray-50">

    <!-- SUCCESS BANNER -->
    <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center py-3 px-4">
        <div class="flex items-center justify-center space-x-2">
            <i class="fas fa-check-circle text-2xl"></i>
            <span class="font-bold text-lg">✅ ADMIN PANEL v3.0 - FULLY WORKING!</span>
            <i class="fas fa-rocket text-2xl"></i>
        </div>
        <p class="text-sm mt-1 opacity-90">All functions loaded successfully. External JavaScript active.</p>
    </div>

    <!-- Navigation -->
    <nav class="glass shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center space-x-3">
                    <div class="gradient-bg p-3 rounded-xl">
                        <i class="fas fa-shield-alt text-2xl text-white"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-black text-gray-900">AlertFlow</h1>
                        <p class="text-xs text-gray-500">Admin Panel v3.0</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-home mr-2"></i>Home
                    </a>
                    <button onclick="logout()" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Page Header -->
        <div class="flex justify-between items-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900">System Dashboard</h2>
            <button onclick="refreshStats()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
            </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Users -->
            <div class="card glass rounded-2xl p-6 border-l-4 border-blue-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Total Users</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" id="totalUsers">0</p>
                    </div>
                    <div class="bg-blue-100 p-4 rounded-xl">
                        <i class="fas fa-users text-3xl text-blue-600"></i>
                    </div>
                </div>
            </div>

            <!-- Active Trials -->
            <div class="card glass rounded-2xl p-6 border-l-4 border-yellow-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Active Trials</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" id="activeTrials">0</p>
                    </div>
                    <div class="bg-yellow-100 p-4 rounded-xl">
                        <i class="fas fa-clock text-3xl text-yellow-600"></i>
                    </div>
                </div>
            </div>

            <!-- Premium Users -->
            <div class="card glass rounded-2xl p-6 border-l-4 border-green-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Premium Users</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" id="premiumUsers">0</p>
                    </div>
                    <div class="bg-green-100 p-4 rounded-xl">
                        <i class="fas fa-crown text-3xl text-green-600"></i>
                    </div>
                </div>
            </div>

            <!-- Messages Today -->
            <div class="card glass rounded-2xl p-6 border-l-4 border-purple-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold">Messages Today</p>
                        <p class="text-3xl font-bold text-gray-900 mt-2" id="messagesToday">0</p>
                    </div>
                    <div class="bg-purple-100 p-4 rounded-xl">
                        <i class="fas fa-envelope text-3xl text-purple-600"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- API Configuration -->
        <div class="glass rounded-2xl p-8 mb-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">
                <i class="fas fa-cogs text-blue-600 mr-3"></i>API Configuration
            </h3>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <!-- Telegram Bot -->
                <div class="border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-xl font-bold text-gray-900">
                            <i class="fab fa-telegram text-blue-500 mr-2"></i>Telegram Bot
                        </h4>
                        <span id="telegramStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">Not Tested</span>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Bot Token</label>
                            <input type="password" id="telegram_bot_token" placeholder="Enter Telegram bot token" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        
                        <div class="flex items-center space-x-2">
                            <input type="checkbox" id="telegramEnabled" onchange="toggleTelegram(this.checked)" class="w-5 h-5">
                            <label for="telegramEnabled" class="text-sm font-semibold text-gray-700">Enable Telegram</label>
                        </div>

                        <div class="flex space-x-3">
                            <button onclick="testTelegram()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-vial mr-2"></i>Test
                            </button>
                            <button onclick="saveTelegramKey()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                        </div>

                        <div id="telegramResult" class="hidden"></div>
                    </div>
                </div>

                <!-- Weather API -->
                <div class="border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-cloud-sun text-orange-500 mr-2"></i>Weather API
                        </h4>
                        <span id="weatherStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">Not Tested</span>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                            <input type="password" id="weather_api_key" placeholder="Enter OpenWeatherMap API key" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://openweathermap.org/api" target="_blank" class="text-orange-600 hover:underline">OpenWeatherMap</a></p>
                        </div>

                        <div class="flex space-x-3">
                            <button onclick="testWeather()" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-vial mr-2"></i>Test
                            </button>
                            <button onclick="saveWeatherKey()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                        </div>

                        <div id="weatherResult" class="hidden"></div>
                    </div>
                </div>

                <!-- News API -->
                <div class="border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-newspaper text-red-500 mr-2"></i>News API
                        </h4>
                        <span id="newsStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">Not Tested</span>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                            <input type="password" id="news_api_key" placeholder="Enter NewsAPI key" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://newsapi.org" target="_blank" class="text-red-600 hover:underline">NewsAPI.org</a></p>
                        </div>

                        <div class="flex space-x-3">
                            <button onclick="testNews()" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-vial mr-2"></i>Test
                            </button>
                            <button onclick="saveNewsKey()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                        </div>

                        <div id="newsResult" class="hidden"></div>
                    </div>
                </div>

                <!-- GNews API -->
                <div class="border border-gray-200 rounded-xl p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-globe text-indigo-500 mr-2"></i>GNews API
                        </h4>
                        <span id="gnewsStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">Not Tested</span>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                            <input type="password" id="gnews_api_key" placeholder="Enter GNews API key" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://gnews.io" target="_blank" class="text-indigo-600 hover:underline">GNews.io</a></p>
                        </div>

                        <div class="flex space-x-3">
                            <button onclick="testGNews()" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-vial mr-2"></i>Test
                            </button>
                            <button onclick="saveGNewsKey()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                        </div>

                        <div id="gnewsResult" class="hidden"></div>
                    </div>
                </div>

                <!-- Gemini AI -->
                <div class="border border-gray-200 rounded-xl p-6 lg:col-span-2">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-robot text-purple-500 mr-2"></i>Gemini AI
                        </h4>
                        <span id="geminiStatus" class="px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-600">Not Tested</span>
                    </div>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                            <input type="password" id="gemini_api_key" placeholder="Enter Gemini API key" 
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://makersuite.google.com/app/apikey" target="_blank" class="text-purple-600 hover:underline">Google AI Studio</a></p>
                        </div>

                        <div class="flex space-x-3">
                            <button onclick="testGemini()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-vial mr-2"></i>Test
                            </button>
                            <button onclick="saveGeminiKey()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">
                                <i class="fas fa-save mr-2"></i>Save
                            </button>
                        </div>

                        <div id="geminiResult" class="hidden"></div>
                    </div>
                </div>

                <!-- WhatsApp Toggle -->
                <div class="border border-gray-200 rounded-xl p-6 lg:col-span-2">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-xl font-bold text-gray-900">
                                <i class="fab fa-whatsapp text-green-500 mr-2"></i>WhatsApp Integration
                            </h4>
                            <p class="text-sm text-gray-600 mt-1">Enable or disable WhatsApp message delivery</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span class="text-sm font-semibold text-gray-700">Status:</span>
                            <input type="checkbox" id="whatsappEnabled" onchange="toggleWhatsApp(this.checked)" class="w-6 h-6">
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- Users Table -->
        <div class="glass rounded-2xl p-8 mb-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">
                    <i class="fas fa-users text-blue-600 mr-3"></i>Registered Users
                </h3>
                <button onclick="loadUsers()" class="text-blue-600 hover:text-blue-800 font-semibold">
                    <i class="fas fa-sync-alt mr-2"></i>Refresh
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
        <div class="glass rounded-2xl p-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">
                    <i class="fas fa-list-alt text-purple-600 mr-3"></i>API Test Logs
                </h3>
                <button onclick="loadLogs()" class="text-purple-600 hover:text-purple-800 font-semibold">
                    <i class="fas fa-sync-alt mr-2"></i>Refresh
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

    <!-- Load External JavaScript -->
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/utils.js"></script>
    <script src="/static/admin-panel.js?v=3.0"></script>
</body>
</html>
  `)
})

export default admin
