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
  
  // User is authenticated, show simple dashboard
  return c.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - WeatherNews Alert</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-purple-50 to-indigo-100">
    <!-- Navigation -->
    <nav class="bg-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="flex items-center space-x-3">
                    <div class="bg-gradient-to-br from-purple-600 to-indigo-600 p-2 rounded-lg">
                        <i class="fas fa-cloud-sun text-2xl text-white"></i>
                    </div>
                    <span class="text-xl font-bold gradient-text">WeatherNews Alert</span>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="/" class="nav-link text-gray-600">
                        <i class="fas fa-home"></i> Home
                    </a>
                    <a href="/static/admin-login.html" class="nav-link text-gray-600">
                        <i class="fas fa-cog"></i> Admin
                    </a>
                    <span class="text-sm text-gray-600" id="userEmail"></span>
                    <button onclick="logout()" class="nav-link text-red-600 hover:bg-red-50">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="glass-card">
            <div class="text-center py-12">
                <i class="fas fa-rocket text-6xl text-purple-600 mb-6"></i>
                <h1 class="text-4xl font-bold gradient-text mb-4">Welcome to Your Dashboard!</h1>
                <p class="text-xl text-gray-600 mb-8">Your WeatherNews Alert account is active</p>
                
                <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                        <i class="fas fa-cloud-sun text-4xl mb-3"></i>
                        <h3 class="text-xl font-bold mb-2">Weather Updates</h3>
                        <p class="text-sm text-blue-100">Get daily weather forecasts</p>
                    </div>
                    
                    <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                        <i class="fas fa-newspaper text-4xl mb-3"></i>
                        <h3 class="text-xl font-bold mb-2">News Summaries</h3>
                        <p class="text-sm text-green-100">Stay updated with local news</p>
                    </div>
                    
                    <div class="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                        <i class="fas fa-paper-plane text-4xl mb-3"></i>
                        <h3 class="text-xl font-bold mb-2">Telegram Delivery</h3>
                        <p class="text-sm text-purple-100">Messages on Telegram bot</p>
                    </div>
                </div>
                
                <div class="mt-12">
                    <p class="text-gray-600 mb-4">Your account is active with a 3-day free trial</p>
                    <button class="btn-primary" onclick="testNotification()">
                        <i class="fas fa-paper-plane mr-2"></i> Send Test Notification
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="/static/utils.js"></script>
    <script>
        async function loadProfile() {
            try {
                const response = await axios.get('/api/user/profile');
                if (response.data.success) {
                    const user = response.data.user;
                    document.getElementById('userEmail').textContent = user.email;
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    window.location.href = '/auth/login';
                }
            }
        }

        async function testNotification() {
            showToast('Test notification feature coming soon!', 'info');
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

        loadProfile();
    </script>
</body>
</html>
  `)
})

export default dashboard
