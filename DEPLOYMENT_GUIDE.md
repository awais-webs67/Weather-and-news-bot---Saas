# 🚀 Complete Deployment Guide - AlertFlow

This guide provides step-by-step instructions for deploying AlertFlow to Cloudflare Pages and running it locally on your PC.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development on Your PC](#local-development-on-your-pc)
3. [Deploy to Cloudflare Pages](#deploy-to-cloudflare-pages)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts & API Keys

Before starting, ensure you have:

✅ **GitHub Account** (for code management)
✅ **Cloudflare Account** (free tier works) - [Sign up](https://dash.cloudflare.com/sign-up)
✅ **Telegram Bot Token** - Get from [@BotFather](https://t.me/botfather)
✅ **OpenWeatherMap API Key** - [Get free key](https://openweathermap.org/api)
✅ **NewsAPI or GNews Key** - [NewsAPI](https://newsapi.org) or [GNews](https://gnews.io)
✅ **Google Gemini API Key** (optional) - [Get key](https://makersuite.google.com/app/apikey)

### Software Requirements

| Software | Minimum Version | Download Link |
|----------|----------------|---------------|
| **Node.js** | 18.0.0+ | [nodejs.org](https://nodejs.org) |
| **npm** | 9.0.0+ | Included with Node.js |
| **Git** | 2.30.0+ | [git-scm.com](https://git-scm.com) |
| **Wrangler CLI** | Latest | `npm install -g wrangler` |

---

## Local Development on Your PC

### Step 1: Install Node.js and Git

#### Windows

1. **Download Node.js**:
   - Visit [nodejs.org](https://nodejs.org)
   - Download **LTS version** (recommended)
   - Run installer and follow prompts
   - Check installation:
     ```cmd
     node --version
     npm --version
     ```

2. **Download Git**:
   - Visit [git-scm.com](https://git-scm.com)
   - Download for Windows
   - Run installer with default options
   - Check installation:
     ```cmd
     git --version
     ```

#### macOS

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and Git
brew install node git

# Verify installation
node --version
npm --version
git --version
```

#### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Verify installation
node --version
npm --version
git --version
```

---

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/awais-webs67/Weather-and-news-bot---Saas.git

# Navigate to project directory
cd Weather-and-news-bot---Saas

# Or if you want to rename the folder
git clone https://github.com/awais-webs67/Weather-and-news-bot---Saas.git alertflow
cd alertflow
```

---

### Step 3: Install Dependencies

```bash
# Install project dependencies (this may take 2-3 minutes)
npm install

# Install Wrangler CLI globally
npm install -g wrangler

# Install PM2 globally (for process management)
npm install -g pm2

# Verify installations
wrangler --version
pm2 --version
```

---

### Step 4: Setup Local Database

```bash
# Create local D1 database and run migrations
npm run db:migrate:local

# Optional: Add test/seed data
npm run db:seed

# Verify database was created
ls -la .wrangler/state/v3/d1/
```

**Expected Output**:
```
Successfully applied 1 migration(s)!
Database created at: .wrangler/state/v3/d1/miniflare-D1DatabaseObject/...
```

---

### Step 5: Configure Environment Variables

Create a `.dev.vars` file in the project root directory:

```bash
# Create the file
touch .dev.vars

# Or on Windows
type nul > .dev.vars
```

Add your API keys to `.dev.vars`:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Weather API
OPENWEATHERMAP_API_KEY=abcd1234efgh5678ijkl9012mnop3456

# News APIs (choose one or both)
NEWS_API_KEY=newsapi_key_here_1234567890abcdef
GNEWS_API_KEY=gnews_key_here_abcdefghijklmnop

# AI Features (Optional but recommended)
GEMINI_API_KEY=AIzaSyD...

# Admin Configuration (Optional - customize if needed)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

**⚠️ Important**: Never commit `.dev.vars` to Git! It's already in `.gitignore`.

---

### Step 6: Build the Project

```bash
# Build the project (creates dist/ folder)
npm run build

# Verify build was successful
ls -la dist/
```

**Expected Output**:
```
dist/
├── _worker.js         # Compiled application
├── _routes.json       # Routing configuration
└── static/            # Static assets
```

---

### Step 7: Start Development Server

#### Option 1: Using PM2 (Recommended)

```bash
# Clean port 3000 if in use
npm run clean-port

# Start with PM2
pm2 start ecosystem.config.cjs

# Check status
pm2 list

# View logs
pm2 logs webapp --nostream

# Stop service
pm2 stop webapp

# Restart service
pm2 restart webapp
```

#### Option 2: Using npm scripts

```bash
# Start development server
npm run dev:sandbox

# Server will be available at http://localhost:3000
```

#### Option 3: Manual start

```bash
npx wrangler pages dev dist --ip 0.0.0.0 --port 3000
```

---

### Step 8: Access Application Locally

Open your browser and visit:

- **Homepage**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
  - Username: `admin`
  - Password: `admin123`
- **User Dashboard**: http://localhost:3000/dashboard

---

### Step 9: Configure API Keys in Admin Panel

1. **Login to Admin Panel**:
   - Visit: http://localhost:3000/admin
   - Enter credentials (admin/admin123)

2. **Configure APIs**:
   - Navigate to **API Configuration** section
   - Enter your API keys:
     - **Telegram Bot Token**
     - **Weather API Key** (OpenWeatherMap)
     - **News API Key** (NewsAPI or GNews)
     - **Gemini AI Key** (optional)

3. **Test Each API**:
   - Click **Test** button next to each API
   - Should show ✅ success message
   - If error, verify API key is correct

4. **Save Configuration**:
   - Click **Save** for each API
   - Keys are stored in local D1 database

---

### Step 10: Setup Local Telegram Webhook (Optional)

For local testing with real Telegram bot, use **ngrok**:

```bash
# Install ngrok
# Windows: Download from https://ngrok.com/download
# macOS: brew install ngrok
# Linux: snap install ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy the https URL (e.g., https://1234-56-78-90-12.ngrok.io)

# Set Telegram webhook
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://1234-56-78-90-12.ngrok.io/webhook/telegram"}'

# Verify webhook
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Now you can test bot commands directly in Telegram!

---

## Deploy to Cloudflare Pages

### Step 1: Install and Login to Wrangler

```bash
# Install Wrangler globally (if not done)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Verify login
wrangler whoami
```

**Expected Output**:
```
 ⛅️ wrangler 3.x.x
──────────────────────────────────
You are logged in with an OAuth Token.

👤 User: your-email@example.com
📇 Account: Your Account Name (account-id)
```

---

### Step 2: Create Production Database

```bash
# Create Cloudflare D1 database
wrangler d1 create webapp-production

# IMPORTANT: Copy the database_id from output
# You'll need this in the next step
```

**Expected Output**:
```
✅ Successfully created DB 'webapp-production'

[[d1_databases]]
binding = "DB"
database_name = "webapp-production"
database_id = "abcd1234-5678-90ab-cdef-1234567890ab"  ← COPY THIS ID
```

---

### Step 3: Update wrangler.jsonc Configuration

Edit `wrangler.jsonc` and add your database ID:

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
      "database_id": "abcd1234-5678-90ab-cdef-1234567890ab"  // ← PASTE YOUR ID HERE
    }
  ]
}
```

---

### Step 4: Run Migrations on Production Database

```bash
# Apply database migrations to production
wrangler d1 migrations apply webapp-production

# Verify migration succeeded
wrangler d1 execute webapp-production --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected Output**:
```
🌀 Executing on database webapp-production:
✅ Successfully applied 1 migration(s)!

Tables created:
- users
- locations
- schedules
- messages
- license_keys
- api_settings
- api_logs
- admin_users
```

---

### Step 5: Build Project for Production

```bash
# Clean previous builds
rm -rf dist

# Build for production
npm run build

# Verify build output
ls -la dist/
```

---

### Step 6: Create Cloudflare Pages Project

```bash
# Create Pages project
wrangler pages project create alertflow --production-branch main

# Or use custom name
wrangler pages project create my-weatherbot --production-branch main
```

**Expected Output**:
```
✨ Successfully created the 'alertflow' project.
🌎 View your project at https://alertflow.pages.dev
```

---

### Step 7: Deploy to Cloudflare Pages

```bash
# Deploy using npm script
npm run deploy

# Or deploy manually
wrangler pages deploy dist --project-name alertflow

# For subsequent deployments
npm run deploy
```

**Expected Output**:
```
✨ Compiled Worker successfully
✨ Uploading...
🌎 Deploying...
✅ Deployment complete!
🚀 https://alertflow.pages.dev
🚀 https://abc123.alertflow.pages.dev
```

---

### Step 8: Configure Production Environment Variables

Set your API keys as Cloudflare secrets:

```bash
# Telegram Bot Token
wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name alertflow
# Enter your token when prompted

# Weather API
wrangler pages secret put OPENWEATHERMAP_API_KEY --project-name alertflow

# News API (choose one or both)
wrangler pages secret put NEWS_API_KEY --project-name alertflow
wrangler pages secret put GNEWS_API_KEY --project-name alertflow

# Gemini AI (optional)
wrangler pages secret put GEMINI_API_KEY --project-name alertflow

# List all secrets to verify
wrangler pages secret list --project-name alertflow
```

---

### Step 9: Configure Production Telegram Webhook

```bash
# Set webhook to your Cloudflare Pages URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://alertflow.pages.dev/webhook/telegram"}'

# Verify webhook is set correctly
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

**Expected Response**:
```json
{
  "ok": true,
  "result": {
    "url": "https://alertflow.pages.dev/webhook/telegram",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    "max_connections": 40
  }
}
```

---

## Post-Deployment Configuration

### Step 1: Access Production Admin Panel

1. Visit: `https://alertflow.pages.dev/admin`
2. Login with default credentials:
   - Username: `admin`
   - Password: `admin123`

### Step 2: Configure Production API Keys

Even though you set secrets via Wrangler, you need to configure them in the admin panel:

1. Go to **API Configuration** section
2. Enter all API keys (same as before)
3. Click **Test** for each API to verify
4. Click **Save** to store in production database

### Step 3: Change Admin Password

**IMPORTANT**: Change the default admin password!

```bash
# Connect to production database
wrangler d1 execute webapp-production --command="UPDATE admin_users SET password = 'NEW_HASHED_PASSWORD' WHERE username = 'admin'"

# Or use the admin panel to change it
```

### Step 4: Test Bot in Telegram

1. Open Telegram and search for your bot
2. Send `/start` command
3. Try weather commands:
   - `/weather`
   - `/forecast`
   - `/checkweather London`
4. Verify AI recommendations appear
5. Check that all features work correctly

---

## Troubleshooting

### Common Deployment Issues

#### 1. Database Not Found Error

```bash
# Verify database exists
wrangler d1 list

# Check database binding in wrangler.jsonc
# Make sure database_id is correct
```

#### 2. Webhook Not Working

```bash
# Check webhook status
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Delete and reset webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://alertflow.pages.dev/webhook/telegram"
```

#### 3. API Keys Not Working

```bash
# List secrets
wrangler pages secret list --project-name alertflow

# Re-add a secret
wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name alertflow

# Check in admin panel if keys are saved in database
```

#### 4. Build Fails

```bash
# Clean and rebuild
rm -rf dist node_modules .wrangler
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

#### 5. Deployment Fails

```bash
# Check Wrangler version
wrangler --version

# Update Wrangler
npm install -g wrangler@latest

# Retry deployment
npm run deploy
```

### Getting Help

If you encounter issues:

1. **Check Cloudflare Dashboard**:
   - Visit [dash.cloudflare.com](https://dash.cloudflare.com)
   - Go to Workers & Pages → Your project
   - Check deployment logs

2. **View Wrangler Logs**:
   ```bash
   wrangler pages deployment tail --project-name alertflow
   ```

3. **Check GitHub Issues**:
   - Search existing issues
   - Create new issue with error details

4. **Contact Support**:
   - Telegram: @awais_webs
   - GitHub Issues: [Create Issue](https://github.com/awais-webs67/Weather-and-news-bot---Saas/issues)

---

## Quick Command Reference

### Local Development

```bash
# Setup
git clone <repo-url>
cd Weather-and-news-bot---Saas
npm install
npm run db:migrate:local
npm run build

# Run
pm2 start ecosystem.config.cjs
pm2 logs webapp

# Stop
pm2 stop webapp
```

### Production Deployment

```bash
# Initial deployment
wrangler login
wrangler d1 create webapp-production
# Update wrangler.jsonc with database_id
wrangler d1 migrations apply webapp-production
npm run build
wrangler pages project create alertflow
npm run deploy

# Set secrets
wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name alertflow
# ... add other secrets

# Subsequent deployments
npm run build
npm run deploy
```

### Database Management

```bash
# Local
npm run db:migrate:local
npm run db:seed
npm run db:reset

# Production
wrangler d1 migrations apply webapp-production
wrangler d1 execute webapp-production --command="SELECT COUNT(*) FROM users"
```

---

## Security Checklist

Before going live, ensure:

- [ ] Changed default admin password
- [ ] All API keys set as Cloudflare secrets (not in code)
- [ ] `.dev.vars` in `.gitignore` and not committed
- [ ] Telegram webhook uses HTTPS
- [ ] Admin panel accessible only to authorized users
- [ ] Database backups configured (Cloudflare auto-backups D1)
- [ ] Rate limiting enabled (Cloudflare provides this)
- [ ] CORS configured properly
- [ ] Input validation on all forms
- [ ] SQL injection prevention (using parameterized queries)

---

## Performance Optimization

### Cloudflare Settings

1. **Enable Caching**:
   - Static assets cached automatically
   - API responses can use Cache API

2. **Enable Minification**:
   - Already handled by Vite build

3. **Monitor Performance**:
   - Check Cloudflare Analytics dashboard
   - Review Worker metrics

### Database Optimization

```bash
# Add indexes for frequently queried fields
wrangler d1 execute webapp-production --command="
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
"
```

---

## Backup and Recovery

### Database Backup

```bash
# Export production database
wrangler d1 export webapp-production --output backup.sql

# Import to new database
wrangler d1 execute webapp-production --file backup.sql
```

### Code Backup

```bash
# Commit and push regularly
git add .
git commit -m "Your changes"
git push origin main

# Create releases/tags for stable versions
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

**🎉 Congratulations! Your AlertFlow bot is now deployed and running!**

For additional help, check the main [README.md](README.md) or create an issue on GitHub.
