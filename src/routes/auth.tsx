import { Hono } from 'hono'
import { Bindings } from '../types'
import { hashPassword, verifyPassword, createSessionToken, calculateTrialEnd, isValidEmail, sanitize } from '../lib/utils'

const auth = new Hono<{ Bindings: Bindings }>()

// Login page
auth.get('/login', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Login - AlertFlow</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <!-- Back to Home Button -->
        <div class="absolute top-6 left-6 z-10">
            <a href="/" class="flex items-center space-x-2 text-gray-700 hover:text-teal-600 font-semibold transition">
                <i class="fas fa-arrow-left"></i>
                <span>Back to Home</span>
            </a>
        </div>

        <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full">
                <div class="bg-white rounded-2xl shadow-2xl p-8">
                    <div class="text-center mb-8">
                        <div class="flex justify-center mb-6">
                            <div class="relative">
                                <div class="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl blur opacity-60"></div>
                                <div class="relative bg-gradient-to-br from-teal-500 to-blue-600 p-4 rounded-2xl">
                                    <i class="fas fa-bolt text-5xl text-white"></i>
                                </div>
                            </div>
                        </div>
                        <h2 class="text-3xl font-black text-gray-900 mb-2">
                            Welcome Back
                        </h2>
                        <p class="text-gray-600">
                            Sign in to continue to AlertFlow
                        </p>
                    </div>

                    <form id="loginForm" class="space-y-6">
                        <div id="errorMessage" class="hidden bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                            <div class="flex items-center">
                                <i class="fas fa-exclamation-circle mr-2"></i>
                                <span id="errorText"></span>
                            </div>
                        </div>

                        <div>
                            <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-envelope text-teal-600 mr-1"></i> Email Address
                            </label>
                            <input id="email" name="email" type="email" required 
                                class="input-field" 
                                placeholder="you@example.com">
                        </div>

                        <div>
                            <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-lock text-teal-600 mr-1"></i> Password
                            </label>
                            <input id="password" name="password" type="password" required 
                                class="input-field" 
                                placeholder="Enter your password">
                        </div>

                        <div>
                            <button type="submit" id="submitBtn" class="btn-primary w-full text-lg py-4">
                                <i class="fas fa-sign-in-alt mr-2"></i> Sign In
                            </button>
                        </div>

                        <div class="text-center">
                            <p class="text-sm text-gray-600">
                                Don't have an account?
                                <a href="/auth/signup" class="font-semibold text-teal-600 hover:text-teal-700 transition">
                                    Start Free Trial <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/utils.js"></script>
        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorDiv = document.getElementById('errorMessage');
                const errorText = document.getElementById('errorText');
                const submitBtn = document.getElementById('submitBtn');
                
                errorDiv.classList.add('hidden');
                showLoading(submitBtn);
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await axios.post('/api/auth/login', { email, password });
                    if (response.data.success) {
                        showToast('Login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1000);
                    }
                } catch (error) {
                    hideLoading(submitBtn);
                    errorText.textContent = error.response?.data?.error || 'Login failed. Please try again.';
                    errorDiv.classList.remove('hidden');
                    showToast(error.response?.data?.error || 'Login failed', 'error');
                }
            });
        </script>
    </body>
    </html>
  `)
})

// Signup page
auth.get('/signup', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sign Up - AlertFlow</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <!-- Back to Home Button -->
        <div class="absolute top-6 left-6 z-10">
            <a href="/" class="flex items-center space-x-2 text-gray-700 hover:text-teal-600 font-semibold transition">
                <i class="fas fa-arrow-left"></i>
                <span>Back to Home</span>
            </a>
        </div>

        <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full">
                <div class="bg-white rounded-2xl shadow-2xl p-8">
                    <div class="text-center mb-8">
                        <div class="flex justify-center mb-6">
                            <div class="relative">
                                <div class="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-2xl blur opacity-60"></div>
                                <div class="relative bg-gradient-to-br from-teal-500 to-blue-600 p-4 rounded-2xl">
                                    <i class="fas fa-bolt text-5xl text-white"></i>
                                </div>
                            </div>
                        </div>
                        <h2 class="text-3xl font-black text-gray-900 mb-2">
                            Start Your Free Trial
                        </h2>
                        <p class="text-gray-600 mb-4">
                            Get 3 days free access to all features
                        </p>
                        <div class="flex justify-center space-x-4 mt-4 text-sm text-gray-600">
                            <span><i class="fas fa-check-circle text-green-500"></i> No Credit Card</span>
                            <span><i class="fas fa-check-circle text-green-500"></i> Cancel Anytime</span>
                        </div>
                    </div>

                    <form id="signupForm" class="space-y-6">
                        <div id="errorMessage" class="hidden bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                            <div class="flex items-center">
                                <i class="fas fa-exclamation-circle mr-2"></i>
                                <span id="errorText"></span>
                            </div>
                        </div>

                        <div>
                            <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-user text-teal-600 mr-1"></i> Full Name
                            </label>
                            <input id="name" name="name" type="text" required 
                                class="input-field" 
                                placeholder="John Doe">
                        </div>
                        
                        <div>
                            <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-envelope text-teal-600 mr-1"></i> Email Address
                            </label>
                            <input id="email" name="email" type="email" required 
                                class="input-field" 
                                placeholder="you@example.com">
                        </div>
                        
                        <div>
                            <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
                                <i class="fas fa-lock text-teal-600 mr-1"></i> Password
                            </label>
                            <input id="password" name="password" type="password" required 
                                class="input-field" 
                                placeholder="Minimum 6 characters">
                            <p class="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
                        </div>

                        <div>
                            <button type="submit" id="submitBtn" class="btn-primary w-full text-lg py-4">
                                <i class="fas fa-rocket mr-2"></i> Start Free Trial
                            </button>
                        </div>

                        <div class="text-center">
                            <p class="text-sm text-gray-600">
                                Already have an account?
                                <a href="/auth/login" class="font-semibold text-teal-600 hover:text-teal-700 transition">
                                    Sign In <i class="fas fa-arrow-right ml-1"></i>
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/utils.js"></script>
        <script>
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorDiv = document.getElementById('errorMessage');
                const errorText = document.getElementById('errorText');
                const submitBtn = document.getElementById('submitBtn');
                
                errorDiv.classList.add('hidden');
                
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                if (password.length < 6) {
                    errorText.textContent = 'Password must be at least 6 characters';
                    errorDiv.classList.remove('hidden');
                    showToast('Password too short', 'error');
                    return;
                }
                
                showLoading(submitBtn);
                
                try {
                    const response = await axios.post('/api/auth/signup', { name, email, password });
                    if (response.data.success) {
                        showToast('Account created successfully! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1500);
                    }
                } catch (error) {
                    hideLoading(submitBtn);
                    errorText.textContent = error.response?.data?.error || 'Signup failed. Please try again.';
                    errorDiv.classList.remove('hidden');
                    showToast(error.response?.data?.error || 'Signup failed', 'error');
                }
            });
        </script>
    </body>
    </html>
  `)
})

export default auth
