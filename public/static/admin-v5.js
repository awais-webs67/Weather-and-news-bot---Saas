// ============================================
// ALERTFLOW ADMIN PANEL - PROFESSIONAL v5.0
// Complete professional redesign with all features
// ============================================

console.log('✅ Admin Panel v5.0 Loaded!');

// Global state
const state = {
    users: [],
    logs: [],
    licenseKeys: [],
    currentUser: null
};

// ===================
// UTILITY FUNCTIONS
// ===================

window.showToast = function(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-500 translate-x-full`;
    
    const icons = {
        success: '<i class="fas fa-check-circle mr-3"></i>',
        error: '<i class="fas fa-exclamation-circle mr-3"></i>',
        warning: '<i class="fas fa-exclamation-triangle mr-3"></i>',
        info: '<i class="fas fa-info-circle mr-3"></i>'
    };
    
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        warning: 'bg-yellow-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    toast.className += ` ${colors[type]}`;
    toast.innerHTML = `${icons[type]}${message}`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.remove('translate-x-full'), 100);
    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
};

// ===================
// STATS FUNCTIONS
// ===================

window.loadStats = async function() {
    try {
        const response = await axios.get('/api/admin/stats');
        if (response.data.success) {
            const { totalUsers, activeTrials, premiumUsers, messagesToday } = response.data.stats;
            document.getElementById('totalUsers').textContent = totalUsers;
            document.getElementById('activeTrials').textContent = activeTrials;
            document.getElementById('premiumUsers').textContent = premiumUsers;
            document.getElementById('messagesToday').textContent = messagesToday;
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
};

window.refreshStats = function() {
    loadStats();
    loadUsers();
    loadLogs();
    showToast('Data refreshed!', 'success');
};

// ===================
// SETTINGS FUNCTIONS
// ===================

window.loadSettings = async function() {
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
            if (settings.whatsapp_phone_number_id) {
                document.getElementById('whatsapp_phone_number_id').value = settings.whatsapp_phone_number_id;
            }
            if (settings.whatsapp_business_account_id) {
                document.getElementById('whatsapp_business_account_id').value = settings.whatsapp_business_account_id;
            }
            if (settings.whatsapp_access_token) {
                document.getElementById('whatsapp_access_token').value = settings.whatsapp_access_token;
            }
            
            if (settings.whatsapp_enabled !== undefined) {
                document.getElementById('whatsappEnabled').checked = settings.whatsapp_enabled == 1;
            }
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
};

// ===================
// API SAVE FUNCTIONS
// ===================

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
    if (!key) return showToast('Please enter API key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { weather_api_key: key }
        });
        if (response.data.success) showToast('Weather API saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveNewsKey = async function() {
    const key = document.getElementById('news_api_key').value;
    if (!key) return showToast('Please enter API key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { news_api_key: key }
        });
        if (response.data.success) showToast('News API saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveGNewsKey = async function() {
    const key = document.getElementById('gnews_api_key').value;
    if (!key) return showToast('Please enter API key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { gnews_api_key: key }
        });
        if (response.data.success) showToast('GNews API saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveGeminiKey = async function() {
    const key = document.getElementById('gemini_api_key').value;
    if (!key) return showToast('Please enter API key', 'warning');
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { gemini_api_key: key }
        });
        if (response.data.success) showToast('Gemini API saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

window.saveWhatsAppSettings = async function() {
    const phoneNumberId = document.getElementById('whatsapp_phone_number_id').value;
    const businessAccountId = document.getElementById('whatsapp_business_account_id').value;
    const accessToken = document.getElementById('whatsapp_access_token').value;
    
    if (!phoneNumberId || !businessAccountId || !accessToken) {
        return showToast('Please fill all WhatsApp fields', 'warning');
    }
    
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: {
                whatsapp_phone_number_id: phoneNumberId,
                whatsapp_business_account_id: businessAccountId,
                whatsapp_access_token: accessToken
            }
        });
        if (response.data.success) showToast('WhatsApp settings saved!', 'success');
    } catch (error) {
        showToast('Save failed', 'error');
    }
};

// ===================
// API TEST FUNCTIONS
// ===================

window.testTelegram = async function() {
    const token = document.getElementById('telegram_bot_token').value;
    if (!token) return showToast('Please enter token first', 'warning');
    
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    btn.disabled = true;
    
    try {
        const response = await axios.post('/api/admin/test/telegram', { token });
        if (response.data.success) {
            showToast(`✅ Connected: ${response.data.bot_name}`, 'success');
        } else {
            showToast('Test failed: ' + response.data.error, 'error');
        }
    } catch (error) {
        showToast('Test failed', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.testWeather = async function() {
    const apiKey = document.getElementById('weather_api_key').value;
    if (!apiKey) return showToast('Please enter API key first', 'warning');
    
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    btn.disabled = true;
    
    try {
        const response = await axios.post('/api/admin/test/weather', { apiKey });
        if (response.data.success) {
            showToast('✅ Weather API working!', 'success');
        } else {
            showToast('Test failed: ' + response.data.error, 'error');
        }
    } catch (error) {
        showToast('Test failed', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.testNews = async function() {
    const apiKey = document.getElementById('news_api_key').value;
    if (!apiKey) return showToast('Please enter API key first', 'warning');
    
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    btn.disabled = true;
    
    try {
        const response = await axios.post('/api/admin/test/news', { apiKey });
        if (response.data.success) {
            showToast(`✅ Found ${response.data.data.count} articles`, 'success');
        } else {
            showToast('Test failed: ' + response.data.error, 'error');
        }
    } catch (error) {
        showToast('Test failed', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.testGNews = async function() {
    const apiKey = document.getElementById('gnews_api_key').value;
    if (!apiKey) return showToast('Please enter API key first', 'warning');
    
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    btn.disabled = true;
    
    try {
        const response = await axios.post('/api/admin/test/gnews', { apiKey });
        if (response.data.success) {
            showToast(`✅ Found ${response.data.data.count} articles`, 'success');
        } else {
            showToast('Test failed: ' + response.data.error, 'error');
        }
    } catch (error) {
        showToast('Test failed', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.testGemini = async function() {
    const apiKey = document.getElementById('gemini_api_key').value;
    if (!apiKey) return showToast('Please enter API key first', 'warning');
    
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    btn.disabled = true;
    
    try {
        const response = await axios.post('/api/admin/test/gemini', { apiKey });
        if (response.data.success) {
            showToast('✅ Gemini AI working!', 'success');
        } else {
            showToast('Test failed: ' + response.data.error, 'error');
        }
    } catch (error) {
        showToast('Test failed', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.testWhatsApp = async function() {
    const phoneNumberId = document.getElementById('whatsapp_phone_number_id').value;
    const accessToken = document.getElementById('whatsapp_access_token').value;
    
    if (!phoneNumberId || !accessToken) {
        return showToast('Please save WhatsApp settings first', 'warning');
    }
    
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    btn.disabled = true;
    
    try {
        const response = await axios.post('/api/admin/test/whatsapp', {
            phoneNumberId,
            accessToken
        });
        if (response.data.success) {
            showToast('✅ WhatsApp connected!', 'success');
        } else {
            showToast('Test failed: ' + response.data.error, 'error');
        }
    } catch (error) {
        showToast('Test failed', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

// ===================
// TOGGLE FUNCTIONS
// ===================

window.toggleWhatsApp = async function(enabled) {
    try {
        const response = await axios.post('/api/admin/settings', {
            settings: { whatsapp_enabled: enabled ? 1 : 0 }
        });
        if (response.data.success) {
            showToast(enabled ? 'WhatsApp enabled' : 'WhatsApp disabled', 'info');
        }
    } catch (error) {
        showToast('Toggle failed', 'error');
    }
};

// ===================
// USER MANAGEMENT
// ===================

window.loadUsers = async function() {
    try {
        const response = await axios.get('/api/admin/users');
        if (response.data.success) {
            state.users = response.data.users;
            renderUsers();
        }
    } catch (error) {
        document.getElementById('usersTableBody').innerHTML = 
            '<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Failed to load users</td></tr>';
    }
};

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (state.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.users.map(user => {
        const statusColors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            suspended: 'bg-red-100 text-red-800'
        };
        
        const planColors = {
            free: 'bg-gray-100 text-gray-800',
            trial: 'bg-blue-100 text-blue-800',
            premium: 'bg-purple-100 text-purple-800'
        };
        
        const date = new Date(user.created_at).toLocaleDateString();
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-900">${user.email}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${user.name || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${planColors[user.subscription_plan] || planColors.free}">
                        ${user.subscription_plan}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColors[user.subscription_status] || statusColors.inactive}">
                        ${user.subscription_status}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">${date}</td>
                <td class="px-6 py-4 text-sm">
                    <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-800 mr-3 font-semibold">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                    <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-800 font-semibold">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

window.showAddUserModal = function() {
    document.getElementById('userModal').classList.remove('hidden');
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userPasswordGroup').classList.remove('hidden');
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
    document.getElementById('userPasswordGroup').classList.remove('hidden');
    document.getElementById('userPassword').value = '';
    document.getElementById('userPassword').placeholder = 'Leave blank to keep current password';
};

window.saveUser = async function() {
    const email = document.getElementById('userEmail').value;
    const name = document.getElementById('userName').value;
    const plan = document.getElementById('userPlan').value;
    const status = document.getElementById('userStatus').value;
    const password = document.getElementById('userPassword').value;
    
    if (!email) return showToast('Email required', 'warning');
    
    const userData = {
        email,
        name,
        subscription_plan: plan,
        subscription_status: status
    };
    
    if (password) {
        userData.password = password;
    }
    
    try {
        if (state.currentUser) {
            await axios.put(`/api/admin/users/${state.currentUser.id}`, userData);
            showToast('User updated!', 'success');
        } else {
            if (!password) {
                return showToast('Password required for new users', 'warning');
            }
            await axios.post('/api/admin/users', userData);
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

// ===================
// LICENSE KEY MANAGEMENT
// ===================

window.loadLicenseKeys = async function() {
    try {
        const response = await axios.get('/api/admin/license-keys');
        if (response.data.success) {
            state.licenseKeys = response.data.keys;
            renderLicenseKeys();
        }
    } catch (error) {
        document.getElementById('licenseKeysTableBody').innerHTML = 
            '<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Failed to load license keys</td></tr>';
    }
};

function renderLicenseKeys() {
    const tbody = document.getElementById('licenseKeysTableBody');
    if (state.licenseKeys.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No license keys generated yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.licenseKeys.map(key => {
        const statusColors = {
            unused: 'bg-green-100 text-green-800',
            used: 'bg-gray-100 text-gray-800'
        };
        
        const createdDate = new Date(key.created_at).toLocaleDateString();
        const usedDate = key.used_at ? new Date(key.used_at).toLocaleDateString() : '-';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-mono text-gray-900">${key.license_key}</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                        ${key.plan_type}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">${key.duration_days} days</td>
                <td class="px-6 py-4">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${statusColors[key.is_used ? 'used' : 'unused']}">
                        ${key.is_used ? 'Used' : 'Unused'}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">${key.used_by_email || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${createdDate}</td>
            </tr>
        `;
    }).join('');
}

