import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { Bindings } from './types'

// Import routes
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import apiRoutes from './routes/api'
import adminRoutes from './routes/admin'
import adminApiRoutes from './routes/admin-api'
import webhookRoutes from './routes/webhook'

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Mount routes
app.route('/auth', authRoutes)
app.route('/dashboard', dashboardRoutes)
app.route('/api', apiRoutes)
app.route('/api/admin', adminApiRoutes)
app.route('/admin', adminRoutes)
app.route('/webhook', webhookRoutes)

// Landing page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WeatherNews Alert - Daily Weather & News Updates</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .hero-gradient {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .feature-card {
                transition: transform 0.3s ease;
            }
            .feature-card:hover {
                transform: translateY(-5px);
            }
        </style>
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
                    <div class="flex space-x-4">
                        <a href="/auth/login" class="text-gray-600 hover:text-gray-900">Login</a>
                        <a href="/auth/signup" class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                            Start Free Trial
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <div class="hero-gradient text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 class="text-5xl font-bold mb-6">
                    Weather & News Updates Delivered to Your Phone
                </h1>
                <p class="text-xl mb-8 text-purple-100">
                    Get personalized weather forecasts and local news summaries directly on Telegram or WhatsApp
                </p>
                <div class="flex justify-center space-x-4">
                    <a href="/auth/signup" class="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 text-lg">
                        Start 3-Day Free Trial
                    </a>
                    <a href="#how-it-works" class="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 text-lg">
                        Learn More
                    </a>
                </div>
                <div class="mt-8 flex justify-center space-x-6 text-sm">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span>No Credit Card Required</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span>Cancel Anytime</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        <span>Instant Setup</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- How It Works Section -->
        <div id="how-it-works" class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-4xl font-bold text-center mb-12 text-gray-800">How It Works</h2>
                <div class="grid md:grid-cols-4 gap-8">
                    <div class="text-center">
                        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl font-bold text-purple-600">1</span>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Sign Up Free</h3>
                        <p class="text-gray-600">Create your account in less than 1 minute</p>
                    </div>
                    <div class="text-center">
                        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl font-bold text-purple-600">2</span>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Choose Channel</h3>
                        <p class="text-gray-600">Connect via Telegram or WhatsApp</p>
                    </div>
                    <div class="text-center">
                        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl font-bold text-purple-600">3</span>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Set Preferences</h3>
                        <p class="text-gray-600">Choose your city, language, and schedule</p>
                    </div>
                    <div class="text-center">
                        <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span class="text-2xl font-bold text-purple-600">4</span>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Receive Updates</h3>
                        <p class="text-gray-600">Get daily weather and news automatically</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="py-20 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-4xl font-bold text-center mb-12 text-gray-800">Features</h2>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-white p-6 rounded-lg shadow-md feature-card">
                        <i class="fas fa-cloud-sun text-4xl text-purple-600 mb-4"></i>
                        <h3 class="text-xl font-semibold mb-3">Weather Updates</h3>
                        <p class="text-gray-600">Morning and evening weather forecasts with hourly and weekly predictions</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md feature-card">
                        <i class="fas fa-newspaper text-4xl text-purple-600 mb-4"></i>
                        <h3 class="text-xl font-semibold mb-3">Local News</h3>
                        <p class="text-gray-600">Daily news summaries from your city and country</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md feature-card">
                        <i class="fas fa-bell text-4xl text-purple-600 mb-4"></i>
                        <h3 class="text-xl font-semibold mb-3">Custom Schedule</h3>
                        <p class="text-gray-600">Set your preferred notification times for weather and news</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md feature-card">
                        <i class="fas fa-globe text-4xl text-purple-600 mb-4"></i>
                        <h3 class="text-xl font-semibold mb-3">Multi-Language</h3>
                        <p class="text-gray-600">Available in English and Urdu (more languages coming soon)</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md feature-card">
                        <i class="fab fa-telegram text-4xl text-purple-600 mb-4"></i>
                        <h3 class="text-xl font-semibold mb-3">Telegram & WhatsApp</h3>
                        <p class="text-gray-600">Receive updates on your favorite messaging platform</p>
                    </div>
                    <div class="bg-white p-6 rounded-lg shadow-md feature-card">
                        <i class="fas fa-exclamation-triangle text-4xl text-purple-600 mb-4"></i>
                        <h3 class="text-xl font-semibold mb-3">Weather Alerts</h3>
                        <p class="text-gray-600">Get notified about severe weather conditions instantly</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pricing Section -->
        <div class="py-20 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 class="text-4xl font-bold text-center mb-12 text-gray-800">Simple Pricing</h2>
                <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <div class="border-2 border-gray-200 rounded-lg p-8 hover:border-purple-600 transition">
                        <h3 class="text-2xl font-bold mb-2">Free Trial</h3>
                        <div class="text-4xl font-bold mb-4">$0<span class="text-lg text-gray-600">/3 days</span></div>
                        <ul class="space-y-3 mb-6">
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> All features included</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Telegram support</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> No credit card required</li>
                        </ul>
                        <a href="/auth/signup" class="block text-center bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300">
                            Start Free Trial
                        </a>
                    </div>
                    <div class="border-2 border-purple-600 rounded-lg p-8 shadow-lg transform scale-105">
                        <div class="bg-purple-600 text-white text-sm px-3 py-1 rounded-full inline-block mb-2">Popular</div>
                        <h3 class="text-2xl font-bold mb-2">Monthly</h3>
                        <div class="text-4xl font-bold mb-4">$9.99<span class="text-lg text-gray-600">/month</span></div>
                        <ul class="space-y-3 mb-6">
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> All features included</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Telegram & WhatsApp</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Priority delivery</li>
                        </ul>
                        <a href="/auth/signup" class="block text-center bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                            Get Started
                        </a>
                    </div>
                    <div class="border-2 border-gray-200 rounded-lg p-8 hover:border-purple-600 transition">
                        <h3 class="text-2xl font-bold mb-2">Yearly</h3>
                        <div class="text-4xl font-bold mb-4">$95.99<span class="text-lg text-gray-600">/year</span></div>
                        <div class="text-sm text-green-600 mb-4">Save 20%</div>
                        <ul class="space-y-3 mb-6">
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> All features included</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Telegram & WhatsApp</li>
                            <li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i> Custom schedules</li>
                        </ul>
                        <a href="/auth/signup" class="block text-center bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">
                            Get Started
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8">
                    <div>
                        <h4 class="font-bold mb-4">WeatherNews Alert</h4>
                        <p class="text-gray-400 text-sm">Daily weather and news updates delivered to your messaging app</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Product</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="#" class="hover:text-white">Features</a></li>
                            <li><a href="#" class="hover:text-white">Pricing</a></li>
                            <li><a href="#" class="hover:text-white">How It Works</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Company</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="#" class="hover:text-white">About</a></li>
                            <li><a href="#" class="hover:text-white">Contact</a></li>
                            <li><a href="#" class="hover:text-white">Support</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4">Legal</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="#" class="hover:text-white">Privacy Policy</a></li>
                            <li><a href="#" class="hover:text-white">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
                    © 2025 WeatherNews Alert. All rights reserved.
                </div>
            </div>
        </footer>
    </body>
    </html>
  `)
})

// Export scheduled handler for Cloudflare Cron Triggers
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    // This runs every minute to check for scheduled messages
    const { MessageScheduler } = await import('./lib/scheduler')
    const scheduler = new MessageScheduler(env.DB)
    await scheduler.sendScheduledMessages()
  }
}
