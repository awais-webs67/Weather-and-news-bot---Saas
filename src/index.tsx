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
        <title>AlertFlow - Smart Weather & News Automation</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800;900&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
            }
            h1, h2, h3, h4 {
                font-family: 'Poppins', sans-serif;
            }
            .hero-gradient {
                background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%);
                position: relative;
                overflow: hidden;
            }
            .hero-gradient::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2314B8A6' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                opacity: 0.3;
            }
            .feature-card {
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }
            .feature-card:hover {
                transform: translateY(-8px);
                border-color: #14B8A6;
                box-shadow: 0 20px 40px rgba(20, 184, 166, 0.15);
            }
            .gradient-text {
                background: linear-gradient(135deg, #14B8A6 0%, #0EA5E9 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .pulse-animation {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            .pricing-card {
                transition: all 0.3s ease;
            }
            .pricing-card:hover {
                transform: scale(1.03);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
            }
            .floating {
                animation: floating 3s ease-in-out infinite;
            }
            @keyframes floating {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
        </style>
    </head>
    <body class="bg-white">
        <!-- Navigation -->
        <nav class="bg-white/95 backdrop-blur-sm shadow-sm fixed w-full z-50 border-b border-gray-100">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-20 items-center">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <div class="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-xl blur opacity-60"></div>
                            <div class="relative bg-gradient-to-br from-teal-500 to-blue-600 p-2.5 rounded-xl">
                                <i class="fas fa-bolt text-2xl text-white"></i>
                            </div>
                        </div>
                        <span class="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            AlertFlow
                        </span>
                    </div>
                    <div class="hidden md:flex items-center space-x-8">
                        <a href="#features" class="text-gray-600 hover:text-gray-900 font-medium transition">Features</a>
                        <a href="#how-it-works" class="text-gray-600 hover:text-gray-900 font-medium transition">How It Works</a>
                        <a href="#pricing" class="text-gray-600 hover:text-gray-900 font-medium transition">Pricing</a>
                        <a href="/auth/login" class="text-gray-600 hover:text-gray-900 font-medium transition">Login</a>
                        <a href="/auth/signup" class="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all">
                            Start Free Trial
                        </a>
                    </div>
                    <!-- Mobile menu button -->
                    <button onclick="toggleMobileMenu()" class="md:hidden text-gray-700 hover:text-gray-900 transition">
                        <i id="menuIcon" class="fas fa-bars text-2xl"></i>
                    </button>
                </div>
                <!-- Mobile Menu -->
                <div id="mobileMenu" class="hidden md:hidden pb-6 pt-4 border-t border-gray-100">
                    <div class="flex flex-col space-y-4">
                        <a href="#features" onclick="closeMobileMenu()" class="text-gray-600 hover:text-gray-900 font-medium transition py-2 px-4 rounded-lg hover:bg-gray-50">Features</a>
                        <a href="#how-it-works" onclick="closeMobileMenu()" class="text-gray-600 hover:text-gray-900 font-medium transition py-2 px-4 rounded-lg hover:bg-gray-50">How It Works</a>
                        <a href="#pricing" onclick="closeMobileMenu()" class="text-gray-600 hover:text-gray-900 font-medium transition py-2 px-4 rounded-lg hover:bg-gray-50">Pricing</a>
                        <a href="/auth/login" class="text-gray-600 hover:text-gray-900 font-medium transition py-2 px-4 rounded-lg hover:bg-gray-50">Login</a>
                        <a href="/auth/signup" class="bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition text-center">
                            Start Free Trial
                        </a>
                    </div>
                </div>
            </div>
        </nav>
        
        <script>
            function toggleMobileMenu() {
                const menu = document.getElementById('mobileMenu');
                const icon = document.getElementById('menuIcon');
                if (menu.classList.contains('hidden')) {
                    menu.classList.remove('hidden');
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    menu.classList.add('hidden');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
            
            function closeMobileMenu() {
                const menu = document.getElementById('mobileMenu');
                const icon = document.getElementById('menuIcon');
                menu.classList.add('hidden');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        </script>

        <!-- Hero Section -->
        <div class="hero-gradient text-white pt-32 pb-20 relative">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div class="inline-flex items-center px-4 py-2 bg-teal-500/20 backdrop-blur-sm border border-teal-400/30 rounded-full mb-6">
                            <span class="w-2 h-2 bg-teal-400 rounded-full mr-2 pulse-animation"></span>
                            <span class="text-sm font-semibold text-teal-300">AI-Powered Smart Alerts</span>
                        </div>
                        <h1 class="text-5xl lg:text-6xl font-black mb-6 leading-tight">
                            Stay Ahead with
                            <span class="block mt-2 gradient-text">Smart Weather & News</span>
                        </h1>
                        <p class="text-xl mb-8 text-gray-300 leading-relaxed">
                            Automated weather forecasts and curated news summaries delivered instantly to Telegram. 
                            Perfect timing, personalized content, zero effort.
                        </p>
                        <div class="flex flex-col sm:flex-row gap-4 mb-10">
                            <a href="/auth/signup" class="group bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center">
                                Start 3-Day Free Trial
                                <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                            </a>
                            <a href="#how-it-works" class="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 hover:border-white transition-all flex items-center justify-center backdrop-blur-sm">
                                <i class="fas fa-play-circle mr-2"></i>
                                See How It Works
                            </a>
                        </div>
                        <div class="flex flex-wrap gap-6 text-sm">
                            <div class="flex items-center text-gray-300">
                                <i class="fas fa-check-circle text-teal-400 mr-2 text-lg"></i>
                                <span class="font-medium">No Credit Card Required</span>
                            </div>
                            <div class="flex items-center text-gray-300">
                                <i class="fas fa-check-circle text-teal-400 mr-2 text-lg"></i>
                                <span class="font-medium">Setup in 60 Seconds</span>
                            </div>
                            <div class="flex items-center text-gray-300">
                                <i class="fas fa-check-circle text-teal-400 mr-2 text-lg"></i>
                                <span class="font-medium">Cancel Anytime</span>
                            </div>
                        </div>
                    </div>
                    <div class="hidden lg:block">
                        <div class="relative floating">
                            <div class="absolute inset-0 bg-gradient-to-br from-teal-400 to-blue-500 rounded-3xl blur-3xl opacity-30"></div>
                            <div class="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 space-y-4">
                                <!-- Weather Card -->
                                <div class="bg-gradient-to-br from-orange-400 to-orange-600 p-6 rounded-2xl shadow-2xl">
                                    <div class="flex items-center justify-between mb-3">
                                        <span class="text-white/80 text-sm font-semibold">Morning Update</span>
                                        <i class="fas fa-sun text-yellow-300 text-3xl"></i>
                                    </div>
                                    <div class="text-white text-4xl font-bold mb-2">24°C</div>
                                    <p class="text-white/90 text-sm">Sunny with clear skies. Perfect day ahead! ☀️</p>
                                </div>
                                <!-- News Card -->
                                <div class="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-2xl">
                                    <div class="flex items-center justify-between mb-3">
                                        <span class="text-white/80 text-sm font-semibold">Top Headlines</span>
                                        <i class="fas fa-newspaper text-white text-2xl"></i>
                                    </div>
                                    <p class="text-white text-sm font-medium leading-relaxed">
                                        5 important stories curated for you from trusted sources 📰
                                    </p>
                                </div>
                                <!-- Telegram Badge -->
                                <div class="bg-gradient-to-br from-teal-500 to-teal-600 p-4 rounded-2xl shadow-xl flex items-center justify-between">
                                    <div class="flex items-center">
                                        <i class="fab fa-telegram text-white text-3xl mr-3"></i>
                                        <span class="text-white font-semibold">Delivered to Telegram</span>
                                    </div>
                                    <i class="fas fa-check-circle text-white text-xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- How It Works Section -->
        <div id="how-it-works" class="py-24 bg-gradient-to-b from-gray-50 to-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-5xl font-black mb-4 text-gray-900">Get Started in Minutes</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">Simple setup, powerful automation. Here's how AlertFlow works</p>
                </div>
                <div class="grid md:grid-cols-4 gap-8 relative">
                    <!-- Connection line (desktop) -->
                    <div class="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-teal-200 via-blue-200 to-purple-200" style="top: 4rem; z-index: 0;"></div>
                    
                    <div class="text-center relative z-10">
                        <div class="bg-gradient-to-br from-teal-500 to-teal-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition-transform">
                            <span class="text-3xl font-black text-white">1</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3 text-gray-900">Sign Up Free</h3>
                        <p class="text-gray-600 leading-relaxed">Create your account in under 60 seconds. No credit card needed.</p>
                    </div>
                    
                    <div class="text-center relative z-10">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition-transform">
                            <span class="text-3xl font-black text-white">2</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3 text-gray-900">Connect Telegram</h3>
                        <p class="text-gray-600 leading-relaxed">Link your Telegram account with one simple command.</p>
                    </div>
                    
                    <div class="text-center relative z-10">
                        <div class="bg-gradient-to-br from-purple-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition-transform">
                            <span class="text-3xl font-black text-white">3</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3 text-gray-900">Customize</h3>
                        <p class="text-gray-600 leading-relaxed">Set your location, language, and preferred notification times.</p>
                    </div>
                    
                    <div class="text-center relative z-10">
                        <div class="bg-gradient-to-br from-orange-500 to-orange-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-110 transition-transform">
                            <span class="text-3xl font-black text-white">4</span>
                        </div>
                        <h3 class="text-xl font-bold mb-3 text-gray-900">Relax & Receive</h3>
                        <p class="text-gray-600 leading-relaxed">Get perfectly timed weather and news updates automatically.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div id="features" class="py-24 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-5xl font-black mb-4 text-gray-900">Powerful Features</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need for smart, automated daily updates</p>
                </div>
                <div class="grid md:grid-cols-3 gap-8">
                    <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl feature-card border border-gray-100">
                        <div class="bg-gradient-to-br from-orange-400 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-cloud-sun text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-900">Smart Weather</h3>
                        <p class="text-gray-600 leading-relaxed">Morning and evening forecasts with 7-day predictions. Temperature, conditions, and hourly breakdowns.</p>
                    </div>
                    
                    <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl feature-card border border-gray-100">
                        <div class="bg-gradient-to-br from-blue-500 to-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-newspaper text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-900">Curated News</h3>
                        <p class="text-gray-600 leading-relaxed">Top 5 headlines from your country. No clutter, just what matters most delivered daily.</p>
                    </div>
                    
                    <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl feature-card border border-gray-100">
                        <div class="bg-gradient-to-br from-teal-500 to-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-clock text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-900">Perfect Timing</h3>
                        <p class="text-gray-600 leading-relaxed">Schedule updates for YOUR timezone. Multiple notifications per day, all customizable.</p>
                    </div>
                    
                    <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl feature-card border border-gray-100">
                        <div class="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-globe text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-900">Multi-Language</h3>
                        <p class="text-gray-600 leading-relaxed">English and Urdu supported. Weather and news in your preferred language.</p>
                    </div>
                    
                    <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl feature-card border border-gray-100">
                        <div class="bg-gradient-to-br from-blue-400 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fab fa-telegram text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-900">Telegram Native</h3>
                        <p class="text-gray-600 leading-relaxed">Rich formatted messages with emojis. Interactive commands for instant weather and news.</p>
                    </div>
                    
                    <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl feature-card border border-gray-100">
                        <div class="bg-gradient-to-br from-red-500 to-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
                            <i class="fas fa-bolt text-3xl text-white"></i>
                        </div>
                        <h3 class="text-2xl font-bold mb-4 text-gray-900">AI-Enhanced</h3>
                        <p class="text-gray-600 leading-relaxed">Powered by Gemini AI for intelligent summaries and weather insights.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pricing Section -->
        <div id="pricing" class="py-24 bg-gradient-to-b from-gray-50 to-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="text-center mb-16">
                    <h2 class="text-5xl font-black mb-4 text-gray-900">Simple, Transparent Pricing</h2>
                    <p class="text-xl text-gray-600 max-w-2xl mx-auto">Start free, upgrade when you're ready. No hidden fees.</p>
                </div>
                <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <!-- Free Trial -->
                    <div class="bg-white border-2 border-gray-200 rounded-3xl p-8 hover:shadow-xl transition-all pricing-card">
                        <div class="text-center mb-6">
                            <h3 class="text-2xl font-bold mb-2 text-gray-900">Free Trial</h3>
                            <div class="text-5xl font-black mb-2 text-gray-900">$0</div>
                            <div class="text-gray-600 font-medium">for 3 days</div>
                        </div>
                        <ul class="space-y-4 mb-8">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">All premium features</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">Telegram integration</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">No credit card needed</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">Cancel anytime</span>
                            </li>
                        </ul>
                        <a href="/auth/signup" class="block text-center bg-gray-100 text-gray-900 py-4 rounded-xl font-bold hover:bg-gray-200 transition">
                            Start Free Trial
                        </a>
                    </div>
                    
                    <!-- Monthly Plan -->
                    <div class="bg-gradient-to-br from-teal-500 to-blue-600 rounded-3xl p-8 shadow-2xl transform md:scale-105 pricing-card relative overflow-hidden">
                        <div class="absolute top-4 right-4 bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                            POPULAR
                        </div>
                        <div class="text-center mb-6">
                            <h3 class="text-2xl font-bold mb-2 text-white">Monthly</h3>
                            <div class="text-5xl font-black mb-2 text-white">$9.99</div>
                            <div class="text-teal-100 font-medium">per month</div>
                        </div>
                        <ul class="space-y-4 mb-8">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-white mr-3 mt-1"></i>
                                <span class="text-white">Unlimited weather updates</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-white mr-3 mt-1"></i>
                                <span class="text-white">Daily news summaries</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-white mr-3 mt-1"></i>
                                <span class="text-white">7-day forecasts</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-white mr-3 mt-1"></i>
                                <span class="text-white">Multi-language support</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-white mr-3 mt-1"></i>
                                <span class="text-white">Priority support</span>
                            </li>
                        </ul>
                        <a href="/auth/signup" class="block text-center bg-white text-teal-600 py-4 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg">
                            Get Started Now
                        </a>
                    </div>
                    
                    <!-- Yearly Plan -->
                    <div class="bg-white border-2 border-teal-500 rounded-3xl p-8 hover:shadow-xl transition-all pricing-card relative">
                        <div class="absolute top-4 right-4 bg-teal-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                            SAVE 20%
                        </div>
                        <div class="text-center mb-6">
                            <h3 class="text-2xl font-bold mb-2 text-gray-900">Yearly</h3>
                            <div class="text-5xl font-black mb-2 text-gray-900">$95.99</div>
                            <div class="text-gray-600 font-medium">per year</div>
                            <div class="mt-2 text-sm font-semibold text-teal-600">Save $24 annually</div>
                        </div>
                        <ul class="space-y-4 mb-8">
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">All Monthly features</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">AI-powered insights</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">VIP support</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">Early access to features</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-check-circle text-teal-500 mr-3 mt-1"></i>
                                <span class="text-gray-700">20% discount</span>
                            </li>
                        </ul>
                        <a href="/auth/signup" class="block text-center bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 rounded-xl font-bold hover:shadow-lg transition">
                            Get Best Value
                        </a>
                    </div>
                </div>
                
                <!-- WhatsApp Payment Note -->
                <div class="mt-12 text-center">
                    <div class="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-xl">
                        <i class="fab fa-whatsapp text-2xl text-green-600 mr-3"></i>
                        <span class="text-gray-700 font-medium">💳 Easy payment via WhatsApp after signup</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-12 mb-12">
                    <div class="col-span-2 md:col-span-1">
                        <div class="flex items-center space-x-3 mb-4">
                            <div class="bg-gradient-to-br from-teal-500 to-blue-600 p-2 rounded-xl">
                                <i class="fas fa-bolt text-xl text-white"></i>
                            </div>
                            <span class="text-2xl font-black">AlertFlow</span>
                        </div>
                        <p class="text-gray-400 text-sm leading-relaxed">
                            Smart weather and news automation for busy people. Stay informed effortlessly.
                        </p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4 text-white">Product</h4>
                        <ul class="space-y-3 text-sm">
                            <li><a href="#features" class="text-gray-400 hover:text-white transition">Features</a></li>
                            <li><a href="#pricing" class="text-gray-400 hover:text-white transition">Pricing</a></li>
                            <li><a href="#how-it-works" class="text-gray-400 hover:text-white transition">How It Works</a></li>
                            <li><a href="/auth/signup" class="text-gray-400 hover:text-white transition">Start Free Trial</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4 text-white">Support</h4>
                        <ul class="space-y-3 text-sm">
                            <li><a href="/dashboard" class="text-gray-400 hover:text-white transition">Dashboard</a></li>
                            <li><a href="/auth/login" class="text-gray-400 hover:text-white transition">Login</a></li>
                            <li><a href="https://wa.me/923430641457" target="_blank" class="text-gray-400 hover:text-white transition">Contact Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4 text-white">Legal</h4>
                        <ul class="space-y-3 text-sm">
                            <li><a href="#" class="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                            <li><a href="#" class="text-gray-400 hover:text-white transition">Refund Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-700 pt-8">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <p class="text-sm text-gray-400">© 2025 AlertFlow. All rights reserved.</p>
                        <div class="flex space-x-6 mt-4 md:mt-0">
                            <a href="https://t.me/AivraSols_bot" target="_blank" class="text-gray-400 hover:text-white transition">
                                <i class="fab fa-telegram text-xl"></i>
                            </a>
                            <a href="https://wa.me/923430641457" target="_blank" class="text-gray-400 hover:text-white transition">
                                <i class="fab fa-whatsapp text-xl"></i>
                            </a>
                        </div>
                    </div>
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
