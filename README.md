# WeatherNews Alert SaaS

## 🌤️ Project Overview

A complete, modern SaaS web application that delivers **daily weather updates and local news summaries** directly to users via **Telegram or WhatsApp**. Built with cutting-edge serverless technology for global reach and blazing-fast performance.

### Key Features
- **Automated Weather Updates** - Morning and evening forecasts delivered automatically
- **Daily News Summaries** - Curated local and national news delivered daily
- **Multi-Channel Support** - Telegram (active) and WhatsApp (ready to activate)
- **Multi-Language** - English and Urdu support with more languages coming
- **Smart Scheduling** - Users control when they receive updates
- **3-Day Free Trial** - No credit card required
- **Admin Panel** - Complete system control for non-technical users
- **Responsive Design** - Beautiful UI that works on all devices

---

## 🚀 Live URLs

### Public Website
**🔗 Main Application**: https://3000-ifo5w1bpg047qfgq372y5-2e77fc33.sandbox.novita.ai

### User Access Points
- **Landing Page**: `/`
- **Sign Up**: `/auth/signup`
- **Login**: `/auth/login`
- **Dashboard**: `/dashboard` (requires login)

### Admin Access
- **Admin Panel**: `/admin`
- Configure API keys, enable/disable WhatsApp, manage users

### API Endpoints
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/user/profile` - Get user data
- `POST /api/user/preferences` - Update location & channel settings
- `POST /api/user/schedules` - Update notification schedule
- `GET /api/weather/:city` - Get weather data (placeholder)
- `GET /api/news/:country` - Get news feed (placeholder)

---

## 📊 Data Architecture

### Database: Cloudflare D1 (SQLite)
The application uses a robust relational database structure:

#### Core Tables
1. **users** - User accounts with authentication
   - Email/password authentication
   - Trial & subscription tracking
   - Telegram/WhatsApp connection info

2. **locations** - User location preferences
   - Country, city, timezone
   - Language preference (English/Urdu)
   - Temperature units (°C/°F)

3. **schedules** - Notification timing
   - Morning weather (default: 07:00)
   - Evening weather (default: 20:00)
   - Daily news (default: 09:00)

4. **messages** - Message delivery log
   - Tracks all sent messages
   - Success/failure status
   - Error logging

5. **news_items** - News cache
   - Country/city-specific news
   - Title, summary, URL, source

6. **api_settings** - System configuration
   - API keys storage
   - WhatsApp enable/disable toggle
   - Trial duration settings

7. **weather_cache** - Weather data cache
   - Reduces API costs
   - Stores recent weather data by city

8. **subscription_plans** - Available plans
   - Free Trial (3 days)
   - Monthly Premium ($9.99)
   - Yearly Premium ($95.99)

### Storage Strategy
- **D1 Database** - All relational data (users, preferences, logs)
- **Server-side caching** - Weather and news data to reduce API calls
- **Session cookies** - User authentication (7-day expiry)

---

## 🎯 Current Features (Completed)

### ✅ Authentication System
- Email/password registration with validation
- Secure password hashing (SHA-256)
- Session-based authentication
- Automatic 3-day trial activation

### ✅ User Dashboard
- Profile management
- Channel selection (Telegram/WhatsApp)
- Location & language preferences
- Custom notification schedule
- Trial status tracking

### ✅ Admin Panel
- System statistics dashboard
- WhatsApp enable/disable toggle
- API key management (Telegram, WhatsApp, Weather)
- User management table
- Real-time stats refresh

### ✅ Database & Backend
- Complete D1 database schema
- RESTful API endpoints
- User preferences storage
- Schedule management
- Message logging system

### ✅ UI/UX Design
- Modern landing page with hero section
- Responsive design (mobile-first)
- Feature showcase cards
- Pricing comparison table
- Professional color scheme (purple gradient)

---

## 🔜 Features Not Yet Implemented

### 🔨 Integration Phase (Next Priority)

1. **Weather API Integration**
   - Connect to OpenWeatherMap or WeatherAPI
   - Implement real-time weather fetching
   - Set up weather data caching
   - Format weather messages for delivery

2. **News RSS Integration**
   - Connect to news RSS feeds
   - Implement news fetching & parsing
   - Deduplicate news items
   - Generate daily news summaries

3. **Telegram Bot**
   - Create Telegram bot via BotFather
   - Implement webhook handling
   - Command system (/start, /now, /today, /news, etc.)
   - Message formatting and delivery

4. **WhatsApp Cloud API**
   - Meta Business integration
   - Webhook setup
   - Message template creation
   - Delivery system (when enabled by admin)

### 🚀 Automation Phase

5. **Scheduled Message Delivery**
   - Cloudflare Cron Triggers setup
   - Schedule processing logic
   - Batch message sending
   - Retry logic for failed messages

6. **User Commands**
   - `/start` - Welcome message
   - `/now` - Current weather
   - `/today` - Today's forecast
   - `/hourly` - Hourly forecast
   - `/week` - Weekly forecast
   - `/news` - Latest news
   - `/settings` - Update preferences
   - `/stop` - Unsubscribe

### 💳 Monetization Phase

7. **Payment Integration**
   - Stripe payment gateway
   - Subscription upgrade flow
   - Payment webhook handling
   - Trial expiry enforcement

8. **Subscription Management**
   - Auto-renewal system
   - Plan upgrade/downgrade
   - Cancellation flow
   - Grace period handling

---

## 🛠️ Tech Stack

### Backend
- **Hono** - Fast, lightweight web framework
- **TypeScript** - Type-safe development
- **Cloudflare D1** - Serverless SQLite database
- **Cloudflare Workers** - Edge runtime (serverless)

### Frontend
- **TailwindCSS** - Utility-first CSS via CDN
- **Font Awesome** - Icon library
- **Axios** - HTTP client
- **Vanilla JavaScript** - No heavy frameworks

### Deployment
- **Platform**: Cloudflare Pages
- **Edge Network**: Global CDN
- **Database**: Cloudflare D1 (SQLite)
- **Development**: Local with Wrangler CLI

---

## 📝 User Guide

### For End Users

1. **Sign Up**
   - Visit the website
   - Click "Start Free Trial"
   - Enter name, email, password
   - Get 3 days free access

2. **Setup Your Preferences**
   - Choose Telegram or WhatsApp
   - Enter your city & country
   - Select language (English/Urdu)
   - Choose temperature unit (°C/°F)

3. **Set Your Schedule**
   - Enable/disable morning weather
   - Enable/disable evening weather
   - Enable/disable daily news
   - Choose delivery times

4. **Connect Telegram**
   - Start chat with @WeatherNewsBot
   - Type `/start`
   - Updates will arrive automatically

### For Administrators

1. **Access Admin Panel**
   - Visit `/admin`
   - View system statistics

2. **Configure API Keys**
   - Enter Telegram Bot Token
   - Enter Weather API Key
   - (Optional) WhatsApp credentials

3. **Enable WhatsApp**
   - Toggle WhatsApp switch when ready
   - Ensure API credentials are saved first

4. **Manage Users**
   - View all registered users
   - Monitor subscription status
   - Track message delivery

---

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- Cloudflare account (for production)

### Local Development

```bash
# Install dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Build the project
npm run build

