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
        <title>Login - WeatherNews Alert</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <div class="flex justify-center">
                        <i class="fas fa-cloud-sun text-5xl text-purple-600"></i>
                    </div>
                    <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Or
                        <a href="/auth/signup" class="font-medium text-purple-600 hover:text-purple-500">
                            start your free 3-day trial
                        </a>
                    </p>
                </div>
                <form class="mt-8 space-y-6" id="loginForm">
                    <div id="errorMessage" class="hidden bg-red-50 text-red-600 p-3 rounded-lg text-sm"></div>
                    <div class="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label for="email" class="sr-only">Email address</label>
                            <input id="email" name="email" type="email" required 
                                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm" 
                                placeholder="Email address">
                        </div>
                        <div>
                            <label for="password" class="sr-only">Password</label>
                            <input id="password" name="password" type="password" required 
                                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm" 
                                placeholder="Password">
                        </div>
                    </div>

                    <div>
                        <button type="submit" 
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('loginForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorDiv = document.getElementById('errorMessage');
                errorDiv.classList.add('hidden');
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await axios.post('/api/auth/login', { email, password });
                    if (response.data.success) {
                        window.location.href = '/dashboard';
                    }
                } catch (error) {
                    errorDiv.textContent = error.response?.data?.error || 'Login failed';
                    errorDiv.classList.remove('hidden');
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
        <title>Sign Up - WeatherNews Alert</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div class="max-w-md w-full space-y-8">
                <div>
                    <div class="flex justify-center">
                        <i class="fas fa-cloud-sun text-5xl text-purple-600"></i>
                    </div>
                    <h2 class="mt-6 text-center text-3xl font-bold text-gray-900">
                        Start your free 3-day trial
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Already have an account?
                        <a href="/auth/login" class="font-medium text-purple-600 hover:text-purple-500">
                            Sign in
                        </a>
                    </p>
                </div>
                <form class="mt-8 space-y-6" id="signupForm">
                    <div id="errorMessage" class="hidden bg-red-50 text-red-600 p-3 rounded-lg text-sm"></div>
                    <div id="successMessage" class="hidden bg-green-50 text-green-600 p-3 rounded-lg text-sm"></div>
                    
                    <div class="space-y-4">
                        <div>
                            <label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
                            <input id="name" name="name" type="text" required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                                placeholder="John Doe">
                        </div>
                        
                        <div>
                            <label for="email" class="block text-sm font-medium text-gray-700">Email address</label>
                            <input id="email" name="email" type="email" required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                                placeholder="you@example.com">
                        </div>
                        
                        <div>
                            <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                            <input id="password" name="password" type="password" required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" 
                                placeholder="Minimum 6 characters">
                        </div>
                    </div>

                    <div>
                        <button type="submit" 
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                            Start Free Trial
                        </button>
                    </div>
                    
                    <p class="text-xs text-center text-gray-500">
                        No credit card required • Cancel anytime
                    </p>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('signupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const errorDiv = document.getElementById('errorMessage');
                const successDiv = document.getElementById('successMessage');
                errorDiv.classList.add('hidden');
                successDiv.classList.add('hidden');
                
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                if (password.length < 6) {
                    errorDiv.textContent = 'Password must be at least 6 characters';
                    errorDiv.classList.remove('hidden');
                    return;
                }
                
                try {
                    const response = await axios.post('/api/auth/signup', { name, email, password });
                    if (response.data.success) {
                        successDiv.textContent = 'Account created! Redirecting...';
                        successDiv.classList.remove('hidden');
                        setTimeout(() => {
                            window.location.href = '/dashboard';
                        }, 1500);
                    }
                } catch (error) {
                    errorDiv.textContent = error.response?.data?.error || 'Signup failed';
                    errorDiv.classList.remove('hidden');
                }
            });
        </script>
    </body>
    </html>
  `)
})

export default auth
