// ============================================
// ALERTFLOW ADMIN PANEL - PROFESSIONAL v4.0
// Complete rewrite with all features
// ============================================

console.log('✅ Admin Panel v4.0 Loaded!');

// Global state
const state = {
    users: [],
    logs: [],
    settings: {},
    currentUser: null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing admin panel v4.0...');
    
    try {
        await Promise.all([
            loadStats(),
            loadSettings(),
            loadUsers(),
            loadLogs()
        ]);
        console.log('✅ Admin panel initialized!');
    } catch (error) {
        console.error('❌ Init error:', error);
        showToast('Failed to initialize', 'error');
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} animate-slide-in`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('animate-slide-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
    return container;
}

// ============================================
// STATS MANAGEMENT
// ============================================
window.loadStats = async function() {
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
        console.error('Stats error:', error);
        if (error.response?.status === 401) window.location.href = '/admin';
    }
};

window.refreshStats = function() {
    loadStats();
    showToast('Stats refreshed', 'success');
};

// ============================================
// SETTINGS MANAGEMENT - FIXED!
// ============================================
window.loadSettings = async function() {
    try {
        const response = await axios.get('/api/admin/settings');
        if (response.data.success) {
            state.settings = response.data.settings;
            populateSettings(state.settings);
        }
    } catch (error) {
        console.error('Settings error:', error);
    }
};

function populateSettings(settings) {
    const fields = {
        telegram_bot_token: 'telegram_bot_token',
        weather_api_key: 'weather_api_key',
        news_api_key: 'news_api_key',
        gnews_api_key: 'gnews_api_key',
        gemini_api_key: 'gemini_api_key'
    };
    
    Object.entries(fields).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el && settings[key]) el.value = settings[key];
    });
    
    if (settings.telegram_bot_token_enabled) {
        document.getElementById('telegramEnabled').checked = settings.telegram_bot_token_enabled === 1;
    }
    if (settings.whatsapp_enabled) {
        document.getElementById('whatsappEnabled').checked = settings.whatsapp_enabled === 'true' || settings.whatsapp_enabled === '1';
    }
}

// FIXED SAVE FUNCTIONS
window.saveTelegramKey = async function() {
    const token = document.getElementById('telegram_bot_token').value;
    if (!token) return showToast('Please enter token', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { telegram_bot_token: token }
        });
        if (response.data.success) showToast('Telegram saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveWeatherKey = async function() {
    const key = document.getElementById('weather_api_key').value;
    if (!key) return showToast('Please enter key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { weather_api_key: key }
        });
        if (response.data.success) showToast('Weather saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveNewsKey = async function() {
    const key = document.getElementById('news_api_key').value;
    if (!key) return showToast('Please enter key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { news_api_key: key }
        });
        if (response.data.success) showToast('News saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveGNewsKey = async function() {
    const key = document.getElementById('gnews_api_key').value;
    if (!key) return showToast('Please enter key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { gnews_api_key: key }
        });
        if (response.data.success) showToast('GNews saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveGeminiKey = async function() {
    const key = document.getElementById('gemini_api_key').value;
    if (!key) return showToast('Please enter key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { gemini_api_key: key }
        });
        if (response.data.success) showToast('Gemini saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

// ============================================
// API TESTING FUNCTIONS
// ============================================
window.testTelegram = async function() {
    const token = document.getElementById('telegram_bot_token').value;
    if (!token) return showToast('Enter token first', 'warning');
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        const response = await axios.post('/api/admin/test/telegram', { token });
        if (response.data.success) {
            showToast(`✅ Connected: @${response.data.data.username}`, 'success');
            document.getElementById('telegramStatus').innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Working</span>';
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        showToast(error.response?.data?.error || 'Test failed', 'error');
        document.getElementById('telegramStatus').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle"></i> Failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-vial"></i> Test';
    }
};

window.testWeather = async function() {
    const key = document.getElementById('weather_api_key').value;
    if (!key) return showToast('Enter API key first', 'warning');
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        const response = await axios.post('/api/admin/test/weather', { apiKey: key });
        if (response.data.success) {
            showToast(`✅ ${response.data.data.city}: ${response.data.data.temperature}°C`, 'success');
            document.getElementById('weatherStatus').innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Working</span>';
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        showToast(error.response?.data?.error || 'Test failed', 'error');
        document.getElementById('weatherStatus').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle"></i> Failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-vial"></i> Test';
    }
};

window.testNews = async function() {
    const key = document.getElementById('news_api_key').value;
    if (!key) return showToast('Enter API key first', 'warning');
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        const response = await axios.post('/api/admin/test/news', { apiKey: key });
        if (response.data.success) {
            showToast(`✅ ${response.data.data.count} headlines fetched`, 'success');
            document.getElementById('newsStatus').innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Working</span>';
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        showToast(error.response?.data?.error || 'Test failed', 'error');
        document.getElementById('newsStatus').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle"></i> Failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-vial"></i> Test';
    }
};

window.testGNews = async function() {
    const key = document.getElementById('gnews_api_key').value;
    if (!key) return showToast('Enter API key first', 'warning');
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        const response = await axios.post('/api/admin/test/gnews', { apiKey: key });
        if (response.data.success) {
            showToast(`✅ ${response.data.data.count} headlines fetched`, 'success');
            document.getElementById('gnewsStatus').innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Working</span>';
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        showToast(error.response?.data?.error || 'Test failed', 'error');
        document.getElementById('gnewsStatus').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle"></i> Failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-vial"></i> Test';
    }
};

window.testGemini = async function() {
    const key = document.getElementById('gemini_api_key').value;
    if (!key) return showToast('Enter API key first', 'warning');
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
    
    try {
        const response = await axios.post('/api/admin/test/gemini', { apiKey: key });
        if (response.data.success) {
            showToast('✅ Gemini AI connected', 'success');
            document.getElementById('geminiStatus').innerHTML = '<span class="text-green-600"><i class="fas fa-check-circle"></i> Working</span>';
        } else {
            throw new Error(response.data.error);
        }
    } catch (error) {
        showToast(error.response?.data?.error || 'Test failed', 'error');
        document.getElementById('geminiStatus').innerHTML = '<span class="text-red-600"><i class="fas fa-times-circle"></i> Failed</span>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-vial"></i> Test';
    }
};

// ============================================
// TOGGLE FUNCTIONS
// ============================================
window.toggleTelegram = async function(enabled) {
    try {
        await axios.post('/api/admin/settings', {
            settings: { telegram_bot_token_enabled: enabled ? '1' : '0' }
        });
        showToast(`Telegram ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
        showToast('Toggle failed', 'error');
        document.getElementById('telegramEnabled').checked = !enabled;
    }
};

