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
    <title>Admin Dashboard - WeatherNews Alert</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg border-b-4 border-red-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center space-x-3">
                    <div class="bg-gradient-to-br from-red-600 to-orange-600 p-2 rounded-lg">
                        <i class="fas fa-user-shield text-2xl text-white"></i>
                    </div>
                    <span class="text-xl font-bold text-gray-800">Admin Dashboard</span>
                </div>
                <div class="flex items-center space-x-4">
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
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-4xl font-bold gradient-text">System Administration</h1>
            <div class="flex space-x-3">
                <button onclick="refreshStats()" class="btn-secondary">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="grid lg:grid-cols-4 gap-6 mb-8">
            <div class="glass-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-sm">Total Users</p>
                        <p class="text-3xl font-bold" id="totalUsers">0</p>
                    </div>
                    <i class="fas fa-users text-5xl text-blue-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-yellow-100 text-sm">Active Trials</p>
                        <p class="text-3xl font-bold" id="activeTrials">0</p>
                    </div>
                    <i class="fas fa-clock text-5xl text-yellow-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-100 text-sm">Premium Users</p>
                        <p class="text-3xl font-bold" id="premiumUsers">0</p>
                    </div>
                    <i class="fas fa-crown text-5xl text-green-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-100 text-sm">Messages Today</p>
                        <p class="text-3xl font-bold" id="messagesToday">0</p>
                    </div>
                    <i class="fas fa-envelope text-5xl text-purple-200"></i>
                </div>
            </div>
        </div>

        <!-- API Configuration & Testing -->
        <div class="grid lg:grid-cols-2 gap-6 mb-8">
            <!-- Telegram API -->
            <div class="glass-card">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold flex items-center text-blue-600">
                        <i class="fab fa-telegram text-3xl mr-3"></i>
                        Telegram Bot API
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

                    <div class="flex space-x-3">
                        <button onclick="testTelegram()" class="btn-primary flex-1">
                            <i class="fas fa-vial mr-2"></i> Test Connection
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
        </div>

        <!-- WhatsApp Toggle -->
        <div class="glass-card mb-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <i class="fab fa-whatsapp text-5xl text-green-600"></i>
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">WhatsApp Integration</h3>
                        <p class="text-sm text-gray-600">Enable WhatsApp Cloud API for message delivery</p>
                    </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="whatsappToggle" class="sr-only peer" disabled>
                    <div class="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                </label>
            </div>
            <p class="text-xs text-gray-500 mt-4">
                <i class="fas fa-info-circle"></i> Configure WhatsApp credentials in settings before enabling
            </p>
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
        // Load initial data
        async function init() {
            await loadStats();
            await loadSettings();
            await loadLogs();
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
                    resultDiv.innerHTML = \`
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                            <div>
                                <p class="font-semibold text-green-800">✅ Connection Successful!</p>
                                <p class="text-sm text-green-700 mt-1">Bot Name: <strong>\${data.bot_name}</strong></p>
                                <p class="text-sm text-green-700">Username: @\${data.username}</p>
                                <p class="text-sm text-green-700">Bot ID: \${data.bot_id}</p>
                            </div>
                        </div>
                    \`;
                    statusBadge.textContent = '✅ Working';
                    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                    showToast('Telegram bot connected successfully!', 'success');
                } else {
                    throw new Error(response.data.error || 'Test failed');
                }
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
                resultDiv.innerHTML = \`
                    <div class="flex items-start">
                        <i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i>
                        <div>
                            <p class="font-semibold text-red-800">❌ Connection Failed</p>
                            <p class="text-sm text-red-700 mt-1">\${error.response?.data?.error || error.message}</p>
                        </div>
                    </div>
                \`;
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
                    resultDiv.innerHTML = \`
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                            <div>
                                <p class="font-semibold text-green-800">✅ Connection Successful!</p>
                                <p class="text-sm text-green-700 mt-1">Test City: <strong>\${data.city}, \${data.country}</strong></p>
                                <p class="text-sm text-green-700">Temperature: \${data.temperature}°C</p>
                                <p class="text-sm text-green-700">Condition: \${data.description}</p>
                            </div>
                        </div>
                    \`;
                    statusBadge.textContent = '✅ Working';
                    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
                    showToast('Weather API connected successfully!', 'success');
                } else {
                    throw new Error(response.data.error || 'Test failed');
                }
                
                resultDiv.classList.remove('hidden');
            } catch (error) {
                resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200';
                resultDiv.innerHTML = \`
                    <div class="flex items-start">
                        <i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i>
                        <div>
                            <p class="font-semibold text-red-800">❌ Connection Failed</p>
                            <p class="text-sm text-red-700 mt-1">\${error.response?.data?.error || error.message}</p>
                            <p class="text-xs text-red-600 mt-2">Get a valid key from: <a href="https://openweathermap.org/api" target="_blank" class="underline">OpenWeatherMap</a></p>
                        </div>
                    </div>
                \`;
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
                    
                    tbody.innerHTML = logs.map(log => \`
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                \${new Date(log.created_at).toLocaleString()}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 py-1 rounded-full bg-\${log.api_name === 'telegram' ? 'blue' : 'orange'}-100 text-\${log.api_name === 'telegram' ? 'blue' : 'orange'}-800">
                                    \${log.api_name.toUpperCase()}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                \${log.action}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm">
                                <span class="px-2 py-1 rounded-full bg-\${log.success ? 'green' : 'red'}-100 text-\${log.success ? 'green' : 'red'}-800">
                                    \${log.success ? '✅ Success' : '❌ Failed'}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-600">
                                \${log.success ? (log.details || 'OK') : (log.error_message || 'Error')}
                            </td>
                        </tr>
                    \`).join('');
                }
            } catch (error) {
                console.error('Failed to load logs');
            }
        }

        function refreshStats() {
            loadStats();
            showToast('Stats refreshed', 'info');
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

        // Initialize
        init();
    </script>
</body>
</html>
  `)
})

export default admin
