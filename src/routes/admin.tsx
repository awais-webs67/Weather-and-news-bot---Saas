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
    <title>AlertFlow Admin - Professional Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            min-height: 100vh;
            color: #f1f5f9;
        }
        
        .sidebar {
            background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
            border-right: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .card {
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.1);
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
            transition: all 0.3s ease;
        }
        
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            border-color: rgba(148, 163, 184, 0.2);
        }
        
        .stat-card {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
            border: 1px solid rgba(59, 130, 246, 0.2);
        }
        
        .stat-card:hover {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
            border-color: rgba(59, 130, 246, 0.3);
        }
        
        .api-card {
            background: rgba(15, 23, 42, 0.6);
            border-left: 3px solid transparent;
            transition: all 0.3s ease;
        }
        
        .api-card:hover {
            border-left-color: #3b82f6;
            transform: translateX(4px);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
        }
        
        .btn-primary:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }
        
        .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        }
        
        .btn-success:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.6);
        }
        
        input, select, textarea {
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.2);
            color: #f1f5f9;
        }
        
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        input::placeholder {
            color: #64748b;
        }
        
        table {
            background: rgba(15, 23, 42, 0.4);
        }
        
        tbody tr:hover {
            background: rgba(59, 130, 246, 0.05);
        }
        
        .modal-backdrop {
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
        }
        
        .toast {
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.5);
        }
        
        ::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
        }
    </style>
