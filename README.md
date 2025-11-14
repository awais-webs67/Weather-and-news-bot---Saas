# 🌤️ AlertFlow - Smart Weather & News Automation Bot

> **AI-Powered Telegram bot delivering automated weather forecasts and curated news summaries with intelligent safety recommendations.**

[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange?style=for-the-badge&logo=cloudflare)](https://pages.cloudflare.com)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue?style=for-the-badge&logo=telegram)](https://telegram.org/blog/bot-revolution)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Local Development Setup](#-local-development-setup)
- [Deployment to Cloudflare Pages](#-deployment-to-cloudflare-pages)
- [Configuration](#-configuration)
- [Database Setup](#-database-setup)
- [API Integrations](#-api-integrations)
- [Bot Commands](#-bot-commands)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

---

## ✨ Features

### 🌤️ Weather Intelligence
- **Real-time weather updates** with OpenWeatherMap API
- **7-day detailed forecasts** with temperature, humidity, wind, and rain probability
- **AI-powered safety recommendations** using Google Gemini AI
- **Air Quality Index (AQI)** with numeric values and descriptive labels (0-500 scale)
- **6-hour, hourly, and tomorrow forecasts** for precise planning
- **Multi-city support** - check weather anywhere in the world

### 📰 News Automation
- **Curated news summaries** from NewsAPI and GNews
- **Country-specific headlines** with worldwide coverage
- **Category filtering** (Sports, Tech, Business, Entertainment, Health, Science)
- **Search functionality** for any topic or keyword
- **Multi-language support** (English/Urdu)

### 🤖 AI-Powered Features
- **Gemini AI safety advisor** provides personalized weather precautions
- **Smart recommendations** based on temperature, humidity, wind, and AQI
- **3-4 bullet point advice** with actionable tips for daily planning

### 💼 SaaS Features
- **User authentication** with secure password hashing
- **Subscription management** (Free, Trial, Premium plans)
- **License key system** for premium access
- **Admin dashboard** with comprehensive management tools
- **Sales statistics** with real-time database analytics
- **Scheduled notifications** via Cloudflare Cron triggers

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Hono (TypeScript) |
| **Runtime** | Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) |
| **Frontend** | HTML, TailwindCSS, Vanilla JavaScript |
| **Build Tool** | Vite |
| **APIs** | Telegram Bot API, OpenWeatherMap, NewsAPI, GNews, Google Gemini AI |
| **Deployment** | Cloudflare Pages |
| **Process Manager** | PM2 (local development) |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ installed
- **npm** or **pnpm** package manager
- **Cloudflare account** (free tier works)
- **Telegram Bot Token** (get from [@BotFather](https://t.me/botfather))
- **API Keys**:
  - OpenWeatherMap API key
  - NewsAPI or GNews API key
  - Google Gemini API key (optional, for AI features)

### 1️⃣ Clone Repository

```bash
git clone https://github.com/awais-webs67/Weather-and-news-bot---Saas.git
cd Weather-and-news-bot---Saas
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Setup Database

```bash
# Create local database and run migrations
npm run db:migrate:local

# Seed with initial data (optional)
npm run db:seed
```

### 4️⃣ Configure Environment

Create `.dev.vars` file in project root:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Weather API
OPENWEATHERMAP_API_KEY=your_weather_api_key

# News APIs
NEWS_API_KEY=your_newsapi_key
GNEWS_API_KEY=your_gnews_key

# AI (Optional)
GEMINI_API_KEY=your_gemini_api_key
```

### 5️⃣ Start Development Server

```bash
# Build first
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Or use npm script
npm run dev:sandbox
```

### 6️⃣ Access Application

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **User Dashboard**: http://localhost:3000/dashboard

**Default Admin Credentials**:
- Username: `admin`
- Password: `admin123`

---

## 💻 Local Development Setup

### Step-by-Step Guide

#### 1. Install Node.js and npm

```bash
# Check if installed
node --version  # Should be 18+
npm --version

# Install if needed (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. Clone and Install

```bash
git clone https://github.com/awais-webs67/Weather-and-news-bot---Saas.git
cd Weather-and-news-bot---Saas
npm install
```

#### 3. Install PM2 Globally (Recommended)

```bash
npm install -g pm2
```

#### 4. Setup Database

```bash
# Initialize local D1 database
npx wrangler d1 migrations apply webapp-production --local

# Optional: Add test data
npm run db:seed
```

#### 5. Configure API Keys

Create `.dev.vars`:

```env
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENWEATHERMAP_API_KEY=abcd1234efgh5678ijkl9012mnop3456
NEWS_API_KEY=newsapi_key_here
GEMINI_API_KEY=AIzaSyD...
```

#### 6. Build and Start

```bash
# Build project
npm run build

# Clean port if needed
npm run clean-port

# Start with PM2
pm2 start ecosystem.config.cjs

# Check logs
pm2 logs webapp --nostream

# Check status
pm2 list
```

#### 7. Configure Admin Panel

1. Open http://localhost:3000/admin
2. Login with default credentials
3. Navigate to API Configuration section
4. Add your API keys:
   - Telegram Bot Token
   - Weather API Key
   - News API Key (NewsAPI or GNews)
   - Gemini AI Key (optional)
5. Click **Test** button for each to verify
6. Click **Save** to store in database

#### 8. Setup Telegram Bot Webhook

```bash
# Get your public URL (if using ngrok or similar)
# Then set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/webhook/telegram"}'
```

For local testing, use ngrok:
```bash
ngrok http 3000
# Use the https URL for webhook
```

---

## 🌐 Deployment to Cloudflare Pages

### Step-by-Step Deployment Guide

#### 1. Install Wrangler CLI

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

#### 2. Create Cloudflare D1 Database

```bash
# Create production database
wrangler d1 create webapp-production

# Copy the database_id from output
# Update wrangler.jsonc with the database_id
```

#### 3. Update wrangler.jsonc

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "alertflow",
  "compatibility_date": "2024-01-01",
  "pages_build_output_dir": "./dist",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "webapp-production",
      "database_id": "YOUR_DATABASE_ID_HERE"  // ← Paste your database ID
    }
  ]
}
```

#### 4. Run Migrations on Production Database

```bash
# Apply migrations to production
wrangler d1 migrations apply webapp-production
```

#### 5. Create Cloudflare Pages Project

```bash
# Build the project
npm run build

# Create Pages project
wrangler pages project create alertflow --production-branch main
```

#### 6. Deploy to Cloudflare Pages

```bash
# Deploy
npm run deploy

# Or deploy with custom project name
npm run deploy:prod
```

#### 7. Set Production Environment Variables

```bash
# Add secrets (one at a time)
wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name alertflow
wrangler pages secret put OPENWEATHERMAP_API_KEY --project-name alertflow
wrangler pages secret put NEWS_API_KEY --project-name alertflow
wrangler pages secret put GEMINI_API_KEY --project-name alertflow
```

#### 8. Configure Telegram Webhook for Production

```bash
# Set webhook to your Cloudflare Pages URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://alertflow.pages.dev/webhook/telegram"}'
```

#### 9. Verify Deployment

- Visit: `https://alertflow.pages.dev`
- Login to admin panel: `https://alertflow.pages.dev/admin`
- Test bot commands in Telegram
- Check Cloudflare dashboard for logs

---

## ⚙️ Configuration

### package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:sandbox": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
    "build": "vite build",
    "deploy": "npm run build && wrangler pages deploy dist",
    "db:migrate:local": "wrangler d1 migrations apply webapp-production --local",
    "db:migrate:prod": "wrangler d1 migrations apply webapp-production",
    "db:seed": "wrangler d1 execute webapp-production --local --file=./seed.sql",
    "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed",
    "clean-port": "fuser -k 3000/tcp 2>/dev/null || true"
  }
}
```

### PM2 Configuration (ecosystem.config.cjs)

```javascript
module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'npx',
      args: 'wrangler pages dev dist --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
```

---

## 🗄️ Database Setup

### Database Schema

The project uses **Cloudflare D1** (SQLite-based) with the following main tables:

- **users** - User accounts and authentication
- **locations** - User location preferences
- **schedules** - Notification schedules
- **messages** - Message delivery logs
- **license_keys** - Premium subscription keys
- **api_settings** - API configuration and keys
- **api_logs** - API usage logs
- **admin_users** - Admin authentication

### Migration Commands

```bash
# Local development
npm run db:migrate:local

# Production
npm run db:migrate:prod

# Reset local database (CAUTION: Deletes all data)
npm run db:reset
```

### Manual Database Access

```bash
# Local database
wrangler d1 execute webapp-production --local --command="SELECT * FROM users LIMIT 5"

# Production database
wrangler d1 execute webapp-production --command="SELECT COUNT(*) FROM users"
```

---

## 🔌 API Integrations

### Required APIs

#### 1. Telegram Bot API
- **Purpose**: Bot communication
- **Get Token**: [@BotFather](https://t.me/botfather)
- **Cost**: Free
- **Setup**: 
  ```
  /newbot
  Follow prompts to get token
  ```

#### 2. OpenWeatherMap API
- **Purpose**: Weather data
- **Get Key**: [OpenWeatherMap](https://openweathermap.org/api)
- **Cost**: Free (60 calls/minute)
- **Features**: Current weather, 5-day forecast, AQI estimates

#### 3. NewsAPI or GNews
- **Purpose**: News headlines
- **NewsAPI**: [newsapi.org](https://newsapi.org)
- **GNews**: [gnews.io](https://gnews.io)
- **Cost**: Free tiers available
- **Recommendation**: Use GNews for better country coverage

#### 4. Google Gemini AI (Optional)
- **Purpose**: AI weather recommendations
- **Get Key**: [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Cost**: Free tier (60 requests/minute)
- **Features**: Personalized safety advice, activity suggestions

### API Configuration in Admin Panel

1. Navigate to `/admin` and login
2. Go to **API Configuration** section
3. Enter API keys in respective fields
4. Click **Test** to verify each key
5. Click **Save** to store in database
6. Keys are stored encrypted in Cloudflare D1

---

## 🤖 Bot Commands

### Weather Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/start` | Welcome message and bot info | `/start` |
| `/weather` | Your local weather + AI advice | `/weather` |
| `/checkweather` | Check any city worldwide + AI | `/checkweather London` |
| `/6hour` | Next 6 hours forecast + AI | `/6hour` |
| `/hourly` | 24-hour forecast + AI | `/hourly` |
| `/tomorrow` | Tomorrow's weather + AI | `/tomorrow` |
| `/forecast` | 7-day forecast with AQI + AI | `/forecast` |
| `/wind` | Wind speed and direction | `/wind` |
| `/humidity` | Humidity and air quality | `/humidity` |
| `/sunrise` | Sunrise/sunset times | `/sunrise` |

### News Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/news` | Top headlines for your country | `/news` |
| `/checknews` | News from any country | `/checknews Pakistan` |
| `/topnews` | Breaking news by country | `/topnews India` |
| `/search` | Search news by topic | `/search technology` |
| `/sports` | Sports news ⚽ | `/sports` |
| `/tech` | Technology news 💻 | `/tech` |
| `/business` | Business & finance 💼 | `/business` |
| `/entertainment` | Entertainment news 🎬 | `/entertainment` |
| `/health` | Health & medical 🏥 | `/health` |
| `/science` | Science news 🔬 | `/science` |

### Account Commands

| Command | Description |
|---------|-------------|
| `/settings` | View your account settings |
| `/help` | Complete help guide |

---

## 📁 Project Structure

```
Weather-and-news-bot---Saas/
├── src/
│   ├── index.tsx                 # Main application entry
│   ├── routes/
│   │   ├── webhook.ts            # Telegram webhook handler (ALL weather commands)
│   │   ├── admin.tsx             # Admin dashboard UI
│   │   ├── admin-api.ts          # Admin API endpoints (+ sales-stats)
│   │   ├── auth.tsx              # Authentication routes
│   │   └── user-dashboard.tsx    # User dashboard
│   ├── lib/
│   │   ├── integrations.ts       # API integrations (Weather, News, Gemini AI, calculateAQI)
│   │   ├── utils.ts              # Utility functions
│   │   ├── scheduler.ts          # Cron job scheduler
│   │   └── pricing.ts            # License key generation
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── public/
│   └── static/
│       ├── admin-v5.js           # Admin panel JavaScript
│       ├── dashboard.html        # User dashboard HTML
│       ├── styles.css            # Custom styles
│       └── utils.js              # Frontend utilities
├── migrations/
│   └── 0001_initial_schema.sql   # Database migrations
├── dist/                         # Build output (generated)
├── .wrangler/                    # Local D1 database (generated)
├── wrangler.jsonc                # Cloudflare configuration
├── ecosystem.config.cjs          # PM2 configuration
├── package.json                  # Dependencies and scripts
├── vite.config.ts                # Vite build config
├── tsconfig.json                 # TypeScript config
├── .gitignore                    # Git ignore rules
├── .dev.vars                     # Local environment variables (create this)
├── README.md                     # This file
├── CHANGES_SUMMARY.md            # Recent changes documentation
└── test-ai-output.md             # AI output format examples
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Port 3000 Already in Use

```bash
# Kill process on port 3000
npm run clean-port

# Or manually
fuser -k 3000/tcp

# Or with PM2
pm2 delete webapp
```

#### 2. Database Not Found

```bash
# Reset and recreate local database
npm run db:reset

# Check if database exists
npx wrangler d1 list
```

#### 3. AI Recommendations Not Showing

**Check Gemini API Key**:
```bash
# Verify key is configured
npx wrangler d1 execute webapp-production --local \
  --command="SELECT setting_key, is_enabled FROM api_settings WHERE setting_key = 'gemini_api_key'"
```

**Test Gemini API**:
- Go to `/admin` dashboard
- Click **Test** next to Gemini AI
- Should return success message

**Verify User Has Location**:
- Users must have city/country configured in dashboard
- Check in admin panel under User Management

#### 4. Telegram Webhook Not Working

```bash
# Check webhook status
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"

# Remove webhook (for local testing)
curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"

# Set webhook
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/webhook/telegram"
```

#### 5. Build Errors

```bash
# Clean and rebuild
rm -rf dist .wrangler/state node_modules
npm install
npm run build
```

#### 6. PM2 Service Not Starting

```bash
# Check PM2 logs
pm2 logs webapp --lines 50

# Restart service
pm2 restart webapp

# Delete and recreate
pm2 delete webapp
npm run clean-port
npm run build
pm2 start ecosystem.config.cjs
```

### Debug Mode

Enable debug logging:

```bash
# Check wrangler logs
pm2 logs webapp --nostream --lines 100

# Check for errors
pm2 logs webapp --nostream | grep -i "error\|fail"

# Monitor in real-time
pm2 logs webapp
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain existing code style
- Add comments for complex logic
- Update README for new features
- Test thoroughly before submitting PR

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Awais** - [GitHub](https://github.com/awais-webs67)

---

## 🙏 Acknowledgments

- [Hono Framework](https://hono.dev) - Lightweight web framework
- [Cloudflare Workers](https://workers.cloudflare.com) - Edge computing platform
- [OpenWeatherMap](https://openweathermap.org) - Weather data API
- [Telegram Bot API](https://core.telegram.org/bots/api) - Bot platform
- [Google Gemini AI](https://ai.google.dev) - AI-powered recommendations
- [TailwindCSS](https://tailwindcss.com) - CSS framework

---

## 📞 Support

For issues and questions:

- **GitHub Issues**: [Create an issue](https://github.com/awais-webs67/Weather-and-news-bot---Saas/issues)
- **Telegram**: @awais_webs (for urgent support)
- **Email**: support@alertflow.com

---

## 🗺️ Roadmap

- [ ] WhatsApp integration
- [ ] SMS notifications
- [ ] Mobile app (React Native)
- [ ] Advanced AI features
- [ ] Multi-language support (expand beyond EN/UR)
- [ ] Weather alerts and warnings
- [ ] Custom notification schedules
- [ ] Integration with calendar apps

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ by Awais**
