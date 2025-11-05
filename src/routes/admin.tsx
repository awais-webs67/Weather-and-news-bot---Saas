import { Hono } from 'hono'
import { Bindings } from '../types'
import { getCookie, verifySessionToken } from '../lib/utils'

const admin = new Hono<{ Bindings: Bindings }>()

async function adminAuthMiddleware(c: any, next: () => Promise<void>) {
  const sessionToken = getCookie(c.req.header('cookie'), 'admin_session')
  if (!sessionToken) return c.redirect('/admin')
  
  const payload = verifySessionToken(sessionToken)
  if (!payload || !payload.userId) return c.redirect('/admin')
  
  const admin = await c.env.DB.prepare(
    'SELECT * FROM admin_users WHERE id = ? AND is_active = 1'
  ).bind(payload.userId).first()
  
  if (!admin) return c.redirect('/admin')
  await next()
}

admin.get('/', async (c) => {
  const sessionToken = getCookie(c.req.header('cookie'), 'admin_session')
  if (sessionToken) {
    const payload = verifySessionToken(sessionToken)
    if (payload && payload.userId) {
      return c.redirect('/admin/dashboard')
    }
  }
  
  try {
    const loginHTML = await Bun.file('public/static/admin-login.html').text()
    return c.html(loginHTML)
  } catch {
    return c.redirect('/static/admin-login.html')
  }
})

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
    <title>AlertFlow Admin Panel</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .glass-effect {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stat-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        }
        
        .api-card {
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
        }
        
        .api-card:hover {
            border-left-color: #667eea;
            transform: translateX(4px);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .btn-success:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        }
        
        .toast {
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 500;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        .toast-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        
        .toast-error {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
        }
        
        .toast-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
        }
        
        .animate-slide-in {
            animation: slideIn 0.3s ease-out;
        }
        
        .animate-slide-out {
            animation: slideOut 0.3s ease-in;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        
        .modal-backdrop {
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .nav-gradient {
            background: linear-gradient(to right, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body>

    <!-- Navigation -->
    <nav class="nav-gradient shadow-2xl">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <div class="bg-white p-2.5 rounded-xl shadow-lg">
                        <i class="fas fa-shield-alt text-2xl text-purple-600"></i>
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold text-white">AlertFlow</h1>
                        <p class="text-xs text-purple-100">Admin Control Panel</p>
                    </div>
                </div>
                
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-white hover:text-purple-100 transition">
                        <i class="fas fa-home mr-2"></i>Home
                    </a>
                    <button onclick="logout()" class="text-white hover:text-purple-100 transition">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-6 py-8">
        
        <!-- Page Header -->
        <div class="flex justify-between items-center mb-8">
            <div>
                <h2 class="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
                <p class="text-purple-100">Monitor and manage your system</p>
            </div>
            <button onclick="refreshStats()" class="btn-primary text-white px-6 py-3 rounded-xl font-semibold shadow-lg">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
            </button>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="stat-card glass-effect rounded-2xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold mb-1">Total Users</p>
                        <p class="text-4xl font-bold text-gray-900" id="totalUsers">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-blue-400 to-blue-600 p-4 rounded-2xl">
                        <i class="fas fa-users text-3xl text-white"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card glass-effect rounded-2xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold mb-1">Active Trials</p>
                        <p class="text-4xl font-bold text-gray-900" id="activeTrials">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-yellow-400 to-yellow-600 p-4 rounded-2xl">
                        <i class="fas fa-clock text-3xl text-white"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card glass-effect rounded-2xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold mb-1">Premium Users</p>
                        <p class="text-4xl font-bold text-gray-900" id="premiumUsers">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-400 to-green-600 p-4 rounded-2xl">
                        <i class="fas fa-crown text-3xl text-white"></i>
                    </div>
                </div>
            </div>

            <div class="stat-card glass-effect rounded-2xl p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-semibold mb-1">Messages Today</p>
                        <p class="text-4xl font-bold text-gray-900" id="messagesToday">0</p>
                    </div>
                    <div class="bg-gradient-to-br from-purple-400 to-purple-600 p-4 rounded-2xl">
                        <i class="fas fa-envelope text-3xl text-white"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- API Configuration -->
        <div class="glass-effect rounded-2xl p-8 mb-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">
                <i class="fas fa-cogs text-purple-600 mr-3"></i>API Configuration
            </h3>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <!-- Telegram -->
                <div class="api-card bg-white rounded-xl p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-blue-100 p-3 rounded-lg">
                                <i class="fab fa-telegram text-2xl text-blue-600"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900">Telegram Bot</h4>
                                <p class="text-xs text-gray-500">Messaging service</p>
                            </div>
                        </div>
                        <span id="telegramStatus" class="text-sm text-gray-500">Not tested</span>
                    </div>
                    
                    <input type="password" id="telegram_bot_token" placeholder="Bot token" 
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 text-sm">
                    
                    <div class="flex items-center mb-3">
                        <input type="checkbox" id="telegramEnabled" onchange="toggleTelegram(this.checked)" class="w-4 h-4 mr-2">
                        <label class="text-sm text-gray-700">Enable Telegram</label>
                    </div>

                    <div class="flex space-x-2">
                        <button onclick="testTelegram()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveTelegramKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- Weather -->
                <div class="api-card bg-white rounded-xl p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-orange-100 p-3 rounded-lg">
                                <i class="fas fa-cloud-sun text-2xl text-orange-600"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900">Weather API</h4>
                                <p class="text-xs text-gray-500">OpenWeatherMap</p>
                            </div>
                        </div>
                        <span id="weatherStatus" class="text-sm text-gray-500">Not tested</span>
                    </div>
                    
                    <input type="password" id="weather_api_key" placeholder="API key" 
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testWeather()" class="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveWeatherKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- News API -->
                <div class="api-card bg-white rounded-xl p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-red-100 p-3 rounded-lg">
                                <i class="fas fa-newspaper text-2xl text-red-600"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900">News API</h4>
                                <p class="text-xs text-gray-500">NewsAPI.org</p>
                            </div>
                        </div>
                        <span id="newsStatus" class="text-sm text-gray-500">Not tested</span>
                    </div>
                    
                    <input type="password" id="news_api_key" placeholder="API key" 
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testNews()" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveNewsKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- GNews -->
                <div class="api-card bg-white rounded-xl p-6 shadow-sm">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-indigo-100 p-3 rounded-lg">
                                <i class="fas fa-globe text-2xl text-indigo-600"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900">GNews API</h4>
                                <p class="text-xs text-gray-500">GNews.io</p>
                            </div>
                        </div>
                        <span id="gnewsStatus" class="text-sm text-gray-500">Not tested</span>
                    </div>
                    
                    <input type="password" id="gnews_api_key" placeholder="API key" 
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testGNews()" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveGNewsKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- Gemini AI -->
                <div class="api-card bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="bg-purple-100 p-3 rounded-lg">
                                <i class="fas fa-robot text-2xl text-purple-600"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900">Gemini AI</h4>
                                <p class="text-xs text-gray-500">Google AI</p>
                            </div>
                        </div>
                        <span id="geminiStatus" class="text-sm text-gray-500">Not tested</span>
                    </div>
                    
                    <input type="password" id="gemini_api_key" placeholder="API key" 
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testGemini()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveGeminiKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- WhatsApp Toggle -->
                <div class="api-card bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="bg-green-100 p-3 rounded-lg">
                                <i class="fab fa-whatsapp text-2xl text-green-600"></i>
                            </div>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900">WhatsApp Integration</h4>
                                <p class="text-xs text-gray-500">Enable or disable WhatsApp messaging</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="whatsappEnabled" onchange="toggleWhatsApp(this.checked)" class="sr-only peer">
                            <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>

            </div>
        </div>

        <!-- Users Management -->
        <div class="glass-effect rounded-2xl p-8 mb-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">
                    <i class="fas fa-users text-blue-600 mr-3"></i>User Management
                </h3>
                <div class="flex space-x-3">
                    <button onclick="showAddUserModal()" class="btn-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg">
                        <i class="fas fa-plus mr-2"></i>Add User
                    </button>
                    <button onclick="loadUsers()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                        <i class="fas fa-sync-alt mr-2"></i>Refresh
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b-2 border-gray-200">
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Plan</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Joined</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody" class="divide-y divide-gray-100">
                        <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- API Logs -->
        <div class="glass-effect rounded-2xl p-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">
                    <i class="fas fa-list-alt text-purple-600 mr-3"></i>API Activity Logs
                </h3>
                <button onclick="loadLogs()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition">
                    <i class="fas fa-sync-alt mr-2"></i>Refresh
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b-2 border-gray-200">
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Timestamp</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">API</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody" class="divide-y divide-gray-100">
                        <tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Loading logs...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <!-- User Modal -->
    <div id="userModal" class="fixed inset-0 z-50 hidden flex items-center justify-center">
        <div class="modal-backdrop absolute inset-0" onclick="closeUserModal()"></div>
        <div class="glass-effect rounded-2xl p-8 max-w-md w-full mx-4 relative z-10 shadow-2xl">
            <h3 id="userModalTitle" class="text-2xl font-bold text-gray-900 mb-6">Add User</h3>
            
            <form id="userForm" onsubmit="event.preventDefault(); saveUser();">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                        <input type="email" id="userEmail" required 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                        <input type="text" id="userName" 
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Subscription Plan</label>
                        <select id="userPlan" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm">
                            <option value="free">Free</option>
                            <option value="trial">Trial</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                        <select id="userStatus" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button type="submit" class="flex-1 btn-primary text-white px-6 py-3 rounded-xl font-semibold">
                        <i class="fas fa-save mr-2"></i>Save
                    </button>
                    <button type="button" onclick="closeUserModal()" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/admin-v4.js?v=4.0"></script>
</body>
</html>
  `)
})

export default admin