# Start development server
npm run dev:sandbox

# Or use PM2 for daemon mode
pm2 start ecosystem.config.cjs

# View logs
pm2 logs webapp --nostream
```

### Database Commands

```bash
# Apply migrations locally
npm run db:migrate:local

# Apply migrations to production
npm run db:migrate:prod

# Execute SQL query (local)
npm run db:console:local -- --command="SELECT * FROM users"

# Execute SQL query (production)
npm run db:console:prod -- --command="SELECT * FROM users"
```

---

## 🚀 Deployment Status

### Current Status
✅ **Active** - Running on Cloudflare Pages sandbox

### Deployment Steps (Production)

1. **Setup Cloudflare API**
   ```bash
   # Configure API key first
   # (Use setup_cloudflare_api_key tool)
   ```

2. **Create Production Database**
   ```bash
   npx wrangler d1 create webapp-production
   # Copy database_id to wrangler.jsonc
   ```

3. **Apply Migrations**
   ```bash
   npm run db:migrate:prod
   ```

4. **Deploy to Cloudflare Pages**
   ```bash
   npm run deploy:prod
   ```

5. **Set Environment Secrets**
   ```bash
   npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name webapp
   npx wrangler pages secret put WEATHER_API_KEY --project-name webapp
   ```

---

## 📌 Recommended Next Steps

### Phase 1: Core Integration (Week 1-2)
1. Integrate Weather API (OpenWeatherMap)
2. Setup Telegram Bot webhook
3. Implement basic command system
4. Test message delivery

### Phase 2: News & Automation (Week 3-4)
1. Integrate News RSS feeds
2. Setup Cloudflare Cron Triggers
3. Implement scheduled message delivery
4. Add retry logic for failed messages

### Phase 3: WhatsApp & Polish (Week 5-6)
1. Setup WhatsApp Business API
2. Create message templates
3. Implement WhatsApp delivery
4. Admin panel improvements

### Phase 4: Monetization (Week 7-8)
1. Integrate Stripe payments
2. Implement subscription flow
3. Add trial expiry enforcement
4. Marketing & launch preparation

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. Weather API not yet connected (using mock data)
2. News feed not yet integrated (using mock data)
3. Telegram bot not created (webhook endpoint ready)
4. WhatsApp disabled (integration ready, waiting for activation)
5. No payment gateway (Stripe integration pending)
6. Scheduled delivery not active (cron triggers not setup)

### Future Improvements
- Add more languages (Spanish, French, Arabic)
- Support multiple cities per user
- Custom schedule per notification type
- Push notifications for severe weather
- News category filtering
- Export user data feature
- Two-factor authentication

---

## 📄 License & Credits

Built with modern serverless technology:
- **Hono Framework** - Ultra-fast web framework
- **Cloudflare Pages** - Global edge deployment
- **TailwindCSS** - Utility-first styling
- **Font Awesome** - Beautiful icons

---

## 📞 Support & Contact

For technical support or business inquiries, users can reach out through the website contact form or admin panel.

---

**Last Updated**: 2025-11-05  
**Version**: 1.0.0 (MVP)  
**Status**: ✅ Core features complete, ready for API integration
