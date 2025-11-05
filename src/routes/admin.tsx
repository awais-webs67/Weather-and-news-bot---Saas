import { Hono } from 'hono'
import { Bindings } from '../types'

const admin = new Hono<{ Bindings: Bindings }>()

// Simple admin middleware (in production, use proper authentication)
async function adminMiddleware(c: any, next: () => Promise<void>) {
  // For now, anyone can access admin
  // In production, add proper admin authentication
  await next()
}

admin.use('/*', adminMiddleware)

admin.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Panel - WeatherNews Alert</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <div class="min-h-screen">
            <!-- Header -->
            <div class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16 items-center">
                        <div class="flex items-center">
                            <i class="fas fa-user-shield text-3xl text-red-600"></i>
                            <span class="ml-2 text-xl font-bold text-gray-800">Admin Panel</span>
                        </div>
                        <div class="flex space-x-4">
                            <a href="/" class="text-gray-600 hover:text-gray-900">
                                <i class="fas fa-home"></i> Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-8">System Administration</h1>

                <div class="grid md:grid-cols-2 gap-6 mb-6">
                    <!-- Stats Card -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                            System Stats
                        </h2>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Users:</span>
                                <span class="font-semibold" id="totalUsers">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Active Trials:</span>
                                <span class="font-semibold text-yellow-600" id="activeTrials">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Premium Users:</span>
                                <span class="font-semibold text-green-600" id="premiumUsers">-</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Messages Sent Today:</span>
                                <span class="font-semibold" id="messagesSent">-</span>
                            </div>
                        </div>
                    </div>

                    <!-- WhatsApp Toggle Card -->
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-xl font-bold mb-4 flex items-center">
                            <i class="fab fa-whatsapp text-green-600 mr-2"></i>
                            WhatsApp Integration
                        </h2>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 bg-gray-50 rounded">
                                <div>
                                    <span class="font-medium">WhatsApp Service</span>
                                    <p class="text-sm text-gray-500">Enable/Disable WhatsApp messaging</p>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="whatsappToggle" class="sr-only peer" disabled>
                                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>
                            <p class="text-xs text-gray-500">
                                <i class="fas fa-info-circle"></i> Enable this when you're ready to activate WhatsApp Cloud API. 
                                Make sure to configure API credentials below first.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- API Settings -->
                <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-key text-purple-600 mr-2"></i>
                        API Configuration
                    </h2>
                    
                    <div class="space-y-4">
                        <!-- Telegram Bot Token -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Telegram Bot Token
                            </label>
                            <div class="flex space-x-2">
                                <input type="password" id="telegram_bot_token" placeholder="Enter Telegram Bot API Token" 
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <button onclick="togglePassword('telegram_bot_token')" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://t.me/BotFather" target="_blank" class="text-purple-600 hover:underline">@BotFather</a></p>
                        </div>

                        <!-- WhatsApp API Key -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                WhatsApp Cloud API Token
                            </label>
                            <input type="password" id="whatsapp_api_key" placeholder="Enter WhatsApp Cloud API Token" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://business.facebook.com/" target="_blank" class="text-purple-600 hover:underline">Meta Business</a></p>
                        </div>

                        <!-- WhatsApp Phone Number ID -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                WhatsApp Phone Number ID
                            </label>
                            <input type="text" id="whatsapp_phone_number_id" placeholder="Enter Phone Number ID" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        </div>

                        <!-- Weather API Key -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Weather API Key
                            </label>
                            <input type="password" id="weather_api_key" placeholder="Enter Weather API Key" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <p class="text-xs text-gray-500 mt-1">Get from: <a href="https://openweathermap.org/api" target="_blank" class="text-purple-600 hover:underline">OpenWeatherMap</a></p>
                        </div>

                        <!-- Trial Duration -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Free Trial Duration (days)
                            </label>
                            <input type="number" id="trial_duration_days" value="3" min="1" max="30"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        </div>

                        <button onclick="saveAPISettings()" class="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-semibold">
                            Save All Settings
                        </button>
                    </div>
                </div>

                <!-- User Management -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-users text-indigo-600 mr-2"></i>
                        User Management
                    </h2>
                    
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
                            <tbody class="bg-white divide-y divide-gray-200" id="usersList">
                                <tr>
                                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading users...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            async function loadStats() {
                try {
                    const response = await axios.get('/api/admin/stats');
                    if (response.data.success) {
                        const stats = response.data.stats;
                        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
                        document.getElementById('activeTrials').textContent = stats.activeTrials || 0;
                        document.getElementById('premiumUsers').textContent = stats.premiumUsers || 0;
                        document.getElementById('messagesSent').textContent = stats.messagesToday || 0;
                    }
                } catch (error) {
                    console.error('Failed to load stats');
                }
            }

            async function loadSettings() {
                try {
                    const response = await axios.get('/api/admin/settings');
                    if (response.data.success) {
                        const settings = response.data.settings;
                        Object.keys(settings).forEach(key => {
                            const input = document.getElementById(key);
                            if (input) {
                                if (input.type === 'checkbox') {
                                    input.checked = settings[key] === 'true';
                                } else {
                                    input.value = settings[key] || '';
                                }
                            }
                        });
                    }
                } catch (error) {
                    console.error('Failed to load settings');
                }
            }

            async function loadUsers() {
                try {
                    const response = await axios.get('/api/admin/users');
                    if (response.data.success) {
                        const users = response.data.users;
                        const tbody = document.getElementById('usersList');
                        
                        if (users.length === 0) {
                            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No users found</td></tr>';
                            return;
                        }
                        
                        tbody.innerHTML = users.map(user => \`
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">\${user.email}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">\${user.name || '-'}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <span class="px-2 py-1 text-xs rounded-full bg-\${user.subscription_plan === 'premium' ? 'green' : 'yellow'}-100 text-\${user.subscription_plan === 'premium' ? 'green' : 'yellow'}-800">
                                        \${user.subscription_plan.toUpperCase()}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm">
                                    <span class="px-2 py-1 text-xs rounded-full bg-\${user.subscription_status === 'active' ? 'green' : 'red'}-100 text-\${user.subscription_status === 'active' ? 'green' : 'red'}-800">
                                        \${user.subscription_status.toUpperCase()}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    \${new Date(user.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        \`).join('');
                    }
                } catch (error) {
                    console.error('Failed to load users');
                }
            }

            async function saveAPISettings() {
                const settings = {
                    whatsapp_enabled: document.getElementById('whatsappToggle').checked ? 'true' : 'false',
                    telegram_bot_token: document.getElementById('telegram_bot_token').value,
                    whatsapp_api_key: document.getElementById('whatsapp_api_key').value,
                    whatsapp_phone_number_id: document.getElementById('whatsapp_phone_number_id').value,
                    weather_api_key: document.getElementById('weather_api_key').value,
                    trial_duration_days: document.getElementById('trial_duration_days').value
                };
                
                try {
                    const response = await axios.post('/api/admin/settings', { settings });
                    if (response.data.success) {
                        alert('Settings saved successfully!');
                    }
                } catch (error) {
                    alert('Failed to save settings');
                }
            }

            function togglePassword(inputId) {
                const input = document.getElementById(inputId);
                input.type = input.type === 'password' ? 'text' : 'password';
            }

            // Load data on page load
            loadStats();
            loadSettings();
            loadUsers();
            
            // Refresh stats every 30 seconds
            setInterval(loadStats, 30000);
        </script>
    </body>
    </html>
  `)
})

// Admin API endpoints
admin.get('/api/stats', async (c) => {
  try {
    const totalUsers = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
    const activeTrials = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'trial' AND subscription_status = 'active'"
    ).first()
    const premiumUsers = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM users WHERE subscription_plan = 'premium' AND subscription_status = 'active'"
    ).first()
    const messagesToday = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM messages WHERE DATE(created_at) = DATE('now')"
    ).first()

    return c.json({
      success: true,
      stats: {
        totalUsers: (totalUsers as any).count || 0,
        activeTrials: (activeTrials as any).count || 0,
        premiumUsers: (premiumUsers as any).count || 0,
        messagesToday: (messagesToday as any).count || 0
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to load stats' }, 500)
  }
})

admin.get('/api/settings', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT setting_key, setting_value FROM api_settings').all()
    
    const settings: any = {}
    result.results.forEach((row: any) => {
      settings[row.setting_key] = row.setting_value
    })

    return c.json({ success: true, settings })
  } catch (error) {
    return c.json({ error: 'Failed to load settings' }, 500)
  }
})

admin.post('/api/settings', async (c) => {
  try {
    const { settings } = await c.req.json()
    
    for (const [key, value] of Object.entries(settings)) {
      await c.env.DB.prepare(`
        INSERT INTO api_settings (setting_key, setting_value, is_enabled)
        VALUES (?, ?, 1)
        ON CONFLICT(setting_key) DO UPDATE SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      `).bind(key, value, value).run()
    }

    return c.json({ success: true, message: 'Settings saved' })
  } catch (error) {
    return c.json({ error: 'Failed to save settings' }, 500)
  }
})

admin.get('/api/users', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT id, email, name, subscription_plan, subscription_status, created_at FROM users ORDER BY created_at DESC LIMIT 100'
    ).all()

    return c.json({ success: true, users: result.results })
  } catch (error) {
    return c.json({ error: 'Failed to load users' }, 500)
  }
})

export default admin