window.toggleWhatsApp = async function(enabled) {
    try {
        await axios.post('/api/admin/settings', {
            settings: { whatsapp_enabled: enabled ? 'true' : 'false' }
        });
        showToast(`WhatsApp ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
        showToast('Toggle failed', 'error');
        document.getElementById('whatsappEnabled').checked = !enabled;
    }
};

// ============================================
// USER MANAGEMENT
// ============================================
window.loadUsers = async function() {
    try {
        const response = await axios.get('/api/admin/users');
        if (response.data.success) {
            state.users = response.data.users;
            renderUsers();
        }
    } catch (error) {
        console.error('Users error:', error);
    }
};

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (state.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.users.map(user => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">${user.email}</td>
            <td class="px-6 py-4 text-sm text-gray-600">${user.name || '-'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${
                    user.subscription_plan === 'premium' ? 'bg-green-100 text-green-800' :
                    user.subscription_plan === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                }">${user.subscription_plan.toUpperCase()}</span>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${
                    user.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">${user.subscription_status.toUpperCase()}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">${new Date(user.created_at).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.showAddUserModal = function() {
    document.getElementById('userModal').classList.remove('hidden');
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    state.currentUser = null;
};

window.closeUserModal = function() {
    document.getElementById('userModal').classList.add('hidden');
};

window.editUser = function(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    
    state.currentUser = user;
    document.getElementById('userModal').classList.remove('hidden');
    document.getElementById('userModalTitle').textContent = 'Edit User';
    
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userPlan').value = user.subscription_plan;
    document.getElementById('userStatus').value = user.subscription_status;
};

window.saveUser = async function() {
    const email = document.getElementById('userEmail').value;
    const name = document.getElementById('userName').value;
    const plan = document.getElementById('userPlan').value;
    const status = document.getElementById('userStatus').value;
    
    if (!email) return showToast('Email required', 'warning');
    
    try {
        if (state.currentUser) {
            // Update existing user
            await axios.put(`/api/admin/users/${state.currentUser.id}`, {
                email, name, subscription_plan: plan, subscription_status: status
            });
            showToast('User updated!', 'success');
        } else {
            // Add new user
            await axios.post('/api/admin/users', {
                email, name, subscription_plan: plan, subscription_status: status
            });
            showToast('User added!', 'success');
        }
        
        closeUserModal();
        loadUsers();
    } catch (error) {
        showToast(error.response?.data?.error || 'Save failed', 'error');
    }
};

window.deleteUser = async function(userId) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    
    try {
        await axios.delete(`/api/admin/users/${userId}`);
        showToast('User deleted', 'success');
        loadUsers();
    } catch (error) {
        showToast('Delete failed', 'error');
    }
};

// ============================================
// LOGS
// ============================================
window.loadLogs = async function() {
    try {
        const response = await axios.get('/api/admin/logs');
        if (response.data.success) {
            state.logs = response.data.logs;
            renderLogs();
        }
    } catch (error) {
        console.error('Logs error:', error);
    }
};

function renderLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (state.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.logs.map(log => `
        <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">${new Date(log.created_at).toLocaleString()}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${
                    log.api_name === 'telegram' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                }">${log.api_name.toUpperCase()}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">${log.action}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${
                    log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }">${log.success ? '✅ Success' : '❌ Failed'}</span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">${log.success ? (log.details || 'OK') : (log.error_message || 'Error')}</td>
        </tr>
    `).join('');
}

// ============================================
// LOGOUT
// ============================================
window.logout = async function() {
    try {
        await axios.post('/api/admin/auth/logout');
    } catch (error) {}
    window.location.href = '/admin';
};

console.log('✅ All functions loaded!');