</head>
<body class="antialiased">
    
    <!-- Top Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 h-16 flex items-center px-6">
        <div class="flex items-center justify-between w-full">
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-3">
                    <div class="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                        <i class="fas fa-bolt text-white text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-lg font-bold text-white">AlertFlow</h1>
                        <p class="text-xs text-slate-400">Admin Dashboard</p>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center space-x-4">
                <button onclick="refreshStats()" class="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold transition">
                    <i class="fas fa-sync-alt mr-2"></i>Refresh
                </button>
                <button onclick="logout()" class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition">
                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                </button>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <div class="pt-20 px-6 pb-8 max-w-7xl mx-auto">
        
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Users -->
            <div class="stat-card card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="bg-blue-500/20 p-3 rounded-lg">
                        <i class="fas fa-users text-2xl text-blue-400"></i>
                    </div>
                    <i class="fas fa-arrow-up text-green-400 text-sm"></i>
                </div>
                <h3 class="text-3xl font-bold text-white mb-1" id="totalUsers">0</h3>
                <p class="text-sm text-slate-400 font-medium">Total Users</p>
            </div>

            <!-- Active Trials -->
            <div class="stat-card card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="bg-yellow-500/20 p-3 rounded-lg">
                        <i class="fas fa-clock text-2xl text-yellow-400"></i>
                    </div>
                    <i class="fas fa-minus text-slate-400 text-sm"></i>
                </div>
                <h3 class="text-3xl font-bold text-white mb-1" id="activeTrials">0</h3>
                <p class="text-sm text-slate-400 font-medium">Active Trials</p>
            </div>

            <!-- Premium Users -->
            <div class="stat-card card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="bg-purple-500/20 p-3 rounded-lg">
                        <i class="fas fa-crown text-2xl text-purple-400"></i>
                    </div>
                    <i class="fas fa-arrow-up text-green-400 text-sm"></i>
                </div>
                <h3 class="text-3xl font-bold text-white mb-1" id="premiumUsers">0</h3>
                <p class="text-sm text-slate-400 font-medium">Premium Users</p>
            </div>

            <!-- Messages Today -->
            <div class="stat-card card rounded-xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="bg-green-500/20 p-3 rounded-lg">
                        <i class="fas fa-paper-plane text-2xl text-green-400"></i>
                    </div>
                    <i class="fas fa-arrow-up text-green-400 text-sm"></i>
                </div>
                <h3 class="text-3xl font-bold text-white mb-1" id="messagesToday">0</h3>
                <p class="text-sm text-slate-400 font-medium">Messages Today</p>
            </div>
        </div>

        <!-- API Configuration Section -->
        <div class="card rounded-xl p-8 mb-8">
            <h2 class="text-2xl font-bold text-white mb-6">
                <i class="fas fa-plug text-blue-400 mr-3"></i>API Configuration
            </h2>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <!-- Telegram Bot -->
                <div class="api-card rounded-lg p-5">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="bg-blue-500/20 p-2.5 rounded-lg">
                            <i class="fab fa-telegram text-xl text-blue-400"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white">Telegram Bot</h4>
                            <p class="text-xs text-slate-400">Bot API Token</p>
                        </div>
                    </div>
                    
                    <input type="text" id="telegram_bot_token" placeholder="Enter bot token" 
                        class="w-full px-4 py-2.5 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testTelegram()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveTelegramKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- Weather API -->
                <div class="api-card rounded-lg p-5">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="bg-orange-500/20 p-2.5 rounded-lg">
                            <i class="fas fa-cloud-sun text-xl text-orange-400"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white">Weather API</h4>
                            <p class="text-xs text-slate-400">OpenWeatherMap Key</p>
                        </div>
                    </div>
                    
                    <input type="text" id="weather_api_key" placeholder="Enter API key" 
                        class="w-full px-4 py-2.5 rounded-lg mb-3 text-sm">

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
                <div class="api-card rounded-lg p-5">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="bg-red-500/20 p-2.5 rounded-lg">
                            <i class="fas fa-newspaper text-xl text-red-400"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white">News API</h4>
                            <p class="text-xs text-slate-400">NewsAPI.org Key</p>
                        </div>
                    </div>
                    
                    <input type="text" id="news_api_key" placeholder="Enter API key" 
                        class="w-full px-4 py-2.5 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testNews()" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveNewsKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- GNews API -->
                <div class="api-card rounded-lg p-5">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="bg-pink-500/20 p-2.5 rounded-lg">
                            <i class="fas fa-globe text-xl text-pink-400"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white">GNews API</h4>
                            <p class="text-xs text-slate-400">GNews.io Key</p>
                        </div>
                    </div>
                    
                    <input type="text" id="gnews_api_key" placeholder="Enter API key" 
                        class="w-full px-4 py-2.5 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testGNews()" class="flex-1 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveGNewsKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- Gemini AI -->
                <div class="api-card rounded-lg p-5">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="bg-purple-500/20 p-2.5 rounded-lg">
                            <i class="fas fa-brain text-xl text-purple-400"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white">Gemini AI</h4>
                            <p class="text-xs text-slate-400">Google AI Key</p>
                        </div>
                    </div>
                    
                    <input type="text" id="gemini_api_key" placeholder="Enter API key" 
                        class="w-full px-4 py-2.5 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2">
                        <button onclick="testGemini()" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveGeminiKey()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>
                </div>

                <!-- WhatsApp Cloud API -->
                <div class="api-card rounded-lg p-5">
                    <div class="flex items-center space-x-3 mb-4">
                        <div class="bg-green-500/20 p-2.5 rounded-lg">
                            <i class="fab fa-whatsapp text-xl text-green-400"></i>
                        </div>
                        <div>
                            <h4 class="text-base font-bold text-white">WhatsApp Business</h4>
                            <p class="text-xs text-slate-400">Meta Cloud API</p>
                        </div>
                    </div>
                    
                    <input type="text" id="whatsapp_phone_number_id" placeholder="Phone Number ID" 
                        class="w-full px-4 py-2.5 rounded-lg mb-2 text-sm">
                    <input type="text" id="whatsapp_business_account_id" placeholder="Business Account ID" 
                        class="w-full px-4 py-2.5 rounded-lg mb-2 text-sm">
                    <input type="text" id="whatsapp_access_token" placeholder="Access Token" 
                        class="w-full px-4 py-2.5 rounded-lg mb-3 text-sm">

                    <div class="flex space-x-2 mb-3">
                        <button onclick="testWhatsApp()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-vial mr-2"></i>Test
                        </button>
                        <button onclick="saveWhatsAppSettings()" class="btn-success text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition">
                            <i class="fas fa-save mr-2"></i>Save
                        </button>
                    </div>

                    <!-- Enable/Disable Toggle -->
                    <div class="flex items-center justify-between pt-3 border-t border-slate-700">
                        <span class="text-sm text-slate-300 font-medium">Enable WhatsApp</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="whatsappEnabled" onchange="toggleWhatsApp(this.checked)" class="sr-only peer">
                            <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>

            </div>
        </div>

        <!-- License Key Management -->
        <div class="card rounded-xl p-8 mb-8">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-key text-yellow-400 mr-3"></i>License Key Management
                </h2>
                <button onclick="showGenerateLicenseModal()" class="btn-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
                    <i class="fas fa-plus mr-2"></i>Generate New Key
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b border-slate-700">
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">License Key</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Plan</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Duration</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Used By</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Created</th>
                        </tr>
                    </thead>
                    <tbody id="licenseKeysTableBody" class="divide-y divide-slate-700/50">
                        <tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">Loading license keys...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- User Management -->
        <div class="card rounded-xl p-8 mb-8">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-users text-blue-400 mr-3"></i>User Management
                </h2>
                <button onclick="showAddUserModal()" class="btn-primary text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
                    <i class="fas fa-plus mr-2"></i>Add User
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b border-slate-700">
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Email</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Name</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Plan</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Joined</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody" class="divide-y divide-slate-700/50">
                        <tr><td colspan="6" class="px-6 py-8 text-center text-slate-400">Loading users...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- API Logs -->
        <div class="card rounded-xl p-8">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-white">
                    <i class="fas fa-list-alt text-purple-400 mr-3"></i>API Activity Logs
                </h2>
                <button onclick="loadLogs()" class="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                    <i class="fas fa-sync-alt mr-2"></i>Refresh
                </button>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr class="border-b border-slate-700">
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Timestamp</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">API</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Action</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-4 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Details</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody" class="divide-y divide-slate-700/50">
                        <tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Loading logs...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <!-- User Modal -->
    <div id="userModal" class="fixed inset-0 z-50 hidden flex items-center justify-center">
        <div class="modal-backdrop absolute inset-0" onclick="closeUserModal()"></div>
        <div class="card rounded-xl p-8 max-w-md w-full mx-4 relative z-10 shadow-2xl">
            <h3 id="userModalTitle" class="text-2xl font-bold text-white mb-6">Add User</h3>
            
            <form id="userForm" onsubmit="event.preventDefault(); saveUser();">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Email *</label>
                        <input type="email" id="userEmail" required 
                            class="w-full px-4 py-2.5 rounded-lg text-sm">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Name</label>
                        <input type="text" id="userName" 
                            class="w-full px-4 py-2.5 rounded-lg text-sm">
                    </div>
                    
                    <div id="userPasswordGroup">
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Password *</label>
                        <input type="password" id="userPassword" 
                            class="w-full px-4 py-2.5 rounded-lg text-sm"
                            placeholder="Enter password">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Subscription Plan</label>
                        <select id="userPlan" class="w-full px-4 py-2.5 rounded-lg text-sm">
                            <option value="free">Free</option>
                            <option value="trial">Trial</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                        <select id="userStatus" class="w-full px-4 py-2.5 rounded-lg text-sm">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button type="submit" class="flex-1 btn-primary text-white px-6 py-3 rounded-lg font-semibold">
                        <i class="fas fa-save mr-2"></i>Save
                    </button>
                    <button type="button" onclick="closeUserModal()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- License Key Generation Modal -->
    <div id="licenseModal" class="fixed inset-0 z-50 hidden flex items-center justify-center">
        <div class="modal-backdrop absolute inset-0" onclick="closeLicenseModal()"></div>
        <div class="card rounded-xl p-8 max-w-md w-full mx-4 relative z-10 shadow-2xl">
            <h3 class="text-2xl font-bold text-white mb-6">Generate License Key</h3>
            
            <form onsubmit="event.preventDefault(); generateLicenseKey();">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Plan Type</label>
                        <select id="licensePlanType" class="w-full px-4 py-2.5 rounded-lg text-sm">
                            <option value="trial">Trial (3 days)</option>
                            <option value="monthly">Monthly Premium</option>
                            <option value="yearly">Yearly Premium</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-slate-300 mb-2">Duration (Days)</label>
                        <input type="number" id="licenseDuration" 
                            class="w-full px-4 py-2.5 rounded-lg text-sm"
                            placeholder="e.g., 30, 90, 365"
                            value="30"
                            min="1"
                            required>
                    </div>

                    <!-- Generated Key Display -->
                    <div id="generatedKeyDisplay" class="hidden mt-4 p-4 bg-slate-900 rounded-lg border border-green-500">
                        <p class="text-xs text-slate-400 mb-2">Generated License Key:</p>
                        <div class="flex items-center space-x-2">
                            <code id="generatedKey" class="flex-1 text-sm text-green-400 font-mono break-all"></code>
                            <button type="button" onclick="copyLicenseKey()" class="text-green-400 hover:text-green-300">
                                <i class="fas fa-copy"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3 mt-6">
                    <button type="submit" class="flex-1 btn-primary text-white px-6 py-3 rounded-lg font-semibold">
                        <i class="fas fa-key mr-2"></i>Generate
                    </button>
                    <button type="button" onclick="closeLicenseModal()" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition">
                        Close
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/admin-v5.js?v=5.0"></script>
</body>
</html>
  `)
})

export default admin
