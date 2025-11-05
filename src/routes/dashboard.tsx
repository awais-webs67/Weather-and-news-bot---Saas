import { Hono } from 'hono'
import { Bindings } from '../types'
import { getCookie, verifySessionToken } from '../lib/utils'

const dashboard = new Hono<{ Bindings: Bindings }>()

// Dashboard - check authentication
dashboard.get('/', async (c) => {
  // Check if user is logged in
  const sessionToken = getCookie(c.req.header('cookie'), 'session')
  
  if (!sessionToken) {
    return c.redirect('/auth/login')
  }
  
  const payload = verifySessionToken(sessionToken)
  if (!payload || !payload.userId) {
    return c.redirect('/auth/login')
  }
  
  // User is authenticated, show full dashboard
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - AlertFlow</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg border-b-2 border-teal-500">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-20 items-center">
                <div class="flex items-center space-x-3">
                    <div class="relative">
                        <div class="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl blur opacity-60"></div>
                        <div class="relative bg-gradient-to-br from-teal-500 to-blue-600 p-2.5 rounded-xl">
                            <i class="fas fa-bolt text-2xl text-white"></i>
                        </div>
                    </div>
                    <span class="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent hidden sm:inline">AlertFlow</span>
                </div>
                <!-- Desktop Navigation -->
                <div class="hidden md:flex items-center space-x-4">
                    <div id="userClock" class="text-sm font-mono bg-purple-50 px-3 py-1 rounded-lg text-purple-700"></div>
                    <a href="/" class="nav-link text-gray-600">
                        <i class="fas fa-home"></i> <span class="hidden lg:inline">Home</span>
                    </a>
                    <!-- Subscription Dropdown -->
                    <div class="relative subscription-dropdown">
                        <button onclick="toggleSubscriptionMenu()" class="nav-link text-purple-600 hover:bg-purple-50 flex items-center">
                            <i class="fas fa-crown mr-1"></i>
                            <span class="hidden lg:inline" id="headerPlan">Free Trial</span>
                            <i class="fas fa-chevron-down ml-1 text-xs"></i>
                        </button>
                        <div id="subscriptionMenu" class="hidden absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border-2 border-purple-200 z-50">
                            <div class="p-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-t-xl">
                                <h3 class="font-bold text-lg mb-1">Your Subscription</h3>
                                <p class="text-sm opacity-90">Manage your plan and billing</p>
                            </div>
                            <div class="p-4">
                                <div class="bg-gradient-to-br from-teal-500 to-teal-600 text-white p-4 rounded-lg mb-4">
                                    <p class="text-teal-100 text-xs mb-1">Current Plan</p>
                                    <p class="text-2xl font-bold" id="dropdownPlan">Free Trial</p>
                                    <p class="text-sm text-teal-100 mt-2">Expires: <span id="dropdownExpiry">-</span></p>
                                    <p class="text-xs text-teal-100 mt-1">Status: <span id="dropdownStatus">Active</span></p>
                                </div>
                                
                                <div class="mb-4">
                                    <label class="block text-xs font-semibold text-gray-600 mb-2">Activate License Key</label>
                                    <div class="flex space-x-2">
                                        <input type="text" id="headerLicenseInput" placeholder="XXXX-XXXX-XXXX-XXXX" 
                                            class="input-field text-sm flex-1" maxlength="19">
                                        <button onclick="activateLicenseFromHeader()" class="btn-primary text-sm px-4">
                                            Activate
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="space-y-2">
                                    <div class="border rounded-lg p-3">
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="font-semibold">Monthly</span>
                                            <span class="text-lg font-bold">$9.99<span class="text-sm text-gray-500">/mo</span></span>
                                        </div>
                                        <button onclick="requestPaymentFromHeader('monthly')" class="btn-primary w-full text-sm">
                                            <i class="fab fa-whatsapp mr-1"></i> Pay via WhatsApp
                                        </button>
                                    </div>
                                    
                                    <div class="border-2 border-teal-500 bg-teal-50 rounded-lg p-3 relative">
                                        <div class="absolute -top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                            SAVE 20%
                                        </div>
                                        <div class="flex justify-between items-center mb-2">
                                            <span class="font-semibold">Yearly</span>
                                            <span class="text-lg font-bold">$95.99<span class="text-sm text-gray-500">/yr</span></span>
                                        </div>
                                        <button onclick="requestPaymentFromHeader('yearly')" class="btn-primary w-full text-sm">
                                            <i class="fab fa-whatsapp mr-1"></i> Pay via WhatsApp
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <span class="text-sm text-gray-600" id="userEmail"></span>
                    <button onclick="logout()" class="nav-link text-red-600 hover:bg-red-50">
                        <i class="fas fa-sign-out-alt"></i> <span class="hidden lg:inline">Logout</span>
                    </button>
                </div>
                <!-- Mobile Hamburger -->
                <button onclick="toggleMobileMenu()" class="md:hidden p-2 rounded-lg hover:bg-gray-100">
                    <i class="fas fa-bars text-2xl text-gray-600"></i>
                </button>
            </div>
            <!-- Mobile Menu -->
            <div id="mobileMenu" class="hidden md:hidden pb-4">
                <div class="flex flex-col space-y-2">
                    <div id="userClockMobile" class="text-sm font-mono bg-purple-50 px-3 py-2 rounded-lg text-purple-700 text-center"></div>
                    <span class="text-sm text-gray-600 px-3 py-2" id="userEmailMobile"></span>
                    <a href="/" class="nav-link text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
                        <i class="fas fa-home mr-2"></i> Home
                    </a>
                    <button onclick="toggleSubscriptionMenu()" class="nav-link text-purple-600 px-3 py-2 rounded-lg hover:bg-purple-50 text-left flex items-center justify-between">
                        <span><i class="fas fa-crown mr-2"></i> Subscription</span>
                        <span class="text-xs" id="mobilePlanBadge">Free</span>
                    </button>
                    <button onclick="logout()" class="nav-link text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 text-left">
                        <i class="fas fa-sign-out-alt mr-2"></i> Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Trial Status Banner -->
        <div id="trialBanner" class="hidden mb-6 glass-card bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-2xl mr-4"></i>
                <div>
                    <p class="font-semibold text-gray-800">
                        Your free trial <span id="trialStatus"></span>
                    </p>
                    <a href="#pricing" class="text-sm text-purple-600 hover:underline font-medium">
                        Upgrade to Premium →
                    </a>
                </div>
            </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <h1 class="text-4xl font-bold text-gray-900">Dashboard</h1>
            <button onclick="testNotification()" class="btn-primary w-full sm:w-auto">
                <i class="fas fa-paper-plane mr-2"></i> 
                <span class="hidden sm:inline">Test Notification</span>
                <span class="sm:hidden">Test Message</span>
            </button>
        </div>

        <div class="grid lg:grid-cols-3 gap-6 mb-8">
            <!-- Stats Cards -->
            <div class="glass-card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-100 text-sm">Subscription</p>
                        <p class="text-2xl font-bold" id="subscriptionPlan">Free Trial</p>
                    </div>
                    <i class="fas fa-crown text-4xl text-blue-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-100 text-sm">Status</p>
                        <p class="text-2xl font-bold" id="subscriptionStatus">Active</p>
                    </div>
                    <i class="fas fa-check-circle text-4xl text-green-200"></i>
                </div>
            </div>
            
            <div class="glass-card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-purple-100 text-sm">Trial Ends</p>
                        <p class="text-2xl font-bold" id="trialEnds">-</p>
                    </div>
                    <i class="fas fa-calendar text-4xl text-purple-200"></i>
                </div>
            </div>
        </div>

        <div class="grid lg:grid-cols-2 gap-6">
            <!-- Channel Setup Card -->
            <div class="glass-card">
                <h2 class="text-2xl font-bold mb-6 flex items-center gradient-text">
                    <i class="fas fa-comments mr-3"></i>
                    Messaging Channel
                </h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-3">
                            Choose Your Channel
                        </label>
                        <div class="space-y-3">
                            <label class="flex items-center p-4 border-2 border-purple-300 bg-purple-50 rounded-xl cursor-pointer hover:border-purple-500 transition">
                                <input type="radio" name="channel" value="telegram" class="mr-3 w-5 h-5" checked>
                                <i class="fab fa-telegram text-3xl text-blue-500 mr-3"></i>
                                <div class="flex-1">
                                    <span class="font-semibold text-gray-800">Telegram</span>
                                    <p class="text-xs text-gray-600">Fast & reliable messaging</p>
                                </div>
                                <span class="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold">ACTIVE</span>
                            </label>
                            <label class="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-not-allowed opacity-60">
                                <input type="radio" name="channel" value="whatsapp" class="mr-3 w-5 h-5" disabled>
                                <i class="fab fa-whatsapp text-3xl text-green-500 mr-3"></i>
                                <div class="flex-1">
                                    <span class="font-semibold text-gray-800">WhatsApp</span>
                                    <p class="text-xs text-gray-600">Coming soon...</p>
                                </div>
                                <span class="bg-gray-300 text-gray-600 text-xs px-3 py-1 rounded-full font-semibold">DISABLED</span>
                            </label>
                        </div>
                    </div>

                    <div id="telegramSetup">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fab fa-telegram text-blue-500"></i> Telegram Username
                        </label>
                        <input type="text" id="telegram_username" placeholder="@username" 
                            class="input-field">
                        <div class="mt-3 p-3 bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-300 rounded-lg">
                            <div class="mb-3 pb-3 border-b border-blue-200">
                                <p class="text-xs text-gray-700 mb-2 font-bold flex items-center">
                                    <i class="fab fa-telegram text-blue-600 text-lg mr-2"></i> 
                                    Our Telegram Bot
                                </p>
                                <div class="flex items-center justify-between bg-white p-2 rounded-lg">
                                    <div class="flex items-center">
                                        <div class="bg-blue-500 p-2 rounded-lg mr-2">
                                            <i class="fab fa-telegram text-white text-xl"></i>
                                        </div>
                                        <div>
                                            <p class="font-bold text-blue-700 text-sm">@AivraSols_bot</p>
                                            <p class="text-xs text-gray-500">Your Weather & News Assistant</p>
                                        </div>
                                    </div>
                                    <a href="https://t.me/AivraSols_bot" target="_blank" 
                                       class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all">
                                        <i class="fas fa-external-link-alt mr-1"></i> Open Bot
                                    </a>
                                </div>
                            </div>
                            <p class="text-xs text-gray-700 mb-2 font-semibold">
                                <i class="fas fa-info-circle text-blue-500 mr-1"></i> Setup Instructions:
                            </p>
                            <ol class="text-xs text-gray-600 space-y-1 ml-4 list-decimal">
                                <li>Enter your Telegram username above (with or without @)</li>
                                <li>Save your channel settings</li>
                                <li>Click "Open Bot" above and send <code class="bg-gray-200 px-1 rounded">/start</code></li>
                                <li>Click "Connect Telegram" below to link your account</li>
                            </ol>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="saveChannel()" class="btn-primary">
                            <i class="fas fa-save mr-2"></i> Save Settings
                        </button>
                        <button onclick="connectTelegram()" id="connectBtn" class="btn-secondary">
                            <i class="fab fa-telegram mr-2"></i> Connect Telegram
                        </button>
                    </div>
                </div>
            </div>

            <!-- Location Settings Card -->
            <div class="glass-card">
                <h2 class="text-2xl font-bold mb-6 flex items-center gradient-text">
                    <i class="fas fa-map-marker-alt mr-3"></i>
                    Location Settings
                </h2>
                
                <div class="space-y-4">
                    <div class="relative">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-globe text-purple-600"></i> Country
                        </label>
                        <input type="text" id="country" placeholder="Start typing country name..." 
                            class="input-field" autocomplete="off">
                        <div id="countryDropdown" class="autocomplete-dropdown hidden"></div>
                    </div>

                    <div class="relative">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">
                            <i class="fas fa-city text-purple-600"></i> City
                        </label>
                        <input type="text" id="city" placeholder="Start typing city name..." 
                            class="input-field" autocomplete="off">
                        <div id="cityDropdown" class="autocomplete-dropdown hidden"></div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-language text-purple-600"></i> Language
                            </label>
                            <select id="language" class="input-field">
                                <option value="en">🇬🇧 English</option>
                                <option value="ur">🇵🇰 Urdu (اردو)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-thermometer-half text-purple-600"></i> Temperature
                            </label>
                            <select id="temperature_unit" class="input-field">
                                <option value="C">Celsius (°C)</option>
                                <option value="F">Fahrenheit (°F)</option>
                            </select>
                        </div>
                    </div>

                    <button onclick="saveLocation()" class="btn-primary w-full">
                        <i class="fas fa-save mr-2"></i> Save Location Settings
                    </button>
                </div>
            </div>

            <!-- Schedule Settings Card -->
            <div class="glass-card lg:col-span-2">
                <h2 class="text-2xl font-bold mb-6 flex items-center gradient-text">
                    <i class="fas fa-clock mr-3"></i>
                    Notification Schedule
                </h2>
                
                <div class="space-y-6">
                    <!-- Weather Morning -->
                    <div class="border-2 border-purple-200 rounded-xl p-4 bg-purple-50">
                        <div class="flex items-center justify-between mb-3">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" id="weather_morning_enabled" checked 
                                    class="mr-3 w-5 h-5 text-purple-600 rounded">
                                <div>
                                    <span class="font-bold text-gray-800 text-lg">Morning Weather</span>
                                    <p class="text-xs text-gray-600">Daily weather forecast for the morning</p>
                                </div>
                            </label>
                            <i class="fas fa-sun text-3xl text-yellow-500"></i>
                        </div>
                        <div id="weatherMorningTimes" class="space-y-2"></div>
                        <button onclick="addTime('weather_morning')" class="mt-2 text-sm text-purple-600 hover:text-purple-800 font-semibold">
                            <i class="fas fa-plus-circle mr-1"></i> Add Another Time
                        </button>
                    </div>

                    <!-- Weather Night -->
                    <div class="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50">
                        <div class="flex items-center justify-between mb-3">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" id="weather_night_enabled" checked 
                                    class="mr-3 w-5 h-5 text-indigo-600 rounded">
                                <div>
                                    <span class="font-bold text-gray-800 text-lg">Evening Weather</span>
                                    <p class="text-xs text-gray-600">Evening weather updates and forecasts</p>
                                </div>
                            </label>
                            <i class="fas fa-moon text-3xl text-indigo-600"></i>
                        </div>
                        <div id="weatherNightTimes" class="space-y-2"></div>
                        <button onclick="addTime('weather_night')" class="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-semibold">
                            <i class="fas fa-plus-circle mr-1"></i> Add Another Time
                        </button>
                    </div>

                    <!-- News -->
                    <div class="border-2 border-green-200 rounded-xl p-4 bg-green-50">
                        <div class="flex items-center justify-between mb-3">
                            <label class="flex items-center cursor-pointer">
                                <input type="checkbox" id="news_enabled" checked 
                                    class="mr-3 w-5 h-5 text-green-600 rounded">
                                <div>
                                    <span class="font-bold text-gray-800 text-lg">Daily News</span>
                                    <p class="text-xs text-gray-600">Local and national news summaries</p>
                                </div>
                            </label>
                            <i class="fas fa-newspaper text-3xl text-green-600"></i>
                        </div>
                        <div id="newsTimes" class="space-y-2"></div>
                        <button onclick="addTime('news')" class="mt-2 text-sm text-green-600 hover:text-green-800 font-semibold">
                            <i class="fas fa-plus-circle mr-1"></i> Add Another Time
                        </button>
                    </div>

                    <button onclick="saveSchedules()" class="btn-primary w-full">
                        <i class="fas fa-save mr-2"></i> Save All Schedules
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/utils.js"></script>
    <script>
        let userData = null;
        const scheduleTimes = {
            weather_morning: ['07:00'],
            weather_night: ['20:00'],
            news: ['09:00']
        };
        let userTimezone = 'UTC';

        // Toggle mobile menu
        function toggleMobileMenu() {
            const menu = document.getElementById('mobileMenu');
            menu.classList.toggle('hidden');
        }

        // Toggle subscription dropdown
        function toggleSubscriptionMenu() {
            const menu = document.getElementById('subscriptionMenu');
            menu.classList.toggle('hidden');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            const dropdown = document.querySelector('.subscription-dropdown');
            const menu = document.getElementById('subscriptionMenu');
            if (dropdown && menu && !dropdown.contains(event.target)) {
                menu.classList.add('hidden');
            }
        });

        // Update clocks
        function updateClocks() {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', { 
                timeZone: userTimezone,
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            });
            const dateString = now.toLocaleDateString('en-US', {
                timeZone: userTimezone,
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            
            const clockText = \`\${dateString} \${timeString}\`;
            document.getElementById('userClock').textContent = clockText;
            document.getElementById('userClockMobile').textContent = clockText;
        }

        // Initialize
        async function init() {
            await loadProfile();
            renderScheduleTimes();
            setupCountryAutocomplete('country', 'countryDropdown');
            setupCityAutocomplete('country', 'city', 'cityDropdown');
            
            // Start clock
            setInterval(updateClocks, 1000);
            updateClocks();
        }

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
            document.getElementById('userEmailMobile').textContent = user.email;
            
            // Set user timezone
            if (location && location.timezone) {
                userTimezone = location.timezone;
            }
            document.getElementById('subscriptionPlan').textContent = user.subscription_plan.toUpperCase();
            document.getElementById('subscriptionStatus').textContent = user.subscription_status.toUpperCase();
            
            // Update header dropdown
            document.getElementById('headerPlan').textContent = user.subscription_plan.toUpperCase();
            document.getElementById('mobilePlanBadge').textContent = user.subscription_plan === 'free' ? 'Free' : user.subscription_plan === 'monthly' ? 'Monthly' : 'Yearly';
            document.getElementById('dropdownPlan').textContent = user.subscription_plan.toUpperCase();
            document.getElementById('dropdownStatus').textContent = user.subscription_status.toUpperCase();
            
            if (user.trial_ends_at) {
                const trialDate = new Date(user.trial_ends_at);
                const now = new Date();
                const daysLeft = Math.ceil((trialDate - now) / (1000 * 60 * 60 * 24));
                
                document.getElementById('trialEnds').textContent = trialDate.toLocaleDateString();
                document.getElementById('dropdownExpiry').textContent = trialDate.toLocaleDateString();
                
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
            
            // Load schedules
            if (schedules && schedules.length > 0) {
                scheduleTimes.weather_morning = [];
                scheduleTimes.weather_night = [];
                scheduleTimes.news = [];
                
                schedules.forEach(schedule => {
                    const type = schedule.schedule_type;
                    if (scheduleTimes[type]) {
                        scheduleTimes[type].push(schedule.delivery_time);
                    }
                    
                    const enabledCheckbox = document.getElementById(\`\${type}_enabled\`);
                    if (enabledCheckbox) enabledCheckbox.checked = schedule.is_enabled === 1;
                });
                
                renderScheduleTimes();
            }
        }

        function renderScheduleTimes() {
            ['weather_morning', 'weather_night', 'news'].forEach(type => {
                const container = document.getElementById(\`\${type === 'weather_morning' ? 'weatherMorning' : type === 'weather_night' ? 'weatherNight' : 'news'}Times\`);
                if (!container) return;
                
                container.innerHTML = '';
                scheduleTimes[type].forEach((time, index) => {
                    const timeDiv = document.createElement('div');
                    timeDiv.className = 'flex items-center space-x-2';
                    timeDiv.innerHTML = \`
                        <input type="time" value="\${time}" 
                            onchange="updateTime('\${type}', \${index}, this.value)"
                            class="input-field flex-1">
                        \${scheduleTimes[type].length > 1 ? 
                            \`<button onclick="removeTime('\${type}', \${index})" 
                                class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                                <i class="fas fa-trash"></i>
                            </button>\` : ''}
                    \`;
                    container.appendChild(timeDiv);
                });
            });
        }

        function addTime(type) {
            scheduleTimes[type].push('12:00');
            renderScheduleTimes();
            showToast('Time slot added', 'success');
        }

        function removeTime(type, index) {
            scheduleTimes[type].splice(index, 1);
            renderScheduleTimes();
            showToast('Time slot removed', 'success');
        }

        function updateTime(type, index, newTime) {
            scheduleTimes[type][index] = newTime;
        }

        async function saveChannel() {
            const telegram_username = document.getElementById('telegram_username').value;
            const preferred_channel = document.querySelector('input[name="channel"]:checked').value;
            
            if (!telegram_username) {
                showToast('Please enter your Telegram username', 'warning');
                return;
            }
            
            try {
                await axios.post('/api/user/preferences', {
                    telegram_username: telegram_username.startsWith('@') ? telegram_username : '@' + telegram_username,
                    preferred_channel
                });
                showToast('Channel settings saved! Now connect your Telegram account.', 'success');
            } catch (error) {
                showToast('Failed to save channel settings', 'error');
            }
        }
        
        async function connectTelegram() {
            const telegram_username = document.getElementById('telegram_username').value;
            
            if (!telegram_username) {
                showToast('Please enter and save your Telegram username first', 'warning');
                return;
            }
            
            const connectBtn = document.getElementById('connectBtn');
            const originalText = connectBtn.innerHTML;
            connectBtn.disabled = true;
            connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Connecting...';
            
            try {
                const response = await axios.get('/api/telegram/get-chat-id');
                if (response.data.success) {
                    showToast(response.data.message, 'success');
                    connectBtn.innerHTML = '<i class="fas fa-check mr-2"></i> Connected!';
                    setTimeout(() => {
                        connectBtn.innerHTML = originalText;
                        connectBtn.disabled = false;
                    }, 3000);
                } else {
                    showToast(response.data.error || 'Failed to connect', 'error');
                    if (response.data.hint) {
                        setTimeout(() => showToast(response.data.hint, 'info'), 2000);
                    }
                    connectBtn.innerHTML = originalText;
                    connectBtn.disabled = false;
                }
            } catch (error) {
                showToast('Failed to connect Telegram. Make sure you sent /start to the bot.', 'error');
                connectBtn.innerHTML = originalText;
                connectBtn.disabled = false;
            }
        }

        async function saveLocation() {
            const country = document.getElementById('country').value;
            const city = document.getElementById('city').value;
            const language = document.getElementById('language').value;
            const temperature_unit = document.getElementById('temperature_unit').value;
            
            if (!country || !city) {
                showToast('Please enter both country and city', 'warning');
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
                showToast('Location settings saved successfully!', 'success');
            } catch (error) {
                showToast('Failed to save location settings', 'error');
            }
        }

        async function saveSchedules() {
            const schedules = [];
            
            ['weather_morning', 'weather_night', 'news'].forEach(type => {
                const isEnabled = document.getElementById(\`\${type}_enabled\`).checked;
                scheduleTimes[type].forEach(time => {
                    schedules.push({
                        schedule_type: type,
                        delivery_time: time,
                        is_enabled: isEnabled
                    });
                });
            });
            
            try {
                await axios.post('/api/user/schedules', { schedules });
                showToast('Schedule saved successfully!', 'success');
            } catch (error) {
                showToast('Failed to save schedule', 'error');
            }
        }

        async function testNotification() {
            try {
                const response = await axios.post('/api/user/test-notification');
                if (response.data.success) {
                    showToast(response.data.message, 'success');
                } else if (response.data.needsChatId) {
                    showToast(response.data.error, 'warning');
                    setTimeout(() => {
                        showToast('Click the "Connect Telegram" button in Channel Settings', 'info');
                    }, 2000);
                } else {
                    showToast(response.data.error || 'Failed to send notification', 'error');
                }
            } catch (error) {
                if (error.response?.data?.error) {
                    showToast(error.response.data.error, 'error');
                } else {
                    showToast('Failed to send test notification', 'error');
                }
            }
        }

        async function activateLicenseFromHeader() {
            const licenseKey = document.getElementById('headerLicenseInput').value.trim().toUpperCase();
            
            if (!licenseKey) {
                showToast('Please enter a license key', 'warning');
                return;
            }
            
            try {
                const response = await axios.post('/api/user/activate-license', { licenseKey });
                if (response.data.success) {
                    showToast('License activated successfully! 🎉', 'success');
                    document.getElementById('headerLicenseInput').value = '';
                    document.getElementById('subscriptionMenu').classList.add('hidden');
                    await loadProfile();
                } else {
                    showToast(response.data.error || 'Failed to activate', 'error');
                }
            } catch (error) {
                showToast(error.response?.data?.error || 'Invalid license key', 'error');
            }
        }

        async function requestPaymentFromHeader(planType) {
            try {
                const response = await axios.post('/api/user/request-payment', { planType });
                if (response.data.success) {
                    showToast(\`Opening WhatsApp for \${response.data.plan}...\`, 'info');
                    document.getElementById('subscriptionMenu').classList.add('hidden');
                    setTimeout(() => {
                        window.open(response.data.whatsappLink, '_blank');
                    }, 1000);
                }
            } catch (error) {
                showToast('Error creating payment request', 'error');
            }
        }

        async function logout() {
            try {
                await axios.post('/api/auth/logout');
                showToast('Logged out successfully', 'success');
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 1000);
            } catch (error) {
                window.location.href = '/auth/login';
            }
        }

        // Initialize on page load
        init();
    </script>
</body>
</html>
  `)
})

export default dashboard
