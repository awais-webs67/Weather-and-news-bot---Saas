import { Hono } from 'hono'
import { Bindings } from '../types'

const dashboard = new Hono<{ Bindings: Bindings }>()

dashboard.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - WeatherNews Alert</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16 items-center">
                    <div class="flex items-center">
                        <i class="fas fa-cloud-sun text-3xl text-purple-600"></i>
                        <span class="ml-2 text-xl font-bold text-gray-800">WeatherNews Alert</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-600" id="userEmail"></span>
                        <button onclick="logout()" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Trial Status Banner -->
            <div id="trialBanner" class="hidden mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            Your free trial <span id="trialStatus"></span>
                            <a href="#pricing" class="font-medium underline">Upgrade now</a>
                        </p>
                    </div>
                </div>
            </div>

            <h1 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

            <div class="grid md:grid-cols-2 gap-6">
                <!-- Channel Setup Card -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-comments text-purple-600 mr-2"></i>
                        Messaging Channel
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Choose Your Channel
                            </label>
                            <div class="space-y-2">
                                <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input type="radio" name="channel" value="telegram" class="mr-3" checked>
                                    <i class="fab fa-telegram text-2xl text-blue-500 mr-2"></i>
                                    <span>Telegram</span>
                                    <span class="ml-auto text-xs text-green-600 font-semibold">ACTIVE</span>
                                </label>
                                <label class="flex items-center p-3 border border-gray-300 rounded-lg cursor-not-allowed opacity-50">
                                    <input type="radio" name="channel" value="whatsapp" class="mr-3" disabled>
                                    <i class="fab fa-whatsapp text-2xl text-green-500 mr-2"></i>
                                    <span>WhatsApp</span>
                                    <span class="ml-auto text-xs text-gray-500">Coming Soon</span>
                                </label>
                            </div>
                        </div>

                        <div id="telegramSetup">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                Telegram Username (optional)
                            </label>
                            <div class="flex space-x-2">
                                <input type="text" id="telegram_username" placeholder="@username" 
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            </div>
                            <p class="text-xs text-gray-500 mt-1">
                                Or start a chat with our bot: <a href="#" class="text-purple-600 hover:underline">@WeatherNewsBot</a>
                            </p>
                        </div>

                        <button onclick="saveChannel()" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                            Save Channel
                        </button>
                    </div>
                </div>

                <!-- Location Settings Card -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-map-marker-alt text-purple-600 mr-2"></i>
                        Location Settings
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                            <input type="text" id="country" placeholder="Pakistan" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                            <input type="text" id="city" placeholder="Karachi" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
                            <select id="language" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="en">English</option>
                                <option value="ur">Urdu (اردو)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Temperature Unit</label>
                            <select id="temperature_unit" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="C">Celsius (°C)</option>
                                <option value="F">Fahrenheit (°F)</option>
                            </select>
                        </div>

                        <button onclick="saveLocation()" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                            Save Location
                        </button>
                    </div>
                </div>

                <!-- Schedule Settings Card -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-clock text-purple-600 mr-2"></i>
                        Notification Schedule
                    </h2>
                    
                    <div class="space-y-4">
                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <label class="flex items-center">
                                    <input type="checkbox" id="weather_morning_enabled" checked class="mr-2">
                                    <span class="font-medium">Morning Weather</span>
                                </label>
                            </div>
                            <input type="time" id="weather_morning_time" value="07:00" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        </div>

                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <label class="flex items-center">
                                    <input type="checkbox" id="weather_night_enabled" checked class="mr-2">
                                    <span class="font-medium">Evening Weather</span>
                                </label>
                            </div>
                            <input type="time" id="weather_night_time" value="20:00" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        </div>

                        <div class="border border-gray-200 rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <label class="flex items-center">
                                    <input type="checkbox" id="news_enabled" checked class="mr-2">
                                    <span class="font-medium">Daily News</span>
                                </label>
                            </div>
                            <input type="time" id="news_time" value="09:00" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                        </div>

                        <button onclick="saveSchedules()" class="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                            Save Schedule
                        </button>
                    </div>
                </div>

                <!-- Quick Stats Card -->
                <div class="bg-white rounded-lg shadow-md p-6">
                    <h2 class="text-xl font-bold mb-4 flex items-center">
                        <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                        Account Status
                    </h2>
                    
                    <div class="space-y-4">
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span class="text-gray-600">Subscription</span>
                            <span class="font-semibold text-purple-600" id="subscriptionPlan">Free Trial</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span class="text-gray-600">Status</span>
                            <span class="font-semibold text-green-600" id="subscriptionStatus">Active</span>
                        </div>
                        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span class="text-gray-600">Trial Ends</span>
                            <span class="font-semibold" id="trialEnds">-</span>
                        </div>
                        
                        <a href="#pricing" class="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-center py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold">
                            Upgrade to Premium
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let userData = null;

            async function loadProfile() {
                try {
                    const response = await axios.get('/api/user/profile');
                    if (response.data.success) {
                        userData = response.data;
                        updateUI();
                    }
                } catch (error) {
                    if (error.response?.status === 401) {
                        window.location.href = '/auth/login';
                    }
                }
            }

            function updateUI() {
                if (!userData) return;
                
                const { user, location, schedules } = userData;
                
                document.getElementById('userEmail').textContent = user.email;
                document.getElementById('subscriptionPlan').textContent = user.subscription_plan.toUpperCase();
                document.getElementById('subscriptionStatus').textContent = user.subscription_status.toUpperCase();
                
                if (user.trial_ends_at) {
                    const trialDate = new Date(user.trial_ends_at);
                    const now = new Date();
                    const daysLeft = Math.ceil((trialDate - now) / (1000 * 60 * 60 * 24));
                    
                    document.getElementById('trialEnds').textContent = trialDate.toLocaleDateString();
                    
                    if (daysLeft > 0 && daysLeft <= 3) {
                        document.getElementById('trialBanner').classList.remove('hidden');
                        document.getElementById('trialStatus').textContent = \`ends in \${daysLeft} day\${daysLeft > 1 ? 's' : ''}.\`;
                    }
                }
                
                if (user.telegram_username) {
                    document.getElementById('telegram_username').value = user.telegram_username;
                }
                
                if (location) {
                    document.getElementById('country').value = location.country || '';
                    document.getElementById('city').value = location.city || '';
                    document.getElementById('language').value = location.language || 'en';
                    document.getElementById('temperature_unit').value = location.temperature_unit || 'C';
                }
                
                schedules.forEach(schedule => {
                    const typePrefix = schedule.schedule_type;
                    const enabledCheckbox = document.getElementById(\`\${typePrefix}_enabled\`);
                    const timeInput = document.getElementById(\`\${typePrefix}_time\`);
                    
                    if (enabledCheckbox) enabledCheckbox.checked = schedule.is_enabled === 1;
                    if (timeInput) timeInput.value = schedule.delivery_time;
                });
            }

            async function saveChannel() {
                const telegram_username = document.getElementById('telegram_username').value;
                const preferred_channel = document.querySelector('input[name="channel"]:checked').value;
                
                try {
                    await axios.post('/api/user/preferences', {
                        telegram_username,
                        preferred_channel
                    });
                    alert('Channel settings saved!');
                } catch (error) {
                    alert('Failed to save channel settings');
                }
            }

            async function saveLocation() {
                const country = document.getElementById('country').value;
                const city = document.getElementById('city').value;
                const language = document.getElementById('language').value;
                const temperature_unit = document.getElementById('temperature_unit').value;
                
                if (!country || !city) {
                    alert('Please enter country and city');
                    return;
                }
                
                try {
                    await axios.post('/api/user/preferences', {
                        country,
                        city,
                        language,
                        temperature_unit,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                    alert('Location settings saved!');
                } catch (error) {
                    alert('Failed to save location settings');
                }
            }

            async function saveSchedules() {
                const schedules = [
                    {
                        schedule_type: 'weather_morning',
                        delivery_time: document.getElementById('weather_morning_time').value,
                        is_enabled: document.getElementById('weather_morning_enabled').checked
                    },
                    {
                        schedule_type: 'weather_night',
                        delivery_time: document.getElementById('weather_night_time').value,
                        is_enabled: document.getElementById('weather_night_enabled').checked
                    },
                    {
                        schedule_type: 'news',
                        delivery_time: document.getElementById('news_time').value,
                        is_enabled: document.getElementById('news_enabled').checked
                    }
                ];
                
                try {
                    await axios.post('/api/user/schedules', { schedules });
                    alert('Schedule saved!');
                } catch (error) {
                    alert('Failed to save schedule');
                }
            }

            async function logout() {
                try {
                    await axios.post('/api/auth/logout');
                    window.location.href = '/auth/login';
                } catch (error) {
                    window.location.href = '/auth/login';
                }
            }

            // Load profile on page load
            loadProfile();
        </script>
    </body>
    </html>
  `)
})

export default dashboard