window.showGenerateLicenseModal = function() {
    document.getElementById('licenseModal').classList.remove('hidden');
};

window.closeLicenseModal = function() {
    document.getElementById('licenseModal').classList.add('hidden');
};

window.generateLicenseKey = async function() {
    const planType = document.getElementById('licensePlanType').value;
    const duration = document.getElementById('licenseDuration').value;
    
    if (!duration || duration < 1) {
        return showToast('Please enter valid duration', 'warning');
    }
    
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
    btn.disabled = true;
    
    try {
        const response = await axios.post('/api/admin/generate-license', {
            planType,
            durationDays: parseInt(duration)
        });
        
        if (response.data.success) {
            showToast('License key generated!', 'success');
            document.getElementById('generatedKey').textContent = response.data.licenseKey;
            document.getElementById('generatedKeyDisplay').classList.remove('hidden');
            loadLicenseKeys();
        }
    } catch (error) {
        showToast('Generation failed', 'error');
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
};

window.copyLicenseKey = function() {
    const key = document.getElementById('generatedKey').textContent;
    navigator.clipboard.writeText(key);
    showToast('License key copied!', 'success');
};

// ===================
// API LOGS
// ===================

window.loadLogs = async function() {
    try {
        const response = await axios.get('/api/admin/logs');
        if (response.data.success) {
            state.logs = response.data.logs;
            renderLogs();
        }
    } catch (error) {
        document.getElementById('logsTableBody').innerHTML = 
            '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Failed to load logs</td></tr>';
    }
};

function renderLogs() {
    const tbody = document.getElementById('logsTableBody');
    if (state.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No logs found</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.logs.map(log => {
        const time = new Date(log.created_at).toLocaleString();
        const statusIcon = log.success ? '✅' : '❌';
        const statusColor = log.success ? 'text-green-600' : 'text-red-600';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm text-gray-700">${time}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">${log.api_name}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${log.action}</td>
                <td class="px-6 py-4 text-sm ${statusColor}">${statusIcon}</td>
                <td class="px-6 py-4 text-sm text-gray-700">${log.details || log.error_message || '-'}</td>
            </tr>
        `;
    }).join('');
}

// ===================
// LOGOUT
// ===================

window.logout = async function() {
    try {
        await axios.post('/api/admin/auth/logout');
        window.location.href = '/admin';
    } catch (error) {
        window.location.href = '/admin';
    }
};

// ===================
// INITIALIZATION
// ===================

document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadSettings();
    loadUsers();
    loadLogs();
    loadLicenseKeys();
});
