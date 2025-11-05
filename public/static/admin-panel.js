// ============================================
// ALERTFLOW ADMIN PANEL - JAVASCRIPT
// Version 3.0 - Complete Rewrite
// ============================================

console.log('✅ Admin Panel JS v3.0 Loaded Successfully!');

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing admin panel...');
    
    try {
        await loadStats();
        await loadSettings();
        await loadUsers();
        await loadLogs();
        console.log('✅ Admin panel initialized successfully!');
    } catch (error) {
        console.error('❌ Init error:', error);
        showToast('Failed to initialize admin panel', 'error');
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.toggleAdminMenu = function() {
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
};

// ============================================
// STATS MANAGEMENT
// ============================================
window.loadStats = async function() {
    try {
        console.log('📊 Loading stats...');
        const response = await axios.get('/api/admin/stats');
        
        if (response.data.success) {
            const stats = response.data.stats;
            document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
            document.getElementById('activeTrials').textContent = stats.activeTrials || 0;
            document.getElementById('premiumUsers').textContent = stats.premiumUsers || 0;
            document.getElementById('messagesToday').textContent = stats.messagesToday || 0;
            console.log('✅ Stats loaded:', stats);
        }
    } catch (error) {
        console.error('❌ Stats error:', error);
        if (error.response?.status === 401) {
            window.location.href = '/admin';
        }
    }
};

window.refreshStats = function() {
    console.log('🔄 Refreshing stats...');
    loadStats();
    showToast('Stats refreshed!', 'success');
};

// ============================================
// SETTINGS MANAGEMENT
// ============================================
window.loadSettings = async function() {
    try {
        console.log('⚙️ Loading settings...');
        const response = await axios.get('/api/admin/settings');
        
        if (response.data.success) {
            const settings = response.data.settings;
            
            // Telegram
            if (settings.telegram_bot_token) {
                document.getElementById('telegram_bot_token').value = settings.telegram_bot_token;
            }
            document.getElementById('telegramEnabled').checked = settings.telegram_bot_token_enabled === 1;
            
            // Weather
            if (settings.weather_api_key) {
                document.getElementById('weather_api_key').value = settings.weather_api_key;
            }
            
            // News API
            if (settings.news_api_key) {
                document.getElementById('news_api_key').value = settings.news_api_key;
            }
            
            // GNews
            if (settings.gnews_api_key) {
                document.getElementById('gnews_api_key').value = settings.gnews_api_key;
            }
            
            // Gemini
            if (settings.gemini_api_key) {
                document.getElementById('gemini_api_key').value = settings.gemini_api_key;
            }
            
            // WhatsApp
            document.getElementById('whatsappEnabled').checked = settings.whatsapp_enabled === 'true' || settings.whatsapp_enabled === '1';
            
            console.log('✅ Settings loaded');
        }
    } catch (error) {
        console.error('❌ Settings error:', error);
    }
};

// ============================================
// API TESTING FUNCTIONS
// ============================================
window.testTelegram = async function() {
    const token = document.getElementById('telegram_bot_token').value;
    const resultDiv = document.getElementById('telegramResult');
    const statusBadge = document.getElementById('telegramStatus');
    
    if (!token) {
        showToast('Please enter Telegram bot token', 'warning');
        return;
    }
    
    console.log('🤖 Testing Telegram...');
    resultDiv.classList.add('hidden');
    statusBadge.textContent = 'Testing...';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
    
    try {
        const response = await axios.post('/api/admin/test/telegram', { token });
        
        if (response.data.success) {
            const data = response.data.data;
            resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200 mt-4';
            resultDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                    <div>
                        <p class="font-semibold text-green-800">✅ Connection Successful!</p>
                        <p class="text-sm text-green-700 mt-1">Bot Name: <strong>${data.bot_name}</strong></p>
                        <p class="text-sm text-green-700">Username: @${data.username}</p>
                        <p class="text-sm text-green-700">Bot ID: ${data.bot_id}</p>
                    </div>
                </div>
            `;
            statusBadge.textContent = '✅ Working';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
            showToast('Telegram bot connected successfully!', 'success');
        } else {
            throw new Error(response.data.error || 'Test failed');
        }
        
        resultDiv.classList.remove('hidden');
    } catch (error) {
        resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200 mt-4';
        resultDiv.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i>
                <div>
                    <p class="font-semibold text-red-800">❌ Connection Failed</p>
                    <p class="text-sm text-red-700 mt-1">${error.response?.data?.error || error.message}</p>
                </div>
            </div>
        `;
        statusBadge.textContent = '❌ Failed';
        statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
        resultDiv.classList.remove('hidden');
        showToast('Telegram test failed', 'error');
    }
};

window.testWeather = async function() {
    const apiKey = document.getElementById('weather_api_key').value;
    const resultDiv = document.getElementById('weatherResult');
    const statusBadge = document.getElementById('weatherStatus');
    
    if (!apiKey) {
        showToast('Please enter Weather API key', 'warning');
        return;
    }
    
    console.log('🌤️ Testing Weather API...');
    resultDiv.classList.add('hidden');
    statusBadge.textContent = 'Testing...';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
    
    try {
        const response = await axios.post('/api/admin/test/weather', { apiKey });
        
        if (response.data.success) {
            const data = response.data.data;
            resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200 mt-4';
            resultDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                    <div>
                        <p class="font-semibold text-green-800">✅ Connection Successful!</p>
                        <p class="text-sm text-green-700 mt-1">Test City: <strong>${data.city}, ${data.country}</strong></p>
                        <p class="text-sm text-green-700">Temperature: ${data.temperature}°C</p>
                        <p class="text-sm text-green-700">Condition: ${data.description}</p>
                    </div>
                </div>
            `;
            statusBadge.textContent = '✅ Working';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
            showToast('Weather API connected successfully!', 'success');
        } else {
            throw new Error(response.data.error || 'Test failed');
        }
        
        resultDiv.classList.remove('hidden');
    } catch (error) {
        resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200 mt-4';
        resultDiv.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i>
                <div>
                    <p class="font-semibold text-red-800">❌ Connection Failed</p>
                    <p class="text-sm text-red-700 mt-1">${error.response?.data?.error || error.message}</p>
                    <p class="text-xs text-red-600 mt-2">Get a valid key from: <a href="https://openweathermap.org/api" target="_blank" class="underline">OpenWeatherMap</a></p>
                </div>
            </div>
        `;
        statusBadge.textContent = '❌ Failed';
        statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
        resultDiv.classList.remove('hidden');
        showToast('Weather API test failed', 'error');
    }
};

window.testNews = async function() {
    const apiKey = document.getElementById('news_api_key').value;
    const resultDiv = document.getElementById('newsResult');
    const statusBadge = document.getElementById('newsStatus');
    
    if (!apiKey) {
        showToast('Please enter News API key', 'warning');
        return;
    }
    
    console.log('📰 Testing News API...');
    resultDiv.classList.add('hidden');
    statusBadge.textContent = 'Testing...';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
    
    try {
        const response = await axios.post('/api/admin/test/news', { apiKey });
        
        if (response.data.success) {
            const data = response.data.data;
            resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200 mt-4';
            resultDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                    <div class="flex-1">
                        <p class="font-semibold text-green-800">✅ Connection Successful!</p>
                        <p class="text-sm text-green-700 mt-1">Headlines Fetched: <strong>${data.count}</strong></p>
                    </div>
                </div>
            `;
            statusBadge.textContent = '✅ Working';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
            showToast('News API connected successfully!', 'success');
        } else {
            throw new Error(response.data.error || 'Test failed');
        }
        
        resultDiv.classList.remove('hidden');
    } catch (error) {
        resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200 mt-4';
        resultDiv.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i>
                <div>
                    <p class="font-semibold text-red-800">❌ Connection Failed</p>
                    <p class="text-sm text-red-700 mt-1">${error.response?.data?.error || error.message}</p>
                </div>
            </div>
        `;
        statusBadge.textContent = '❌ Failed';
        statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
        resultDiv.classList.remove('hidden');
        showToast('News API test failed', 'error');
    }
};

window.testGNews = async function() {
    const apiKey = document.getElementById('gnews_api_key').value;
    const resultDiv = document.getElementById('gnewsResult');
    const statusBadge = document.getElementById('gnewsStatus');
    
    if (!apiKey) {
        showToast('Please enter GNews API key', 'warning');
        return;
    }
    
    console.log('🌐 Testing GNews API...');
    resultDiv.classList.add('hidden');
    statusBadge.textContent = 'Testing...';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
    
    try {
        const response = await axios.post('/api/admin/test/gnews', { apiKey });
        
        if (response.data.success) {
            const data = response.data.data;
            resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200 mt-4';
            resultDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                    <div class="flex-1">
                        <p class="font-semibold text-green-800">✅ Connection Successful!</p>
                        <p class="text-sm text-green-700 mt-1">Headlines Fetched: <strong>${data.count}</strong></p>
                    </div>
                </div>
            `;
            statusBadge.textContent = '✅ Working';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
            showToast('GNews API connected successfully!', 'success');
        } else {
            throw new Error(response.data.error || 'Test failed');
        }
        
        resultDiv.classList.remove('hidden');
    } catch (error) {
        resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200 mt-4';
        resultDiv.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i>
                <div>
                    <p class="font-semibold text-red-800">❌ Connection Failed</p>
                    <p class="text-sm text-red-700 mt-1">${error.response?.data?.error || error.message}</p>
                </div>
            </div>
        `;
        statusBadge.textContent = '❌ Failed';
        statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
        resultDiv.classList.remove('hidden');
        showToast('GNews API test failed', 'error');
    }
};

window.testGemini = async function() {
    const apiKey = document.getElementById('gemini_api_key').value;
    const resultDiv = document.getElementById('geminiResult');
    const statusBadge = document.getElementById('geminiStatus');
    
    if (!apiKey) {
        showToast('Please enter Gemini API key', 'warning');
        return;
    }
    
    console.log('🤖 Testing Gemini AI...');
    resultDiv.classList.add('hidden');
    statusBadge.textContent = 'Testing...';
    statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800';
    
    try {
        const response = await axios.post('/api/admin/test/gemini', { apiKey });
        
        if (response.data.success) {
            const data = response.data.data;
            resultDiv.className = 'p-4 rounded-lg bg-green-50 border border-green-200 mt-4';
            resultDiv.innerHTML = `
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-green-600 text-2xl mr-3"></i>
                    <div class="flex-1">
                        <p class="font-semibold text-green-800">✅ Connection Successful!</p>
                        <p class="text-sm text-green-700 mt-1">Model: <strong>${data.model}</strong></p>
                        <div class="mt-2 p-2 bg-white rounded border border-green-300">
                            <p class="text-xs text-gray-700 font-semibold">AI Response:</p>
                            <p class="text-sm text-gray-800 mt-1">${data.response}</p>
                        </div>
                    </div>
                </div>
            `;
            statusBadge.textContent = '✅ Working';
            statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800';
            showToast('Gemini AI connected successfully!', 'success');
        } else {
            throw new Error(response.data.error || 'Test failed');
        }
        
        resultDiv.classList.remove('hidden');
    } catch (error) {
        resultDiv.className = 'p-4 rounded-lg bg-red-50 border border-red-200 mt-4';
        resultDiv.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-times-circle text-red-600 text-2xl mr-3"></i>
                <div>
                    <p class="font-semibold text-red-800">❌ Connection Failed</p>
                    <p class="text-sm text-red-700 mt-1">${error.response?.data?.error || error.message}</p>
                </div>
            </div>
        `;
        statusBadge.textContent = '❌ Failed';
        statusBadge.className = 'px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800';
        resultDiv.classList.remove('hidden');
        showToast('Gemini AI test failed', 'error');
    }
};

// ============================================
// SAVE FUNCTIONS
// ============================================
window.saveTelegramKey = async function() {
    const token = document.getElementById('telegram_bot_token').value;
    
    if (!token) {
        showToast('Please enter Telegram bot token', 'warning');
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/settings', {
            telegram_bot_token: token
        });
        
        if (response.data.success) {
            showToast('Telegram bot token saved!', 'success');
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        showToast('Failed to save Telegram token', 'error');
    }
};

window.saveWeatherKey = async function() {
    const apiKey = document.getElementById('weather_api_key').value;
    
    if (!apiKey) {
        showToast('Please enter Weather API key', 'warning');
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/settings', {
            weather_api_key: apiKey
        });
        
        if (response.data.success) {
            showToast('Weather API key saved!', 'success');
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        showToast('Failed to save Weather key', 'error');
    }
};

window.saveNewsKey = async function() {
    const apiKey = document.getElementById('news_api_key').value;
    
    if (!apiKey) {
        showToast('Please enter News API key', 'warning');
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/settings', {
            news_api_key: apiKey
        });
        
        if (response.data.success) {
            showToast('News API key saved!', 'success');
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        showToast('Failed to save News key', 'error');
    }
};

window.saveGNewsKey = async function() {
    const apiKey = document.getElementById('gnews_api_key').value;
    
    if (!apiKey) {
        showToast('Please enter GNews API key', 'warning');
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/settings', {
            gnews_api_key: apiKey
        });
        
        if (response.data.success) {
            showToast('GNews API key saved!', 'success');
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        showToast('Failed to save GNews key', 'error');
    }
};

window.saveGeminiKey = async function() {
    const apiKey = document.getElementById('gemini_api_key').value;
    
    if (!apiKey) {
        showToast('Please enter Gemini API key', 'warning');
        return;
    }
    
    try {
        const response = await axios.post('/api/admin/settings', {
            gemini_api_key: apiKey
        });
        
        if (response.data.success) {
            showToast('Gemini API key saved!', 'success');
        } else {
            throw new Error('Save failed');
        }
    } catch (error) {
        showToast('Failed to save Gemini key', 'error');
    }
};

// ============================================
// TOGGLE FUNCTIONS
// ============================================
window.toggleTelegram = async function(isEnabled) {
    try {
        const response = await axios.post('/api/admin/settings', {
            telegram_bot_token_enabled: isEnabled ? '1' : '0'
        });
        
        if (response.data.success) {
            showToast(`Telegram ${isEnabled ? 'enabled' : 'disabled'}!`, 'success');
        } else {
            throw new Error('Toggle failed');
        }
    } catch (error) {
        showToast('Failed to toggle Telegram', 'error');
        document.getElementById('telegramEnabled').checked = !isEnabled;
    }
};

window.toggleWhatsApp = async function(isEnabled) {
    try {
        const response = await axios.post('/api/admin/settings', {
            whatsapp_enabled: isEnabled ? 'true' : 'false'
        });
        
        if (response.data.success) {
            showToast(`WhatsApp ${isEnabled ? 'enabled' : 'disabled'}!`, 'success');
        } else {
            throw new Error('Toggle failed');
        }
    } catch (error) {
        showToast('Failed to toggle WhatsApp', 'error');
        document.getElementById('whatsappEnabled').checked = !isEnabled;
    }
};

// ============================================
// USERS & LOGS
// ============================================
window.loadUsers = async function() {
    try {
        const response = await axios.get('/api/admin/users');
        
        if (response.data.success) {
            const users = response.data.users;
            const tbody = document.getElementById('usersTableBody');
            
            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No users found</td></tr>';
            } else {
                tbody.innerHTML = users.map(user => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${user.name || '-'}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 py-1 rounded-full bg-${user.subscription_plan === 'premium' ? 'green' : user.subscription_plan === 'trial' ? 'yellow' : 'gray'}-100 text-${user.subscription_plan === 'premium' ? 'green' : user.subscription_plan === 'trial' ? 'yellow' : 'gray'}-800">
                                ${user.subscription_plan.toUpperCase()}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 py-1 rounded-full bg-${user.subscription_status === 'active' ? 'green' : 'red'}-100 text-${user.subscription_status === 'active' ? 'green' : 'red'}-800">
                                ${user.subscription_status.toUpperCase()}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${new Date(user.created_at).toLocaleDateString()}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('❌ Users error:', error);
    }
};

window.loadLogs = async function() {
    try {
        const response = await axios.get('/api/admin/logs');
        
        if (response.data.success) {
            const logs = response.data.logs;
            const tbody = document.getElementById('logsTableBody');
            
            if (logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No logs found</td></tr>';
            } else {
                tbody.innerHTML = logs.map(log => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${new Date(log.created_at).toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 py-1 rounded-full bg-${log.api_name === 'telegram' ? 'blue' : 'orange'}-100 text-${log.api_name === 'telegram' ? 'blue' : 'orange'}-800">
                                ${log.api_name.toUpperCase()}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">${log.action}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <span class="px-2 py-1 rounded-full bg-${log.success ? 'green' : 'red'}-100 text-${log.success ? 'green' : 'red'}-800">
                                ${log.success ? '✅ Success' : '❌ Failed'}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm text-gray-600">${log.success ? (log.details || 'OK') : (log.error_message || 'Error')}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('❌ Logs error:', error);
    }
};

// ============================================
// LOGOUT
// ============================================
window.logout = async function() {
    try {
        await axios.post('/api/admin/auth/logout');
        window.location.href = '/admin';
    } catch (error) {
        window.location.href = '/admin';
    }
};

console.log('✅ All admin functions registered globally!');
